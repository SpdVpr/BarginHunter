import { NextApiRequest, NextApiResponse } from 'next';
import { StoreService } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop } = req.query;
    
    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ error: 'Shop domain is required' });
    }

    console.log('🔍 Checking store data for:', shop);

    // Get store data
    const store = await StoreService.getStore(shop);
    
    if (!store) {
      return res.status(404).json({ 
        success: false,
        error: 'Store not found',
        message: `Shop ${shop} is not installed or not found in database`,
        shop
      });
    }

    // Return store info (without sensitive data)
    return res.status(200).json({
      success: true,
      message: 'Store found',
      store: {
        id: store.id,
        shopDomain: store.shopDomain,
        hasAccessToken: !!store.accessToken,
        accessTokenLength: store.accessToken?.length || 0,
        scopes: store.scopes,
        isActive: store.isActive,
        installedAt: store.installedAt,
        updatedAt: store.updatedAt,
        scriptTagId: store.scriptTagId,
        shopData: store.shopData
      }
    });

  } catch (error) {
    console.error('🔍 Store check failed:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    });
  }
}
