import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../src/lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop } = req.query;

    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Shop domain is required' 
      });
    }

    console.log(`🔍 Loading simple customers data for shop: ${shop}`);

    // Simple query without ordering - just filter by shopDomain
    const customersSnapshot = await db.collection('customers')
      .where('shopDomain', '==', shop)
      .limit(100)
      .get();

    const customers = customersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email || 'Anonymous',
        customerId: data.customerId,
        totalSessions: data.totalSessions || 0,
        totalScore: data.totalScore || 0,
        bestScore: data.bestScore || 0,
        totalDiscountsEarned: data.totalDiscountsEarned || 0,
        totalDiscountsUsed: data.totalDiscountsUsed || 0,
        firstPlayedAt: data.firstPlayedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        lastPlayedAt: data.lastPlayedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        averageScore: data.totalSessions > 0 ? Math.round(data.totalScore / data.totalSessions) : 0,
        discountUsageRate: data.totalDiscountsEarned > 0 
          ? Math.round((data.totalDiscountsUsed / data.totalDiscountsEarned) * 100) 
          : 0,
      };
    });

    // Calculate summary
    const totalCustomers = customers.length;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const activeCustomers = customers.filter(c => {
      const lastPlayed = new Date(c.lastPlayedAt);
      return lastPlayed > thirtyDaysAgo;
    }).length;

    const totalSessions = customers.reduce((sum, c) => sum + c.totalSessions, 0);
    const totalDiscountsEarned = customers.reduce((sum, c) => sum + c.totalDiscountsEarned, 0);
    const totalDiscountsUsed = customers.reduce((sum, c) => sum + c.totalDiscountsUsed, 0);
    const averageScore = totalSessions > 0 
      ? Math.round(customers.reduce((sum, c) => sum + c.totalScore, 0) / totalSessions)
      : 0;

    console.log(`✅ Loaded ${customers.length} customers successfully`);

    return res.json({
      success: true,
      customers,
      summary: {
        totalCustomers,
        activeCustomers,
        totalSessions,
        totalDiscountsEarned,
        totalDiscountsUsed,
        averageScore,
        discountUsageRate: totalDiscountsEarned > 0 
          ? Math.round((totalDiscountsUsed / totalDiscountsEarned) * 100) 
          : 0,
      }
    });

  } catch (error) {
    console.error('Simple customers API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to load customers data' 
    });
  }
}
