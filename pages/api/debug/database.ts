import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Debug: Checking database contents...');

    const { shop } = req.query;
    const testShop = (shop as string) || 'barginhuntertest.myshopify.com';

    // Import Firebase and services
    const { db } = await import('../../../src/lib/firebase');
    
    let debugResults = {
      shop: testShop,
      collections: {
        gameSessions: { count: 0, documents: [] as any[] },
        gameScores: { count: 0, documents: [] as any[] },
        gameConfigs: { count: 0, documents: [] as any[] },
        discountCodes: { count: 0, documents: [] as any[] }
      },
      rawQueries: {
        allGameSessions: 0,
        shopGameSessions: 0,
        allGameScores: 0,
        shopGameScores: 0
      }
    };

    // Check all gameSessions (no filter)
    try {
      const allSessionsSnapshot = await db.collection('gameSessions').limit(10).get();
      debugResults.rawQueries.allGameSessions = allSessionsSnapshot.size;
      debugResults.collections.gameSessions.count = allSessionsSnapshot.size;
      debugResults.collections.gameSessions.documents = allSessionsSnapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));
    } catch (error: any) {
      console.error('Error getting all sessions:', error);
    }

    // Check gameSessions for specific shop
    try {
      const shopSessionsSnapshot = await db.collection('gameSessions')
        .where('shopDomain', '==', testShop)
        .limit(10)
        .get();
      debugResults.rawQueries.shopGameSessions = shopSessionsSnapshot.size;
    } catch (error: any) {
      console.error('Error getting shop sessions:', error);
      debugResults.rawQueries.shopGameSessions = -1;
    }

    // Check all gameScores (no filter)
    try {
      const allScoresSnapshot = await db.collection('gameScores').limit(10).get();
      debugResults.rawQueries.allGameScores = allScoresSnapshot.size;
      debugResults.collections.gameScores.count = allScoresSnapshot.size;
      debugResults.collections.gameScores.documents = allScoresSnapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));
    } catch (error: any) {
      console.error('Error getting all scores:', error);
    }

    // Check gameScores for specific shop
    try {
      const shopScoresSnapshot = await db.collection('gameScores')
        .where('shopDomain', '==', testShop)
        .limit(10)
        .get();
      debugResults.rawQueries.shopGameScores = shopScoresSnapshot.size;
    } catch (error: any) {
      console.error('Error getting shop scores:', error);
      debugResults.rawQueries.shopGameScores = -1;
    }

    // Check gameConfigs
    try {
      const configsSnapshot = await db.collection('gameConfigs').limit(10).get();
      debugResults.collections.gameConfigs.count = configsSnapshot.size;
      debugResults.collections.gameConfigs.documents = configsSnapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));
    } catch (error: any) {
      console.error('Error getting configs:', error);
    }

    // Check discountCodes
    try {
      const discountsSnapshot = await db.collection('discountCodes').limit(10).get();
      debugResults.collections.discountCodes.count = discountsSnapshot.size;
      debugResults.collections.discountCodes.documents = discountsSnapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));
    } catch (error: any) {
      console.error('Error getting discounts:', error);
    }

    return res.json({
      success: true,
      message: '🔍 Database debug completed!',
      results: debugResults,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Database debug error:', error);
    return res.status(500).json({
      success: false,
      error: 'Database debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
