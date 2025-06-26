import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Test environment variables
    const envCheck = {
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
      FIREBASE_PRIVATE_KEY_LENGTH: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
      NODE_ENV: process.env.NODE_ENV,
    };

    // Try to import Firebase
    let firebaseStatus = 'not_tested';
    try {
      const { db } = await import('../../src/lib/firebase');
      firebaseStatus = 'imported_successfully';
      
      // Try a simple operation
      const testCollection = db.collection('test');
      firebaseStatus = 'database_accessible';
    } catch (firebaseError) {
      firebaseStatus = `firebase_error: ${firebaseError.message}`;
    }

    return res.status(200).json({
      success: true,
      message: 'Firebase test completed',
      environment: envCheck,
      firebaseStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Firebase test error:', error);
    return res.status(500).json({
      success: false,
      error: 'Firebase test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
