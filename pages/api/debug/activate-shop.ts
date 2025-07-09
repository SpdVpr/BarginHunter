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

    console.log('🔧 Activating shop:', shop);

    // Get existing store
    let store = await StoreService.getStore(shop);
    
    if (!store) {
      console.log('🔧 Store not found, creating new store record');
      // Create new store record
      const storeId = await StoreService.createStore({
        shopDomain: shop,
        accessToken: 'temp_token_' + Date.now(), // Temporary token
        scopes: ['read_products', 'write_discounts', 'read_customers', 'write_script_tags', 'read_orders'],
        isActive: true,
        shopData: {
          name: shop.replace('.myshopify.com', ''),
          email: 'test@example.com',
          domain: shop,
          currency: 'USD',
          timezone: 'UTC',
          planName: 'basic',
        },
      });
      
      store = await StoreService.getStore(shop);
      console.log('🔧 New store created with ID:', storeId);
    } else {
      console.log('🔧 Store found, updating to active');
      // Update existing store to active
      await StoreService.updateStore(shop, {
        isActive: true,
        updatedAt: new Date(),
      });
      
      store = await StoreService.getStore(shop);
    }

    // Check/create game config
    let gameConfig;
    try {
      gameConfig = await GameConfigService.getConfig(shop);
      console.log('🔧 Game config found');
    } catch (error) {
      console.log('🔧 Game config not found, creating default config');
      
      await GameConfigService.createConfig({
        shopDomain: shop,
        isEnabled: true,
        gameSettings: {
          discountTiers: [
            { minScore: 0, maxScore: 49, discountPercentage: 5 },
            { minScore: 50, maxScore: 99, discountPercentage: 10 },
            { minScore: 100, maxScore: 199, discountPercentage: 15 },
            { minScore: 200, maxScore: 999, discountPercentage: 20 },
          ],
          maxPlaysPerDay: 3,
          gameTimeLimit: 60,
          selectedGames: ['runner', 'flappy', 'tetris', 'snake', 'space-invaders', 'arkanoid', 'fruit-ninja'],
        },
        widgetSettings: {
          displayType: 'popup',
          triggerType: 'button',
          position: 'bottom-right',
          buttonText: 'Play & Win!',
          customPages: [],
        },
        appearance: {
          primaryColor: '#ff6b6b',
          secondaryColor: '#4ecdc4',
          backgroundTheme: 'default' as 'default' | 'dark' | 'light' | 'custom',
        },
        businessRules: {
          excludeDiscountedProducts: false,
          allowStackingDiscounts: false,
          discountExpiryHours: 24,
        },
      });
      
      gameConfig = await GameConfigService.getConfig(shop);
    }

    return res.status(200).json({
      success: true,
      message: 'Shop activated successfully',
      store: {
        id: store?.id,
        shopDomain: store?.shopDomain,
        isActive: store?.isActive,
        hasAccessToken: !!store?.accessToken,
        scopes: store?.scopes,
      },
      gameConfig: {
        id: gameConfig?.id,
        shopDomain: gameConfig?.shopDomain,
        isEnabled: gameConfig?.isEnabled,
        hasDiscountTiers: !!gameConfig?.gameSettings?.discountTiers,
      }
    });

  } catch (error) {
    console.error('🔧 Activate shop error:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    });
  }
}
