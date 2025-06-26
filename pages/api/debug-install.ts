import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { shop } = req.query;

    const debugInfo = {
      timestamp: new Date().toISOString(),
      shop: shop,
      method: req.method,
      headers: req.headers,
      query: req.query,
      environment: {
        SHOPIFY_CLIENT_ID: process.env.SHOPIFY_CLIENT_ID ? 'SET' : 'NOT SET',
        SHOPIFY_CLIENT_SECRET: process.env.SHOPIFY_CLIENT_SECRET ? 'SET' : 'NOT SET',
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NODE_ENV: process.env.NODE_ENV,
      },
      urls: {
        installUrl: `https://bargin-hunter2.vercel.app/api/auth/install?shop=${shop}`,
        directOAuthUrl: `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_CLIENT_ID}&scope=read_products,write_script_tags,read_script_tags&redirect_uri=https://bargin-hunter2.vercel.app/api/auth/callback&state=install`,
        appUrl: `https://bargin-hunter2.vercel.app/app?shop=${shop}`,
      }
    };

    return res.json(debugInfo);

  } catch (error) {
    return res.status(500).json({
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
