import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variables
    const status = {
      firebase: {
        configured: !!(
          process.env.FIREBASE_PROJECT_ID &&
          process.env.FIREBASE_CLIENT_EMAIL &&
          process.env.FIREBASE_PRIVATE_KEY &&
          process.env.NEXT_PUBLIC_FIREBASE_API_KEY
        ),
        projectId: process.env.FIREBASE_PROJECT_ID,
        hasServiceAccount: !!(process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY),
        hasWebConfig: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      },
      shopify: {
        configured: !!(
          process.env.SHOPIFY_API_KEY &&
          process.env.SHOPIFY_API_SECRET &&
          process.env.SHOPIFY_WEBHOOK_SECRET
        ),
        hasApiKey: !!process.env.SHOPIFY_API_KEY,
        hasApiSecret: !!process.env.SHOPIFY_API_SECRET,
        hasWebhookSecret: !!process.env.SHOPIFY_WEBHOOK_SECRET,
        apiKeyPreview: process.env.SHOPIFY_API_KEY ? 
          process.env.SHOPIFY_API_KEY.substring(0, 8) + '...' : 
          'Not set',
      },
      application: {
        nodeEnv: process.env.NODE_ENV,
        appUrl: process.env.NEXT_PUBLIC_APP_URL,
        host: process.env.HOST,
      },
      readyForTesting: !!(
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY &&
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY
      ),
      readyForShopify: !!(
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY &&
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
        process.env.SHOPIFY_API_KEY &&
        process.env.SHOPIFY_API_SECRET &&
        process.env.SHOPIFY_WEBHOOK_SECRET
      ),
    };

    return res.json({
      success: true,
      message: 'Configuration status check',
      status,
      nextSteps: status.readyForShopify ? 
        ['🎉 All configured! Ready for Shopify testing'] :
        status.readyForTesting ?
        ['🔥 Firebase ready!', '🛍️ Need Shopify API keys', '📖 See SHOPIFY_QUICK_SETUP.md'] :
        ['🔥 Configure Firebase first', '📖 See FIREBASE_SETUP.md'],
    });

  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
