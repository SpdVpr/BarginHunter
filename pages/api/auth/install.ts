import { NextApiRequest, NextApiResponse } from 'next';
import { generateAuthUrl } from '../../../src/lib/shopify';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop } = req.query;

    if (!shop || typeof shop !== 'string') {
      console.log('❌ Install API: Shop parameter missing or invalid:', shop);
      // Redirect back to app page with error
      return res.redirect(302, `/app?error=shop_required`);
    }

    // Validate and normalize shop domain format
    let shopDomain = typeof shop === 'string' ? shop.trim() : '';

    // Remove trailing slash if present
    shopDomain = shopDomain.replace(/\/$/, '');

    // Add .myshopify.com if not present
    if (!shopDomain.includes('.myshopify.com')) {
      shopDomain = `${shopDomain}.myshopify.com`;
    }

    // More flexible regex that allows numbers at the beginning
    const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;

    if (!shopRegex.test(shopDomain)) {
      console.log('❌ Install API: Shop domain validation failed:', shopDomain);
      // Redirect back to app page with error
      return res.redirect(302, `/app?error=invalid_shop&shop=${encodeURIComponent(shop as string)}`);
    }

    // Generate state parameter for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state in session or database for verification
    // For now, we'll use a simple approach - in production, use proper session management
    
    const authUrl = generateAuthUrl(shopDomain, state);

    console.log('🔄 Redirecting to Shopify OAuth:', authUrl);

    // Redirect directly to Shopify OAuth instead of returning JSON
    return res.redirect(302, authUrl);

  } catch (error) {
    console.error('❌ Install API error:', error);
    // Redirect back to app page with error
    return res.redirect(302, `/app?error=install_failed`);
  }
}
