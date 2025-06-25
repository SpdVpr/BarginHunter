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
      return res.status(400).json({ 
        success: false, 
        error: 'Shop parameter is required' 
      });
    }

    // Validate shop domain format
    const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;
    const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
    
    if (!shopRegex.test(shopDomain)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid shop domain format' 
      });
    }

    // Generate state parameter for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state in session or database for verification
    // For now, we'll use a simple approach - in production, use proper session management
    
    const authUrl = generateAuthUrl(shopDomain, state);

    return res.json({
      success: true,
      authUrl,
      state,
      shop: shopDomain,
    });

  } catch (error) {
    console.error('Install error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}
