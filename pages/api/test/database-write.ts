import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔥 Testing database write operations...');

    const { shop } = req.body;
    const testShop = shop || 'barginhuntertest.myshopify.com';

    // Import services
    const { GameSessionService, GameScoreService } = await import('../../../src/lib/database');
    
    let testResults = {
      shop: testShop,
      sessionTest: 'Not tested',
      scoreTest: 'Not tested',
      sessionId: '',
      errors: [] as string[]
    };

    // Test 1: Create a session (same as real game)
    try {
      const sessionId = `test-write-${Date.now()}`;
      testResults.sessionId = sessionId;
      
      console.log('🔥 Creating test session:', sessionId);
      
      await GameSessionService.createSession({
        shopDomain: testShop,
        sessionId,
        gameData: {
          moves: 0,
          timeSpent: 0,
          difficulty: 'medium',
          version: '1.0',
        },
        source: 'popup',
        referrer: 'https://barginhuntertest.myshopify.com',
        completed: false,
      });
      
      console.log('🔥 Session created successfully');
      testResults.sessionTest = 'SUCCESS - session created';
      
      // Test 2: Try to retrieve it immediately
      const retrievedSession = await GameSessionService.getSession(sessionId);
      if (retrievedSession) {
        testResults.sessionTest += ' and retrieved';
      } else {
        testResults.sessionTest += ' but NOT retrieved';
        testResults.errors.push('Session created but not retrievable');
      }
      
    } catch (sessionError: any) {
      console.error('🔥 Session creation failed:', sessionError);
      testResults.sessionTest = `FAILED: ${sessionError.message}`;
      testResults.errors.push(`Session error: ${sessionError.message}`);
    }

    // Test 3: Create a score (same as real game)
    try {
      console.log('🔥 Creating test score...');
      
      await GameScoreService.recordScore({
        shopDomain: testShop,
        sessionId: testResults.sessionId,
        score: 250,
        discountEarned: 10,
        discountCode: 'TEST123',
        gameData: {
          moves: 15,
          timeSpent: 45,
          difficulty: 'medium',
        },
      });
      
      console.log('🔥 Score created successfully');
      testResults.scoreTest = 'SUCCESS - score recorded';
      
    } catch (scoreError: any) {
      console.error('🔥 Score creation failed:', scoreError);
      testResults.scoreTest = `FAILED: ${scoreError.message}`;
      testResults.errors.push(`Score error: ${scoreError.message}`);
    }

    // Test 4: Check if data is actually in database
    try {
      const sessions = await GameSessionService.getSessionsByShop(testShop, 10);
      const scores = await GameScoreService.getScoresByShop(testShop, 10);
      
      testResults.sessionTest += ` (found ${sessions.length} sessions for shop)`;
      testResults.scoreTest += ` (found ${scores.length} scores for shop)`;
      
    } catch (queryError: any) {
      testResults.errors.push(`Query error: ${queryError.message}`);
    }

    return res.json({
      success: testResults.errors.length === 0,
      message: '🔥 Database write test completed!',
      results: testResults,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Database write test error:', error);
    return res.status(500).json({
      success: false,
      error: 'Database write test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
