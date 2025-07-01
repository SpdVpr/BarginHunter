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
    // Generate mock customer data for now
    const mockCustomers = [
      {
        id: 'customer1',
        email: 'customer1@example.com',
        totalSessions: 5,
        completedSessions: 3,
        scores: [150, 200, 180],
        lastPlayedAt: new Date().toISOString(),
        totalDiscountsEarned: 2,
        totalDiscountsUsed: 1,
      },
      {
        id: 'customer2',
        email: 'customer2@example.com',
        totalSessions: 3,
        completedSessions: 2,
        scores: [120, 160],
        lastPlayedAt: new Date(Date.now() - 86400000).toISOString(),
        totalDiscountsEarned: 1,
        totalDiscountsUsed: 1,
      },
    ];

    // Process mock customers
    const customers = mockCustomers.map(customer => {
      const averageScore = customer.scores.length > 0 
        ? customer.scores.reduce((a, b) => a + b, 0) / customer.scores.length 
        : 0;
      
      const bestScore = customer.scores.length > 0 
        ? Math.max(...customer.scores) 
        : 0;

      // Determine if customer is active (played in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const isActive = new Date(customer.lastPlayedAt) > thirtyDaysAgo;

      return {
        ...customer,
        averageScore: Math.round(averageScore * 100) / 100,
        bestScore,
        status: isActive ? 'active' : 'inactive',
      };
    });

    // Sort by total sessions (most active first)
    customers.sort((a, b) => b.totalSessions - a.totalSessions);

    // Calculate summary statistics
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'active').length;
    const averageSessionsPerCustomer = totalCustomers > 0 
      ? customers.reduce((sum, c) => sum + c.totalSessions, 0) / totalCustomers 
      : 0;
    const topPerformers = customers.filter(c => c.totalSessions >= 5).length;

    const summary = {
      totalCustomers,
      activeCustomers,
      averageSessionsPerCustomer: Math.round(averageSessionsPerCustomer * 100) / 100,
      topPerformers,
    };

    res.status(200).json({
      customers,
      summary,
    });
  } catch (error) {
    console.error('Error fetching customers data:', error);
    res.status(500).json({ error: 'Failed to fetch customers data' });
  }
}
