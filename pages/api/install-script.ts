import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop, accessToken } = req.body;

    if (!shop || !accessToken) {
      return res.status(400).json({ 
        error: 'Shop and access token are required' 
      });
    }

    // Create script tag via Shopify API
    const scriptTagData = {
      script_tag: {
        event: 'onload',
        src: `https://bargin-hunter2.vercel.app/api/widget/embed.js?shop=${shop}`,
        display_scope: 'online_store'
      }
    };

    const response = await fetch(`https://${shop}/admin/api/2023-10/script_tags.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify(scriptTagData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Shopify API error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();

    return res.json({
      success: true,
      message: 'Widget script installed successfully',
      scriptTag: result.script_tag,
    });

  } catch (error) {
    console.error('Script installation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to install widget script',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
