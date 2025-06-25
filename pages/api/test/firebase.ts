import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔥 Testing Firebase configuration...');

    // Check environment variables first
    const envCheck = {
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?
        process.env.FIREBASE_CLIENT_EMAIL.substring(0, 20) + '...' :
        'Missing',
      privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
    };

    console.log('Environment check:', envCheck);

    // Try to initialize Firebase using safe helper
    let firebaseTest = 'Not tested';
    try {
      const { initFirebase } = await import('../../../src/lib/firebase-safe');
      await initFirebase();
      firebaseTest = 'Initialized successfully';
    } catch (error) {
      firebaseTest = `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    return res.json({
      success: true,
      message: '🎉 Firebase configuration test completed!',
      environment: envCheck,
      firebaseStatus: firebaseTest,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Firebase test error:', error);
    return res.status(500).json({
      success: false,
      error: 'Firebase test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        projectId: !!process.env.FIREBASE_PROJECT_ID,
        clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
      }
    });
  }
}
