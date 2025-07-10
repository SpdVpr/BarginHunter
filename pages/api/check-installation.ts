import { NextApiRequest, NextApiResponse } from 'next';
import { StoreService, GameConfigService } from '../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop } = req.query;
    
    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'Shop domain is required' 
      });
    }

    console.log('🔍 Checking installation for shop:', shop);

    // Check store data
    const store = await StoreService.getStore(shop);
    
    if (!store) {
      console.log('🔍 No store found in database');
      return res.status(200).json({
        success: true,
        installed: false,
        reason: 'Store not found in database'
      });
    }

    // Check if store is active and has access token
    if (!store.isActive) {
      console.log('🔍 Store is not active');
      return res.status(200).json({
        success: true,
        installed: false,
        reason: 'Store is not active'
      });
    }

    if (!store.accessToken) {
      console.log('🔍 Store has no access token');
      return res.status(200).json({
        success: true,
        installed: false,
        reason: 'No access token'
      });
    }

    // Check if store has required scopes
    const requiredScopes = ['write_price_rules', 'write_discounts'];
    const hasRequiredScopes = requiredScopes.every(scope => 
      store.scopes?.includes(scope)
    );

    if (!hasRequiredScopes) {
      console.log('🔍 Store missing required scopes:', {
        current: store.scopes,
        required: requiredScopes
      });
      return res.status(200).json({
        success: true,
        installed: false,
        reason: 'Missing required scopes',
        details: {
          currentScopes: store.scopes,
          requiredScopes
        }
      });
    }

    // Check game config exists
    const gameConfig = await GameConfigService.getConfig(shop);
    
    if (!gameConfig) {
      console.log('🔍 No game config found, creating default config');
      // Create default game config if it doesn't exist
      try {
        await GameConfigService.createOrUpdateConfig({
          shopDomain: shop,
          isEnabled: true,
          gameSettings: {
            discountTiers: [
              { minScore: 100, discountPercentage: 5 },
              { minScore: 500, discountPercentage: 10 },
              { minScore: 1000, discountPercentage: 15 }
            ]
          }
        });
        console.log('🔍 Default game config created');
      } catch (configError) {
        console.error('🔍 Error creating default config:', configError);
      }
    }

    console.log('🔍 Installation check passed - app is properly installed');
    
    return res.status(200).json({
      success: true,
      installed: true,
      store: {
        id: store.id,
        shopDomain: store.shopDomain,
        isActive: store.isActive,
        installedAt: store.installedAt,
        scopes: store.scopes
      }
    });

  } catch (error) {
    console.error('🔍 Installation check error:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
