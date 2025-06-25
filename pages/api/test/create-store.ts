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
    await GameConfigService.createOrUpdateConfig({
      shopDomain,
      isEnabled: true,
      gameSettings: {
        isEnabled: true,
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
        difficulty: 'medium',
      },
      widgetSettings: {
        displayMode: 'tab',
        triggerEvent: 'immediate',
        position: 'bottom-right',
        showOn: 'all_pages',
      },
      appearance: {
        primaryColor: '#ff6b6b',
        secondaryColor: '#4ecdc4',
        backgroundTheme: 'default',
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
