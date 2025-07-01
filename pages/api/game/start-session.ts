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

async function validatePlayEligibility(
  shopDomain: string,
  ipAddress: string
): Promise<{ canPlay: boolean; reason?: string; playsRemaining: number }> {
  try {
    // Get game configuration
    console.log('🎮 Getting game config for shop:', shopDomain);
    const gameConfig = await GameConfigService.getConfig(shopDomain);
    console.log('🎮 Game config found:', !!gameConfig, gameConfig?.isEnabled);

    if (!gameConfig || !gameConfig.isEnabled) {
      console.log('🎮 Shop inactive or config not found');
      return { canPlay: false, reason: 'shop_inactive', playsRemaining: 0 };
    }

    const maxPlaysPerCustomer = gameConfig.gameSettings.maxPlaysPerCustomer;
    const maxPlaysPerDay = gameConfig.gameSettings.maxPlaysPerDay;

    // Check IP-based limits (instead of customer-based)
    console.log('🎮 Checking IP-based play limits for:', ipAddress);
    console.log('🎮 Max plays per customer setting:', maxPlaysPerCustomer);
    console.log('🎮 Max plays per day setting:', maxPlaysPerDay);

    const allSessions = await GameSessionService.getSessionsByShop(shopDomain, 1000);
    console.log('🎮 Total sessions in shop:', allSessions.length);

    // Filter sessions by IP address - count ALL sessions, not just completed ones
    const ipSessions = allSessions.filter(session => session.ipAddress === ipAddress);
    console.log('🎮 Found', ipSessions.length, 'total sessions for IP:', ipAddress);

    // Also check completed sessions specifically
    const completedIpSessions = ipSessions.filter(session => session.completed);
    console.log('🎮 Found', completedIpSessions.length, 'completed sessions for IP:', ipAddress);

    // Debug: Show some session details
    if (ipSessions.length > 0) {
      console.log('🎮 Recent IP sessions:', ipSessions.slice(0, 3).map(s => ({
        id: s.id,
        completed: s.completed,
        startedAt: s.startedAt.toDate().toISOString(),
        endedAt: s.endedAt?.toDate()?.toISOString(),
        finalScore: s.finalScore
      })));
    }

    // Check per-IP limit (using maxPlaysPerCustomer setting) - count completed sessions only
    if (completedIpSessions.length >= maxPlaysPerCustomer) {
      console.log('🎮 IP limit reached:', completedIpSessions.length, '>=', maxPlaysPerCustomer);
      return {
        canPlay: false,
        reason: 'ip_limit',
        playsRemaining: 0
      };
    }

    // Check daily limits by getting today's sessions
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySessions = allSessions.filter(session => {
      const sessionDate = session.startedAt.toDate();
      return sessionDate >= today;
    });

    if (todaySessions.length >= maxPlaysPerDay) {
      return {
        canPlay: false,
        reason: 'daily_limit',
        playsRemaining: 0
      };
    }

    const ipPlaysRemaining = maxPlaysPerCustomer - completedIpSessions.length;
    const dailyPlaysRemaining = maxPlaysPerDay - todaySessions.length;

    console.log('🎮 IP plays remaining:', ipPlaysRemaining, 'Daily plays remaining:', dailyPlaysRemaining);

    return {
      canPlay: true,
      playsRemaining: Math.min(ipPlaysRemaining, dailyPlaysRemaining)
    };
  } catch (error) {
    console.error('Error validating play eligibility:', error);
    return { canPlay: false, reason: 'validation_error', playsRemaining: 0 };
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

    // Validate play eligibility based on IP address
    console.log('🎮 Validating play eligibility for IP:', ipAddress);
    const eligibility = await validatePlayEligibility(shopDomain, ipAddress);
    console.log('🎮 Eligibility result:', eligibility);

    if (!eligibility.canPlay) {
      const response: StartGameResponse = {
        success: false,
        sessionId: '',
        gameConfig: null,
        canPlay: false,
        playsRemaining: eligibility.playsRemaining,
        error: `Cannot play: ${eligibility.reason}`
      };
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
