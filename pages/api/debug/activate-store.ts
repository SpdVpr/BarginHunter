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

    console.log('🔧 Activating store:', shop);

    // Get store data
    const store = await StoreService.getStore(shop);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found in database'
      });
    }

    // Activate store
    await StoreService.updateStore(shop, { isActive: true });
    console.log('🔧 Store activated:', shop);

    // Ensure game config exists
    let gameConfig = await GameConfigService.getConfig(shop);
    
    if (!gameConfig) {
      console.log('🔧 Creating default game config for:', shop);

      // Create default discount tiers for all games
      const defaultDiscountTiers = [
        { minScore: 0, discount: 0, message: "Keep hunting! 🔍" },
        { minScore: 150, discount: 5, message: "Nice start! 🎯" },
        { minScore: 300, discount: 10, message: "Getting warmer! 🔥" },
        { minScore: 500, discount: 15, message: "Bargain expert! 💡" },
        { minScore: 750, discount: 20, message: "Sale master! 👑" },
        { minScore: 1000, discount: 25, message: "LEGENDARY HUNTER! 🏆" }
      ];

      await GameConfigService.createOrUpdateConfig({
        shopDomain: shop,
        isEnabled: true,
        gameSettings: {
          gameType: 'dino',
          minScoreForDiscount: 150,
          maxPlaysPerCustomer: 3,
          maxPlaysPerDay: 10,
          gameSpeed: 1,
          difficulty: 'medium',
          selectedGames: ['dino', 'flappy', 'tetris', 'snake', 'space-invaders', 'arkanoid', 'fruit-ninja'],
          // Create game-specific settings for all games with default discount tiers
          gameSpecificSettings: {
            'dino': { discountTiers: defaultDiscountTiers },
            'flappy': { discountTiers: defaultDiscountTiers },
            'tetris': { discountTiers: defaultDiscountTiers },
            'snake': { discountTiers: defaultDiscountTiers },
            'space-invaders': { discountTiers: defaultDiscountTiers },
            'arkanoid': { discountTiers: defaultDiscountTiers },
            'fruit-ninja': { discountTiers: defaultDiscountTiers }
          }
        },
        widgetSettings: {
          displayMode: 'popup',
          triggerEvent: 'immediate',
          position: 'bottom-right',
          showOn: 'all_pages',
          customPages: [],
          userPercentage: 100,
          testMode: false,
          showDelay: 0,
          pageLoadTrigger: 'immediate',
          deviceTargeting: 'all',
          geoTargeting: [],
          timeBasedRules: {
            enabled: false
          }
        },
        appearance: {
          primaryColor: '#ff6b6b',
          secondaryColor: '#4ecdc4',
          backgroundTheme: 'default'
        },
        businessRules: {
          excludeDiscountedProducts: false,
          allowStackingDiscounts: false,
          discountExpiryHours: 24
        }
      });
      gameConfig = await GameConfigService.getConfig(shop);
    }

    // Get updated store data
    const updatedStore = await StoreService.getStore(shop);

    return res.status(200).json({
      success: true,
      message: 'Store activated successfully',
      store: {
        id: updatedStore?.id,
        shopDomain: updatedStore?.shopDomain,
        isActive: updatedStore?.isActive,
        hasAccessToken: !!updatedStore?.accessToken,
        scopes: updatedStore?.scopes,
        installedAt: updatedStore?.installedAt,
        updatedAt: updatedStore?.updatedAt
      },
      gameConfig: {
        id: gameConfig?.id,
        shopDomain: gameConfig?.shopDomain,
        isEnabled: gameConfig?.isEnabled,
        createdAt: gameConfig?.createdAt,
        updatedAt: gameConfig?.updatedAt
      }
    });

  } catch (error) {
    console.error('🔧 Store activation error:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
