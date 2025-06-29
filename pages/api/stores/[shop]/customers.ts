import { NextApiRequest, NextApiResponse } from 'next';
import { CustomerService, GameSessionService, DiscountService } from '../../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop } = req.query;

    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Shop domain is required' 
      });
    }

    // Get customers for the shop (with fallback for building indexes)
    let customers: any[] = [];
    let recentSessions: any[] = [];
    let recentDiscounts: any[] = [];

    try {
      customers = await CustomerService.getCustomersByShop(shop, 100);
      recentSessions = await GameSessionService.getSessionsByShop(shop, 50);
      recentDiscounts = await DiscountService.getDiscountsByShop(shop, 50);
    } catch (indexError: any) {
      // If indexes are building, return empty arrays
      if (indexError.code === 9 && indexError.details?.includes('index is currently building')) {
        console.log('📊 Firebase indexes are building, returning empty customers data...');
        customers = [];
        recentSessions = [];
        recentDiscounts = [];
      } else {
        throw indexError;
      }
    }

    // Enrich customer data with recent activity
    const enrichedCustomers = customers.map(customer => {
      const customerSessions = recentSessions.filter(session => 
        session.customerEmail === customer.email || 
        session.customerId === customer.customerId
      );
      
      const customerDiscounts = recentDiscounts.filter(discount => 
        discount.customerEmail === customer.email ||
        discount.customerId === customer.customerId
      );

      const lastSession = customerSessions
        .sort((a, b) => b.startedAt.toDate().getTime() - a.startedAt.toDate().getTime())[0];

      const usedDiscounts = customerDiscounts.filter(d => d.isUsed);

      return {
        id: customer.id,
        email: customer.email,
        customerId: customer.customerId,
        totalSessions: customer.totalSessions,
        totalScore: customer.totalScore,
        bestScore: customer.bestScore,
        totalDiscountsEarned: customer.totalDiscountsEarned,
        totalDiscountsUsed: customer.totalDiscountsUsed,
        firstPlayedAt: customer.firstPlayedAt.toDate().toISOString(),
        lastPlayedAt: customer.lastPlayedAt.toDate().toISOString(),
        lastSessionScore: lastSession?.finalScore || 0,
        recentSessions: customerSessions.length,
        usedDiscountsCount: usedDiscounts.length,
        preferences: customer.preferences,
        // Calculate customer value metrics
        averageScore: customer.totalSessions > 0 ? Math.round(customer.totalScore / customer.totalSessions) : 0,
        discountUsageRate: customer.totalDiscountsEarned > 0 
          ? Math.round((customer.totalDiscountsUsed / customer.totalDiscountsEarned) * 100) 
          : 0,
      };
    });

    // Sort by last played date (most recent first)
    enrichedCustomers.sort((a, b) => 
      new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime()
    );

    // Calculate summary statistics
    const totalCustomers = enrichedCustomers.length;
    const activeCustomers = enrichedCustomers.filter(c => {
      const lastPlayed = new Date(c.lastPlayedAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return lastPlayed > thirtyDaysAgo;
    }).length;

    const totalSessions = enrichedCustomers.reduce((sum, c) => sum + c.totalSessions, 0);
    const totalDiscountsEarned = enrichedCustomers.reduce((sum, c) => sum + c.totalDiscountsEarned, 0);
    const totalDiscountsUsed = enrichedCustomers.reduce((sum, c) => sum + c.totalDiscountsUsed, 0);
    const averageScore = totalSessions > 0 
      ? Math.round(enrichedCustomers.reduce((sum, c) => sum + c.totalScore, 0) / totalSessions)
      : 0;

    return res.json({
      success: true,
      customers: enrichedCustomers,
      summary: {
        totalCustomers,
        activeCustomers,
        totalSessions,
        totalDiscountsEarned,
        totalDiscountsUsed,
        averageScore,
        discountUsageRate: totalDiscountsEarned > 0 
          ? Math.round((totalDiscountsUsed / totalDiscountsEarned) * 100) 
          : 0,
      }
    });

  } catch (error) {
    console.error('Customers API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to load customers data' 
    });
  }
}
