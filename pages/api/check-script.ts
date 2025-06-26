import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop } = req.query;

    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ 
        error: 'Shop parameter is required' 
      });
    }

    // For now, we'll assume the script is installed since we install it automatically
    // In a real implementation, you'd check the Shopify API for existing script tags
    const expectedScriptSrc = `${process.env.NEXT_PUBLIC_APP_URL}/api/widget/embed?shop=${shop}`;

    return res.json({
      success: true,
      isInstalled: true, // Assume installed since we install automatically
      scriptSrc: expectedScriptSrc,
      message: 'Widget script should be automatically installed. If not working, check Widget Settings.',
      troubleshooting: {
        checkTestMode: 'Ensure Test Mode is enabled in Widget Settings',
        checkPercentage: 'Set User Percentage to 100% for testing',
        checkTrigger: 'Verify Page Load Trigger is set to "Immediate"',
        checkDevice: 'Make sure Device Targeting includes your device type',
      }
    });

  } catch (error) {
    console.error('Script check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check widget script status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
