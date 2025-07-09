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

      // Create store record in database
      const storeId = await StoreService.createStore({
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
          minScoreForDiscount: 150,
          maxPlaysPerCustomer: 3,
          maxPlaysPerDay: 10,
          discountTiers: [
            { minScore: 0, discount: 0, message: "Keep hunting! 🔍" },
            { minScore: 150, discount: 5, message: "Nice start! 🎯" },
            { minScore: 300, discount: 10, message: "Getting warmer! 🔥" },
            { minScore: 500, discount: 15, message: "Bargain expert! 💡" },
            { minScore: 750, discount: 20, message: "Sale master! 👑" },
            { minScore: 1000, discount: 25, message: "LEGENDARY HUNTER! 🏆" }
          ],
          gameSpeed: 1,
          difficulty: 'medium' as 'easy' | 'medium' | 'hard',
        },
        widgetSettings: {
          displayMode: 'tab' as 'popup' | 'tab' | 'inline',
          triggerEvent: 'immediate' as 'immediate' | 'scroll' | 'exit_intent' | 'time_delay',
          position: 'bottom-right' as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center',
          showOn: 'all_pages' as 'all_pages' | 'product_pages' | 'cart_page' | 'checkout_page' | 'collection_pages' | 'custom',
          customPages: [],
          userPercentage: 100,
          testMode: false,
          showDelay: 0,
          pageLoadTrigger: 'immediate' as 'immediate' | 'after_delay' | 'on_scroll' | 'on_exit_intent',
          deviceTargeting: 'all' as 'all' | 'desktop' | 'mobile' | 'tablet',
          geoTargeting: [],
          timeBasedRules: {
            enabled: false,
            startTime: undefined,
            endTime: undefined,
            timezone: undefined,
            daysOfWeek: undefined,
          },
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
    } catch (configError) {
      console.error('Failed to create default game config:', configError);
    }

    // Script tag is already installed above, no need to install again

    // For embedded apps, redirect to /app endpoint with shop parameter
    // This is required for Shopify embedded app architecture
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/app?shop=${shop}&installed=true`;

    console.log('🔄 Auth Callback: Redirecting to app endpoint:', redirectUrl);
    return res.redirect(302, redirectUrl);

  } catch (error) {
    console.error('Callback error:', error);
    
    // Redirect to error page
    const errorUrl = `${process.env.NEXT_PUBLIC_APP_URL}/error?message=installation_failed`;
    return res.redirect(302, errorUrl);
  }
}
