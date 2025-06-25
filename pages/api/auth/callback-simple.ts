import { NextApiRequest, NextApiResponse } from 'next';
import { exchangeCodeForToken } from '../../../src/lib/shopify';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Simple callback received:');
    console.log('- Full URL:', req.url);
    console.log('- Query params:', req.query);
    console.log('- Method:', req.method);

    const { shop, code, state, hmac, host, timestamp } = req.query;

    console.log('🔍 Parameter analysis:');
    console.log('- shop:', shop, typeof shop);
    console.log('- code:', code, typeof code);
    console.log('- state:', state, typeof state);
    console.log('- hmac:', hmac, typeof hmac);
    console.log('- host:', host, typeof host);
    console.log('- timestamp:', timestamp, typeof timestamp);

    if (!shop || !code || typeof shop !== 'string' || typeof code !== 'string') {
      console.error('❌ Missing parameters validation failed');
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        debug: {
          shop: { value: shop, type: typeof shop, present: !!shop },
          code: { value: code, type: typeof code, present: !!code },
          state: { value: state, type: typeof state, present: !!state },
          allParams: req.query
        }
      });
    }

    // Check environment variables
    if (!process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_API_SECRET) {
      console.error('❌ Missing Shopify API credentials');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

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
      console.error('❌ No access token received');
      return res.status(400).json({ 
        success: false, 
        error: 'No access token received' 
      });
    }

    console.log('✅ Access token obtained for shop:', shop);
    console.log('✅ Installation completed successfully (simplified)');

    // Redirect to dashboard with success message
    const dashboardUrl = `https://bargin-hunter2.vercel.app/dashboard?shop=${shop}&installed=true`;
    console.log('🔄 Redirecting to:', dashboardUrl);
    
    return res.redirect(302, dashboardUrl);

  } catch (error) {
    console.error('❌ Callback error:', error);
    
    // Return JSON error instead of redirect for debugging
    return res.status(500).json({
      success: false,
      error: 'Installation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
