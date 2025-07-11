import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({ error: 'Shop parameter required' });
    }

    console.log('🧪 Testing finish-session API for shop:', shop);
    console.log('🧪 Request body:', JSON.stringify(req.body, null, 2));

    // Test the actual finish-session API
    const testData = {
      sessionId: 'test-session-' + Date.now(),
      finalScore: 500,
      gameData: {
        duration: 30,
        objectsCollected: 10,
        obstaclesHit: 2,
        maxCombo: 5,
        distanceTraveled: 1000
      },
      playerEmail: undefined
    };

    console.log('🧪 Calling finish-session API with test data:', testData);

    const response = await fetch(`${req.headers.origin}/api/game/finish-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const data = await response.json();

    console.log('🧪 Finish-session API response status:', response.status);
    console.log('🧪 Finish-session API response data:', JSON.stringify(data, null, 2));

    return res.status(200).json({
      success: true,
      test: 'finish-session-debug',
      shop,
      apiResponse: {
        status: response.status,
        data
      },
      testData
    });

  } catch (error) {
    console.error('🧪 Test error:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
