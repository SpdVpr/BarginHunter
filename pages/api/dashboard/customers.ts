import { NextApiRequest, NextApiResponse } from 'next';
import { CustomerService, GameSessionService, GameScoreService, DiscountService } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { shop } = req.query;

  if (!shop || typeof shop !== 'string') {
    return res.status(400).json({ error: 'Shop parameter is required' });
  }

  try {
    console.log('🔍 Customers API: Getting real data for shop:', shop);

    // Get real customer data (same approach as stats API)
    let customers: any[] = [];
    let allSessions: any[] = [];
    let allDiscounts: any[] = [];

    try {
      customers = await CustomerService.getCustomersByShop(shop);
      console.log('🔍 Found customers:', customers.length);

      // Get all sessions and discounts once for efficiency
      allSessions = await GameSessionService.getSessionsByShop(shop, 1000);
      allDiscounts = await DiscountService.getDiscountsByShop(shop, 1000);
      console.log('🔍 Found sessions:', allSessions.length, 'discounts:', allDiscounts.length);
    } catch (indexError: any) {
      // If indexes are building, return empty arrays (same as stats API)
      if (indexError.code === 9 && indexError.details?.includes('index is currently building')) {
        console.log('🔍 Firebase indexes are building, returning empty data...');
        customers = [];
        allSessions = [];
        allDiscounts = [];
      } else {
        throw indexError;
      }
    }

    if (customers.length === 0) {
      console.log('🔍 No customers found, returning empty array');
      return res.status(200).json({
        customers: [],
        summary: {
          totalCustomers: 0,
          activeCustomers: 0,
          averageSessionsPerCustomer: 0,
          topPerformers: 0,
        },
      });
    }

    // Process real customers
    const processedCustomers = await Promise.all(customers.map(async (customer) => {
      try {
        // Get customer's scores (optimized - single call per customer)
        let scores: any[] = [];
        try {
          scores = await GameScoreService.getCustomerScores(shop, customer.customerId || customer.email);
        } catch (scoreError) {
          console.log('🔍 Could not get scores for customer:', customer.email, scoreError);
          scores = [];
        }
        const scoreValues = scores.map(s => s.score);

        // Filter sessions and discounts from already loaded data
        const customerSessions = allSessions.filter(s =>
          s.customerId === customer.customerId ||
          s.customerEmail === customer.email
        );

        const customerDiscounts = allDiscounts.filter(d =>
          d.customerId === customer.customerId ||
          d.customerEmail === customer.email
        );

        const averageScore = scoreValues.length > 0
          ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length
          : 0;

        const bestScore = scoreValues.length > 0
          ? Math.max(...scoreValues)
          : 0;

        // Determine if customer is active (played in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const isActive = customer.lastPlayedAt && new Date(customer.lastPlayedAt.toDate()) > thirtyDaysAgo;

        return {
          id: customer.customerId || customer.email,
          email: customer.email,
          totalSessions: customerSessions.length,
          completedSessions: customerSessions.filter(s => s.completed).length,
          scores: scoreValues,
          lastPlayedAt: customer.lastPlayedAt ? customer.lastPlayedAt.toDate().toISOString() : null,
          totalDiscountsEarned: customerDiscounts.length,
          totalDiscountsUsed: customerDiscounts.filter(d => d.isUsed).length,
          averageScore: Math.round(averageScore * 100) / 100,
          bestScore,
          status: isActive ? 'active' : 'inactive',
        };
      } catch (error) {
        console.error('Error processing customer:', customer, error);
        return {
          id: customer.customerId || customer.email,
          email: customer.email,
          totalSessions: 0,
          completedSessions: 0,
          scores: [],
          lastPlayedAt: null,
          totalDiscountsEarned: 0,
          totalDiscountsUsed: 0,
          averageScore: 0,
          bestScore: 0,
          status: 'inactive',
        };
      }
    }));

    // Sort by total sessions (most active first)
    processedCustomers.sort((a, b) => b.totalSessions - a.totalSessions);

    // Calculate summary statistics
    const totalCustomers = processedCustomers.length;
    const activeCustomers = processedCustomers.filter(c => c.status === 'active').length;
    const averageSessionsPerCustomer = totalCustomers > 0
      ? processedCustomers.reduce((sum, c) => sum + c.totalSessions, 0) / totalCustomers
      : 0;
    const topPerformers = processedCustomers.filter(c => c.totalSessions >= 5).length;

    const summary = {
      totalCustomers,
      activeCustomers,
      averageSessionsPerCustomer: Math.round(averageSessionsPerCustomer * 100) / 100,
      topPerformers,
    };

    res.status(200).json({
      customers: processedCustomers,
      summary,
    });

  } catch (error) {
    console.error('❌ Error fetching customers:', error);
    res.status(200).json({
      customers: [],
      summary: {
        totalCustomers: 0,
        activeCustomers: 0,
        averageSessionsPerCustomer: 0,
        topPerformers: 0,
      },
    });
  }
}
