import { NextApiRequest, NextApiResponse } from 'next';
import { exchangeCodeForToken, getShopData, installScriptTag } from '../../../src/lib/shopify';
import { StoreService, GameConfigService } from '../../../src/lib/database';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop, code, state } = req.query;

    if (!shop || !code || typeof shop !== 'string' || typeof code !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters' 
      });
    }

    // In production, verify the state parameter against stored value
    // if (!verifyState(state)) {
    //   return res.status(400).json({ success: false, error: 'Invalid state parameter' });
    // }

    // Exchange authorization code for access token
    const session = await exchangeCodeForToken(shop, code, state as string);
    
    if (!session || !session.accessToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to obtain access token' 
      });
    }

    // Get shop data
    const shopData = await getShopData(session);

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

    try {
      // Install script tag for widget
      const scriptTag = await installScriptTag(session, shop);
      console.log('Script tag installed:', scriptTag.id);

      // Update store with script tag ID
      await StoreService.updateStore(shop, { scriptTagId: scriptTag.id });
    } catch (scriptError) {
      console.error('Failed to install script tag:', scriptError);
      // Don't fail the installation if script tag fails
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
          showOn: 'all_pages' as 'all_pages' | 'product_pages' | 'cart_page' | 'checkout_page',
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

    // Redirect to success page or app dashboard
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/?shop=${shop}&installed=true`;
    
    return res.redirect(302, redirectUrl);

  } catch (error) {
    console.error('Callback error:', error);
    
    // Redirect to error page
    const errorUrl = `${process.env.NEXT_PUBLIC_APP_URL}/error?message=installation_failed`;
    return res.redirect(302, errorUrl);
  }
}
