import { NextApiRequest, NextApiResponse } from 'next';
import { verifyWebhook, uninstallScriptTag } from '../../../../src/lib/shopify';
import { StoreService } from '../../../../src/lib/database';
import { ShopifySessionManager } from '../../../../src/lib/shopify';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Implement per-shop webhook verification
    // For now, skip verification to allow multi-tenant functionality
    console.log('🗑️ Processing app uninstall webhook for shop:', req.headers['x-shopify-shop-domain']);

    const shopDomain = req.headers['x-shopify-shop-domain'] as string;
    
    console.log('App uninstalled webhook received for shop:', shopDomain);

    // Get store information
    const store = await StoreService.getStore(shopDomain);
    
    if (store) {
      // Remove script tag if it exists
      if (store.scriptTagId && store.accessToken) {
        try {
          const session = ShopifySessionManager.createSession(shopDomain, store.accessToken);
          await uninstallScriptTag(session, store.scriptTagId);
          console.log('Script tag removed for shop:', shopDomain);
        } catch (error) {
          console.error('Failed to remove script tag:', error);
        }
      }

      // Deactivate store
      await StoreService.deactivateStore(shopDomain);
      console.log('Store deactivated:', shopDomain);
    }

    // TODO: Clean up any scheduled tasks, webhooks, etc.
    // TODO: Send notification to admin about uninstallation
    // TODO: Update analytics/metrics

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('App uninstall webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
