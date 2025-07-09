import { NextApiRequest, NextApiResponse } from 'next';
import { StoreService, GameConfigService } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop } = req.body;
    
    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ error: 'Shop domain is required' });
    }

    console.log('🔄 Resetting shop data for:', shop);

    // Delete existing store data
    try {
      await StoreService.deleteStore(shop);
      console.log('🔄 Store data deleted');
    } catch (error) {
      console.log('🔄 No store data to delete or error:', error);
    }

    // Delete existing game config
    try {
      await GameConfigService.deleteConfig(shop);
      console.log('🔄 Game config deleted');
    } catch (error) {
      console.log('🔄 No game config to delete or error:', error);
    }

    return res.status(200).json({
      success: true,
      message: 'Shop data reset successfully. You can now reinstall the app.',
    });

  } catch (error) {
    console.error('🔄 Reset shop error:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
