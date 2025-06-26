import { NextApiRequest, NextApiResponse } from 'next';
import { GameConfigService } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔧 Settings API: Received request body:', JSON.stringify(req.body, null, 2));

    const { shop, gameSettings, widgetSettings, appearance, businessRules } = req.body;

    if (!shop || typeof shop !== 'string') {
      console.log('🔧 Settings API: Missing or invalid shop domain:', shop);
      return res.status(400).json({
        success: false,
        error: 'Shop domain is required'
      });
    }

    // Validate required fields
    if (!gameSettings || !widgetSettings || !appearance || !businessRules) {
      console.log('🔧 Settings API: Missing required sections:', {
        gameSettings: !!gameSettings,
        widgetSettings: !!widgetSettings,
        appearance: !!appearance,
        businessRules: !!businessRules
      });
      return res.status(400).json({
        success: false,
        error: 'All settings sections are required'
      });
    }

    // Validate game settings
    console.log('🔧 Settings API: Validating game settings:', gameSettings);
    if (typeof gameSettings.isEnabled !== 'boolean' ||
        typeof gameSettings.minScoreForDiscount !== 'number' ||
        typeof gameSettings.maxPlaysPerCustomer !== 'number' ||
        typeof gameSettings.maxPlaysPerDay !== 'number' ||
        typeof gameSettings.gameSpeed !== 'number' ||
        !['easy', 'medium', 'hard'].includes(gameSettings.difficulty)) {
      console.log('🔧 Settings API: Game settings validation failed:', {
        isEnabled: typeof gameSettings.isEnabled,
        minScoreForDiscount: typeof gameSettings.minScoreForDiscount,
        maxPlaysPerCustomer: typeof gameSettings.maxPlaysPerCustomer,
        maxPlaysPerDay: typeof gameSettings.maxPlaysPerDay,
        gameSpeed: typeof gameSettings.gameSpeed,
        difficulty: gameSettings.difficulty
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid game settings'
      });
    }

    // Validate widget settings
    if (!['popup', 'tab', 'inline'].includes(widgetSettings.displayMode) ||
        !['immediate', 'scroll', 'exit_intent', 'time_delay'].includes(widgetSettings.triggerEvent) ||
        !['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'].includes(widgetSettings.position) ||
        !['all_pages', 'product_pages', 'cart_page', 'checkout_page', 'collection_pages', 'custom'].includes(widgetSettings.showOn)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid widget settings'
      });
    }

    // Validate new widget settings
    if (widgetSettings.userPercentage !== undefined &&
        (typeof widgetSettings.userPercentage !== 'number' ||
         widgetSettings.userPercentage < 0 ||
         widgetSettings.userPercentage > 100)) {
      return res.status(400).json({
        success: false,
        error: 'User percentage must be between 0 and 100'
      });
    }

    if (widgetSettings.testMode !== undefined && typeof widgetSettings.testMode !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Test mode must be a boolean'
      });
    }

    if (widgetSettings.showDelay !== undefined &&
        (typeof widgetSettings.showDelay !== 'number' || widgetSettings.showDelay < 0)) {
      return res.status(400).json({
        success: false,
        error: 'Show delay must be a non-negative number'
      });
    }

    // Validate appearance settings
    if (typeof appearance.primaryColor !== 'string' ||
        typeof appearance.secondaryColor !== 'string' ||
        !['default', 'dark', 'light', 'custom'].includes(appearance.backgroundTheme)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid appearance settings' 
      });
    }

    // Validate business rules
    if (typeof businessRules.excludeDiscountedProducts !== 'boolean' ||
        typeof businessRules.allowStackingDiscounts !== 'boolean' ||
        typeof businessRules.discountExpiryHours !== 'number') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid business rules' 
      });
    }

    // Ensure discount tiers are properly formatted
    if (!Array.isArray(gameSettings.discountTiers)) {
      gameSettings.discountTiers = [
        { minScore: 0, discount: 0, message: "Keep hunting! 🔍" },
        { minScore: 150, discount: 5, message: "Nice start! 🎯" },
        { minScore: 300, discount: 10, message: "Getting warmer! 🔥" },
        { minScore: 500, discount: 15, message: "Bargain expert! 💡" },
        { minScore: 750, discount: 20, message: "Sale master! 👑" },
        { minScore: 1000, discount: 25, message: "LEGENDARY HUNTER! 🏆" }
      ];
    }

    // Update or create game configuration
    await GameConfigService.createOrUpdateConfig({
      shopDomain: shop,
      isEnabled: gameSettings.isEnabled,
      gameSettings: {
        minScoreForDiscount: Math.max(0, gameSettings.minScoreForDiscount),
        maxPlaysPerCustomer: Math.max(1, gameSettings.maxPlaysPerCustomer),
        maxPlaysPerDay: Math.max(1, gameSettings.maxPlaysPerDay),
        discountTiers: gameSettings.discountTiers,
        gameSpeed: Math.max(0.1, Math.min(3, gameSettings.gameSpeed)),
        difficulty: gameSettings.difficulty,
      },
      widgetSettings: {
        displayMode: widgetSettings.displayMode,
        triggerEvent: widgetSettings.triggerEvent,
        position: widgetSettings.position,
        showOn: widgetSettings.showOn,
        timeDelay: widgetSettings.timeDelay,
        scrollPercentage: widgetSettings.scrollPercentage,
        customPages: widgetSettings.customPages || [],
        // New targeting options
        userPercentage: widgetSettings.userPercentage ?? 100,
        testMode: widgetSettings.testMode ?? false,
        showDelay: widgetSettings.showDelay ?? 0,
        pageLoadTrigger: widgetSettings.pageLoadTrigger || 'immediate',
        deviceTargeting: widgetSettings.deviceTargeting || 'all',
        geoTargeting: widgetSettings.geoTargeting || [],
        timeBasedRules: widgetSettings.timeBasedRules || {
          enabled: false,
          startTime: undefined,
          endTime: undefined,
          timezone: undefined,
          daysOfWeek: undefined,
        },
      },
      appearance: {
        primaryColor: appearance.primaryColor,
        secondaryColor: appearance.secondaryColor,
        backgroundTheme: appearance.backgroundTheme,
        customCSS: appearance.customCSS,
      },
      businessRules: {
        excludeDiscountedProducts: businessRules.excludeDiscountedProducts,
        allowStackingDiscounts: businessRules.allowStackingDiscounts,
        discountExpiryHours: Math.max(1, businessRules.discountExpiryHours),
        minimumOrderValue: businessRules.minimumOrderValue,
        excludedProductIds: businessRules.excludedProductIds || [],
        excludedCollectionIds: businessRules.excludedCollectionIds || [],
      },
    });

    return res.json({
      success: true,
      message: 'Settings updated successfully',
    });

  } catch (error) {
    console.error('Settings update error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to update settings' 
    });
  }
}
