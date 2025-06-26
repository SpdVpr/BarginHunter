import { NextApiRequest, NextApiResponse } from 'next';
import { GameConfigService } from '../../src/lib/database';

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

    console.log('Initializing shop:', shop);

    // Check if config already exists
    const existingConfig = await GameConfigService.getConfig(shop);
    if (existingConfig) {
      return res.json({
        success: true,
        message: 'Shop already initialized',
        shopDomain: shop,
        configId: existingConfig.id,
      });
    }

    // Create default game configuration
    const configId = await GameConfigService.createOrUpdateConfig({
      shopDomain: shop,
      isEnabled: true,
      gameSettings: {
        minScoreForDiscount: 150,
        maxPlaysPerCustomer: 3,
        maxPlaysPerDay: 10,
        discountTiers: [
          { minScore: 0, discount: 0, message: "Keep hunting! 🔍" },
          { minScore: 150, discount: 5, message: "Nice start! 🎯" },
          { minScore: 300, discount: 10, message: "Getting warmer! 🔥" },
          { minScore: 500, discount: 15, message: "Bargain expert! 💡" },
          { minScore: 750, discount: 20, message: "Sale master! 👑" },
          { minScore: 1000, discount: 25, message: "LEGENDARY HUNTER! 🏆" }
        ],
        gameSpeed: 1,
        difficulty: 'medium' as 'easy' | 'medium' | 'hard',
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
          enabled: false,
          startTime: undefined,
          endTime: undefined,
          timezone: undefined,
          daysOfWeek: undefined,
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
      message: 'Shop initialized successfully',
      shopDomain: shop,
      configId,
    });

  } catch (error) {
    console.error('Shop initialization error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to initialize shop',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
