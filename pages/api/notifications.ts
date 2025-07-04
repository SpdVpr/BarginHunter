import { NextApiRequest, NextApiResponse } from 'next';
import { NotificationService } from '../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop, unreadOnly } = req.query;

    if (!shop) {
      return res.status(400).json({ 
        error: 'Missing shop parameter'
      });
    }

    console.log('🔔 Fetching notifications for shop:', shop, 'unreadOnly:', unreadOnly);

    const notifications = await NotificationService.getNotifications(
      shop as string, 
      unreadOnly === 'true'
    );

    console.log('✅ Notifications fetched:', notifications.length);

    res.status(200).json({
      success: true,
      notifications,
      count: notifications.length
    });

  } catch (error) {
    console.error('❌ Failed to fetch notifications:', error);
    res.status(500).json({
      error: 'Failed to fetch notifications',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
