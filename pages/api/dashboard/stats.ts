import { NextApiRequest, NextApiResponse } from 'next';
import { GameSessionService, GameScoreService, DiscountService, CustomerService } from '../../../src/lib/database';

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

    // Get all sessions for the shop (with fallback for building indexes)
    let sessions: any[] = [];
    let discounts: any[] = [];

    try {
      sessions = await GameSessionService.getSessionsByShop(shop, 1000);
      discounts = await DiscountService.getDiscountsByShop(shop, 1000);
    } catch (indexError: any) {
      // If indexes are building, return empty arrays
      if (indexError.code === 9 && indexError.details?.includes('index is currently building')) {
        console.log('📊 Firebase indexes are building, returning empty data...');
        sessions = [];
        discounts = [];
      } else {
        throw indexError;
      }
    }

    const completedSessions = sessions.filter(session => session.completed);
    const usedDiscounts = discounts.filter(discount => discount.isUsed);

    // Calculate statistics
    const totalSessions = sessions.length;
    const totalCompletedSessions = completedSessions.length;
    const totalDiscounts = discounts.length;
    const totalUsedDiscounts = usedDiscounts.length;
    
    // Calculate average score
    const totalScore = completedSessions.reduce((sum, session) => sum + (session.finalScore || 0), 0);
    const averageScore = totalCompletedSessions > 0 ? Math.round(totalScore / totalCompletedSessions) : 0;
    
    // Calculate conversion rate (completed sessions / total sessions)
    const conversionRate = totalSessions > 0 ? (totalCompletedSessions / totalSessions) * 100 : 0;
    
    // Calculate actual revenue from order data
    const actualRevenue = usedDiscounts.reduce((sum, discount) => {
      // Use actual order data if available
      if (discount.actualRevenue) {
        return sum + discount.actualRevenue;
      }
      // Fallback to estimation for older records
      const estimatedOrderValue = discount.orderValue || 100;
      const discountAmount = discount.discountAmount ||
        (discount.type === 'percentage'
          ? (estimatedOrderValue * discount.value / 100)
          : discount.value);
      return sum + (estimatedOrderValue - discountAmount);
    }, 0);

    // Calculate total order value (before discounts)
    const totalOrderValue = usedDiscounts.reduce((sum, discount) => {
      return sum + (discount.orderValue || 100); // Fallback for older records
    }, 0);

    // Calculate total discount amount given
    const totalDiscountAmount = usedDiscounts.reduce((sum, discount) => {
      return sum + (discount.discountAmount ||
        (discount.type === 'percentage'
          ? ((discount.orderValue || 100) * discount.value / 100)
          : discount.value));
    }, 0);

    // Get unique customers count
    const uniqueCustomerEmails = new Set(
      sessions
        .filter(session => session.customerEmail)
        .map(session => session.customerEmail)
    );
    const activeCustomers = uniqueCustomerEmails.size;

    const stats = {
      totalSessions,
      completedSessions: totalCompletedSessions,
      totalDiscounts,
      usedDiscounts: totalUsedDiscounts,
      conversionRate: Math.round(conversionRate * 10) / 10,
      averageScore,
      activeCustomers,
      revenue: Math.round(actualRevenue),
      totalOrderValue: Math.round(totalOrderValue),
      totalDiscountAmount: Math.round(totalDiscountAmount),
      
      // Additional metrics
      completionRate: totalSessions > 0 ? Math.round((totalCompletedSessions / totalSessions) * 100) : 0,
      discountUsageRate: totalDiscounts > 0 ? Math.round((totalUsedDiscounts / totalDiscounts) * 100) : 0,
      
      // Time-based metrics (last 30 days)
      last30Days: {
        sessions: sessions.filter(session => {
          const sessionDate = session.startedAt.toDate();
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return sessionDate >= thirtyDaysAgo;
        }).length,
        
        discounts: discounts.filter(discount => {
          const discountDate = discount.createdAt.toDate();
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return discountDate >= thirtyDaysAgo;
        }).length,
      },
      
      // Today's metrics
      today: {
        sessions: sessions.filter(session => {
          const sessionDate = session.startedAt.toDate();
          const today = new Date();
          return sessionDate.toDateString() === today.toDateString();
        }).length,
        
        discounts: discounts.filter(discount => {
          const discountDate = discount.createdAt.toDate();
          const today = new Date();
          return discountDate.toDateString() === today.toDateString();
        }).length,
      }
    };

    return res.json(stats);

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to load dashboard statistics' 
    });
  }
}
