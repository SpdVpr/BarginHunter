import { NextApiRequest, NextApiResponse } from 'next';
import { ShopifySessionManager } from '../../../src/lib/shopify';
import { ShopifyBillingService } from '../../../src/lib/shopify-billing';
import { StoreService } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop, planId } = req.body;

    if (!shop || !planId) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        required: ['shop', 'planId']
      });
    }

    if (!['starter', 'pro', 'enterprise'].includes(planId)) {
      return res.status(400).json({
        error: 'Invalid plan ID',
        validPlans: ['starter', 'pro', 'enterprise']
      });
    }

    console.log('🔄 Creating subscription for shop:', shop, 'plan:', planId);

    // Get store and create session
    const store = await StoreService.getStore(shop);
    if (!store || !store.accessToken) {
      return res.status(404).json({ error: 'Store not found or not authenticated' });
    }

    const session = ShopifySessionManager.createSession(shop, store.accessToken);
    
    // Create return URL for after payment confirmation
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/billing/activate?shop=${shop}&charge_id={charge_id}`;

    // Create recurring charge
    const { confirmationUrl, chargeId } = await ShopifyBillingService.createRecurringCharge(
      session,
      planId,
      returnUrl
    );

    console.log('✅ Recurring charge created:', { chargeId, confirmationUrl });

    res.status(200).json({
      success: true,
      confirmationUrl,
      chargeId,
      message: 'Redirect user to confirmation URL to complete subscription'
    });

  } catch (error) {
    console.error('❌ Subscription creation failed:', error);
    res.status(500).json({
      error: 'Failed to create subscription',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
