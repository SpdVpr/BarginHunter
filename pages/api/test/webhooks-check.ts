import { NextApiRequest, NextApiResponse } from 'next';
import { StoreService } from '../../../src/lib/database';
import { ShopifySessionManager } from '../../../src/lib/shopify';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop } = req.query;

    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ error: 'Shop domain is required' });
    }

    console.log('🔍 Checking webhooks for shop:', shop);

    // Get store data
    const store = await StoreService.getStore(shop);
    if (!store || !store.accessToken) {
      return res.status(404).json({ 
        error: 'Store not found or no access token' 
      });
    }

    // Create Shopify session
    const session = ShopifySessionManager.createSession(shop, store.accessToken);

    // Get webhooks from Shopify
    const { shopify } = await import('../../../src/lib/shopify');
    const client = new shopify.clients.Rest({ session });
    
    const response = await client.get({
      path: 'webhooks',
    });

    const webhooks = response.body.webhooks || [];
    
    // Check which webhooks we need
    const requiredWebhooks = [
      'orders/create',
      'app/uninstalled',
      'customers/create'
    ];

    const installedTopics = webhooks.map((w: any) => w.topic);
    const missingWebhooks = requiredWebhooks.filter(topic => !installedTopics.includes(topic));

    return res.json({
      success: true,
      shop,
      webhooks: webhooks.map((w: any) => ({
        id: w.id,
        topic: w.topic,
        address: w.address,
        format: w.format,
        created_at: w.created_at,
        updated_at: w.updated_at
      })),
      summary: {
        total: webhooks.length,
        required: requiredWebhooks.length,
        missing: missingWebhooks.length,
        missingTopics: missingWebhooks
      },
      store: {
        hasAccessToken: !!store.accessToken,
        webhookIds: store.webhookIds || []
      }
    });

  } catch (error) {
    console.error('🔍 Webhook check error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    });
  }
}
