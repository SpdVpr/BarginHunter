import { NextApiRequest, NextApiResponse } from 'next';

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

    // Import Firebase services
    const { CustomerService, GameSessionService, GameScoreService, DiscountService } = await import('../../../src/lib/database');

    // Get real customer data
    const customers = await CustomerService.getCustomersByShop(shop);
    console.log('🔍 Found customers:', customers.length);

    if (customers.length === 0) {
      console.log('🔍 No customers found, returning empty array');
      return res.status(200).json([]);
    }

    // Process real customers
    const processedCustomers = await Promise.all(customers.map(async (customer) => {
      try {
        // Get customer's scores
        const scores = await GameScoreService.getCustomerScores(shop, customer.customerId || customer.email);
        const scoreValues = scores.map(s => s.score);

        // Get customer's sessions
        const sessions = await GameSessionService.getSessionsByShop(shop, 1000);
        const customerSessions = sessions.filter(s =>
          s.customerId === customer.customerId ||
          s.customerEmail === customer.email
        );

        // Get customer's discounts
        const discounts = await DiscountService.getDiscountsByShop(shop, 1000);
        const customerDiscounts = discounts.filter(d =>
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
