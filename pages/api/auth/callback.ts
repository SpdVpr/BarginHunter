import { NextApiRequest, NextApiResponse } from 'next';
import { exchangeCodeForToken, getShopData, installScriptTag, installWebhooks } from '../../../src/lib/shopify';
import { StoreService, GameConfigService } from '../../../src/lib/database';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Callback received:', req.query);

    const { shop, code, state } = req.query;

    if (!shop || !code || typeof shop !== 'string' || typeof code !== 'string') {
      console.error('Missing parameters:', { shop, code, state });
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }

    // Check environment variables
    if (!process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_API_SECRET) {
      console.error('Missing Shopify API credentials');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    // In production, verify the state parameter against stored value
    // if (!verifyState(state)) {
    //   return res.status(400).json({ success: false, error: 'Invalid state parameter' });
    // }

    console.log('🔄 Starting token exchange...');

    // Exchange authorization code for access token
    let session;
    try {
      session = await exchangeCodeForToken(shop, code, state as string);
      console.log('✅ Token exchange successful');
    } catch (tokenError) {
      console.error('❌ Token exchange failed:', tokenError);
      return res.status(400).json({
        success: false,
        error: 'Failed to obtain access token',
        details: tokenError instanceof Error ? tokenError.message : 'Unknown error'
      });
    }

    if (!session || !session.accessToken) {
      return res.status(400).json({
        success: false,
        error: 'No access token received'
      });
    }

    console.log('✅ Access token obtained for shop:', shop);

    // Get shop data and create store record
    console.log('🔧 Auth Callback: Getting shop data...');

    try {
      const shopData = await getShopData(session);
      console.log('🔧 Auth Callback: Shop data retrieved:', {
        name: shopData.name,
        domain: shopData.domain
      });

      // Create or update store record in database
      const storeId = await StoreService.createOrUpdateStore({
        shopDomain: shop,
        accessToken: session.accessToken,
        scopes: session.scope?.split(',') || [],
        isActive: true,
        shopData: {
          name: shopData.name,
          email: shopData.email,
          domain: shopData.domain,
          currency: shopData.currency,
          timezone: shopData.timezone,
          planName: shopData.plan_name,
        },
      });

      console.log('🔧 Auth Callback: Store created with ID:', storeId);
    } catch (storeError) {
      console.error('🔧 Auth Callback: Failed to create store:', storeError);
      // Continue with installation even if store creation fails
    }

    try {
      // Install script tag for widget
      console.log('🔧 Auth Callback: Installing script tag for shop:', shop);
      const scriptTag = await installScriptTag(session, shop);
      console.log('🔧 Auth Callback: Script tag installed successfully:', {
        id: scriptTag.id,
        src: scriptTag.src,
        event: scriptTag.event
      });

      // Update store with script tag ID
      await StoreService.updateStore(shop, { scriptTagId: scriptTag.id });
      console.log('🔧 Auth Callback: Store updated with script tag ID:', scriptTag.id);
    } catch (scriptError) {
      console.error('🔧 Auth Callback: Failed to install script tag:', scriptError);
      console.error('🔧 Auth Callback: Script error details:', {
        message: scriptError instanceof Error ? scriptError.message : 'Unknown error',
        stack: scriptError instanceof Error ? scriptError.stack : 'No stack trace'
      });
      // Don't fail the installation if script tag fails
    }

    // Install webhooks for order tracking
    try {
      console.log('🔧 Auth Callback: Installing webhooks for shop:', shop);
      const webhooks = await installWebhooks(session);
      console.log('🔧 Auth Callback: Webhooks installed successfully:', webhooks.length);

      // Store webhook IDs for later cleanup
      const webhookIds = webhooks.map(w => w.id);
      await StoreService.updateStore(shop, { webhookIds });
      console.log('🔧 Auth Callback: Store updated with webhook IDs:', webhookIds);
    } catch (webhookError) {
      console.error('🔧 Auth Callback: Failed to install webhooks:', webhookError);
      console.error('🔧 Auth Callback: Webhook error details:', {
        message: webhookError instanceof Error ? webhookError.message : 'Unknown error',
        stack: webhookError instanceof Error ? webhookError.stack : 'No stack trace'
      });
      // Don't fail the installation if webhooks fail
    }

    // Create default game configuration
    try {
      await GameConfigService.createOrUpdateConfig({
        shopDomain: shop,
        isEnabled: true,
        gameSettings: {
          discountTiers: [
            { minScore: 0, maxScore: 49, discountPercentage: 5 },
            { minScore: 50, maxScore: 99, discountPercentage: 10 },
            { minScore: 100, maxScore: 199, discountPercentage: 15 },
            { minScore: 200, maxScore: 999, discountPercentage: 20 },
          ],
          maxPlaysPerDay: 3,
          gameTimeLimit: 60,
          selectedGames: ['runner', 'flappy', 'tetris', 'snake', 'space-invaders', 'arkanoid', 'fruit-ninja'],
        },
        widgetSettings: {
          displayType: 'popup',
          triggerType: 'button',
          position: 'bottom-right',
          buttonText: 'Play & Win!',
          customPages: [],
        },
        appearance: {
          primaryColor: '#ff6b6b',
          secondaryColor: '#4ecdc4',
          backgroundTheme: 'default' as 'default' | 'dark' | 'light' | 'custom',
        },
        businessRules: {
          excludeDiscountedProducts: false,
          allowStackingDiscounts: false,
          discountExpiryHours: 24,
        },
      });

      console.log('🔧 Auth Callback: Game config created successfully');
    } catch (configError) {
      console.error('🔧 Auth Callback: Failed to create default game config:', configError);
      // Don't fail the installation if game config creation fails
    }

    // Script tag is already installed above, no need to install again

    // For embedded apps, redirect to installation complete page first
    // This provides better user experience and instructions
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/installation-complete?shop=${shop}`;

    console.log('🔄 Auth Callback: Redirecting to installation complete page:', redirectUrl);
    return res.redirect(302, redirectUrl);

  } catch (error) {
    console.error('Callback error:', error);
    
    // Redirect to error page
    const errorUrl = `${process.env.NEXT_PUBLIC_APP_URL}/error?message=installation_failed`;
    return res.redirect(302, errorUrl);
  }
}
