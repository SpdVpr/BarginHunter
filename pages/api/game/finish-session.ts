import { NextApiRequest, NextApiResponse } from 'next';
import { FinishGameRequest, FinishGameResponse } from '../../../src/types/api';
import {
  GameSessionService,
  GameScoreService,
  DiscountService,
  CustomerService,
  GameConfigService
} from '../../../src/lib/database';
import { createDiscountCode, ShopifySessionManager } from '../../../src/lib/shopify';
import { Timestamp } from 'firebase-admin/firestore';
import { StoreService } from '../../../src/lib/database';
import crypto from 'crypto';

function generateDiscountCode(): string {
  const prefix = 'BARGAIN';
  const suffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}${suffix}`;
}

function calculateDiscountEarned(score: number, discountTiers: any[]): number {
  // Find the highest tier the player qualifies for
  const qualifiedTier = discountTiers
    .slice()
    .reverse()
    .find(tier => score >= tier.minScore);

  return qualifiedTier?.discount || 0;
}

function getNextTierScore(score: number): number | null {
  const discountTiers = [
    { minScore: 150, discount: 5 },
    { minScore: 300, discount: 10 },
    { minScore: 500, discount: 15 },
    { minScore: 750, discount: 20 },
    { minScore: 1000, discount: 25 }
  ];

  const nextTier = discountTiers.find(tier => score < tier.minScore);
  return nextTier?.minScore || null;
}

function getScoreMessage(score: number, discountEarned: number): string {
  if (discountEarned === 0) {
    const nextTier = getNextTierScore(score);
    if (nextTier) {
      return `Score ${nextTier} points to earn your first discount!`;
    }
    return "Keep hunting for better scores! 🔍";
  }

  if (score >= 1000) return "LEGENDARY HUNTER! You've mastered the game! 🏆";
  if (score >= 750) return "Sale Master! Incredible performance! 👑";
  if (score >= 500) return "Bargain Expert! You're getting really good! 💡";
  if (score >= 300) return "Getting warmer! Nice improvement! 🔥";
  if (score >= 150) return "Nice start! You earned your first discount! 🎯";
  
  return "Great effort! Keep playing to improve! 🎮";
}

async function createShopifyDiscount(
  shopDomain: string, 
  code: string, 
  discountPercent: number
): Promise<{ success: boolean; shopifyDiscountId?: string; error?: string }> {
  // TODO: Implement actual Shopify API integration
  // This would use the Shopify Admin API to create a discount code
  
  try {
    // Mock implementation for development
    const mockShopifyDiscountId = `gid://shopify/DiscountCodeNode/${Date.now()}`;
    
    // In a real implementation, this would be:
    // const shopifyClient = new Shopify.Clients.Rest(shopDomain, accessToken);
    // const discount = await shopifyClient.post({
    //   path: 'discount_codes',
    //   data: {
    //     discount_code: {
    //       code: code,
    //       discount_type: 'percentage',
    //       value: discountPercent,
    //       usage_limit: 1,
    //       expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    //     }
    //   }
    // });

    return {
      success: true,
      shopifyDiscountId: mockShopifyDiscountId
    };
  } catch (error) {
    console.error('Error creating Shopify discount:', error);
    return {
      success: false,
      error: 'Failed to create discount code'
    };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body: FinishGameRequest = req.body;
    const { sessionId, finalScore, gameData, playerEmail } = body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        discountEarned: 0,
        message: 'Session ID is required',
        error: 'Invalid request'
      });
    }

    // Get session data from database
    const session = await GameSessionService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        discountEarned: 0,
        message: 'Session not found',
        error: 'Invalid session'
      });
    }

    // Validate score (basic fraud prevention)
    if (finalScore < 0 || finalScore > 10000) {
      return res.status(400).json({
        success: false,
        discountEarned: 0,
        message: 'Invalid score detected',
        error: 'Score validation failed'
      });
    }

    // Get game configuration for discount tiers
    const gameConfig = await GameConfigService.getConfig(session.shopDomain);
    const discountTiers = gameConfig?.gameSettings.discountTiers || [
      { minScore: 0, discount: 0, message: "Keep hunting! 🔍" },
      { minScore: 150, discount: 5, message: "Nice start! 🎯" },
      { minScore: 300, discount: 10, message: "Getting warmer! 🔥" },
      { minScore: 500, discount: 15, message: "Bargain expert! 💡" },
      { minScore: 750, discount: 20, message: "Sale master! 👑" },
      { minScore: 1000, discount: 25, message: "LEGENDARY HUNTER! 🏆" }
    ];

    // Calculate discount earned
    const discountEarned = calculateDiscountEarned(finalScore, discountTiers);
    const nextTierScore = getNextTierScore(finalScore);
    const message = getScoreMessage(finalScore, discountEarned);

    let discountCode: string | undefined;
    let expiresAt: string | undefined;

    // Create discount code if earned
    if (discountEarned > 0) {
      discountCode = generateDiscountCode();
      const expiryHours = gameConfig?.businessRules.discountExpiryHours || 24;
      expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();

      try {
        // Get store data for Shopify API
        const store = await StoreService.getStore(session.shopDomain);

        if (store && store.accessToken) {
          // Create Shopify session and discount
          const shopifySession = ShopifySessionManager.createSession(session.shopDomain, store.accessToken);

          const shopifyDiscount = await createDiscountCode(shopifySession, {
            code: discountCode,
            value: discountEarned,
            type: 'percentage',
            usage_limit: 1,
            expires_at: expiresAt,
          });

          // Save discount record to database
          await DiscountService.createDiscountRecord({
            shopDomain: session.shopDomain,
            code: discountCode,
            value: discountEarned,
            type: 'percentage',
            priceRuleId: shopifyDiscount.priceRule.id.toString(),
            discountCodeId: shopifyDiscount.discountCode.id.toString(),
            customerId: session.customerId,
            customerEmail: session.customerEmail || playerEmail,
            sessionId,
            expiresAt: Timestamp.fromDate(new Date(expiresAt)),
            isUsed: false,
          });
        }
      } catch (error) {
        console.error('Failed to create Shopify discount:', error);
        // Continue with the response even if discount creation fails
      }
    }

    // Complete the session in database
    await GameSessionService.completeSession(sessionId, finalScore, discountEarned, discountCode);

    // Record the score
    await GameScoreService.recordScore({
      shopDomain: session.shopDomain,
      customerId: session.customerId,
      customerEmail: session.customerEmail || playerEmail,
      sessionId,
      score: finalScore,
      discountEarned,
      discountCode,
      gameData: {
        moves: gameData?.moves || 0,
        timeSpent: gameData?.timeSpent || 0,
        difficulty: session.gameData.difficulty,
      },
    });

    // Update customer statistics
    if (session.customerId || session.customerEmail || playerEmail) {
      const identifier = session.customerId || session.customerEmail || playerEmail!;
      await CustomerService.updateCustomerStats(session.shopDomain, identifier, finalScore, discountEarned);
    }

    const response: FinishGameResponse = {
      success: true,
      discountEarned,
      discountCode,
      expiresAt,
      message,
      nextTierScore: nextTierScore || undefined
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error finishing game session:', error);
    res.status(500).json({
      success: false,
      discountEarned: 0,
      message: 'An error occurred while processing your game',
      error: 'Internal server error'
    });
  }
}
