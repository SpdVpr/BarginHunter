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
    showOn: 'all_pages' as 'all_pages' | 'product_pages' | 'cart_page' | 'checkout_page'
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

    // If no config exists, use default configuration
    if (!shopConfig) {
      const now = Timestamp.now();
      shopConfig = {
        ...defaultConfig,
        id: `config_${shop}_${Date.now()}`,
        shopDomain: shop,
        createdAt: now,
        updatedAt: now,
      };
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
      ...shopConfig.gameSettings,
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
