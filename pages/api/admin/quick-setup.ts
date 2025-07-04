import { NextApiRequest, NextApiResponse } from 'next';
import { AdminUserService, AdminAnalyticsService } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🚀 Quick admin setup starting...');

    // Create admin user if doesn't exist
    let adminUser;
    try {
      adminUser = await AdminUserService.getAdminUser('admin@bargainhunter.com');
    } catch (error) {
      console.log('Admin user not found, creating...');
    }

    if (!adminUser) {
      const adminId = await AdminUserService.createAdminUser({
        email: 'admin@bargainhunter.com',
        role: 'super_admin',
        permissions: {
          viewAnalytics: true,
          manageShops: true,
          manageBilling: true,
          viewSupport: true,
          systemAdmin: true,
        },
        isActive: true,
      });
      console.log('✅ Admin user created:', adminId);
    } else {
      console.log('✅ Admin user already exists');
    }

    // Generate initial analytics if needed
    try {
      let analytics = await AdminAnalyticsService.getLatestAnalytics();
      if (!analytics) {
        console.log('📊 Generating initial analytics...');
        await AdminAnalyticsService.generateDailyAnalytics();
        analytics = await AdminAnalyticsService.getLatestAnalytics();
      }
      console.log('✅ Analytics ready');
    } catch (error) {
      console.log('⚠️ Analytics generation failed, will use fallback');
    }

    res.status(200).json({
      success: true,
      message: 'Admin setup completed successfully',
      adminEmail: 'admin@bargainhunter.com',
      adminPassword: 'admin123',
      loginUrl: '/api/admin/auth/login',
      dashboardUrl: '/admin/dashboard'
    });

  } catch (error) {
    console.error('❌ Quick admin setup failed:', error);
    res.status(500).json({
      error: 'Quick admin setup failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
