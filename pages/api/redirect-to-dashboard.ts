import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { shop, hmac, host, timestamp, installed } = req.query;

    console.log('🔄 Server-side redirect to dashboard:', { shop, hmac, host, timestamp, installed });

    if (!shop) {
      return res.status(400).json({ error: 'Shop parameter is required' });
    }

    // Build dashboard URL with all parameters
    const params = new URLSearchParams();
    if (shop) params.set('shop', shop as string);
    if (hmac) params.set('hmac', hmac as string);
    if (host) params.set('host', host as string);
    if (timestamp) params.set('timestamp', timestamp as string);
    if (installed) params.set('installed', installed as string);

    const dashboardUrl = `/dashboard?${params.toString()}`;

    console.log('🔄 Redirecting to:', dashboardUrl);

    // Use 302 redirect to dashboard
    return res.redirect(302, dashboardUrl);

  } catch (error) {
    console.error('🔄 Redirect error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
