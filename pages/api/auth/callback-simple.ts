import { NextApiRequest, NextApiResponse } from 'next';
import { exchangeCodeForToken } from '../../../src/lib/shopify';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Simple callback received:', req.query);

    const { shop, code, state } = req.query;

    if (!shop || !code || typeof shop !== 'string' || typeof code !== 'string') {
      console.error('❌ Missing parameters:', { shop, code, state });
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
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
