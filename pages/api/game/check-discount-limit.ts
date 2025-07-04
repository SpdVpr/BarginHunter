import { NextApiRequest, NextApiResponse } from 'next';
import { UsageTrackingService, SubscriptionService } from '../../../src/lib/database';

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

    console.log('🔍 Checking discount code limit for shop:', shop);

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
          limit: planLimits.maxDiscountCodes,
          percentage: 0
        },
        plan: subscription?.plan || 'free',
        message: 'Usage tracking initialized'
      });
    }

    const currentUsage = usage.usage.discountCodesGenerated;
    const limit = usage.limits.maxDiscountCodes;

    // Check if creating a discount code is allowed
    const allowed = limit === -1 || currentUsage < limit;
    const percentage = limit === -1 ? 0 : Math.min((currentUsage / limit) * 100, 100);

    const response = {
      allowed,
      usage: {
        current: currentUsage,
        limit: limit === -1 ? 'unlimited' : limit,
        percentage: Math.round(percentage)
      },
      plan: usage.limits.maxDiscountCodes === 100 ? 'free' : 
            usage.limits.maxDiscountCodes === 1000 ? 'starter' :
            usage.limits.maxDiscountCodes === 10000 ? 'pro' : 'enterprise',
      warnings: {
        approaching80: percentage >= 80 && percentage < 95,
        approaching95: percentage >= 95,
        limitReached: !allowed
      }
    };

    if (!allowed) {
      response['message'] = `You have reached your discount code limit for this month (${currentUsage}/${limit}). Upgrade your plan for more discount codes.`;
      response['upgradeUrl'] = `/dashboard/billing?shop=${shop}`;
      response['suggestedPlans'] = getSuggestedPlans(usage.limits.maxDiscountCodes);
    } else if (percentage >= 95) {
      response['message'] = `You are approaching your discount code limit (${Math.round(percentage)}%). Consider upgrading to avoid interruption.`;
      response['upgradeUrl'] = `/dashboard/billing?shop=${shop}`;
      response['suggestedPlans'] = getSuggestedPlans(usage.limits.maxDiscountCodes);
    } else if (percentage >= 80) {
      response['message'] = `You have used ${Math.round(percentage)}% of your discount code limit this month.`;
    }

    console.log('✅ Discount code limit checked:', response);
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Failed to check discount code limit:', error);
    res.status(500).json({
      error: 'Failed to check discount code limit',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function getSuggestedPlans(currentLimit: number) {
  const suggestions = [];
  
  if (currentLimit === 100) {
    suggestions.push({ plan: 'starter', limit: 1000, price: 19 });
    suggestions.push({ plan: 'pro', limit: 10000, price: 39 });
  } else if (currentLimit === 1000) {
    suggestions.push({ plan: 'pro', limit: 10000, price: 39 });
    suggestions.push({ plan: 'enterprise', limit: 100000, price: 99 });
  } else if (currentLimit === 10000) {
    suggestions.push({ plan: 'enterprise', limit: 100000, price: 99 });
  }
  
  return suggestions;
}
