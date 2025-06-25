import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Simple Firebase test without actual initialization
    const envCheck = {
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
      FIREBASE_SERVICE_ACCOUNT_JSON: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    };

    // Check if we have the minimum required env vars
    const hasBasicConfig = envCheck.FIREBASE_PROJECT_ID && envCheck.FIREBASE_CLIENT_EMAIL;
    const hasPrivateKey = envCheck.FIREBASE_PRIVATE_KEY || envCheck.FIREBASE_SERVICE_ACCOUNT_JSON;

    let status = 'Configuration incomplete';
    if (hasBasicConfig && hasPrivateKey) {
      status = 'Configuration looks good';
    }

    return res.json({
      success: true,
      message: 'Firebase configuration check',
      environment: envCheck,
      status: status,
      recommendation: hasBasicConfig && hasPrivateKey ? 
        'Try using the app without Firebase for now' : 
        'Missing required Firebase configuration',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Configuration check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
