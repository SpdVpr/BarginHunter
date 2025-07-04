import { NextApiRequest, NextApiResponse } from 'next';
import { SubscriptionService, BillingHistoryService, NotificationService } from '../../../../src/lib/database';
import { Timestamp } from 'firebase-admin/firestore';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook authenticity
    const hmac = req.headers['x-shopify-hmac-sha256'] as string;
    const body = JSON.stringify(req.body);
    const hash = crypto
      .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET!)
      .update(body, 'utf8')
      .digest('base64');

    if (hash !== hmac) {
      console.error('❌ Invalid webhook signature');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const charge = req.body;
    const shopDomain = req.headers['x-shopify-shop-domain'] as string;

    console.log('🔔 Billing webhook received:', {
      shopDomain,
      chargeId: charge.id,
      status: charge.status,
      name: charge.name,
      price: charge.price
    });

    // Update subscription based on charge status
    switch (charge.status) {
      case 'active':
        await handleActiveSubscription(shopDomain, charge);
        break;
      case 'cancelled':
        await handleCancelledSubscription(shopDomain, charge);
        break;
      case 'declined':
        await handleDeclinedSubscription(shopDomain, charge);
        break;
      case 'expired':
        await handleExpiredSubscription(shopDomain, charge);
        break;
      default:
        console.log('ℹ️ Unhandled charge status:', charge.status);
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('❌ Billing webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleActiveSubscription(shopDomain: string, charge: any) {
  try {
    // Determine plan based on price or name
    let plan: 'pro' | 'enterprise' = 'pro';
    if (charge.price >= 99 || charge.name.toLowerCase().includes('enterprise')) {
      plan = 'enterprise';
    }

    // Update subscription
    const subscription = await SubscriptionService.getSubscription(shopDomain);
    if (subscription) {
      await SubscriptionService.updateSubscription(shopDomain, {
        status: 'active',
        shopifyChargeId: charge.id.toString(),
        plan,
        price: parseFloat(charge.price),
        currentPeriodStart: Timestamp.now(),
        currentPeriodEnd: Timestamp.fromDate(new Date(charge.billing_on)),
      });
    }

    // Create billing record
    await BillingHistoryService.createBillingRecord({
      shopDomain,
      shopifyChargeId: charge.id.toString(),
      type: 'subscription',
      amount: parseFloat(charge.price),
      currency: 'USD',
      status: 'accepted',
      description: `${charge.name} - Payment processed`,
      billingDate: Timestamp.now(),
      periodStart: Timestamp.now(),
      periodEnd: Timestamp.fromDate(new Date(charge.billing_on)),
    });

    // Create success notification
    await NotificationService.createNotification({
      shopDomain,
      type: 'billing_reminder',
      title: 'Payment Processed',
      message: `Your ${plan} subscription payment has been processed successfully.`,
      priority: 'low',
      isRead: false,
      actionRequired: false,
    });

    console.log('✅ Active subscription processed');
  } catch (error) {
    console.error('❌ Failed to handle active subscription:', error);
  }
}

async function handleCancelledSubscription(shopDomain: string, charge: any) {
  try {
    // Update subscription status
    await SubscriptionService.updateSubscription(shopDomain, {
      status: 'cancelled',
      cancelAtPeriodEnd: false,
    });

    // Create billing record
    await BillingHistoryService.createBillingRecord({
      shopDomain,
      shopifyChargeId: charge.id.toString(),
      type: 'cancellation',
      amount: 0,
      currency: 'USD',
      status: 'accepted',
      description: `${charge.name} - Subscription cancelled`,
      billingDate: Timestamp.now(),
      periodStart: Timestamp.now(),
      periodEnd: Timestamp.now(),
    });

    // Create notification
    await NotificationService.createNotification({
      shopDomain,
      type: 'billing_reminder',
      title: 'Subscription Cancelled',
      message: 'Your subscription has been cancelled. You can reactivate it anytime from the billing page.',
      priority: 'medium',
      isRead: false,
      actionRequired: false,
      actionUrl: '/dashboard/billing',
      actionText: 'View Billing',
    });

    console.log('✅ Cancelled subscription processed');
  } catch (error) {
    console.error('❌ Failed to handle cancelled subscription:', error);
  }
}

async function handleDeclinedSubscription(shopDomain: string, charge: any) {
  try {
    // Update subscription status
    await SubscriptionService.updateSubscription(shopDomain, {
      status: 'past_due',
    });

    // Create billing record
    await BillingHistoryService.createBillingRecord({
      shopDomain,
      shopifyChargeId: charge.id.toString(),
      type: 'subscription',
      amount: parseFloat(charge.price),
      currency: 'USD',
      status: 'declined',
      description: `${charge.name} - Payment declined`,
      billingDate: Timestamp.now(),
      periodStart: Timestamp.now(),
      periodEnd: Timestamp.fromDate(new Date(charge.billing_on)),
    });

    // Create urgent notification
    await NotificationService.createNotification({
      shopDomain,
      type: 'payment_failed',
      title: 'Payment Failed',
      message: 'Your subscription payment was declined. Please update your payment method to continue using the service.',
      priority: 'urgent',
      isRead: false,
      actionRequired: true,
      actionUrl: '/dashboard/billing',
      actionText: 'Update Payment',
    });

    console.log('✅ Declined subscription processed');
  } catch (error) {
    console.error('❌ Failed to handle declined subscription:', error);
  }
}

async function handleExpiredSubscription(shopDomain: string, charge: any) {
  try {
    // Update subscription status
    await SubscriptionService.updateSubscription(shopDomain, {
      status: 'cancelled',
    });

    // Create billing record
    await BillingHistoryService.createBillingRecord({
      shopDomain,
      shopifyChargeId: charge.id.toString(),
      type: 'subscription',
      amount: parseFloat(charge.price),
      currency: 'USD',
      status: 'cancelled',
      description: `${charge.name} - Subscription expired`,
      billingDate: Timestamp.now(),
      periodStart: Timestamp.now(),
      periodEnd: Timestamp.now(),
    });

    // Create notification
    await NotificationService.createNotification({
      shopDomain,
      type: 'billing_reminder',
      title: 'Subscription Expired',
      message: 'Your subscription has expired. Reactivate to continue using premium features.',
      priority: 'high',
      isRead: false,
      actionRequired: true,
      actionUrl: '/dashboard/billing',
      actionText: 'Reactivate',
    });

    console.log('✅ Expired subscription processed');
  } catch (error) {
    console.error('❌ Failed to handle expired subscription:', error);
  }
}
