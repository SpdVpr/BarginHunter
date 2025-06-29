import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../src/lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop, period = '30d' } = req.query;

    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Shop domain is required' 
      });
    }

    console.log(`🔍 Loading simple analytics data for shop: ${shop}, period: ${period}`);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Simple queries without complex ordering
    const sessionsSnapshot = await db.collection('gameSessions')
      .where('shopDomain', '==', shop)
      .limit(1000)
      .get();

    const discountsSnapshot = await db.collection('discountCodes')
      .where('shopDomain', '==', shop)
      .limit(1000)
      .get();

    // Process sessions
    const allSessions = sessionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        startedAt: data.startedAt?.toDate?.() || new Date(),
        completedAt: data.completedAt?.toDate?.() || null,
      };
    });

    // Process discounts
    const allDiscounts = discountsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        usedAt: data.usedAt?.toDate?.() || null,
      };
    });

    // Filter by date range
    const sessions = allSessions.filter(session => {
      const sessionDate = session.startedAt;
      return sessionDate >= startDate && sessionDate <= endDate;
    });

    const discounts = allDiscounts.filter(discount => {
      const discountDate = discount.createdAt;
      return discountDate >= startDate && discountDate <= endDate;
    });

    // Calculate metrics
    const completedSessions = sessions.filter(s => s.completed);
    const usedDiscounts = discounts.filter(d => d.isUsed);
    
    const totalSessions = sessions.length;
    const totalCompletedSessions = completedSessions.length;
    const totalDiscounts = discounts.length;
    const totalUsedDiscounts = usedDiscounts.length;
    
    const completionRate = totalSessions > 0 ? Math.round((totalCompletedSessions / totalSessions) * 100) : 0;
    const discountUsageRate = totalDiscounts > 0 ? Math.round((totalUsedDiscounts / totalDiscounts) * 100) : 0;
    
    const averageScore = completedSessions.length > 0 
      ? Math.round(completedSessions.reduce((sum, s) => sum + (s.finalScore || 0), 0) / completedSessions.length)
      : 0;

    const uniqueCustomers = new Set(sessions.map(s => s.customerEmail || s.customerId).filter(Boolean)).size;
    
    const estimatedRevenue = usedDiscounts.reduce((sum, d) => sum + (d.orderValue || 0), 0);

    // Simple time series (daily for last 7 days)
    const timeSeries = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      
      const daySessions = sessions.filter(s => s.startedAt >= date && s.startedAt < nextDate);
      const dayDiscounts = discounts.filter(d => d.createdAt >= date && d.createdAt < nextDate);
      
      timeSeries.push({
        date: date.toISOString(),
        sessions: daySessions.length,
        completedSessions: daySessions.filter(s => s.completed).length,
        discounts: dayDiscounts.length,
        usedDiscounts: dayDiscounts.filter(d => d.isUsed).length,
        averageScore: daySessions.length > 0 
          ? Math.round(daySessions.reduce((sum, s) => sum + (s.finalScore || 0), 0) / daySessions.length)
          : 0,
      });
    }

    // Hourly breakdown (simple)
    const hourlyBreakdown = Array.from({ length: 24 }, (_, hour) => {
      const hourSessions = sessions.filter(s => s.startedAt.getHours() === hour);
      return {
        hour,
        sessions: hourSessions.length,
        completions: hourSessions.filter(s => s.completed).length,
        discounts: discounts.filter(d => d.createdAt.getHours() === hour).length,
      };
    });

    console.log(`✅ Processed ${sessions.length} sessions and ${discounts.length} discounts`);

    return res.json({
      period: period as string,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      metrics: {
        totalSessions,
        completedSessions: totalCompletedSessions,
        completionRate,
        totalDiscounts,
        usedDiscounts: totalUsedDiscounts,
        discountUsageRate,
        averageScore,
        uniqueCustomers,
        estimatedRevenue,
      },
      timeSeries,
      hourlyBreakdown,
      topScores: [], // Empty for now since it requires complex index
      sourceBreakdown: {},
    });

  } catch (error) {
    console.error('Simple analytics API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to load analytics data' 
    });
  }
}
