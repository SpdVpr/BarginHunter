import { NextApiRequest, NextApiResponse } from 'next';
import { StoreService } from '../../../src/lib/database';
import { installWebhooks, ShopifySessionManager } from '../../../src/lib/shopify';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop } = req.body;

    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ error: 'Shop domain is required' });
    }

    console.log('🔧 Installing webhooks for shop:', shop);

    // Get store data
    const store = await StoreService.getStore(shop);
    if (!store || !store.accessToken) {
      return res.status(404).json({ 
        error: 'Store not found or no access token' 
      });
    }

    // Create Shopify session
    const session = ShopifySessionManager.createSession(shop, store.accessToken);

    // Install webhooks
    const webhooks = await installWebhooks(session);
    console.log('✅ Webhooks installed:', webhooks.length);

    // Update store with webhook IDs
    const webhookIds = webhooks.map(w => w.id);
    await StoreService.updateStore(shop, { webhookIds });

    return res.json({
      success: true,
      message: 'Webhooks installed successfully',
      webhooks: webhooks.map(w => ({
        id: w.id,
        topic: w.topic,
        address: w.address
      })),
      webhookIds
    });

  } catch (error) {
    console.error('🔧 Webhook installation error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    });
  }
}
