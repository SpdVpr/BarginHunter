import { NextApiRequest, NextApiResponse } from 'next';
import { NotificationService } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { notificationId } = req.body;

    if (!notificationId) {
      return res.status(400).json({ 
        error: 'Missing notificationId parameter'
      });
    }

    console.log('📖 Marking notification as read:', notificationId);

    await NotificationService.markAsRead(notificationId);

    console.log('✅ Notification marked as read');

    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('❌ Failed to mark notification as read:', error);
    res.status(500).json({
      error: 'Failed to mark notification as read',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
