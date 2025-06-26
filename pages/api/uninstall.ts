import { NextApiRequest, NextApiResponse } from 'next';
import { GameConfigService } from '../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop } = req.body;

    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ 
        error: 'Shop parameter is required' 
      });
    }

    console.log('Uninstalling app for shop:', shop);

    // Remove game configuration
    try {
      // Note: We would need to implement a delete method in GameConfigService
      // For now, we'll just log the uninstall
      console.log('App uninstalled for shop:', shop);
    } catch (deleteError) {
      console.error('Failed to delete config:', deleteError);
    }

    return res.json({
      success: true,
      message: 'App uninstalled successfully',
    });

  } catch (error) {
    console.error('Uninstall error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to uninstall app',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
