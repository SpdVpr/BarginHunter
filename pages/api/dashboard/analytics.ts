import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../src/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { shop, period = '30d' } = req.query;

  if (!shop || typeof shop !== 'string') {
    return res.status(400).json({ error: 'Shop parameter is required' });
  }

  try {
    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get game sessions
    const sessionsRef = collection(db, 'gameSessions');
    const sessionsQuery = query(
      sessionsRef,
      where('shop', '==', shop),
      where('createdAt', '>=', startDate.toISOString())
    );
    const sessionsSnapshot = await getDocs(sessionsQuery);
    const sessions = sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Get discount codes
    const discountsRef = collection(db, 'discountCodes');
    const discountsQuery = query(
      discountsRef,
      where('shop', '==', shop),
      where('createdAt', '>=', startDate.toISOString())
    );
    const discountsSnapshot = await getDocs(discountsQuery);
    const discounts = discountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calculate metrics
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const totalDiscounts = discounts.length;
    const usedDiscounts = discounts.filter(d => d.isUsed).length;
    
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
    const discountUsageRate = totalDiscounts > 0 ? (usedDiscounts / totalDiscounts) * 100 : 0;
    
    const scores = sessions.filter(s => s.score).map(s => s.score);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    
    const uniqueCustomers = new Set(sessions.map(s => s.customerEmail).filter(Boolean)).size;
    
    // Estimate revenue (assuming average order value of $50 per used discount)
    const estimatedRevenue = usedDiscounts * 50;

    // Get top scores
    const topScores = sessions
      .filter(s => s.score && s.status === 'completed')
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(s => ({
        customerEmail: s.customerEmail || 'Anonymous',
        score: s.score,
        discount: s.discountValue || 0,
        achievedAt: s.createdAt,
      }));

    // Calculate hourly breakdown
    const hourlyBreakdown = Array.from({ length: 24 }, (_, hour) => {
      const hourSessions = sessions.filter(s => {
        const sessionHour = new Date(s.createdAt).getHours();
        return sessionHour === hour;
      });
      
      const hourCompletions = hourSessions.filter(s => s.status === 'completed');
      const hourDiscounts = discounts.filter(d => {
        const discountHour = new Date(d.createdAt).getHours();
        return discountHour === hour;
      });

      return {
        hour,
        sessions: hourSessions.length,
        completions: hourCompletions.length,
        discounts: hourDiscounts.length,
      };
    });

    // Calculate source breakdown (simplified)
    const sourceBreakdown = {
      'Direct': Math.floor(totalSessions * 0.6),
      'Social Media': Math.floor(totalSessions * 0.2),
      'Email': Math.floor(totalSessions * 0.1),
      'Other': Math.floor(totalSessions * 0.1),
    };

    const analyticsData = {
      metrics: {
        totalSessions,
        completedSessions,
        totalDiscounts,
        usedDiscounts,
        completionRate: Math.round(completionRate * 100) / 100,
        discountUsageRate: Math.round(discountUsageRate * 100) / 100,
        averageScore: Math.round(averageScore * 100) / 100,
        uniqueCustomers,
        estimatedRevenue,
      },
      topScores,
      hourlyBreakdown,
      sourceBreakdown,
    };

    res.status(200).json(analyticsData);
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
}
