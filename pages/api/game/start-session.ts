import { NextApiRequest, NextApiResponse } from 'next';
import { StartGameRequest, StartGameResponse } from '../../../src/types/api';
import { GameSessionService, GameConfigService, CustomerService } from '../../../src/lib/database';
import crypto from 'crypto';

function generateSessionId(): string {
  return crypto.randomUUID();
}

function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? (forwarded as string).split(',')[0] : req.connection.remoteAddress;
  return ip || 'unknown';
}

function getUserAgent(req: NextApiRequest): string {
  return req.headers['user-agent'] || 'unknown';
}

function getDeviceType(userAgent: string): 'desktop' | 'tablet' | 'mobile' {
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile')) return 'mobile';
  if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet';
  return 'desktop';
}

function getBrowserType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('chrome')) return 'chrome';
  if (ua.includes('firefox')) return 'firefox';
  if (ua.includes('safari')) return 'safari';
  if (ua.includes('edge')) return 'edge';
  return 'unknown';
}

async function validateDiscountCodeEligibility(
  shopDomain: string,
  ipAddress: string
): Promise<{
  canPlay: boolean;
  reason?: string;
  playsRemaining: number;
  codesUsed?: number;
  maxCodes?: number;
  nextResetTime?: string;
  resetHours?: number;
}> {
  try {
    // Get game configuration
    console.log('🎮 Getting game config for shop:', shopDomain);
    const gameConfig = await GameConfigService.getConfig(shopDomain);
    console.log('🎮 Game config found:', !!gameConfig, gameConfig?.isEnabled);

    if (!gameConfig || !gameConfig.isEnabled) {
      console.log('🎮 Shop inactive or config not found');
      return { canPlay: false, reason: 'shop_inactive', playsRemaining: 0, codesUsed: 0, maxCodes: 0 };
    }

    const maxCodesPerCustomer = gameConfig.gameSettings.maxPlaysPerCustomer; // Reuse this field for max codes
    const resetHours = gameConfig.gameSettings.playLimitResetHours || 24;

    console.log('🎮 Discount code limit settings:');
    console.log('🎮 - maxCodesPerCustomer:', maxCodesPerCustomer);
    console.log('🎮 - resetHours:', resetHours);

    // NEW SYSTEM: Check discount code limits instead of session limits
    console.log('🎮 Checking discount code limits for IP:', ipAddress);

    // Calculate time cutoff for discount code reset
    const resetCutoff = new Date();
    resetCutoff.setHours(resetCutoff.getHours() - resetHours);
    console.log('🎮 Discount code reset cutoff time:', resetCutoff.toISOString());

    // NEW SYSTEM: Get sessions with discount codes for this IP within time period
    console.log('🎮 About to call getDiscountCodesByIP...');
    const sessionsWithCodes = await GameSessionService.getDiscountCodesByIP(shopDomain, ipAddress, resetCutoff);
    console.log('🎮 getDiscountCodesByIP completed successfully');

    console.log('🎮 Sessions with discount codes:', sessionsWithCodes.map(s => ({
      id: s.id,
      discountCode: s.discountCode,
      startedAt: s.startedAt.toDate().toISOString(),
      finalScore: s.finalScore
    })));

    const codesUsed = sessionsWithCodes.length;
    const codesRemaining = Math.max(0, maxCodesPerCustomer - codesUsed);

    // Check discount code limit
    console.log('🎮 Checking discount code limit:', codesUsed, '>=', maxCodesPerCustomer);
    if (codesUsed >= maxCodesPerCustomer) {
      console.log('🎮 Discount code limit reached:', codesUsed, '>=', maxCodesPerCustomer);

      // Calculate next reset time based on oldest discount code
      const nextResetTime = new Date();
      if (sessionsWithCodes.length > 0) {
        // Find the oldest session with discount code within the reset period
        const oldestSession = sessionsWithCodes.reduce((oldest, session) => {
          const sessionTime = session.startedAt.toDate();
          const oldestTime = oldest.startedAt.toDate();
          return sessionTime < oldestTime ? session : oldest;
        });

        const oldestTime = oldestSession.startedAt.toDate();
        nextResetTime.setTime(oldestTime.getTime() + (resetHours * 60 * 60 * 1000));
      }

      return {
        canPlay: false,
        reason: 'code_limit',
        playsRemaining: 0,
        codesUsed: codesUsed,
        maxCodes: maxCodesPerCustomer,
        nextResetTime: nextResetTime.toISOString(),
        resetHours: resetHours
      };
    }

    // User can play - they haven't reached discount code limit
    console.log('🎮 User can play - codes remaining:', codesRemaining);

    return {
      canPlay: true,
      playsRemaining: codesRemaining,
      codesUsed: codesUsed,
      maxCodes: maxCodesPerCustomer,
      resetHours: resetHours
    };
  } catch (error) {
    console.error('Error validating discount code eligibility:', error);
    return { canPlay: false, reason: 'validation_error', playsRemaining: 0, codesUsed: 0, maxCodes: 0 };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body: StartGameRequest = req.body;
    const { shopDomain, customerData, source, referrer } = body;

    console.log('🎮 Start session request:', {
      shopDomain,
      customerData,
      source,
      referrer,
      headers: {
        'user-agent': req.headers['user-agent'],
        'referer': req.headers.referer,
        'x-forwarded-for': req.headers['x-forwarded-for']
      },
      fullBody: req.body
    });

    if (!shopDomain) {
      return res.status(400).json({
        success: false,
        error: 'Shop domain is required'
      });
    }

    // Get client information
    const ipAddress = getClientIP(req);
    const userAgent = getUserAgent(req);
    const deviceType = getDeviceType(userAgent);
    const browserType = getBrowserType(userAgent);

    // Get game configuration first
    console.log('🎮 Getting game config for session...');
    const gameConfigDoc = await GameConfigService.getConfig(shopDomain);
    console.log('🎮 Game config doc:', !!gameConfigDoc);

    if (!gameConfigDoc || !gameConfigDoc.isEnabled) {
      return res.status(403).json({
        success: false,
        sessionId: '',
        gameConfig: null,
        canPlay: false,
        playsRemaining: 0,
        error: 'Game is not enabled for this shop'
      });
    }

    // Validate discount code eligibility based on IP address
    console.log('🎮 Validating discount code eligibility for IP:', ipAddress);
    const eligibility = await validateDiscountCodeEligibility(shopDomain, ipAddress);
    console.log('🎮 Eligibility result:', JSON.stringify(eligibility, null, 2));

    if (!eligibility.canPlay) {
      const response = {
        success: false,
        sessionId: '',
        gameConfig: null,
        canPlay: false,
        playsRemaining: eligibility.playsRemaining,
        error: `Cannot play: ${eligibility.reason}`,
        reason: eligibility.reason,
        // Include detailed discount code limit info for frontend
        codesUsed: eligibility.codesUsed,
        maxCodes: eligibility.maxCodes,
        nextResetTime: eligibility.nextResetTime,
        resetHours: eligibility.resetHours
      };
      console.log('🎮 Returning discount code limit response:', response);
      return res.status(403).json(response);
    }

    // Generate session ID
    const sessionId = generateSessionId();

    // Prepare game configuration for response
    const gameConfig = gameConfigDoc.gameSettings || {
      discountTiers: [
        { minScore: 0, discount: 0, message: "Keep hunting! 🔍" },
        { minScore: 150, discount: 5, message: "Nice start! 🎯" },
        { minScore: 300, discount: 10, message: "Getting warmer! 🔥" },
        { minScore: 500, discount: 15, message: "Bargain expert! 💡" },
        { minScore: 750, discount: 20, message: "Sale master! 👑" },
        { minScore: 1000, discount: 25, message: "LEGENDARY HUNTER! 🏆" }
      ],
      gameSpeed: 1,
      difficulty: 'medium'
    };

    // Create game session in database
    console.log('🎮 Creating session in database...');
    const sessionData = {
      shopDomain,
      customerId: customerData?.id || null,
      customerEmail: customerData?.email || null,
      sessionId,
      gameData: {
        moves: 0,
        timeSpent: 0,
        difficulty: gameConfig.difficulty,
        version: '1.0',
      },
      source: source || 'popup',
      referrer: referrer || undefined,
      userAgent: userAgent || undefined,
      ipAddress: ipAddress || undefined,
      completed: false,
    };
    console.log('🎮 Session data:', sessionData);

    try {
      await GameSessionService.createSession(sessionData);
      console.log('🎮 Session created successfully in database');

      // Test: Try to retrieve the session immediately to verify it was saved
      const testRetrieve = await GameSessionService.getSession(sessionId);
      console.log('🎮 Session retrieval test:', !!testRetrieve);

      // Test: Try to get sessions for this shop
      const shopSessions = await GameSessionService.getSessionsByShop(shopDomain, 5);
      console.log('🎮 Shop sessions count:', shopSessions.length);

    } catch (dbError: any) {
      console.error('🎮 CRITICAL: Failed to create session in database:', {
        error: dbError.message,
        code: dbError.code,
        details: dbError.details,
        sessionId: sessionId,
        shopDomain: shopDomain
      });
      console.error('🎮 This will cause frontend to use temp session, bypassing play limits!');
      // Continue anyway - the game can still work without database logging
    }

    const response: StartGameResponse = {
      success: true,
      sessionId,
      gameConfig,
      canPlay: true,
      playsRemaining: eligibility.playsRemaining - 1
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error starting game session:', error);
    res.status(500).json({
      success: false,
      sessionId: '',
      gameConfig: null,
      canPlay: false,
      error: 'Internal server error'
    });
  }
}
