import { NextApiRequest, NextApiResponse } from 'next';
import { StoreService } from '../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop } = req.query;

    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ 
        error: 'Shop parameter is required' 
      });
    }

    console.log('🔍 Debug Script Tags: Checking for shop:', shop);

    // Get store from database
    const store = await StoreService.getStore(shop);
    
    if (!store) {
      return res.json({
        success: false,
        error: 'Store not found in database',
        shop,
        hasStore: false
      });
    }

    console.log('🔍 Debug Script Tags: Store found:', {
      id: store.id,
      shopDomain: store.shopDomain,
      scriptTagId: store.scriptTagId,
      installedAt: store.installedAt
    });

    return res.json({
      success: true,
      shop,
      hasStore: true,
      store: {
        id: store.id,
        shopDomain: store.shopDomain,
        scriptTagId: store.scriptTagId,
        installedAt: store.installedAt,
        updatedAt: store.updatedAt
      },
      scriptTagInstalled: !!store.scriptTagId,
      expectedScriptSrc: `${process.env.NEXT_PUBLIC_APP_URL}/api/widget/embed?shop=${shop}`
    });

  } catch (error) {
    console.error('🔍 Debug Script Tags: Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check script tags',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
