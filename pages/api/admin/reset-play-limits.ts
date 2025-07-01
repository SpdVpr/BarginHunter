import type { NextApiRequest, NextApiResponse } from 'next';
import { GameSessionService } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop, ipAddress } = req.body;

    if (!shop) {
      return res.status(400).json({ error: 'Shop domain is required' });
    }

    console.log('🔄 Resetting play limits for shop:', shop);

    if (ipAddress) {
      // Reset for specific IP address
      console.log('🔄 Resetting play limits for IP:', ipAddress);
      
      // Get all sessions for this shop and IP
      const allSessions = await GameSessionService.getSessionsByShop(shop, 1000);
      const ipSessions = allSessions.filter(session => session.ipAddress === ipAddress);
      
      console.log('🔄 Found', ipSessions.length, 'sessions for IP:', ipAddress);
      
      // Delete sessions for this IP
      for (const session of ipSessions) {
        try {
          await GameSessionService.deleteSession(session.id);
          console.log('🗑️ Deleted session:', session.id);
        } catch (error) {
          console.error('❌ Failed to delete session:', session.id, error);
        }
      }
      
      return res.status(200).json({
        success: true,
        message: `Reset play limits for IP ${ipAddress}`,
        deletedSessions: ipSessions.length
      });
    } else {
      // Reset for entire shop
      console.log('🔄 Resetting ALL play limits for shop:', shop);
      
      // Get all sessions for this shop
      const allSessions = await GameSessionService.getSessionsByShop(shop, 1000);
      console.log('🔄 Found', allSessions.length, 'total sessions for shop');
      
      // Delete all sessions
      for (const session of allSessions) {
        try {
          await GameSessionService.deleteSession(session.id);
          console.log('🗑️ Deleted session:', session.id);
        } catch (error) {
          console.error('❌ Failed to delete session:', session.id, error);
        }
      }
      
      return res.status(200).json({
        success: true,
        message: `Reset ALL play limits for shop ${shop}`,
        deletedSessions: allSessions.length
      });
    }

  } catch (error) {
    console.error('❌ Error resetting play limits:', error);
    return res.status(500).json({
      error: 'Failed to reset play limits',
      details: error.message
    });
  }
}
