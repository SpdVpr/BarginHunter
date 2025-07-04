import { NextApiRequest, NextApiResponse } from 'next';
import { AdminUserService, AdminAnalyticsService } from '../../../../src/lib/database';
import { db, collections } from '../../../../src/lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check admin authentication
    const adminEmail = req.headers['x-admin-email'] as string || 
                      req.cookies.admin_token ? 'admin@bargainhunter.com' : null; // Simplified for demo
    
    if (!adminEmail) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    console.log('📊 Generating admin report for:', adminEmail);

    // Get latest analytics
    const analytics = await AdminAnalyticsService.getLatestAnalytics();
    
    if (!analytics) {
      return res.status(404).json({ error: 'No analytics data available' });
    }

    // Get all shops data
    const storesSnapshot = await db.collection(collections.stores).get();
    const stores = storesSnapshot.docs.map(doc => doc.data());

    const subscriptionsSnapshot = await db.collection(collections.subscriptions).get();
    const subscriptions = subscriptionsSnapshot.docs.map(doc => doc.data());

    // Generate CSV report
    const csvData = generateCSVReport(analytics, stores, subscriptions);
    
    // Set headers for file download
    const filename = `bargain-hunter-report-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.status(200).send(csvData);

  } catch (error) {
    console.error('❌ Report generation failed:', error);
    res.status(500).json({
      error: 'Report generation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function generateCSVReport(analytics: any, stores: any[], subscriptions: any[]): string {
  const lines = [];
  
  // Header
  lines.push('Bargain Hunter - Business Report');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  
  // Summary metrics
  lines.push('SUMMARY METRICS');
  lines.push('Metric,Value');
  lines.push(`Total Revenue,$${analytics.metrics.totalRevenue}`);
  lines.push(`Monthly Recurring Revenue,$${analytics.metrics.monthlyRecurringRevenue}`);
  lines.push(`Total Shops,${analytics.metrics.totalShops}`);
  lines.push(`Active Shops,${analytics.metrics.activeShops}`);
  lines.push(`Total Game Sessions,${analytics.metrics.totalGameSessions}`);
  lines.push(`Total Discount Codes,${analytics.metrics.totalDiscountCodes}`);
  lines.push(`Average Codes per Shop,${analytics.metrics.averageDiscountCodesPerShop}`);
  lines.push('');
  
  // Plan distribution
  lines.push('PLAN DISTRIBUTION');
  lines.push('Plan,Count,Percentage');
  const total = analytics.metrics.totalShops;
  lines.push(`Free,${analytics.metrics.planDistribution.free},${((analytics.metrics.planDistribution.free / total) * 100).toFixed(1)}%`);
  lines.push(`Starter,${analytics.metrics.planDistribution.starter},${((analytics.metrics.planDistribution.starter / total) * 100).toFixed(1)}%`);
  lines.push(`Pro,${analytics.metrics.planDistribution.pro},${((analytics.metrics.planDistribution.pro / total) * 100).toFixed(1)}%`);
  lines.push(`Enterprise,${analytics.metrics.planDistribution.enterprise},${((analytics.metrics.planDistribution.enterprise / total) * 100).toFixed(1)}%`);
  lines.push('');
  
  // Revenue by plan
  lines.push('REVENUE BY PLAN');
  lines.push('Plan,Customers,Revenue,Avg Revenue per Customer');
  Object.entries(analytics.planMetrics).forEach(([plan, metrics]: [string, any]) => {
    const avgRevenue = metrics.count > 0 ? (metrics.revenue / metrics.count).toFixed(2) : '0.00';
    lines.push(`${plan.toUpperCase()},${metrics.count},$${metrics.revenue.toFixed(2)},$${avgRevenue}`);
  });
  lines.push('');
  
  // Top shops by revenue
  lines.push('TOP SHOPS BY REVENUE');
  lines.push('Shop Domain,Plan,Revenue,Status');
  
  const shopsWithRevenue = stores.map(store => {
    const subscription = subscriptions.find(s => s.shopDomain === store.shopDomain);
    return {
      shopDomain: store.shopDomain,
      plan: subscription?.plan || 'free',
      revenue: subscription?.price || 0,
      status: subscription?.status || 'active'
    };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 20);
  
  shopsWithRevenue.forEach(shop => {
    lines.push(`${shop.shopDomain},${shop.plan},$${shop.revenue},${shop.status}`);
  });
  
  return lines.join('\n');
}
