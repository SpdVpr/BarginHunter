import { NextApiRequest, NextApiResponse } from 'next';
import { UsageTrackingService, SubscriptionService } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop, action } = req.query;

    if (!shop) {
      return res.status(400).json({ 
        error: 'Missing shop parameter'
      });
    }

    if (!action || !['gameSession', 'discountCode', 'analytics', 'webhook', 'abTest'].includes(action as string)) {
      return res.status(400).json({ 
        error: 'Invalid or missing action parameter',
        validActions: ['gameSession', 'discountCode', 'analytics', 'webhook', 'abTest']
      });
    }

    console.log('🔍 Checking usage limits for shop:', shop, 'action:', action);

    // Get current usage
    const usage = await UsageTrackingService.getCurrentUsage(shop as string);
    
    if (!usage) {
      // Initialize usage tracking if it doesn't exist
      const subscription = await SubscriptionService.getSubscription(shop as string);
      const planLimits = await SubscriptionService.getDefaultPlanLimits(subscription?.plan || 'free');
      await UsageTrackingService.initializeUsageTracking(shop as string, planLimits);
      
      // Return allowed since we just initialized
      return res.status(200).json({
        allowed: true,
        usage: {
          current: 0,
          limit: planLimits[`max${action.charAt(0).toUpperCase() + action.slice(1)}s` as keyof typeof planLimits] || 0,
          percentage: 0
        },
        plan: subscription?.plan || 'free',
        message: 'Usage tracking initialized'
      });
    }

    // Map action to usage field
    const usageFieldMap: { [key: string]: keyof typeof usage.usage } = {
      gameSession: 'gameSessions',
      discountCode: 'discountCodesGenerated',
      analytics: 'analyticsRequests',
      webhook: 'webhookCalls',
      abTest: 'abTestVariants'
    };

    const limitFieldMap: { [key: string]: keyof typeof usage.limits } = {
      gameSession: 'maxGameSessions',
      discountCode: 'maxDiscountCodes',
      analytics: 'maxAnalyticsRequests',
      webhook: 'maxWebhookCalls',
      abTest: 'maxAbTestVariants'
    };

    const usageField = usageFieldMap[action as string];
    const limitField = limitFieldMap[action as string];

    if (!usageField || !limitField) {
      return res.status(400).json({ error: 'Invalid action mapping' });
    }

    const currentUsage = usage.usage[usageField];
    const limit = usage.limits[limitField];

    // Check if action is allowed
    const allowed = limit === -1 || currentUsage < limit; // -1 means unlimited
    const percentage = limit === -1 ? 0 : Math.min((currentUsage / limit) * 100, 100);

    const response = {
      allowed,
      usage: {
        current: currentUsage,
        limit: limit === -1 ? 'unlimited' : limit,
        percentage: Math.round(percentage)
      },
      plan: usage.limits.maxGameSessions === -1 ? 'pro' : 'free', // Simple plan detection
      warnings: {
        approaching80: percentage >= 80 && percentage < 95,
        approaching95: percentage >= 95,
        limitReached: !allowed
      }
    };

    if (!allowed) {
      response['message'] = `You have reached your ${action} limit for this month. Upgrade to Pro for unlimited access.`;
      response['upgradeUrl'] = `/dashboard/billing?shop=${shop}`;
    } else if (percentage >= 95) {
      response['message'] = `You are approaching your ${action} limit (${percentage}%). Consider upgrading to avoid interruption.`;
      response['upgradeUrl'] = `/dashboard/billing?shop=${shop}`;
    } else if (percentage >= 80) {
      response['message'] = `You have used ${percentage}% of your ${action} limit this month.`;
    }

    console.log('✅ Usage limits checked:', response);
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Failed to check usage limits:', error);
    res.status(500).json({
      error: 'Failed to check usage limits',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
