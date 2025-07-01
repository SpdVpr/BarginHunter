import type { NextApiRequest, NextApiResponse } from 'next';
import { GameConfigService, GameSessionService } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop } = req.query;

    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ error: 'Shop parameter is required' });
    }

    console.log('🔍 Debug config check for shop:', shop);

    // Get current configuration
    const config = await GameConfigService.getConfig(shop);
    
    if (!config) {
      return res.status(404).json({ 
        error: 'No configuration found for shop',
        shop: shop
      });
    }

    // Get recent sessions to check current usage
    const sessions = await GameSessionService.getSessionsByShop(shop, 50);
    const completedSessions = sessions.filter(s => s.completed);

    // Calculate time-based sessions (last 24 hours by default)
    const resetHours = config.gameSettings?.playLimitResetHours || 24;
    const resetCutoff = new Date();
    resetCutoff.setHours(resetCutoff.getHours() - resetHours);

    const recentSessions = completedSessions.filter(session => {
      const sessionTime = session.startedAt.toDate();
      return sessionTime > resetCutoff;
    });

    // Group by IP address
    const sessionsByIP = recentSessions.reduce((acc, session) => {
      const ip = session.ipAddress || 'unknown';
      if (!acc[ip]) acc[ip] = [];
      acc[ip].push(session);
      return acc;
    }, {} as Record<string, any[]>);

    const debugInfo = {
      shop: shop,
      timestamp: new Date().toISOString(),
      configuration: {
        isEnabled: config.isEnabled,
        gameSettings: config.gameSettings,
        lastUpdated: config.updatedAt?.toDate?.()?.toISOString() || 'unknown'
      },
      playLimitAnalysis: {
        maxPlaysPerCustomer: config.gameSettings?.maxPlaysPerCustomer || 'not set',
        playLimitResetHours: resetHours,
        resetCutoffTime: resetCutoff.toISOString(),
        totalCompletedSessions: completedSessions.length,
        recentSessionsCount: recentSessions.length,
        sessionsByIP: Object.keys(sessionsByIP).map(ip => ({
          ipAddress: ip,
          sessionCount: sessionsByIP[ip].length,
          sessions: sessionsByIP[ip].map(s => ({
            id: s.id,
            startedAt: s.startedAt.toDate().toISOString(),
            completed: s.completed
          }))
        }))
      }
    };

    return res.status(200).json(debugInfo);

  } catch (error) {
    console.error('❌ Error in config check:', error);
    return res.status(500).json({
      error: 'Failed to check configuration',
      details: error.message
    });
  }
}
