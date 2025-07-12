import { NextApiRequest, NextApiResponse } from 'next';
import { StoreService, GameConfigService } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const shopDomain = 'test-store.myshopify.com';
    
    console.log('🏪 Creating test store:', shopDomain);

    // Create test store
    const storeId = await StoreService.createStore({
      shopDomain,
      accessToken: 'test_access_token_demo',
      scopes: ['read_products', 'write_discounts', 'read_customers', 'write_script_tags', 'read_orders'],
      isActive: true,
      shopData: {
        name: 'Bargain Hunter Test Store',
        email: 'test@bargainhunter.com',
        domain: shopDomain,
        currency: 'USD',
        timezone: 'UTC',
        planName: 'development',
      }
    });

    console.log('✅ Test store created with ID:', storeId);

    // Create default game configuration
    await GameConfigService.createOrUpdateConfig({
      shopDomain,
      isEnabled: true,
      gameSettings: {
        maxPlaysPerCustomer: 3,
        maxPlaysPerDay: 10,
        gameSpeed: 1,
        difficulty: 'medium' as 'easy' | 'medium' | 'hard',
      },
      widgetSettings: {
        displayMode: 'tab' as 'popup' | 'tab' | 'inline',
        triggerEvent: 'immediate' as 'immediate' | 'scroll' | 'exit_intent' | 'time_delay',
        position: 'bottom-right' as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center',
        showOn: 'all_pages' as 'all_pages' | 'product_pages' | 'cart_page' | 'checkout_page',
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

    console.log('✅ Game configuration created');

    return res.json({
      success: true,
      message: '🎉 Test store and configuration created successfully!',
      storeId,
      shopDomain,
      nextSteps: [
        '1. Test dashboard: /dashboard?shop=' + shopDomain,
        '2. Test game widget: /widget/game?shop=' + shopDomain,
        '3. Test analytics: /dashboard/analytics?shop=' + shopDomain,
        '4. Run full tests: /test',
      ]
    });

  } catch (error) {
    console.error('❌ Create test store error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create test store',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
