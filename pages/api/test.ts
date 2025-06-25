import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const envCheck = {
      SHOPIFY_API_KEY: !!process.env.SHOPIFY_API_KEY,
      SHOPIFY_API_SECRET: !!process.env.SHOPIFY_API_SECRET,
      SHOPIFY_SCOPES: !!process.env.SHOPIFY_SCOPES,
      HOST: process.env.HOST,
      NODE_ENV: process.env.NODE_ENV,
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
    };

    return res.status(200).json({
      success: true,
      message: 'API is working',
      environment: envCheck,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Test API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
