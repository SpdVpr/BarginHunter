import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../src/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { shop } = req.query;

  if (!shop || typeof shop !== 'string') {
    return res.status(400).json({ error: 'Shop parameter is required' });
  }

  try {
    // Get game sessions
    const sessionsRef = collection(db, 'gameSessions');
    const sessionsQuery = query(
      sessionsRef,
      where('shop', '==', shop)
    );
    const sessionsSnapshot = await getDocs(sessionsQuery);
    const sessions = sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Get discount codes
    const discountsRef = collection(db, 'discountCodes');
    const discountsQuery = query(
      discountsRef,
      where('shop', '==', shop)
    );
    const discountsSnapshot = await getDocs(discountsQuery);
    const discounts = discountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Group sessions by customer
    const customerMap = new Map();
    
    sessions.forEach(session => {
      const email = session.customerEmail || 'Anonymous';
      if (!customerMap.has(email)) {
        customerMap.set(email, {
          id: email,
          email: email,
          totalSessions: 0,
          completedSessions: 0,
          scores: [],
          lastPlayedAt: session.createdAt,
          totalDiscountsEarned: 0,
          totalDiscountsUsed: 0,
        });
      }
      
      const customer = customerMap.get(email);
      customer.totalSessions++;
      
      if (session.status === 'completed') {
        customer.completedSessions++;
        if (session.score) {
          customer.scores.push(session.score);
        }
      }
      
      // Update last played date
      if (new Date(session.createdAt) > new Date(customer.lastPlayedAt)) {
        customer.lastPlayedAt = session.createdAt;
      }
    });

    // Add discount information
    discounts.forEach(discount => {
      const email = discount.customerEmail || 'Anonymous';
      if (customerMap.has(email)) {
        const customer = customerMap.get(email);
        customer.totalDiscountsEarned++;
        if (discount.isUsed) {
          customer.totalDiscountsUsed++;
        }
      }
    });

    // Convert to array and calculate derived fields
    const customers = Array.from(customerMap.values()).map(customer => {
      const averageScore = customer.scores.length > 0 
        ? customer.scores.reduce((a, b) => a + b, 0) / customer.scores.length 
        : 0;
      
      const bestScore = customer.scores.length > 0 
        ? Math.max(...customer.scores) 
        : 0;

      // Determine if customer is active (played in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const isActive = new Date(customer.lastPlayedAt) > thirtyDaysAgo;

      return {
        ...customer,
        averageScore: Math.round(averageScore * 100) / 100,
        bestScore,
        status: isActive ? 'active' : 'inactive',
      };
    });

    // Sort by total sessions (most active first)
    customers.sort((a, b) => b.totalSessions - a.totalSessions);

    // Calculate summary statistics
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'active').length;
    const averageSessionsPerCustomer = totalCustomers > 0 
      ? customers.reduce((sum, c) => sum + c.totalSessions, 0) / totalCustomers 
      : 0;
    const topPerformers = customers.filter(c => c.totalSessions >= 5).length;

    const summary = {
      totalCustomers,
      activeCustomers,
      averageSessionsPerCustomer: Math.round(averageSessionsPerCustomer * 100) / 100,
      topPerformers,
    };

    res.status(200).json({
      customers,
      summary,
    });
  } catch (error) {
    console.error('Error fetching customers data:', error);
    res.status(500).json({ error: 'Failed to fetch customers data' });
  }
}
