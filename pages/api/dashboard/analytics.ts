import { NextApiRequest, NextApiResponse } from 'next';

// Mock analytics data when APIs are not available
function getMockAnalyticsData() {
  return {
    metrics: {
      totalSessions: 156,
      completedSessions: 89,
      totalDiscounts: 45,
      usedDiscounts: 23,
      completionRate: 57.05,
      discountUsageRate: 51.11,
      averageScore: 245,
      uniqueCustomers: 67,
      estimatedRevenue: 1150,
    },
    topScores: [
      { customerEmail: 'player1@example.com', score: 450, discount: 15, achievedAt: new Date().toISOString() },
      { customerEmail: 'player2@example.com', score: 380, discount: 10, achievedAt: new Date().toISOString() },
      { customerEmail: 'player3@example.com', score: 320, discount: 10, achievedAt: new Date().toISOString() },
    ],
    hourlyBreakdown: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      sessions: Math.floor(Math.random() * 15) + 1,
      completions: Math.floor(Math.random() * 8) + 1,
      discounts: Math.floor(Math.random() * 5) + 1,
    })),
    sourceBreakdown: {
      'Direct': 94,
      'Social Media': 31,
      'Email': 16,
      'Other': 15,
    },
  };
}

// Get real analytics data from Firebase
async function getAnalyticsFromExistingAPI(shop: string, period: string) {
  try {
    console.log('🔍 Getting real analytics data for shop:', shop, 'period:', period);

    // Import Firebase services
    const { GameSessionService, GameScoreService, DiscountService } = await import('../../../src/lib/database');

    // Get real sessions data
    const sessions = await GameSessionService.getSessionsByShop(shop, 1000);
    console.log('🔍 Found sessions:', sessions.length);

    // Get real scores data
    const scores = await GameScoreService.getScoresByShop(shop, 100);
    console.log('🔍 Found scores:', scores.length);

    // Get real discounts data
    const discounts = await DiscountService.getDiscountsByShop(shop, 100);
    console.log('🔍 Found discounts:', discounts.length);

    // Calculate period filter
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
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Filter sessions by period
    const periodSessions = sessions.filter(session => {
      const sessionDate = session.startedAt.toDate();
      return sessionDate >= startDate;
    });

    // Filter scores by period
    const periodScores = scores.filter(score => {
      const scoreDate = score.achievedAt.toDate();
      return scoreDate >= startDate;
    });

    // Filter discounts by period
    const periodDiscounts = discounts.filter(discount => {
      const discountDate = discount.createdAt.toDate();
      return discountDate >= startDate;
    });

    // Calculate metrics
    const totalSessions = periodSessions.length;
    const completedSessions = periodSessions.filter(s => s.completed).length;
    const totalDiscounts = periodDiscounts.length;
    const usedDiscounts = periodDiscounts.filter(d => d.isUsed).length;
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
    const discountUsageRate = totalDiscounts > 0 ? (usedDiscounts / totalDiscounts) * 100 : 0;
    const averageScore = periodScores.length > 0 ?
      periodScores.reduce((sum, score) => sum + score.score, 0) / periodScores.length : 0;

    // Get unique customers
    const uniqueCustomers = new Set([
      ...periodSessions.map(s => s.customerEmail || s.customerId || s.ipAddress).filter(Boolean)
    ]).size;

    // Calculate estimated revenue (rough estimate)
    const estimatedRevenue = usedDiscounts * 50; // Assume average order $50

    // Get top scores
    const topScores = periodScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(score => ({
        customerEmail: score.customerEmail || 'Anonymous',
        score: score.score,
        discount: score.discountEarned,
        achievedAt: score.achievedAt.toDate().toISOString()
      }));

    // Calculate hourly breakdown
    const hourlyBreakdown = Array.from({ length: 24 }, (_, hour) => {
      const hourSessions = periodSessions.filter(session => {
        const sessionHour = session.startedAt.toDate().getHours();
        return sessionHour === hour;
      });

      return {
        hour,
        sessions: hourSessions.length,
        completions: hourSessions.filter(s => s.completed).length,
        discounts: periodDiscounts.filter(discount => {
          const discountHour = discount.createdAt.toDate().getHours();
          return discountHour === hour;
        }).length,
      };
    });

    // Source breakdown (simplified)
    const sourceBreakdown = {
      'Direct': Math.floor(totalSessions * 0.6),
      'Social Media': Math.floor(totalSessions * 0.2),
      'Email': Math.floor(totalSessions * 0.1),
      'Other': Math.floor(totalSessions * 0.1),
    };

    return {
      metrics: {
        totalSessions,
        completedSessions,
        totalDiscounts,
        usedDiscounts,
        completionRate: Math.round(completionRate * 100) / 100,
        discountUsageRate: Math.round(discountUsageRate * 100) / 100,
        averageScore: Math.round(averageScore),
        uniqueCustomers,
        estimatedRevenue,
      },
      topScores,
      hourlyBreakdown,
      sourceBreakdown,
    };
  } catch (error) {
    console.error('❌ Error getting real analytics data:', error);
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { shop, period = '30d' } = req.query;

  if (!shop || typeof shop !== 'string') {
    return res.status(400).json({ error: 'Shop parameter is required' });
  }

  try {
    console.log('🔍 Analytics API: Getting real data for shop:', shop);

    // Try to get real analytics data from Firebase
    const analyticsData = await getAnalyticsFromExistingAPI(shop, period as string);

    console.log('🔍 Analytics API: Real data retrieved:', analyticsData);
    res.status(200).json(analyticsData);
  } catch (error) {
    console.error('❌ Error fetching analytics data:', error);

    // Return empty/zero data instead of mock data to see what's really working
    const emptyData = {
      metrics: {
        totalSessions: 0,
        completedSessions: 0,
        totalDiscounts: 0,
        usedDiscounts: 0,
        completionRate: 0,
        discountUsageRate: 0,
        averageScore: 0,
        uniqueCustomers: 0,
        estimatedRevenue: 0,
      },
      topScores: [],
      hourlyBreakdown: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        sessions: 0,
        completions: 0,
        discounts: 0,
      })),
      sourceBreakdown: {
        'Direct': 0,
        'Social Media': 0,
        'Email': 0,
        'Other': 0,
      },
    };

    res.status(200).json(emptyData);
  }
}
