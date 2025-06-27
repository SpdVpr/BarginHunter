import { NextApiRequest, NextApiResponse } from 'next';
import { DiscountService } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop, limit = 50, status = 'all' } = req.query;

    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Shop domain is required' 
      });
    }

    console.log('📊 Loading discount analytics for shop:', shop);

    // Get all discounts for the shop
    const allDiscounts = await DiscountService.getDiscountsByShop(shop, parseInt(limit as string));

    // Filter by status if specified
    let discounts = allDiscounts;
    if (status === 'used') {
      discounts = allDiscounts.filter(d => d.isUsed);
    } else if (status === 'unused') {
      discounts = allDiscounts.filter(d => !d.isUsed);
    }

    // Sort by creation date (newest first)
    discounts.sort((a, b) => {
      const dateA = a.createdAt.toDate();
      const dateB = b.createdAt.toDate();
      return dateB.getTime() - dateA.getTime();
    });

    // Calculate summary statistics
    const usedDiscounts = allDiscounts.filter(d => d.isUsed);
    const unusedDiscounts = allDiscounts.filter(d => !d.isUsed);

    const totalRevenue = usedDiscounts.reduce((sum, discount) => {
      return sum + (discount.actualRevenue || discount.orderValue || 0);
    }, 0);

    const totalDiscountAmount = usedDiscounts.reduce((sum, discount) => {
      return sum + (discount.discountAmount || 0);
    }, 0);

    const averageOrderValue = usedDiscounts.length > 0 
      ? usedDiscounts.reduce((sum, d) => sum + (d.orderValue || 0), 0) / usedDiscounts.length
      : 0;

    // Group by discount tier
    const tierBreakdown = allDiscounts.reduce((acc, discount) => {
      const tier = `${discount.value}%`;
      if (!acc[tier]) {
        acc[tier] = { total: 0, used: 0, revenue: 0 };
      }
      acc[tier].total++;
      if (discount.isUsed) {
        acc[tier].used++;
        acc[tier].revenue += (discount.actualRevenue || discount.orderValue || 0);
      }
      return acc;
    }, {} as Record<string, { total: number; used: number; revenue: number }>);

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentDiscounts = allDiscounts.filter(d => {
      const createdDate = d.createdAt.toDate();
      return createdDate >= sevenDaysAgo;
    });

    const recentUsed = recentDiscounts.filter(d => d.isUsed);

    // Format discounts for display
    const formattedDiscounts = discounts.map(discount => ({
      id: discount.id,
      code: discount.code,
      value: discount.value,
      type: discount.type,
      isUsed: discount.isUsed,
      createdAt: discount.createdAt.toDate().toISOString(),
      usedAt: discount.usedAt?.toDate().toISOString(),
      customerEmail: discount.customerEmail || discount.orderCustomerEmail,
      sessionId: discount.sessionId,
      orderId: discount.orderId,
      orderValue: discount.orderValue,
      discountAmount: discount.discountAmount,
      actualRevenue: discount.actualRevenue,
      currency: discount.currency || 'USD',
      expiresAt: discount.expiresAt?.toDate().toISOString(),
      daysToExpiry: discount.expiresAt 
        ? Math.ceil((discount.expiresAt.toDate().getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null
    }));

    const summary = {
      total: allDiscounts.length,
      used: usedDiscounts.length,
      unused: unusedDiscounts.length,
      usageRate: allDiscounts.length > 0 ? (usedDiscounts.length / allDiscounts.length) * 100 : 0,
      totalRevenue: Math.round(totalRevenue),
      totalDiscountAmount: Math.round(totalDiscountAmount),
      averageOrderValue: Math.round(averageOrderValue),
      recentActivity: {
        generated: recentDiscounts.length,
        used: recentUsed.length,
        revenue: Math.round(recentUsed.reduce((sum, d) => sum + (d.actualRevenue || d.orderValue || 0), 0))
      },
      tierBreakdown: Object.entries(tierBreakdown).map(([tier, data]) => ({
        tier,
        total: data.total,
        used: data.used,
        usageRate: data.total > 0 ? (data.used / data.total) * 100 : 0,
        revenue: Math.round(data.revenue)
      })).sort((a, b) => parseInt(b.tier) - parseInt(a.tier))
    };

    return res.json({
      success: true,
      summary,
      discounts: formattedDiscounts,
      pagination: {
        total: allDiscounts.length,
        showing: discounts.length,
        limit: parseInt(limit as string)
      }
    });

  } catch (error) {
    console.error('📊 Discount analytics error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to load discount analytics' 
    });
  }
}
