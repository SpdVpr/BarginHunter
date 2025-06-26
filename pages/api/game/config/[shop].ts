import { NextApiRequest, NextApiResponse } from 'next';
import { GameConfigService } from '../../../../src/lib/database';
import { Timestamp } from 'firebase-admin/firestore';

// Default configuration for new stores
const defaultConfig = {
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
    difficulty: 'medium' as 'easy' | 'medium' | 'hard'
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
    backgroundTheme: 'default' as 'default' | 'dark' | 'light' | 'custom'
  },
  businessRules: {
    excludeDiscountedProducts: false,
    allowStackingDiscounts: false,
    discountExpiryHours: 24
  }
};

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

    // Get shop configuration from database
    let shopConfig = await GameConfigService.getConfig(shop);

    // If no config exists, create default configuration in database
    if (!shopConfig) {
      console.log('No config found for shop:', shop, 'Creating default config...');

      try {
        const configId = await GameConfigService.createOrUpdateConfig({
          shopDomain: shop,
          isEnabled: defaultConfig.isEnabled,
          gameSettings: defaultConfig.gameSettings,
          widgetSettings: defaultConfig.widgetSettings,
          appearance: defaultConfig.appearance,
          businessRules: defaultConfig.businessRules,
        });

        // Fetch the newly created config
        shopConfig = await GameConfigService.getConfig(shop);
        console.log('Default config created with ID:', configId);
      } catch (createError) {
        console.error('Failed to create default config:', createError);
        // Fallback to in-memory default config
        const now = Timestamp.now();
        shopConfig = {
          ...defaultConfig,
          id: `config_${shop}_${Date.now()}`,
          shopDomain: shop,
          createdAt: now,
          updatedAt: now,
        };
      }
    }

    // Check if game is enabled
    if (!shopConfig.isEnabled) {
      return res.status(403).json({
        success: false,
        error: 'Game is not enabled for this shop'
      });
    }

    // Return the configuration
    res.status(200).json({
      success: true,
      gameSettings: shopConfig.gameSettings,
      widgetSettings: shopConfig.widgetSettings,
      appearance: shopConfig.appearance,
      businessRules: shopConfig.businessRules
    });

  } catch (error) {
    console.error('Error fetching game config:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
