import { SubscriptionService, UsageTrackingService, NotificationService } from './database';

export class UpgradeRecommendationService {
  /**
   * Analyze usage patterns and create upgrade recommendations
   */
  static async analyzeAndRecommend(shopDomain: string): Promise<void> {
    try {
      console.log('🔍 Analyzing usage patterns for shop:', shopDomain);

      const subscription = await SubscriptionService.getSubscription(shopDomain);
      const usage = await UsageTrackingService.getCurrentUsage(shopDomain);

      if (!subscription || !usage) {
        console.log('⚠️ No subscription or usage data found');
        return;
      }

      const currentPlan = subscription.plan;
      const discountCodesUsed = usage.usage.discountCodesGenerated;
      const discountCodesLimit = usage.limits.maxDiscountCodes;

      // Calculate usage percentage
      const usagePercentage = discountCodesLimit === -1 ? 0 : (discountCodesUsed / discountCodesLimit) * 100;

      console.log('📊 Usage analysis:', {
        plan: currentPlan,
        used: discountCodesUsed,
        limit: discountCodesLimit,
        percentage: usagePercentage
      });

      // Generate recommendations based on usage patterns
      await this.generateRecommendations(shopDomain, currentPlan, usagePercentage, discountCodesUsed, discountCodesLimit);

    } catch (error) {
      console.error('❌ Failed to analyze usage patterns:', error);
    }
  }

  /**
   * Generate specific recommendations based on usage patterns
   */
  private static async generateRecommendations(
    shopDomain: string,
    currentPlan: string,
    usagePercentage: number,
    discountCodesUsed: number,
    discountCodesLimit: number
  ): Promise<void> {
    
    // High usage recommendations
    if (usagePercentage >= 90 && currentPlan !== 'enterprise') {
      const nextPlan = this.getNextPlan(currentPlan);
      if (nextPlan) {
        await NotificationService.createUpgradeSuggestion(
          shopDomain,
          `You're using ${Math.round(usagePercentage)}% of your discount codes. Upgrade to ${nextPlan.name} for ${nextPlan.limit.toLocaleString()} codes/month.`
        );
      }
    }

    // Consistent high usage over time
    if (usagePercentage >= 70 && currentPlan === 'free') {
      await NotificationService.createUpgradeSuggestion(
        shopDomain,
        'You\'re consistently using most of your free discount codes. Upgrade to Starter for 10x more codes at just $19/month.'
      );
    }

    // Growth pattern detection
    if (discountCodesUsed > 50 && currentPlan === 'free') {
      await NotificationService.createUpgradeSuggestion(
        shopDomain,
        'Your discount code usage is growing! Consider upgrading to avoid hitting limits during peak sales periods.'
      );
    }

    // Enterprise recommendations for high-volume users
    if (discountCodesUsed > 5000 && currentPlan === 'pro') {
      await NotificationService.createUpgradeSuggestion(
        shopDomain,
        'You\'re generating high volumes of discount codes. Enterprise plan offers 100,000 codes/month with dedicated support.'
      );
    }
  }

  /**
   * Get the next recommended plan
   */
  private static getNextPlan(currentPlan: string) {
    const planHierarchy = {
      free: { name: 'Starter', limit: 1000, price: 19 },
      starter: { name: 'Pro', limit: 10000, price: 39 },
      pro: { name: 'Enterprise', limit: 100000, price: 99 },
    };

    return planHierarchy[currentPlan as keyof typeof planHierarchy] || null;
  }

  /**
   * Check if shop should receive upgrade recommendations
   */
  static async shouldRecommendUpgrade(shopDomain: string): Promise<boolean> {
    try {
      const usage = await UsageTrackingService.getCurrentUsage(shopDomain);
      if (!usage) return false;

      const discountCodesUsed = usage.usage.discountCodesGenerated;
      const discountCodesLimit = usage.limits.maxDiscountCodes;

      // Recommend upgrade if using more than 70% of limit
      if (discountCodesLimit !== -1) {
        const usagePercentage = (discountCodesUsed / discountCodesLimit) * 100;
        return usagePercentage >= 70;
      }

      return false;
    } catch (error) {
      console.error('❌ Failed to check upgrade recommendation:', error);
      return false;
    }
  }

  /**
   * Get upgrade suggestions for a specific shop
   */
  static async getUpgradeSuggestions(shopDomain: string) {
    try {
      const subscription = await SubscriptionService.getSubscription(shopDomain);
      const usage = await UsageTrackingService.getCurrentUsage(shopDomain);

      if (!subscription || !usage) {
        return [];
      }

      const currentPlan = subscription.plan;
      const suggestions = [];

      // Add next tier suggestions
      if (currentPlan === 'free') {
        suggestions.push({
          plan: 'starter',
          name: '💼 Starter',
          price: 19,
          limit: 1000,
          benefits: ['10x more discount codes', '1,000 codes per month'],
          recommended: true
        });
        suggestions.push({
          plan: 'pro',
          name: '🚀 Pro',
          price: 39,
          limit: 10000,
          benefits: ['100x more discount codes', '10,000 codes per month'],
          recommended: false
        });
      } else if (currentPlan === 'starter') {
        suggestions.push({
          plan: 'pro',
          name: '🚀 Pro',
          price: 39,
          limit: 10000,
          benefits: ['10x more discount codes', '10,000 codes per month'],
          recommended: true
        });
        suggestions.push({
          plan: 'enterprise',
          name: '🏢 Enterprise',
          price: 99,
          limit: 100000,
          benefits: ['100x more discount codes', '100,000 codes per month', 'Dedicated support'],
          recommended: false
        });
      } else if (currentPlan === 'pro') {
        suggestions.push({
          plan: 'enterprise',
          name: '🏢 Enterprise',
          price: 99,
          limit: 100000,
          benefits: ['10x more discount codes', '100,000 codes per month', 'Dedicated support'],
          recommended: true
        });
      }

      return suggestions;
    } catch (error) {
      console.error('❌ Failed to get upgrade suggestions:', error);
      return [];
    }
  }

  /**
   * Create a personalized upgrade message
   */
  static async getPersonalizedUpgradeMessage(shopDomain: string): Promise<string | null> {
    try {
      const usage = await UsageTrackingService.getCurrentUsage(shopDomain);
      const subscription = await SubscriptionService.getSubscription(shopDomain);

      if (!usage || !subscription) return null;

      const discountCodesUsed = usage.usage.discountCodesGenerated;
      const discountCodesLimit = usage.limits.maxDiscountCodes;
      const currentPlan = subscription.plan;

      if (discountCodesLimit === -1) return null; // Unlimited plan

      const usagePercentage = (discountCodesUsed / discountCodesLimit) * 100;

      if (usagePercentage >= 95) {
        return `You've used ${discountCodesUsed} of ${discountCodesLimit} discount codes (${Math.round(usagePercentage)}%). Upgrade now to avoid hitting your limit!`;
      } else if (usagePercentage >= 80) {
        return `You're using ${Math.round(usagePercentage)}% of your discount codes. Consider upgrading to ensure you don't run out during busy periods.`;
      } else if (discountCodesUsed >= 50 && currentPlan === 'free') {
        return `You've generated ${discountCodesUsed} discount codes this month. You're getting great value from Bargain Hunter!`;
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to get personalized upgrade message:', error);
      return null;
    }
  }
}
