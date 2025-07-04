import { NextApiRequest, NextApiResponse } from 'next';
import { ShopifySessionManager } from '../../../src/lib/shopify';
import { ShopifyBillingService } from '../../../src/lib/shopify-billing';
import { StoreService } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop, charge_id } = req.query;

    if (!shop || !charge_id) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        required: ['shop', 'charge_id']
      });
    }

    console.log('🔄 Activating subscription for shop:', shop, 'charge_id:', charge_id);

    // Get store and create session
    const store = await StoreService.getStore(shop as string);
    if (!store || !store.accessToken) {
      return res.status(404).json({ error: 'Store not found or not authenticated' });
    }

    const session = ShopifySessionManager.createSession(shop as string, store.accessToken);
    
    // Activate the recurring charge
    await ShopifyBillingService.activateRecurringCharge(session, charge_id as string);

    console.log('✅ Subscription activated successfully');

    // Redirect to dashboard with success message
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?shop=${shop}&subscription=activated`;
    
    res.redirect(302, dashboardUrl);

  } catch (error) {
    console.error('❌ Subscription activation failed:', error);
    
    // Redirect to dashboard with error message
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?shop=${shop}&subscription=error&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`;
    
    res.redirect(302, dashboardUrl);
  }
}
