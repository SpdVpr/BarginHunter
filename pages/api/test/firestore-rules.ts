import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔥 Testing Firestore rules and permissions...');

    const { shop } = req.query;
    const testShop = (shop as string) || 'test-shop.myshopify.com';

    // Import Firebase admin
    const { db } = await import('../../../src/lib/firebase');
    
    let testResults = {
      connection: 'Not tested',
      readTest: 'Not tested',
      writeTest: 'Not tested',
      deleteTest: 'Not tested',
      collections: {
        gameSessions: 'Not tested',
        gameScores: 'Not tested',
        gameConfigs: 'Not tested'
      }
    };

    // Test 1: Basic connection
    try {
      await db.collection('test').limit(1).get();
      testResults.connection = 'SUCCESS';
    } catch (error: any) {
      testResults.connection = `FAILED: ${error.message}`;
    }

    // Test 2: Read test
    try {
      const snapshot = await db.collection('gameSessions').limit(1).get();
      testResults.readTest = `SUCCESS - found ${snapshot.size} documents`;
    } catch (error: any) {
      testResults.readTest = `FAILED: ${error.message}`;
    }

    // Test 3: Write test
    try {
      const testDoc = db.collection('test').doc();
      await testDoc.set({
        test: true,
        timestamp: new Date(),
        shop: testShop
      });
      testResults.writeTest = 'SUCCESS';
      
      // Clean up
      await testDoc.delete();
      testResults.deleteTest = 'SUCCESS';
    } catch (error: any) {
      testResults.writeTest = `FAILED: ${error.message}`;
    }

    // Test 4: Collection-specific tests
    const collections = ['gameSessions', 'gameScores', 'gameConfigs'];
    
    for (const collectionName of collections) {
      try {
        const testDoc = db.collection(collectionName).doc();
        await testDoc.set({
          test: true,
          shopDomain: testShop,
          timestamp: new Date()
        });
        
        // Try to read it back
        const doc = await testDoc.get();
        if (doc.exists) {
          testResults.collections[collectionName as keyof typeof testResults.collections] = 'SUCCESS';
        } else {
          testResults.collections[collectionName as keyof typeof testResults.collections] = 'FAILED - document not found after write';
        }
        
        // Clean up
        await testDoc.delete();
      } catch (error: any) {
        testResults.collections[collectionName as keyof typeof testResults.collections] = `FAILED: ${error.message}`;
      }
    }

    return res.json({
      success: true,
      message: '🔥 Firestore rules test completed!',
      testShop,
      results: testResults,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Firestore rules test error:', error);
    return res.status(500).json({
      success: false,
      error: 'Firestore rules test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
