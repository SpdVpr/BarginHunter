import { NextApiRequest, NextApiResponse } from 'next';
import { GameConfigService } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop, gameSettings, widgetSettings, appearance, businessRules } = req.body;

    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Shop domain is required' 
      });
    }

    // Validate required fields
    if (!gameSettings || !widgetSettings || !appearance || !businessRules) {
      return res.status(400).json({ 
        success: false, 
        error: 'All settings sections are required' 
      });
    }

    // Validate game settings
    if (typeof gameSettings.isEnabled !== 'boolean' ||
        typeof gameSettings.minScoreForDiscount !== 'number' ||
        typeof gameSettings.maxPlaysPerCustomer !== 'number' ||
        typeof gameSettings.maxPlaysPerDay !== 'number' ||
        typeof gameSettings.gameSpeed !== 'number' ||
        !['easy', 'medium', 'hard'].includes(gameSettings.difficulty)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid game settings' 
      });
    }

    // Validate widget settings
    if (!['popup', 'tab', 'inline'].includes(widgetSettings.displayMode) ||
        !['immediate', 'scroll', 'exit_intent', 'time_delay'].includes(widgetSettings.triggerEvent) ||
        !['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'].includes(widgetSettings.position) ||
        !['all_pages', 'product_pages', 'cart_page', 'checkout_page'].includes(widgetSettings.showOn)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid widget settings' 
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
        isEnabled: gameSettings.isEnabled,
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
