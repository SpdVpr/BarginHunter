import { NextApiRequest, NextApiResponse } from 'next';
import { StoreService } from '../../../src/lib/database';
import { createDiscountCode, ShopifySessionManager } from '../../../src/lib/shopify';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop } = req.body;
    
    if (!shop) {
      return res.status(400).json({ error: 'Shop domain is required' });
    }

    console.log('🧪 Testing discount creation for shop:', shop);

    // Get store data
    const store = await StoreService.getStore(shop);
    console.log('🧪 Store data:', store ? 'Found' : 'Not found');
    
    if (!store) {
      return res.status(404).json({ 
        error: 'Store not found',
        message: 'Shop is not installed or not found in database'
      });
    }

    if (!store.accessToken) {
      return res.status(400).json({ 
        error: 'No access token',
        message: 'Store does not have a valid access token'
      });
    }

    console.log('🧪 Store has access token, creating test discount...');

    // Create test discount code
    const testCode = `TEST${Date.now().toString().slice(-6)}`;
    const shopifySession = ShopifySessionManager.createSession(shop, store.accessToken);

    const shopifyDiscount = await createDiscountCode(shopifySession, {
      code: testCode,
      value: 10,
      type: 'percentage',
      usage_limit: 1,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    console.log('🧪 Discount created successfully:', shopifyDiscount);

    return res.status(200).json({
      success: true,
      message: 'Test discount created successfully!',
      discount: {
        code: testCode,
        priceRuleId: shopifyDiscount.priceRule.id,
        discountCodeId: shopifyDiscount.discountCode.id,
        value: 10,
        type: 'percentage'
      },
      store: {
        shopDomain: store.shopDomain,
        hasAccessToken: !!store.accessToken,
        isActive: store.isActive
      }
    });

  } catch (error) {
    console.error('🧪 Test discount creation failed:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    });
  }
}
