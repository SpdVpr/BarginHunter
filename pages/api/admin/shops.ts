import { NextApiRequest, NextApiResponse } from 'next';
import { 
  AdminUserService, 
  SubscriptionService, 
  UsageTrackingService, 
  StoreService 
} from '../../../src/lib/database';
import { db, collections } from '../../../src/lib/firebase';

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

    console.log('🏪 Admin shops access:', { adminEmail, hasToken: !!token });

    console.log('🏪 Admin shops request from:', adminEmail);

    // Get all subscriptions
    let subscriptions = [];
    let stores = [];

    try {
      const subscriptionsSnapshot = await db.collection(collections.subscriptions).get();
      subscriptions = subscriptionsSnapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.warn('Could not fetch subscriptions:', error);
    }

    try {
      const storesSnapshot = await db.collection(collections.stores).get();
      stores = storesSnapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.warn('Could not fetch stores:', error);
    }

    // Get current month usage
    let usageData = [];
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const usageSnapshot = await db.collection(collections.usageTracking)
        .where('month', '==', currentMonth)
        .get();
      usageData = usageSnapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.warn('Could not fetch usage data:', error);
    }

    // Combine data for each shop
    const shops = stores.map(store => {
      const subscription = subscriptions.find(s => s.shopDomain === store.shopDomain);
      const usage = usageData.find(u => u.shopDomain === store.shopDomain);
      
      return {
        shopDomain: store.shopDomain,
        plan: subscription?.plan || 'free',
        status: subscription?.status || 'active',
        revenue: subscription?.price || 0,
        discountCodes: usage?.usage?.discountCodesGenerated || 0,
        gameSessions: usage?.usage?.gameSessions || 0,
        lastActive: store.updatedAt ? new Date(store.updatedAt.seconds * 1000).toLocaleDateString() : 'Unknown',
        installedAt: store.installedAt ? new Date(store.installedAt.seconds * 1000).toLocaleDateString() : 'Unknown',
        isActive: store.isActive,
        shopData: {
          name: store.shopData?.name || 'Unknown',
          email: store.shopData?.email || 'Unknown',
          currency: store.shopData?.currency || 'USD',
          planName: store.shopData?.planName || 'Unknown'
        }
      };
    });

    // Sort by revenue descending
    shops.sort((a, b) => b.revenue - a.revenue);

    console.log('✅ Admin shops data retrieved:', shops.length, 'shops');

    res.status(200).json({
      success: true,
      shops,
      summary: {
        totalShops: shops.length,
        activeShops: shops.filter(s => s.isActive).length,
        totalRevenue: shops.reduce((sum, s) => sum + s.revenue, 0),
        totalDiscountCodes: shops.reduce((sum, s) => sum + s.discountCodes, 0),
        planDistribution: {
          free: shops.filter(s => s.plan === 'free').length,
          starter: shops.filter(s => s.plan === 'starter').length,
          pro: shops.filter(s => s.plan === 'pro').length,
          enterprise: shops.filter(s => s.plan === 'enterprise').length,
        }
      }
    });

  } catch (error) {
    console.error('❌ Admin shops request failed:', error);
    res.status(500).json({
      error: 'Failed to get shops data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
