import { NextApiRequest, NextApiResponse } from 'next';
import { GameConfigService } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔧 Settings API: Starting request processing...');
    console.log('🔧 Settings API: Request method:', req.method);
    console.log('🔧 Settings API: Request headers:', req.headers);
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

    // Set default for isEnabled if not provided
    if (gameSettings.isEnabled === undefined) {
      gameSettings.isEnabled = true;
    }

    if (typeof gameSettings.isEnabled !== 'boolean' ||
        typeof gameSettings.minScoreForDiscount !== 'number' ||
        typeof gameSettings.maxPlaysPerCustomer !== 'number' ||
        typeof gameSettings.maxPlaysPerDay !== 'number' ||
        typeof gameSettings.gameSpeed !== 'number' ||
        !['easy', 'medium', 'hard'].includes(gameSettings.difficulty) ||
        (gameSettings.gameType && !['dino', 'flappy_bird', 'tetris', 'snake', 'space_invaders', 'arkanoid', 'fruit_ninja'].includes(gameSettings.gameType))) {
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
    console.log('🔧 Settings API: Validating widget settings:', JSON.stringify(widgetSettings, null, 2));

    // Only validate if the properties exist (make validation more flexible)
    if (widgetSettings.displayMode && !['popup', 'tab', 'inline', 'floating_button'].includes(widgetSettings.displayMode)) {
      console.log('🔧 Settings API: Invalid displayMode:', widgetSettings.displayMode);
      return res.status(400).json({
        success: false,
        error: `Invalid displayMode: ${widgetSettings.displayMode}`
      });
    }

    if (widgetSettings.triggerEvent && !['immediate', 'scroll', 'exit_intent', 'time_delay'].includes(widgetSettings.triggerEvent)) {
      console.log('🔧 Settings API: Invalid triggerEvent:', widgetSettings.triggerEvent);
      return res.status(400).json({
        success: false,
        error: `Invalid triggerEvent: ${widgetSettings.triggerEvent}`
      });
    }

    if (widgetSettings.position && !['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'].includes(widgetSettings.position)) {
      console.log('🔧 Settings API: Invalid position:', widgetSettings.position);
      return res.status(400).json({
        success: false,
        error: `Invalid position: ${widgetSettings.position}`
      });
    }

    if (widgetSettings.showOn && !['all_pages', 'homepage', 'product_pages', 'cart_page', 'checkout_page', 'collection_pages', 'custom', 'url_targeting'].includes(widgetSettings.showOn)) {
      console.log('🔧 Settings API: Invalid showOn:', widgetSettings.showOn);
      return res.status(400).json({
        success: false,
        error: `Invalid showOn: ${widgetSettings.showOn}`
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

    // Test mode validation moved to game settings
    if (gameSettings.testMode !== undefined && typeof gameSettings.testMode !== 'boolean') {
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

    // Validate floating button settings if floating_button mode is selected
    if (widgetSettings.displayMode === 'floating_button' && widgetSettings.floatingButton) {
      const fb = widgetSettings.floatingButton;
      if (typeof fb.text !== 'string' ||
          typeof fb.icon !== 'string' ||
          typeof fb.backgroundColor !== 'string' ||
          typeof fb.textColor !== 'string' ||
          typeof fb.borderRadius !== 'number' ||
          !['small', 'medium', 'large'].includes(fb.size) ||
          !fb.position ||
          !['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right'].includes(fb.position.desktop) ||
          !['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right'].includes(fb.position.mobile) ||
          !fb.offset ||
          typeof fb.offset.desktop?.x !== 'number' ||
          typeof fb.offset.desktop?.y !== 'number' ||
          typeof fb.offset.mobile?.x !== 'number' ||
          typeof fb.offset.mobile?.y !== 'number' ||
          !['none', 'pulse', 'bounce', 'shake'].includes(fb.animation) ||
          typeof fb.showOnHover !== 'boolean') {
        console.log('🔧 Settings API: Floating button validation failed:', fb);
        return res.status(400).json({
          success: false,
          error: 'Invalid floating button settings'
        });
      }
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

    // Ensure game-specific settings are properly formatted
    if (!gameSettings.gameSpecificSettings || typeof gameSettings.gameSpecificSettings !== 'object') {
      gameSettings.gameSpecificSettings = {};
    }

    // Update or create game configuration
    console.log('🔧 Settings API: Updating Firebase configuration...');
    console.log('🔧 Game settings received:', JSON.stringify(gameSettings, null, 2));
    console.log('🔧 Specifically - maxPlaysPerCustomer:', gameSettings.maxPlaysPerCustomer);
    await GameConfigService.createOrUpdateConfig({
      shopDomain: shop,
      isEnabled: gameSettings.isEnabled,
      gameSettings: {
        isEnabled: gameSettings.isEnabled,
        gameType: gameSettings.gameType || 'dino',
        maxPlaysPerCustomer: Math.max(1, gameSettings.maxPlaysPerCustomer),
        maxPlaysPerDay: Math.max(1, gameSettings.maxPlaysPerDay),
        playLimitResetHours: Math.max(1, gameSettings.playLimitResetHours || 24), // Default 24 hours
        gameSpeed: Math.max(0.1, Math.min(3, gameSettings.gameSpeed)),
        difficulty: gameSettings.difficulty,
        testMode: gameSettings.testMode ?? false, // Moved from widget settings
        gameSpecificSettings: gameSettings.gameSpecificSettings || {}, // Add game-specific settings
      },
      widgetSettings: {
        displayMode: widgetSettings.displayMode,
        triggerEvent: widgetSettings.triggerEvent,
        position: widgetSettings.position,
        showOn: widgetSettings.showOn,
        timeDelay: widgetSettings.timeDelay,
        scrollPercentage: widgetSettings.scrollPercentage,
        customPages: (widgetSettings.customPages || []).map((page: string) => {
          // Normalize and validate URLs - support both relative paths and full URLs
          const trimmed = page.trim();
          if (!trimmed) return null;

          // If it's a full URL, keep it as is
          if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            return trimmed;
          }

          // If it's a relative path, ensure it starts with /
          if (!trimmed.startsWith('/')) {
            return '/' + trimmed;
          }

          return trimmed;
        }).filter(Boolean),
        // New targeting options
        userPercentage: widgetSettings.userPercentage ?? 100,

        showDelay: widgetSettings.showDelay ?? 0,
        pageLoadTrigger: widgetSettings.pageLoadTrigger || 'immediate',
        deviceTargeting: widgetSettings.deviceTargeting || 'all',
        geoTargeting: widgetSettings.geoTargeting || [],
        timeBasedRules: {
          enabled: widgetSettings.timeBasedRules?.enabled || false,
          ...(widgetSettings.timeBasedRules?.startTime && { startTime: widgetSettings.timeBasedRules.startTime }),
          ...(widgetSettings.timeBasedRules?.endTime && { endTime: widgetSettings.timeBasedRules.endTime }),
          ...(widgetSettings.timeBasedRules?.timezone && { timezone: widgetSettings.timeBasedRules.timezone }),
          ...(widgetSettings.timeBasedRules?.daysOfWeek && { daysOfWeek: widgetSettings.timeBasedRules.daysOfWeek }),
        },
        targetUrls: widgetSettings.targetUrls || [],
        // Floating button configuration
        ...(widgetSettings.floatingButton && { floatingButton: widgetSettings.floatingButton }),
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
    console.error('🔧 Settings API: Update error:', error);
    console.error('🔧 Settings API: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return res.status(500).json({
      success: false,
      error: 'Failed to update settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
