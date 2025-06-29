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
    let allSessions: any[] = [];
    let allDiscounts: any[] = [];

    try {
      console.log(`🔍 Loading analytics data for shop: ${shop}`);
      allSessions = await GameSessionService.getSessionsByShop(shop, 10000);
      allDiscounts = await DiscountService.getDiscountsByShop(shop, 10000);
      console.log(`✅ Loaded ${allSessions.length} sessions and ${allDiscounts.length} discounts`);
    } catch (dbError: any) {
      console.error('❌ Database error in analytics:', dbError);

      // Return empty analytics data instead of failing
      return res.json({
        period: period as string,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        metrics: {
          totalSessions: 0,
          completedSessions: 0,
          completionRate: 0,
          totalDiscounts: 0,
          usedDiscounts: 0,
          discountUsageRate: 0,
          averageScore: 0,
          uniqueCustomers: 0,
          estimatedRevenue: 0,
        },
        timeSeries: [],
        hourlyBreakdown: [],
        topScores: [],
        sourceBreakdown: {},
      });
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
    let timeSeriesData = [];
    try {
      timeSeriesData = generateTimeSeries(sessions, discounts, startDate, endDate, granularity as string);
    } catch (timeSeriesError) {
      console.error('Time series generation error:', timeSeriesError);
      // Fallback to empty array if time series fails
      timeSeriesData = [];
    }

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

    // Top scores (with fallback for missing index)
    let topScores: any[] = [];
    try {
      topScores = await GameScoreService.getTopScores(shop, 10);
    } catch (scoresError: any) {
      console.error('❌ Error loading top scores:', scoresError);
      if (scoresError.code === 9 && scoresError.details?.includes('index')) {
        console.log('📝 Top scores index needed:', scoresError.details);
      }
      topScores = []; // Fallback to empty array
    }

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
  let iterations = 0;
  const maxIterations = 1000; // Prevent infinite loops

  while (current <= endDate && iterations < maxIterations) {
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

    // Safety check to prevent infinite loops
    if (nextPeriod.getTime() <= current.getTime()) {
      console.error('Time series generation: nextPeriod is not advancing');
      break;
    }

    const periodSessions = sessions.filter(s => {
      try {
        const sessionDate = s.startedAt?.toDate ? s.startedAt.toDate() : new Date(s.startedAt);
        return sessionDate >= current && sessionDate < nextPeriod;
      } catch (error) {
        console.error('Error parsing session date:', error);
        return false;
      }
    });

    const periodDiscounts = discounts.filter(d => {
      try {
        const discountDate = d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt);
        return discountDate >= current && discountDate < nextPeriod;
      } catch (error) {
        console.error('Error parsing discount date:', error);
        return false;
      }
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
    iterations++;
  }

  return data;
}
