import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variables
    const apiKey = process.env.SHOPIFY_API_KEY;
    const apiSecret = process.env.SHOPIFY_API_SECRET;
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
    const scopes = process.env.SHOPIFY_SCOPES;
    const host = process.env.HOST;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    return res.json({
      success: true,
      credentials: {
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey?.length || 0,
        apiKeyPrefix: apiKey?.substring(0, 8) + '...',
        hasApiSecret: !!apiSecret,
        apiSecretLength: apiSecret?.length || 0,
        hasWebhookSecret: !!webhookSecret,
        scopes: scopes?.split(',') || [],
        host,
        appUrl,
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🔍 Credentials check error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
