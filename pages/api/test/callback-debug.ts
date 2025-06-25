import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔍 Callback debug endpoint called');
    
    const debugInfo = {
      method: req.method,
      url: req.url,
      query: req.query,
      headers: {
        'user-agent': req.headers['user-agent'],
        'referer': req.headers.referer,
        'host': req.headers.host,
      },
      timestamp: new Date().toISOString(),
    };

    console.log('Debug info:', debugInfo);

    return res.status(200).json({
      success: true,
      message: 'Callback debug endpoint',
      debug: debugInfo,
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Debug endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
