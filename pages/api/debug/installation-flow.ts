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

    console.log('🔍 Debug installation flow for:', shop);

    // Check store data
    const store = await StoreService.getStore(shop);
    console.log('🔍 Store found:', !!store);
    
    // Check game config
    let gameConfig = null;
    try {
      gameConfig = await GameConfigService.getConfig(shop);
      console.log('🔍 Game config found:', !!gameConfig);
    } catch (configError) {
      console.log('🔍 Game config error:', configError);
    }

    // Check dashboard stats endpoint
    let dashboardStats = null;
    try {
      const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboard/stats?shop=${shop}`);
      dashboardStats = {
        status: statsResponse.status,
        ok: statsResponse.ok
      };
      console.log('🔍 Dashboard stats response:', dashboardStats);
    } catch (statsError) {
      console.log('🔍 Dashboard stats error:', statsError);
    }

    return res.status(200).json({
      success: true,
      debug: {
        shop,
        store: store ? {
          id: store.id,
          shopDomain: store.shopDomain,
          hasAccessToken: !!store.accessToken,
          accessTokenLength: store.accessToken?.length || 0,
          scopes: store.scopes,
          isActive: store.isActive,
          scriptTagId: store.scriptTagId,
          installedAt: store.installedAt,
          updatedAt: store.updatedAt
        } : null,
        gameConfig: gameConfig ? {
          id: gameConfig.id,
          shopDomain: gameConfig.shopDomain,
          isEnabled: gameConfig.isEnabled,
          hasDiscountTiers: !!gameConfig.gameSettings?.discountTiers,
          createdAt: gameConfig.createdAt,
          updatedAt: gameConfig.updatedAt
        } : null,
        dashboardStats,
        installationComplete: !!(store && gameConfig && store.accessToken && store.scopes?.includes('write_price_rules')),
        missingComponents: {
          store: !store,
          gameConfig: !gameConfig,
          accessToken: !store?.accessToken,
          writePriceRulesScope: !store?.scopes?.includes('write_price_rules')
        }
      }
    });

  } catch (error) {
    console.error('🔍 Debug installation flow error:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    });
  }
}
