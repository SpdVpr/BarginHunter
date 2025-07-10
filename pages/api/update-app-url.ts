import { NextApiRequest, NextApiResponse } from 'next';
import { StoreService } from '../../src/lib/database';
import { shopify } from '../../src/lib/shopify';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop } = req.body;
    
    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'Shop domain is required' 
      });
    }

    console.log('🔄 Updating App URL for shop:', shop);

    // Get store from database
    const store = await StoreService.getStore(shop);
    
    if (!store || !store.accessToken) {
      return res.status(404).json({
        success: false,
        error: 'Store not found or no access token'
      });
    }

    // Create Shopify session
    const session = {
      id: `offline_${shop}`,
      shop,
      state: 'offline',
      isOnline: false,
      accessToken: store.accessToken,
    };

    try {
      // Update app URL using Shopify Admin API
      const client = new shopify.clients.Rest({ session });
      
      // Get current app info
      const appResponse = await client.get({
        path: 'oauth/access_scopes'
      });
      
      console.log('🔄 Current app scopes:', appResponse.body);

      // Note: Shopify doesn't allow updating App URL via API
      // The App URL must be changed manually in the Partner Dashboard
      // But we can provide instructions to the merchant
      
      return res.status(200).json({
        success: true,
        message: 'App installation verified',
        instructions: {
          title: 'Manual App URL Update Required',
          description: 'To complete the installation, please update the App URL in your Shopify Partner Dashboard:',
          steps: [
            '1. Go to your Shopify Partner Dashboard',
            '2. Navigate to Apps > Bargain Hunter',
            '3. Go to App setup > URLs',
            '4. Change App URL from /app to /dashboard',
            `5. Set App URL to: https://bargin-hunter2.vercel.app/dashboard`
          ],
          currentUrl: 'https://bargin-hunter2.vercel.app/app',
          newUrl: 'https://bargin-hunter2.vercel.app/dashboard'
        },
        store: {
          shopDomain: store.shopDomain,
          isActive: store.isActive,
          installedAt: store.installedAt
        }
      });

    } catch (shopifyError) {
      console.error('🔄 Shopify API error:', shopifyError);
      
      return res.status(500).json({
        success: false,
        error: 'Failed to communicate with Shopify API',
        details: shopifyError instanceof Error ? shopifyError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('🔄 Update App URL error:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
