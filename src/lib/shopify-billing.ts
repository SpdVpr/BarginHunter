import { shopify } from './shopify';
import { Session } from '@shopify/shopify-api';
import { SubscriptionService, BillingHistoryService, NotificationService } from './database';
import { Timestamp } from 'firebase-admin/firestore';

export interface PricingPlan {
  id: 'free' | 'starter' | 'pro' | 'enterprise';
  name: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  trialDays?: number;
  features: string[];
  limits: {
    maxGameSessions: number; // Always unlimited (-1) for all plans
    maxDiscountCodes: number; // This is the only limit that varies
    analyticsRetentionDays: number; // Always unlimited for all plans
    customBranding: boolean; // Always true for all plans
    advancedAnalytics: boolean; // Always true for all plans
    prioritySupport: boolean; // Always true for all plans
    webhookIntegrations: boolean; // Always true for all plans
    abTesting: boolean; // Always true for all plans
    multipleGameTypes: boolean; // Always true for all plans
    fraudProtection: boolean; // Always true for all plans
  };
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: '🆓 Free Tier',
    price: 0,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      'Unlimited game sessions',
      'Advanced analytics & reporting',
      'Custom branding & themes',
      'A/B testing capabilities',
      'Priority support',
      'Webhook integrations',
      'Multiple game types',
      'Advanced fraud protection',
      '100 discount codes per month',
    ],
    limits: {
      maxGameSessions: -1, // Unlimited
      maxDiscountCodes: 100,
      analyticsRetentionDays: -1, // Unlimited
      customBranding: true,
      advancedAnalytics: true,
      prioritySupport: true,
      webhookIntegrations: true,
      abTesting: true,
      multipleGameTypes: true,
      fraudProtection: true,
    },
  },
  {
    id: 'starter',
    name: '💼 Starter',
    price: 19,
    currency: 'USD',
    billingCycle: 'monthly',
    trialDays: 14,
    features: [
      'Unlimited game sessions',
      'Advanced analytics & reporting',
      'Custom branding & themes',
      'A/B testing capabilities',
      'Priority support',
      'Webhook integrations',
      'Multiple game types',
      'Advanced fraud protection',
      '1,000 discount codes per month',
    ],
    limits: {
      maxGameSessions: -1, // Unlimited
      maxDiscountCodes: 1000,
      analyticsRetentionDays: -1, // Unlimited
      customBranding: true,
      advancedAnalytics: true,
      prioritySupport: true,
      webhookIntegrations: true,
      abTesting: true,
      multipleGameTypes: true,
      fraudProtection: true,
    },
  },
  {
    id: 'pro',
    name: '🚀 Pro',
    price: 39,
    currency: 'USD',
    billingCycle: 'monthly',
    trialDays: 14,
    features: [
      'Unlimited game sessions',
      'Advanced analytics & reporting',
      'Custom branding & themes',
      'A/B testing capabilities',
      'Priority support',
      'Webhook integrations',
      'Multiple game types',
      'Advanced fraud protection',
      '10,000 discount codes per month',
    ],
    limits: {
      maxGameSessions: -1, // Unlimited
      maxDiscountCodes: 10000,
      analyticsRetentionDays: -1, // Unlimited
      customBranding: true,
      advancedAnalytics: true,
      prioritySupport: true,
      webhookIntegrations: true,
      abTesting: true,
      multipleGameTypes: true,
      fraudProtection: true,
    },
  },
  {
    id: 'enterprise',
    name: '🏢 Enterprise',
    price: 99,
    currency: 'USD',
    billingCycle: 'monthly',
    trialDays: 14,
    features: [
      'Unlimited game sessions',
      'Advanced analytics & reporting',
      'Custom branding & themes',
      'A/B testing capabilities',
      'Priority support',
      'Webhook integrations',
      'Multiple game types',
      'Advanced fraud protection',
      '100,000 discount codes per month',
    ],
    limits: {
      maxGameSessions: -1, // Unlimited
      maxDiscountCodes: 100000,
      analyticsRetentionDays: -1, // Unlimited
      customBranding: true,
      advancedAnalytics: true,
      prioritySupport: true,
      webhookIntegrations: true,
      abTesting: true,
      multipleGameTypes: true,
      fraudProtection: true,
    },
  },
];

export class ShopifyBillingService {
  /**
   * Create a recurring charge for a subscription plan
   */
  static async createRecurringCharge(
    session: Session,
    planId: 'starter' | 'pro' | 'enterprise',
    returnUrl: string
  ): Promise<{ confirmationUrl: string; chargeId: string }> {
    const plan = PRICING_PLANS.find(p => p.id === planId);
    if (!plan) throw new Error('Invalid plan ID');

    const client = new shopify.clients.Rest({ session });
    
    const response = await client.post({
      path: 'recurring_application_charges',
      data: {
        recurring_application_charge: {
          name: `Bargain Hunter - ${plan.name}`,
          price: plan.price,
          return_url: returnUrl,
          trial_days: plan.trialDays || 0,
          test: process.env.NODE_ENV !== 'production', // Test mode in development
        },
      },
    });

    const charge = response.body.recurring_application_charge;
    
    // Create billing record
    await BillingHistoryService.createBillingRecord({
      shopDomain: session.shop,
      shopifyChargeId: charge.id.toString(),
      type: 'subscription',
      amount: plan.price,
      currency: plan.currency,
      status: 'pending',
      description: `${plan.name} plan subscription`,
      billingDate: Timestamp.now(),
      periodStart: Timestamp.now(),
      periodEnd: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days
    });

    return {
      confirmationUrl: charge.confirmation_url,
      chargeId: charge.id.toString(),
    };
  }

