import { NextApiRequest, NextApiResponse } from 'next';
import { AdminAnalyticsService, AdminUserService } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check admin authentication
    const adminEmail = req.headers['x-admin-email'] as string;
    if (!adminEmail) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    const hasPermission = await AdminUserService.hasPermission(adminEmail, 'viewAnalytics');
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    console.log('📊 Admin analytics request from:', adminEmail);

    // Get latest analytics or generate if needed
    let analytics = await AdminAnalyticsService.getLatestAnalytics();
    
    if (!analytics) {
      console.log('📊 No analytics found, generating...');
      await AdminAnalyticsService.generateDailyAnalytics();
      analytics = await AdminAnalyticsService.getLatestAnalytics();
    }

    if (!analytics) {
      return res.status(500).json({ error: 'Failed to generate analytics' });
    }

    // Update admin last login
    await AdminUserService.updateLastLogin(adminEmail);

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
