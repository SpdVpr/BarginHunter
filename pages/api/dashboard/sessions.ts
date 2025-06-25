import { NextApiRequest, NextApiResponse } from 'next';
import { GameSessionService } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop, limit = '50', offset = '0' } = req.query;

    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Shop domain is required' 
      });
    }

    const limitNum = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);

    // Get sessions for the shop (with fallback for building indexes)
    let allSessions: any[] = [];

    try {
      allSessions = await GameSessionService.getSessionsByShop(shop, limitNum + offsetNum);
    } catch (indexError: any) {
      // If indexes are building, return empty array
      if (indexError.code === 9 && indexError.details?.includes('index is currently building')) {
        console.log('📊 Firebase indexes are building, returning empty sessions data...');
        allSessions = [];
      } else {
        throw indexError;
      }
    }

    const sessions = allSessions.slice(offsetNum, offsetNum + limitNum);

    // Format sessions for the dashboard
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      customerEmail: session.customerEmail || 'Anonymous',
      customerId: session.customerId,
      score: session.finalScore || 0,
      discount: session.discountEarned || 0,
      discountCode: session.discountCode,
      completedAt: session.endedAt ? session.endedAt.toDate().toISOString() : session.startedAt.toDate().toISOString(),
      startedAt: session.startedAt.toDate().toISOString(),
      status: session.completed ? 'completed' : 'abandoned',
      gameData: session.gameData,
      source: session.source,
      timeSpent: session.gameData?.timeSpent || 0,
      moves: session.gameData?.moves || 0,
    }));

    // Calculate summary statistics for this batch
    const completedCount = formattedSessions.filter(s => s.status === 'completed').length;
    const totalDiscount = formattedSessions.reduce((sum, s) => sum + s.discount, 0);
    const averageScore = formattedSessions.length > 0 
      ? Math.round(formattedSessions.reduce((sum, s) => sum + s.score, 0) / formattedSessions.length)
      : 0;

    return res.json({
      success: true,
      sessions: formattedSessions,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: allSessions.length,
        hasMore: offsetNum + limitNum < allSessions.length,
      },
      summary: {
        total: formattedSessions.length,
        completed: completedCount,
        abandoned: formattedSessions.length - completedCount,
        totalDiscount,
        averageScore,
        completionRate: formattedSessions.length > 0 
          ? Math.round((completedCount / formattedSessions.length) * 100) 
          : 0,
      }
    });

  } catch (error) {
    console.error('Dashboard sessions error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to load sessions data' 
    });
  }
}
