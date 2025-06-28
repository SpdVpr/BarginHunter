import { NextApiRequest, NextApiResponse } from 'next';
import { FinishGameRequest, FinishGameResponse } from '../../../src/types/api';
import {
  GameSessionService,
  GameScoreService,
  DiscountService,
  CustomerService,
  GameConfigService,
  StoreService
} from '../../../src/lib/database';
import { createDiscountCode, ShopifySessionManager } from '../../../src/lib/shopify';
import { Timestamp } from 'firebase-admin/firestore';
import crypto from 'crypto';

function generateDiscountCode(): string {
  const prefix = 'BARGAIN';
  const suffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}${suffix}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Enable CORS for testing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop = 'barginhuntertest.myshopify.com', score = 500 } = req.method === 'GET' ? req.query : req.body;

    console.log('🧪 Debug finish session for shop:', shop, 'score:', score);

    // Create test session
    const sessionId = `test-session-${Date.now()}`;
    const finalScore = parseInt(score as string);

    // Get game config
    const gameConfig = await GameConfigService.getConfig(shop);
    console.log('🎮 Game config:', gameConfig ? 'found' : 'not found');

    const discountTiers = gameConfig?.gameSettings.discountTiers || [
      { minScore: 0, discount: 0, message: "Keep hunting! 🔍" },
      { minScore: 150, discount: 5, message: "Nice start! 🎯" },
      { minScore: 300, discount: 10, message: "Getting warmer! 🔥" },
      { minScore: 500, discount: 15, message: "Bargain expert! 💡" },
      { minScore: 750, discount: 20, message: "Sale master! 👑" },
      { minScore: 1000, discount: 25, message: "LEGENDARY HUNTER! 🏆" }
    ];

    // Calculate discount earned
    const discountTier = discountTiers.slice().reverse().find(tier => finalScore >= tier.minScore);
    const discountEarned = discountTier?.discount || 0;

    console.log('💰 Discount earned:', discountEarned, '%');

    let discountCode: string | undefined;
    let expiresAt: string | undefined;
    let shopifyDiscount: any;
    let databaseRecord: any;

    // Create discount code if earned
    if (discountEarned > 0) {
      discountCode = generateDiscountCode();
      const expiryHours = gameConfig?.businessRules.discountExpiryHours || 24;
      expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();

      console.log('🎫 Creating discount code:', discountCode);

      try {
        // Get store data for Shopify API
        const store = await StoreService.getStore(shop);
        console.log('🏪 Store found:', !!store, 'has token:', !!store?.accessToken);

        if (store && store.accessToken) {
          // Create Shopify session and discount
          const shopifySession = ShopifySessionManager.createSession(shop, store.accessToken);

          shopifyDiscount = await createDiscountCode(shopifySession, {
            code: discountCode,
            value: discountEarned,
            type: 'percentage',
            usage_limit: 1,
            expires_at: expiresAt,
          });

          console.log('✅ Shopify discount created:', {
            priceRuleId: shopifyDiscount.priceRule.id,
            discountCodeId: shopifyDiscount.discountCode.id
          });

          // Save discount record to database
          const discountRecordId = await DiscountService.createDiscountRecord({
            shopDomain: shop,
            code: discountCode,
            value: discountEarned,
            type: 'percentage',
            priceRuleId: shopifyDiscount.priceRule.id.toString(),
            discountCodeId: shopifyDiscount.discountCode.id.toString(),
            customerId: 'test-customer',
            customerEmail: 'test@example.com',
            sessionId,
            expiresAt: Timestamp.fromDate(new Date(expiresAt)),
            isUsed: false,
          });

          console.log('💾 Database record created:', discountRecordId);
          databaseRecord = { id: discountRecordId };
        }
      } catch (error) {
        console.error('❌ Failed to create discount:', error);
        throw error;
      }
    }

    return res.json({
      success: true,
      message: 'Debug finish session completed',
      debug: {
        shop,
        finalScore,
        discountEarned,
        discountCode,
        expiresAt,
        shopifyDiscount: shopifyDiscount ? {
          priceRuleId: shopifyDiscount.priceRule.id,
          discountCodeId: shopifyDiscount.discountCode.id
        } : null,
        databaseRecord
      }
    });

  } catch (error) {
    console.error('🧪 Debug finish session error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    });
  }
}
