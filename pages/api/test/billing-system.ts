import { NextApiRequest, NextApiResponse } from 'next';
import { 
  SubscriptionService, 
  UsageTrackingService, 
  BillingHistoryService, 
  NotificationService 
} from '../../../src/lib/database';
import { ShopifyBillingService } from '../../../src/lib/shopify-billing';
import { UpgradeRecommendationService } from '../../../src/lib/upgrade-recommendations';
import { Timestamp } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop, testType } = req.body;

    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    console.log('🧪 Running billing system test:', testType, 'for shop:', shop);

    let testResults = {};

    switch (testType) {
      case 'subscription_creation':
        testResults = await testSubscriptionCreation(shop);
        break;
      case 'usage_tracking':
        testResults = await testUsageTracking(shop);
        break;
      case 'billing_history':
        testResults = await testBillingHistory(shop);
        break;
      case 'notifications':
        testResults = await testNotifications(shop);
        break;
      case 'upgrade_recommendations':
        testResults = await testUpgradeRecommendations(shop);
        break;
      case 'plan_limits':
        testResults = await testPlanLimits();
        break;
      case 'full_system':
        testResults = await runFullSystemTest(shop);
        break;
      default:
        return res.status(400).json({ error: 'Invalid test type' });
    }

    res.status(200).json({
      success: true,
      testType,
      shop,
      results: testResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Billing system test failed:', error);
    res.status(500).json({
      error: 'Billing system test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function testSubscriptionCreation(shop: string) {
  console.log('🧪 Testing subscription creation...');
  
  const results = {
    freeSubscriptionCreated: false,
    starterSubscriptionCreated: false,
    planLimitsCorrect: false,
    usageTrackingInitialized: false
  };

  try {
    // Test free subscription creation
    const planLimits = await SubscriptionService.getDefaultPlanLimits('free');
    const subscriptionId = await SubscriptionService.createSubscription({
      shopDomain: shop,
      plan: 'free',
      status: 'active',
      billingCycle: 'monthly',
      price: 0,
      currency: 'USD',
      currentPeriodStart: Timestamp.now(),
      currentPeriodEnd: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      cancelAtPeriodEnd: false,
      planLimits,
    });
    results.freeSubscriptionCreated = !!subscriptionId;

    // Test plan limits
    results.planLimitsCorrect = planLimits.maxDiscountCodes === 100;

    // Test usage tracking initialization
    await UsageTrackingService.initializeUsageTracking(shop, planLimits);
    const usage = await UsageTrackingService.getCurrentUsage(shop);
    results.usageTrackingInitialized = !!usage;

    // Test starter subscription upgrade
    const starterLimits = await SubscriptionService.getDefaultPlanLimits('starter');
    await SubscriptionService.updateSubscription(shop, {
      plan: 'starter',
      price: 19,
      planLimits: starterLimits,
    });
    results.starterSubscriptionCreated = true;

  } catch (error) {
    console.error('❌ Subscription creation test failed:', error);
  }

  return results;
}

async function testUsageTracking(shop: string) {
  console.log('🧪 Testing usage tracking...');
  
  const results = {
    gameSessionTracked: false,
    discountCodeTracked: false,
    limitCheckWorks: false,
    warningTriggered: false
  };

  try {
    // Test game session tracking
    const sessionResult = await UsageTrackingService.incrementUsage(shop, 'gameSessions', 1);
    results.gameSessionTracked = sessionResult.success;

    // Test discount code tracking
    const discountResult = await UsageTrackingService.incrementUsage(shop, 'discountCodesGenerated', 1);
    results.discountCodeTracked = discountResult.success;

    // Test limit checking (simulate reaching 80% of free plan limit)
    for (let i = 0; i < 79; i++) {
      await UsageTrackingService.incrementUsage(shop, 'discountCodesGenerated', 1);
    }
    
    const warningResult = await UsageTrackingService.incrementUsage(shop, 'discountCodesGenerated', 1);
    results.warningTriggered = warningResult.warningTriggered || false;

    // Test limit reached
    for (let i = 0; i < 19; i++) {
      await UsageTrackingService.incrementUsage(shop, 'discountCodesGenerated', 1);
    }
    
    const limitResult = await UsageTrackingService.incrementUsage(shop, 'discountCodesGenerated', 1);
    results.limitCheckWorks = limitResult.limitReached;

  } catch (error) {
    console.error('❌ Usage tracking test failed:', error);
  }

  return results;
}

async function testBillingHistory(shop: string) {
  console.log('🧪 Testing billing history...');
  
  const results = {
    billingRecordCreated: false,
    billingHistoryRetrieved: false,
    billingRecordUpdated: false
  };

  try {
    // Create billing record
    const billingId = await BillingHistoryService.createBillingRecord({
      shopDomain: shop,
      shopifyChargeId: 'test_charge_123',
      type: 'subscription',
      amount: 19,
      currency: 'USD',
      status: 'pending',
      description: 'Test billing record',
      billingDate: Timestamp.now(),
      periodStart: Timestamp.now(),
      periodEnd: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    });
    results.billingRecordCreated = !!billingId;

    // Retrieve billing history
    const history = await BillingHistoryService.getBillingHistory(shop);
    results.billingHistoryRetrieved = history.length > 0;

    // Update billing record
    await BillingHistoryService.updateBillingRecord(billingId, {
      status: 'accepted',
    });
    results.billingRecordUpdated = true;

  } catch (error) {
    console.error('❌ Billing history test failed:', error);
  }

  return results;
}

async function testNotifications(shop: string) {
  console.log('🧪 Testing notifications...');
  
  const results = {
    usageWarningCreated: false,
    upgradeNotificationCreated: false,
    notificationsRetrieved: false,
    notificationMarkedRead: false
  };

  try {
    // Create usage warning
    const warningId = await NotificationService.createUsageWarning(
      shop, 
      'discountCodesGenerated', 
      80, 
      100, 
      80
    );
    results.usageWarningCreated = !!warningId;

    // Create upgrade suggestion
    const upgradeId = await NotificationService.createUpgradeSuggestion(
      shop,
      'Test upgrade recommendation'
    );
    results.upgradeNotificationCreated = !!upgradeId;

    // Retrieve notifications
    const notifications = await NotificationService.getNotifications(shop);
    results.notificationsRetrieved = notifications.length > 0;

    // Mark notification as read
    if (notifications.length > 0) {
      await NotificationService.markAsRead(notifications[0].id);
      results.notificationMarkedRead = true;
    }

  } catch (error) {
    console.error('❌ Notifications test failed:', error);
  }

  return results;
}

async function testUpgradeRecommendations(shop: string) {
  console.log('🧪 Testing upgrade recommendations...');
  
  const results = {
    recommendationsGenerated: false,
    personalizedMessageCreated: false,
    shouldRecommendUpgrade: false
  };

  try {
    // Test upgrade suggestions
    const suggestions = await UpgradeRecommendationService.getUpgradeSuggestions(shop);
    results.recommendationsGenerated = suggestions.length > 0;

    // Test personalized message
    const message = await UpgradeRecommendationService.getPersonalizedUpgradeMessage(shop);
    results.personalizedMessageCreated = !!message;

    // Test should recommend upgrade
    const shouldRecommend = await UpgradeRecommendationService.shouldRecommendUpgrade(shop);
    results.shouldRecommendUpgrade = shouldRecommend;

  } catch (error) {
    console.error('❌ Upgrade recommendations test failed:', error);
  }

  return results;
}

async function testPlanLimits() {
  console.log('🧪 Testing plan limits...');
  
  const results = {
    freePlanLimits: null,
    starterPlanLimits: null,
    proPlanLimits: null,
    enterprisePlanLimits: null,
    allPlansHaveCorrectLimits: false
  };

  try {
    const freeLimits = await SubscriptionService.getDefaultPlanLimits('free');
    const starterLimits = await SubscriptionService.getDefaultPlanLimits('starter');
    const proLimits = await SubscriptionService.getDefaultPlanLimits('pro');
    const enterpriseLimits = await SubscriptionService.getDefaultPlanLimits('enterprise');

    results.freePlanLimits = freeLimits;
    results.starterPlanLimits = starterLimits;
    results.proPlanLimits = proLimits;
    results.enterprisePlanLimits = enterpriseLimits;

    // Verify correct limits
    results.allPlansHaveCorrectLimits = 
      freeLimits.maxDiscountCodes === 100 &&
      starterLimits.maxDiscountCodes === 1000 &&
      proLimits.maxDiscountCodes === 10000 &&
      enterpriseLimits.maxDiscountCodes === 100000;

  } catch (error) {
    console.error('❌ Plan limits test failed:', error);
  }

  return results;
}

async function runFullSystemTest(shop: string) {
  console.log('🧪 Running full system test...');
  
  const results = {
    subscriptionTest: await testSubscriptionCreation(shop),
    usageTest: await testUsageTracking(shop),
    billingTest: await testBillingHistory(shop),
    notificationsTest: await testNotifications(shop),
    upgradeTest: await testUpgradeRecommendations(shop),
    planLimitsTest: await testPlanLimits(),
    overallSuccess: false
  };

  // Calculate overall success
  const allTests = [
    results.subscriptionTest,
    results.usageTest,
    results.billingTest,
    results.notificationsTest,
    results.upgradeTest,
    results.planLimitsTest
  ];

  let totalChecks = 0;
  let passedChecks = 0;

  allTests.forEach(test => {
    Object.values(test).forEach(value => {
      if (typeof value === 'boolean') {
        totalChecks++;
        if (value) passedChecks++;
      }
    });
  });

  results.overallSuccess = passedChecks / totalChecks >= 0.8; // 80% pass rate

  return results;
}
