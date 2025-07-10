import { NextApiRequest, NextApiResponse } from 'next';
import { StoreService, GameConfigService } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop } = req.query;
    
    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ error: 'Shop domain is required' });
    }

    console.log('🔍 Debug store status for:', shop);

    // Get store data
    const store = await StoreService.getStore(shop);
    
    // Get game config
    const gameConfig = await GameConfigService.getConfig(shop);

    const response = {
      success: true,
      shop,
      timestamp: new Date().toISOString(),
      store: store ? {
        id: store.id,
        shopDomain: store.shopDomain,
        isActive: store.isActive,
        hasAccessToken: !!store.accessToken,
        accessTokenLength: store.accessToken?.length || 0,
        scopes: store.scopes,
        scriptTagId: store.scriptTagId,
        webhookIds: store.webhookIds,
        installedAt: store.installedAt,
        updatedAt: store.updatedAt,
        shopData: store.shopData
      } : null,
      gameConfig: gameConfig ? {
        id: gameConfig.id,
        shopDomain: gameConfig.shopDomain,
        isEnabled: gameConfig.isEnabled,
        gameSettings: gameConfig.gameSettings,
        createdAt: gameConfig.createdAt,
        updatedAt: gameConfig.updatedAt
      } : null,
      checks: {
        storeExists: !!store,
        storeActive: store?.isActive || false,
        hasAccessToken: !!store?.accessToken,
        hasRequiredScopes: store?.scopes?.includes('write_price_rules') || false,
        gameConfigExists: !!gameConfig,
        installationComplete: !!(store && store.isActive && store.accessToken && gameConfig)
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('🔍 Debug store status error:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    });
  }
}
