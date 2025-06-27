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

// This function is no longer needed - we use the real Shopify API function

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body: FinishGameRequest = req.body;
    const { sessionId, finalScore, gameData, playerEmail } = body;

    console.log('🎮 Finish session request:', { sessionId, finalScore, gameData, playerEmail });

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        discountEarned: 0,
        message: 'Session ID is required',
        error: 'Invalid request'
      });
    }

    // For now, always allow the game to finish successfully
    // This ensures the user experience works while we fix Firebase
    console.log('🎮 Processing finish session for sessionId:', sessionId);

    // Handle sessions - try database first, fallback to mock
    let session: any;
    let isTemporarySession = sessionId.startsWith('temp-');

    if (!isTemporarySession) {
      // Try to get session from database
      try {
        console.log('🎮 Getting session from database:', sessionId);
        session = await GameSessionService.getSession(sessionId);
        console.log('🎮 Session found in database:', !!session);
      } catch (dbError: any) {
        console.error('🎮 Database error, treating as temporary session:', dbError);
        isTemporarySession = true;
      }
    }

    if (isTemporarySession || !session) {
      console.log('🎮 Using temporary/fallback session for:', sessionId);

      // Extract shop domain from referrer or use a default
      const shopDomain = req.headers.referer?.includes('.myshopify.com')
        ? req.headers.referer.match(/https?:\/\/([^.]+\.myshopify\.com)/)?.[1] || 'barginhuntertest.myshopify.com'
        : 'barginhuntertest.myshopify.com';

      console.log('🎮 Using shop domain for fallback session:', shopDomain);

      // Create a mock session
      session = {
        id: sessionId,
        shopDomain,
        sessionId,
        gameData: { difficulty: 'medium' },
        completed: false
      };
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

    // Get game configuration for discount tiers (with fallback)
    let gameConfig: any = null;
    try {
      gameConfig = await GameConfigService.getConfig(session.shopDomain);
      console.log('🎮 Game config loaded:', !!gameConfig);
    } catch (configError: any) {
      console.error('🎮 Failed to load game config, using defaults:', configError);
    }

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

    // Complete the session in database (skip for temp sessions)
    if (!sessionId.startsWith('temp-')) {
      try {
        await GameSessionService.completeSession(sessionId, finalScore, discountEarned, discountCode);
        console.log('🎮 Session completed in database');
      } catch (dbError: any) {
        console.error('🎮 Failed to complete session in database:', dbError);
      }
    }

    // Record the score
    try {
      await GameScoreService.recordScore({
        shopDomain: session.shopDomain,
        customerId: session.customerId,
        customerEmail: session.customerEmail || playerEmail,
        sessionId,
        score: finalScore,
        discountEarned,
        discountCode,
        gameData: {
          moves: gameData?.objectsCollected || 0,
          timeSpent: gameData?.duration || 0,
          difficulty: session.gameData.difficulty,
        },
      });
      console.log('🎮 Score recorded in database');
    } catch (dbError: any) {
      console.error('🎮 Failed to record score in database:', dbError);
    }

    // Update customer statistics
    if (session.customerId || session.customerEmail || playerEmail) {
      try {
        const identifier = session.customerId || session.customerEmail || playerEmail!;
        await CustomerService.updateCustomerStats(session.shopDomain, identifier, finalScore, discountEarned);
        console.log('🎮 Customer stats updated');
      } catch (dbError: any) {
        console.error('🎮 Failed to update customer stats:', dbError);
      }
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
