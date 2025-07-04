import { NextApiRequest, NextApiResponse } from 'next';
import { AdminAnalyticsService, AdminUserService } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check admin authentication via cookie or header
    const adminEmail = req.headers['x-admin-email'] as string || 'admin@bargainhunter.com';

    // Simple authentication check - in production you'd verify JWT token
    const token = req.cookies.admin_token;
    if (!token && !req.headers['x-admin-email']) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    // For demo purposes, allow if we have either token or admin email header
    console.log('🔐 Admin analytics access:', { adminEmail, hasToken: !!token });

    console.log('📊 Admin analytics request from:', adminEmail);

    // Get latest analytics or generate if needed
    let analytics = await AdminAnalyticsService.getLatestAnalytics();

    if (!analytics) {
      console.log('📊 No analytics found, generating...');
      try {
        await AdminAnalyticsService.generateDailyAnalytics();
        analytics = await AdminAnalyticsService.getLatestAnalytics();
      } catch (generateError) {
        console.error('📊 Failed to generate analytics:', generateError);
        // Return empty analytics structure for demo
        analytics = {
          id: 'demo',
          date: new Date().toISOString().slice(0, 10),
          metrics: {
            totalRevenue: 0,
            monthlyRecurringRevenue: 0,
            newRevenue: 0,
            churnedRevenue: 0,
            totalShops: 0,
            activeShops: 0,
            newShops: 0,
            churnedShops: 0,
            planDistribution: { free: 0, starter: 0, pro: 0, enterprise: 0 },
            totalGameSessions: 0,
            totalDiscountCodes: 0,
            averageDiscountCodesPerShop: 0,
            freeToStarterConversion: 0,
            starterToProConversion: 0,
            proToEnterpriseConversion: 0,
            totalNotifications: 0,
            upgradeRecommendations: 0,
            limitWarnings: 0,
          },
          planMetrics: {},
          topCountries: [],
          systemMetrics: { apiCalls: 0, errorRate: 0, averageResponseTime: 0, uptime: 99.9 },
          createdAt: { seconds: Date.now() / 1000 },
          updatedAt: { seconds: Date.now() / 1000 },
        };
      }
    }

    console.log('✅ Admin analytics retrieved successfully');

    res.status(200).json({
      success: true,
      analytics,
      generatedAt: analytics.createdAt,
      lastUpdated: analytics.updatedAt
    });

  } catch (error) {
    console.error('❌ Admin analytics failed:', error);
    res.status(500).json({
      error: 'Failed to get admin analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
