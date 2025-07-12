import { NextApiRequest, NextApiResponse } from 'next';
import { GameConfigService, SubscriptionService, UsageTrackingService } from '../../src/lib/database';
import { Timestamp } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop } = req.query;

    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Shop domain is required' 
      });
    }

    console.log('Initializing shop:', shop);

    // Check if config already exists
    const existingConfig = await GameConfigService.getConfig(shop);
    if (existingConfig) {
      return res.json({
        success: true,
        message: 'Shop already initialized',
        shopDomain: shop,
        configId: existingConfig.id,
      });
    }

    // Create default game configuration
    const configId = await GameConfigService.createOrUpdateConfig({
      shopDomain: shop,
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
        showOn: 'all_pages' as 'all_pages' | 'product_pages' | 'cart_page' | 'checkout_page' | 'collection_pages' | 'custom',
        customPages: [],
        userPercentage: 100,
        testMode: false,
        showDelay: 0,
        pageLoadTrigger: 'immediate' as 'immediate' | 'after_delay' | 'on_scroll' | 'on_exit_intent',
        deviceTargeting: 'all' as 'all' | 'desktop' | 'mobile' | 'tablet',
        geoTargeting: [],
        timeBasedRules: {
          enabled: false,
          startTime: undefined,
          endTime: undefined,
          timezone: undefined,
          daysOfWeek: undefined,
        },
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

    // Initialize free subscription
    try {
      const existingSubscription = await SubscriptionService.getSubscription(shop);
      if (!existingSubscription) {
        console.log('🆓 Creating free subscription for new shop');
        const planLimits = await SubscriptionService.getDefaultPlanLimits('free');

        await SubscriptionService.createSubscription({
          shopDomain: shop,
          plan: 'free',
          status: 'active',
          billingCycle: 'monthly',
          price: 0,
          currency: 'USD',
          currentPeriodStart: Timestamp.now(),
          currentPeriodEnd: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days
          cancelAtPeriodEnd: false,
          planLimits,
        });

        // Initialize usage tracking
        await UsageTrackingService.initializeUsageTracking(shop, planLimits);
        console.log('✅ Free subscription and usage tracking initialized');
      }
    } catch (subscriptionError) {
      console.error('⚠️ Failed to initialize subscription (non-critical):', subscriptionError);
      // Don't fail the shop initialization if subscription setup fails
    }

    return res.json({
      success: true,
      message: 'Shop initialized successfully',
      shopDomain: shop,
      configId,
    });

  } catch (error) {
    console.error('Shop initialization error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to initialize shop',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
