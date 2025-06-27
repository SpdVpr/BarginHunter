import { NextApiRequest, NextApiResponse } from 'next';
import { StoreService } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Enable CORS for testing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop } = req.method === 'GET' ? req.query : req.body;

    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ error: 'Shop domain is required' });
    }

    console.log('🔄 Refreshing token for shop:', shop);

    // Delete existing store record to force fresh installation
    await StoreService.deleteStore(shop);
    console.log('🗑️ Deleted existing store record');

    return res.json({
      success: true,
      message: 'Store record deleted. Please reinstall the app.',
      nextStep: `https://bargin-hunter2.vercel.app/api/auth/install?shop=${shop}`
    });

  } catch (error) {
    console.error('🔄 Token refresh error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    });
  }
}
