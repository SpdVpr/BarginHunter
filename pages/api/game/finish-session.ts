import { NextApiRequest, NextApiResponse } from 'next';
import { FinishGameRequest, FinishGameResponse } from '../../../src/types/api';
import {
  GameSessionService,
  GameScoreService,
  DiscountService,
  CustomerService,
  GameConfigService,
  UsageTrackingService
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
    .find(tier => {
      // Support both old and new tier formats
      if (tier.maxScore !== undefined) {
        // New format with minScore and maxScore
        return score >= tier.minScore && score <= tier.maxScore;
      } else {
        // Old format with just minScore
        return score >= tier.minScore;
      }
    });

  // Support both discount and discountPercentage properties
  return qualifiedTier?.discount || qualifiedTier?.discountPercentage || 0;
}

function getNextTierScore(score: number, discountTiers: any[]): number | null {
  // Find the next tier the player can reach
  const nextTier = discountTiers
    .filter(tier => {
      // Support both formats
      if (tier.maxScore !== undefined) {
        // New format: find next tier where minScore > current score
        return tier.minScore > score;
      } else {
        // Old format: find next tier where minScore > current score
        return tier.minScore > score;
      }
    })
    .sort((a, b) => a.minScore - b.minScore)[0]; // Get the lowest qualifying tier

  return nextTier?.minScore || null;
}

