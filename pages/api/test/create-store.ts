import { NextApiRequest, NextApiResponse } from 'next';
import { StoreService, GameConfigService } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shopDomain, accessToken, shopData } = req.body;

    if (!shopDomain) {
      return res.status(400).json({ error: 'shopDomain is required' });
    }

    // Create test store
    const storeId = await StoreService.createStore({
      shopDomain,
      accessToken: accessToken || 'test_access_token',
      scopes: ['read_products', 'write_discounts', 'read_customers'],
      isActive: true,
      shopData: shopData || {
        name: 'Test Store',
        email: 'test@store.com',
        domain: shopDomain,
        currency: 'USD',
        timezone: 'UTC',
        planName: 'basic'
      }
    });

    // Create default game configuration
    const defaultDiscountTiers = [
      { minScore: 0, discount: 0, message: "Keep hunting! 🔍" },
      { minScore: 150, discount: 5, message: "Nice start! 🎯" },
      { minScore: 300, discount: 10, message: "Getting warmer! 🔥" },
      { minScore: 500, discount: 15, message: "Bargain expert! 💡" },
      { minScore: 750, discount: 20, message: "Sale master! 👑" },
      { minScore: 1000, discount: 25, message: "LEGENDARY HUNTER! 🏆" }
    ];

    await GameConfigService.createOrUpdateConfig({
      shopDomain,
      isEnabled: true,
      gameSettings: {
        gameType: 'dino',
        minScoreForDiscount: 150,
        maxPlaysPerCustomer: 3,
        maxPlaysPerDay: 10,
        gameSpeed: 1,
        difficulty: 'medium' as 'easy' | 'medium' | 'hard',
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
        displayMode: 'tab' as 'popup' | 'tab' | 'inline',
        triggerEvent: 'immediate' as 'immediate' | 'scroll' | 'exit_intent' | 'time_delay',
        position: 'bottom-right' as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center',
        showOn: 'all_pages' as 'all_pages' | 'product_pages' | 'cart_page' | 'checkout_page' | 'collection_pages' | 'custom',
        customPages: [],
        userPercentage: 100,
        testMode: false,
        showDelay: 0,
        pageLoadTrigger: 'immediate' as 'immediate' | 'after_delay' | 'on_scroll' | 'on_exit_intent',
        deviceTargeting: 'all' as 'all' | 'desktop' | 'mobile' | 'tablet',
        geoTargeting: [],
        timeBasedRules: {
          enabled: false
        },
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

    return res.json({
      success: true,
      message: 'Test store created successfully',
      storeId,
      shopDomain,
    });

  } catch (error) {
    console.error('Create test store error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create test store',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
