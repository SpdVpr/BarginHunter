import { NextApiRequest, NextApiResponse } from 'next';
import { ShopifySessionManager } from '../../../src/lib/shopify';
import { ShopifyBillingService } from '../../../src/lib/shopify-billing';
import { StoreService, SubscriptionService, UsageTrackingService } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop } = req.query;

    if (!shop) {
      return res.status(400).json({ 
        error: 'Missing shop parameter'
      });
    }

    console.log('🔄 Getting billing status for shop:', shop);

    // Get local subscription data
    const subscription = await SubscriptionService.getSubscription(shop as string);
    const currentUsage = await UsageTrackingService.getCurrentUsage(shop as string);

    // Get store for Shopify API access
    const store = await StoreService.getStore(shop as string);
    let shopifyStatus = null;

    if (store && store.accessToken && subscription?.shopifyChargeId) {
      try {
        const session = ShopifySessionManager.createSession(shop as string, store.accessToken);
        shopifyStatus = await ShopifyBillingService.getSubscriptionStatus(session);
      } catch (error) {
        console.warn('⚠️ Could not fetch Shopify billing status:', error);
      }
    }

    // Get available plans
    const availablePlans = ShopifyBillingService.getAllPlans();

    const response = {
      success: true,
      subscription: subscription || {
        plan: 'free',
        status: 'active',
        planLimits: ShopifyBillingService.getPlan('free')?.limits,
      },
      usage: currentUsage || {
        usage: {
          gameSessions: 0,
          discountCodesGenerated: 0,
          analyticsRequests: 0,
          webhookCalls: 0,
          abTestVariants: 0,
        },
        limits: ShopifyBillingService.getPlan('free')?.limits,
      },
      shopifyStatus,
      availablePlans,
      recommendations: await generateRecommendations(shop as string, currentUsage, subscription),
    };

    console.log('✅ Billing status retrieved successfully');
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Failed to get billing status:', error);
    res.status(500).json({
      error: 'Failed to get billing status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function generateRecommendations(
  shopDomain: string, 
  usage: any, 
  subscription: any
): Promise<string[]> {
  const recommendations: string[] = [];

  if (!usage || !subscription) return recommendations;

  const currentPlan = subscription.plan || 'free';
  
  // Check usage patterns
  if (currentPlan === 'free') {
    const gameSessionsUsage = usage.usage?.gameSessions || 0;
    const gameSessionsLimit = usage.limits?.maxGameSessions || 100;
    
    if (gameSessionsUsage > gameSessionsLimit * 0.8) {
      recommendations.push('Consider upgrading to Pro for unlimited game sessions');
    }
    
    if (gameSessionsUsage > 50) {
      recommendations.push('Pro plan offers advanced analytics and custom branding');
    }
  }

  if (currentPlan === 'pro') {
    const totalSessions = usage.usage?.gameSessions || 0;
    
    if (totalSessions > 1000) {
      recommendations.push('Enterprise plan offers multiple game types and dedicated support');
    }
  }

  return recommendations;
}