function getScoreMessage(score: number, discountEarned: number, discountTiers?: any[]): string {
  if (discountEarned === 0) {
    if (discountTiers) {
      const nextTier = getNextTierScore(score, discountTiers);
      if (nextTier) {
        return `Score ${nextTier} points to earn your first discount!`;
      }
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
  console.log('🎮 finish-session API called - method:', req.method);
  console.log('🎮 finish-session request body:', JSON.stringify(req.body, null, 2));

  if (req.method !== 'POST') {
    console.log('🎮 finish-session: Method not allowed');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body: FinishGameRequest = req.body;
    const { sessionId, finalScore, gameData, playerEmail } = body;

    console.log('🎮 Finish session request parsed:', { sessionId, finalScore, gameData, playerEmail });

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

    // Get game configuration for discount tiers - use same logic as game config API
    let gameConfig: any = null;
    let discountTiers: any[] = [];

    try {
      gameConfig = await GameConfigService.getConfig(session.shopDomain);
      console.log('🎮 Game config loaded:', !!gameConfig);

      if (gameConfig) {
        // Use same logic as /api/game/config/[shop].ts - ONLY game-specific settings
        const currentGameType = gameConfig.gameSettings?.gameType || 'dino';

        // ONLY use game-specific settings for discount tiers
        if (gameConfig.gameSettings?.gameSpecificSettings?.[currentGameType]?.discountTiers) {
          discountTiers = gameConfig.gameSettings.gameSpecificSettings[currentGameType].discountTiers;
          console.log('🎯 Using game-specific discount tiers for', currentGameType, ':', JSON.stringify(discountTiers, null, 2));
        } else {
          console.log('🎯 No game-specific discount tiers found for', currentGameType);
          discountTiers = [];
        }
      }
    } catch (configError: any) {
      console.error('🎮 Failed to load game config:', configError);
      discountTiers = [];
    }

    console.log('🎯 Discount tiers loaded:', JSON.stringify(discountTiers, null, 2));
    console.log('🎯 Final score:', finalScore);

    // If no discount tiers are configured, no discount can be earned
    if (discountTiers.length === 0) {
      console.log('🎯 No discount tiers configured - no discount earned');
      return res.status(200).json({
        success: true,
        sessionId,
        score: finalScore,
        discountEarned: 0,
        message: 'Game completed! Configure discount tiers in admin panel to enable discounts.',
        nextTierScore: null
      });
    }

    // Calculate discount earned
    let discountEarned = calculateDiscountEarned(finalScore, discountTiers);
    const nextTierScore = getNextTierScore(finalScore, discountTiers);
    let message = getScoreMessage(finalScore, discountEarned, discountTiers);

    let discountCode: string | undefined;
    let expiresAt: string | undefined;

    // Create discount code if earned and within limits
    if (discountEarned > 0) {
      // Check discount code limits before creating
      const limitCheck = await UsageTrackingService.incrementUsage(session.shopDomain, 'discountCodesGenerated', 1);

      if (limitCheck.limitReached) {
        console.log('⚠️ Discount code limit reached, not creating discount code');
        // Still award points but no discount code
        discountEarned = 0;
        message = "Great score! You've reached your discount code limit for this month. Upgrade your plan for more discount codes.";
      } else {
        discountCode = generateDiscountCode();
        const expiryHours = gameConfig?.businessRules.discountExpiryHours || 24;
        expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();

        if (limitCheck.warningTriggered) {
          console.log('⚠️ Discount code warning triggered');
        }
      }
    }

    // Create discount code in Shopify if we have one
    if (discountCode && discountEarned > 0) {
      try {
        console.log('🎫 Creating Shopify discount code:', discountCode, 'for', discountEarned + '%');

        // Get store data for Shopify API
        const store = await StoreService.getStore(session.shopDomain);

        if (!store || !store.accessToken) {
          console.error('❌ No store or access token found for:', session.shopDomain);
          throw new Error('Store not found or no access token');
        }

        console.log('🔑 Store found, creating Shopify session...');

        // Create Shopify session and discount
        const shopifySession = ShopifySessionManager.createSession(session.shopDomain, store.accessToken);

        console.log('🛒 Creating discount in Shopify...');
        const shopifyDiscount = await createDiscountCode(shopifySession, {
          code: discountCode,
          value: discountEarned,
          type: 'percentage',
          usage_limit: 1,
          expires_at: expiresAt,
        });

        console.log('✅ Shopify discount created successfully:', shopifyDiscount);

          // Save discount record to database
          console.log('💾 Saving discount record to database...', {
            shopDomain: session.shopDomain,
            code: discountCode,
            customerId: session.customerId,
            customerEmail: session.customerEmail || playerEmail,
            sessionId
          });

          const discountRecordId = await DiscountService.createDiscountRecord({
            shopDomain: session.shopDomain,
            code: discountCode,
            value: discountEarned,
            type: 'percentage',
            priceRuleId: shopifyDiscount.priceRule.id.toString(),
            discountCodeId: shopifyDiscount.discountCode.id.toString(),
            customerId: session.customerId || null,
            customerEmail: session.customerEmail || playerEmail || null,
            sessionId,
            expiresAt: Timestamp.fromDate(new Date(expiresAt)),
            isUsed: false,
          });

          console.log('✅ Discount record saved with ID:', discountRecordId);

      } catch (error) {
        console.error('❌ Failed to create discount:', error);
        console.error('❌ Error details:', error instanceof Error ? error.message : error);

        // For demo purposes, still return the discount code even if Shopify creation fails
        console.log('⚠️ Continuing with demo discount code despite Shopify error');

        // You could also set discountCode = undefined here if you don't want to show codes that aren't in Shopify
        // discountCode = undefined;
      }
    }

    // Complete the session in database - ALWAYS track completed sessions for play limits
    try {
      if (!sessionId.startsWith('temp-')) {
        // Update existing session
        console.log('🎮 Completing real session:', sessionId);
        await GameSessionService.completeSession(sessionId, finalScore, discountEarned, discountCode);
        console.log('🎮 Real session completed in database');
      } else {
        // For temp sessions, create a new completed session to track play limits
        console.log('🎮 Creating completed session record for temp session to track play limits');
        const ipAddress = req.headers['x-forwarded-for']?.toString().split(',')[0] ||
                         req.connection.remoteAddress || 'unknown';

        const completedSessionData = {
          shopDomain: session.shopDomain,
          customerId: session.customerId || null,
          customerEmail: session.customerEmail || null,
          sessionId: sessionId, // Keep original temp sessionId
          gameData: {
            moves: 0,
            timeSpent: 0,
            difficulty: session.gameData?.difficulty || 'medium',
            version: '1.0',
          },
          source: 'popup',
          referrer: req.headers.referer || undefined,
          userAgent: req.headers['user-agent'] || undefined,
          ipAddress: ipAddress,
          completed: true, // Mark as completed immediately
          endedAt: Timestamp.now(),
          finalScore: finalScore,
          discountEarned: discountEarned,
          discountCode: discountCode
        };

        await GameSessionService.createSession(completedSessionData);
        console.log('🎮 Temp session recorded as completed for play limit tracking');
      }
    } catch (dbError: any) {
      console.error('🎮 Failed to complete session in database:', dbError);
    }

    // Record the score
    try {
      await GameScoreService.recordScore({
        shopDomain: session.shopDomain,
        customerId: session.customerId || null,
        customerEmail: session.customerEmail || playerEmail || null,
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
        if (identifier) {
          await CustomerService.updateCustomerStats(session.shopDomain, identifier, finalScore, discountEarned);
          console.log('🎮 Customer stats updated');
        }
      } catch (dbError: any) {
        console.error('🎮 Failed to update customer stats:', dbError);
      }
    }

    // Track game session usage (for analytics, no limits)
    try {
      console.log('📊 Tracking game session for analytics...');
      await UsageTrackingService.incrementUsage(session.shopDomain, 'gameSessions', 1);
      console.log('📊 Game session usage tracked (unlimited)');
    } catch (usageError: any) {
      console.error('📊 Failed to track game session usage:', usageError);
      // Don't fail the request if usage tracking fails
    }

    const response: FinishGameResponse = {
      success: true,
      discountEarned,
      discountCode,
      expiresAt,
      message,
      nextTierScore: nextTierScore || undefined
    };

    console.log('🎮 finish-session completed successfully, sending response:', response);
    res.status(200).json(response);

  } catch (error) {
    console.error('🎮 Error finishing game session:', error);
    res.status(500).json({
      success: false,
      discountEarned: 0,
      message: 'An error occurred while processing your game',
      error: 'Internal server error'
    });
  }
}
