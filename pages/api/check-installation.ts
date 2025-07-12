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
        console.log('🔍 Default game config created with game-specific discount tiers');
      } catch (configError) {
        console.error('🔍 Error creating default config:', configError);
      }
    } else {
      // Check if existing config needs migration to game-specific settings
      const currentGameType = gameConfig.gameSettings?.gameType || 'dino';

      if (!gameConfig.gameSettings?.gameSpecificSettings?.[currentGameType]?.discountTiers) {
        console.log('🔍 Existing config needs migration to game-specific settings');
        try {
          // Use existing discount tiers or create default ones
          const existingTiers = gameConfig.gameSettings?.discountTiers || [
            { minScore: 0, discount: 0, message: "Keep hunting! 🔍" },
            { minScore: 150, discount: 5, message: "Nice start! 🎯" },
            { minScore: 300, discount: 10, message: "Getting warmer! 🔥" },
            { minScore: 500, discount: 15, message: "Bargain expert! 💡" },
            { minScore: 750, discount: 20, message: "Sale master! 👑" },
            { minScore: 1000, discount: 25, message: "LEGENDARY HUNTER! 🏆" }
          ];

          // Ensure proper format for discount tiers
          const formattedTiers = existingTiers.map((tier: any) => ({
            minScore: tier.minScore || 0,
            discount: tier.discount || tier.discountPercentage || 0,
            message: tier.message || `${tier.discount || tier.discountPercentage || 0}% discount earned!`
          }));

          // Create game-specific settings for all games
          const gameSpecificSettings = gameConfig.gameSettings?.gameSpecificSettings || {};
          const allGames = ['dino', 'flappy', 'tetris', 'snake', 'space-invaders', 'arkanoid', 'fruit-ninja'];

          allGames.forEach(game => {
            if (!gameSpecificSettings[game]?.discountTiers) {
              gameSpecificSettings[game] = { discountTiers: formattedTiers };
            }
          });

          await GameConfigService.createOrUpdateConfig({
            ...gameConfig,
            gameSettings: {
              ...gameConfig.gameSettings,
              gameSpecificSettings
            }
          });
          console.log('🔍 Config migrated to game-specific settings');
        } catch (migrationError) {
          console.error('🔍 Error migrating config:', migrationError);
        }
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
