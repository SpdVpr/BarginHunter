import { NextApiRequest, NextApiResponse } from 'next';
import { db, Timestamp } from '../../../src/lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔥 Testing Firebase connection...');

    // Test Firebase connection by writing and reading a test document
    const testDoc = {
      message: 'Firebase connection test',
      timestamp: Timestamp.now(),
      success: true,
      testId: Math.random().toString(36).substr(2, 9),
    };

    console.log('📝 Writing test document...');
    // Write test document
    const docRef = await db.collection('test').add(testDoc);
    console.log('✅ Test document written with ID:', docRef.id);

    console.log('📖 Reading test document...');
    // Read it back
    const doc = await docRef.get();
    const data = doc.data();
    console.log('✅ Test document read successfully');

    console.log('🗑️ Cleaning up test document...');
    // Clean up - delete the test document
    await docRef.delete();
    console.log('✅ Test document deleted');

    return res.json({
      success: true,
      message: '🎉 Firebase connection successful!',
      testData: {
        ...data,
        timestamp: data?.timestamp?.toDate?.()?.toISOString() || data?.timestamp,
      },
      documentId: docRef.id,
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

  } catch (error) {
    console.error('❌ Firebase test error:', error);
    return res.status(500).json({
      success: false,
      error: 'Firebase connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      projectId: process.env.FIREBASE_PROJECT_ID,
      hasCredentials: {
        projectId: !!process.env.FIREBASE_PROJECT_ID,
        clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      }
    });
  }
}
