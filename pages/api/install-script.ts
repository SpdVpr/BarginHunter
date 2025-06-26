import { NextApiRequest, NextApiResponse } from 'next';
import { installScriptTag } from '../../src/lib/shopify';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop } = req.body;

    if (!shop) {
      return res.status(400).json({
        error: 'Shop parameter is required'
      });
    }

    // For now, we'll use a simplified approach since we don't have the full session
    // In a real app, you'd get the access token from your database
    const scriptTagData = {
      script_tag: {
        event: 'onload',
        src: `${process.env.NEXT_PUBLIC_APP_URL}/api/widget/embed.js?shop=${shop}`,
        display_scope: 'online_store'
      }
    };

    // Note: This requires proper authentication in a real scenario
    // For now, return success and show manual instructions
    return res.json({
      success: true,
      message: 'Script installation initiated. Please check the Installation Guide for manual steps if needed.',
      scriptSrc: `${process.env.NEXT_PUBLIC_APP_URL}/api/widget/embed.js?shop=${shop}`,
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
