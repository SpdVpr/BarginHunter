import { NextApiRequest, NextApiResponse } from 'next';
import { GameSessionService, GameScoreService, DiscountService } from '../../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop, period = '30d', granularity = 'day' } = req.query;

    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Shop domain is required' 
      });
    }

    // Calculate date range based on period
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

    // Get all sessions and filter by date range (with fallback for building indexes)
    let allSessions = [];
    let allDiscounts = [];

    try {
      allSessions = await GameSessionService.getSessionsByShop(shop, 10000);
      allDiscounts = await DiscountService.getDiscountsByShop(shop, 10000);
    } catch (indexError: any) {
      // If indexes are building, return empty arrays
      if (indexError.code === 9 && indexError.details?.includes('index is currently building')) {
        console.log('📊 Firebase indexes are building, returning empty analytics data...');
        allSessions = [];
        allDiscounts = [];
      } else {
        throw indexError;
      }
    }

    const sessions = allSessions.filter(session => {
      const sessionDate = session.startedAt.toDate();
      return sessionDate >= startDate && sessionDate <= endDate;
    });

    const discounts = allDiscounts.filter(discount => {
      const discountDate = discount.createdAt.toDate();
      return discountDate >= startDate && discountDate <= endDate;
    });

    // Group data by time period
    const timeSeriesData = generateTimeSeries(sessions, discounts, startDate, endDate, granularity as string);

    // Calculate summary metrics
    const completedSessions = sessions.filter(s => s.completed);
    const usedDiscounts = discounts.filter(d => d.isUsed);
    
    const metrics = {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      completionRate: sessions.length > 0 ? (completedSessions.length / sessions.length) * 100 : 0,
      totalDiscounts: discounts.length,
      usedDiscounts: usedDiscounts.length,
      discountUsageRate: discounts.length > 0 ? (usedDiscounts.length / discounts.length) * 100 : 0,
      averageScore: completedSessions.length > 0 
        ? completedSessions.reduce((sum, s) => sum + (s.finalScore || 0), 0) / completedSessions.length 
        : 0,
      uniqueCustomers: new Set(sessions.filter(s => s.customerEmail).map(s => s.customerEmail)).size,
      
      // Revenue estimation (would need actual order data)
      estimatedRevenue: usedDiscounts.reduce((sum, discount) => {
        const avgOrderValue = 100; // This should come from actual order data
        const discountAmount = discount.type === 'percentage' 
          ? (avgOrderValue * discount.value / 100)
          : discount.value;
        return sum + (avgOrderValue - discountAmount);
      }, 0),
    };

    // Top performing hours
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const hourSessions = sessions.filter(s => s.startedAt.toDate().getHours() === hour);
      return {
        hour,
        sessions: hourSessions.length,
        completions: hourSessions.filter(s => s.completed).length,
        discounts: discounts.filter(d => d.createdAt.toDate().getHours() === hour).length,
      };
    });

    // Top scores
    const topScores = await GameScoreService.getTopScores(shop, 10);

    // Device/source breakdown
    const sourceBreakdown = sessions.reduce((acc, session) => {
      acc[session.source] = (acc[session.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return res.json({
      success: true,
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      metrics,
      timeSeries: timeSeriesData,
      hourlyBreakdown: hourlyData,
      topScores: topScores.map(score => ({
        customerEmail: score.customerEmail || 'Anonymous',
        score: score.score,
        discount: score.discountEarned,
        achievedAt: score.achievedAt.toDate().toISOString(),
      })),
      sourceBreakdown,
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to load analytics data' 
    });
  }
}

function generateTimeSeries(
  sessions: any[], 
  discounts: any[], 
  startDate: Date, 
  endDate: Date, 
  granularity: string
) {
  const data = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const nextPeriod = new Date(current);
    
    switch (granularity) {
      case 'hour':
        nextPeriod.setHours(current.getHours() + 1);
        break;
      case 'day':
        nextPeriod.setDate(current.getDate() + 1);
        break;
      case 'week':
        nextPeriod.setDate(current.getDate() + 7);
        break;
      case 'month':
        nextPeriod.setMonth(current.getMonth() + 1);
        break;
      default:
        nextPeriod.setDate(current.getDate() + 1);
    }

    const periodSessions = sessions.filter(s => {
      const sessionDate = s.startedAt.toDate();
      return sessionDate >= current && sessionDate < nextPeriod;
    });

    const periodDiscounts = discounts.filter(d => {
      const discountDate = d.createdAt.toDate();
      return discountDate >= current && discountDate < nextPeriod;
    });

    data.push({
      date: current.toISOString(),
      sessions: periodSessions.length,
      completedSessions: periodSessions.filter(s => s.completed).length,
      discounts: periodDiscounts.length,
      usedDiscounts: periodDiscounts.filter(d => d.isUsed).length,
      averageScore: periodSessions.length > 0 
        ? periodSessions.reduce((sum, s) => sum + (s.finalScore || 0), 0) / periodSessions.length 
        : 0,
    });

    current.setTime(nextPeriod.getTime());
  }

  return data;
}