  /**
   * Activate a recurring charge after merchant confirmation
   */
  static async activateRecurringCharge(
    session: Session,
    chargeId: string
  ): Promise<void> {
    const client = new shopify.clients.Rest({ session });
    
    // First, get the charge details
    const getResponse = await client.get({
      path: `recurring_application_charges/${chargeId}`,
    });

    const charge = getResponse.body.recurring_application_charge;
    
    if (charge.status !== 'accepted') {
      throw new Error('Charge not accepted by merchant');
    }

    // Activate the charge
    await client.post({
      path: `recurring_application_charges/${chargeId}/activate`,
    });

    // Determine plan based on price
    const plan = PRICING_PLANS.find(p => p.price === parseFloat(charge.price));
    if (!plan) throw new Error('Unknown plan price');

    // Create or update subscription
    const existingSubscription = await SubscriptionService.getSubscription(session.shop);
    
    if (existingSubscription) {
      await SubscriptionService.updateSubscription(session.shop, {
        shopifyChargeId: chargeId,
        plan: plan.id,
        status: 'active',
        price: plan.price,
        currency: plan.currency,
        billingCycle: plan.billingCycle,
        currentPeriodStart: Timestamp.now(),
        currentPeriodEnd: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        planLimits: plan.limits,
      });
    } else {
      await SubscriptionService.createSubscription({
        shopDomain: session.shop,
        shopifyChargeId: chargeId,
        plan: plan.id,
        status: 'active',
        billingCycle: plan.billingCycle,
        price: plan.price,
        currency: plan.currency,
        currentPeriodStart: Timestamp.now(),
        currentPeriodEnd: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        cancelAtPeriodEnd: false,
        planLimits: plan.limits,
      });
    }

    // Update billing record
    await BillingHistoryService.updateBillingRecord(chargeId, {
      status: 'accepted',
    });

    // Create success notification
    await NotificationService.createNotification({
      shopDomain: session.shop,
      type: 'billing_reminder',
      title: 'Subscription Activated',
      message: `Your ${plan.name} plan is now active. Enjoy unlimited access to all features!`,
      priority: 'medium',
      isRead: false,
      actionRequired: false,
    });
  }

  /**
   * Cancel a recurring charge
   */
  static async cancelRecurringCharge(
    session: Session,
    chargeId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<void> {
    if (!cancelAtPeriodEnd) {
      const client = new shopify.clients.Rest({ session });
      
      await client.delete({
        path: `recurring_application_charges/${chargeId}`,
      });
    }

    // Update subscription
    await SubscriptionService.cancelSubscription(session.shop, cancelAtPeriodEnd);

    // Create billing record
    await BillingHistoryService.createBillingRecord({
      shopDomain: session.shop,
      shopifyChargeId: chargeId,
      type: 'cancellation',
      amount: 0,
      currency: 'USD',
      status: 'accepted',
      description: cancelAtPeriodEnd ? 'Subscription cancelled at period end' : 'Subscription cancelled immediately',
      billingDate: Timestamp.now(),
      periodStart: Timestamp.now(),
      periodEnd: Timestamp.now(),
    });
  }

  /**
   * Get current subscription status from Shopify
   */
  static async getSubscriptionStatus(session: Session): Promise<any> {
    const client = new shopify.clients.Rest({ session });
    
    const response = await client.get({
      path: 'recurring_application_charges',
    });

    const charges = response.body.recurring_application_charges;
    const activeCharge = charges.find((charge: any) => charge.status === 'active');
    
    return activeCharge || null;
  }

  /**
   * Check if shop has access to a specific feature
   */
  static async hasFeatureAccess(
    shopDomain: string,
    feature: keyof PricingPlan['limits']
  ): Promise<boolean> {
    const subscription = await SubscriptionService.getSubscription(shopDomain);
    
    if (!subscription) {
      // Default to free plan limits
      const freePlan = PRICING_PLANS.find(p => p.id === 'free')!;
      return freePlan.limits[feature] as boolean;
    }

    return subscription.planLimits[feature] as boolean;
  }

  /**
   * Get plan by ID
   */
  static getPlan(planId: string): PricingPlan | null {
    return PRICING_PLANS.find(p => p.id === planId) || null;
  }

  /**
   * Get all available plans
   */
  static getAllPlans(): PricingPlan[] {
    return PRICING_PLANS;
  }
}
