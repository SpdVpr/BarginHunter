import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { shop } = req.query;

    console.log('Test callback called with:', {
      method: req.method,
      query: req.query,
      headers: req.headers,
    });

    // Simulate successful installation
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/app?shop=${shop}&installed=true`;
    
    console.log('Test callback redirecting to:', redirectUrl);
    
    return res.redirect(302, redirectUrl);

  } catch (error) {
    console.error('Test callback error:', error);
    return res.status(500).json({
      error: 'Test callback failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
