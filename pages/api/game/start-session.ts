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
  customerIdentifier: string
): Promise<{ canPlay: boolean; reason?: string; playsRemaining: number }> {
  try {
    // Get game configuration
    const gameConfig = await GameConfigService.getConfig(shopDomain);

    if (!gameConfig || !gameConfig.isEnabled) {
      return { canPlay: false, reason: 'shop_inactive', playsRemaining: 0 };
    }

    const maxPlaysPerCustomer = gameConfig.gameSettings.maxPlaysPerCustomer;
    const maxPlaysPerDay = gameConfig.gameSettings.maxPlaysPerDay;

    // Check customer-specific limits if customer is identified
    if (customerIdentifier && customerIdentifier !== 'unknown') {
      const customer = await CustomerService.getCustomer(shopDomain, customerIdentifier);

      if (customer && customer.totalSessions >= maxPlaysPerCustomer) {
        return {
          canPlay: false,
          reason: 'customer_limit',
          playsRemaining: 0
        };
      }
    }

    // Check daily limits by getting today's sessions
    const allSessions = await GameSessionService.getSessionsByShop(shopDomain, 1000);
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

    return {
      canPlay: true,
      playsRemaining: maxPlaysPerDay - todaySessions.length
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

    // Use IP address as customer identifier if no customer data provided
    const customerIdentifier = customerData?.email || customerData?.id || ipAddress;

    // Validate play eligibility
    const eligibility = await validatePlayEligibility(shopDomain, customerIdentifier);
    
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

    // Get game configuration
    const gameConfigDoc = await GameConfigService.getConfig(shopDomain);
    const gameConfig = gameConfigDoc?.gameSettings || {
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
    await GameSessionService.createSession({
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
      referrer: referrer || null,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      completed: false,
    });

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
