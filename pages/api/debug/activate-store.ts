import { NextApiRequest, NextApiResponse } from 'next';
import { StoreService, GameConfigService } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop } = req.body;
    
    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ error: 'Shop domain is required' });
    }

    console.log('🔧 Activating store:', shop);

    // Get store data
    const store = await StoreService.getStore(shop);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found in database'
      });
    }

    // Activate store
    await StoreService.updateStore(shop, { isActive: true });
    console.log('🔧 Store activated:', shop);

    // Ensure game config exists
    let gameConfig = await GameConfigService.getConfig(shop);
    
    if (!gameConfig) {
      console.log('🔧 Creating default game config for:', shop);
      await GameConfigService.createOrUpdateConfig({
        shopDomain: shop,
        isEnabled: true,
        gameSettings: {
          discountTiers: [
            { minScore: 0, maxScore: 49, discountPercentage: 5 },
            { minScore: 50, maxScore: 99, discountPercentage: 10 },
            { minScore: 100, maxScore: 199, discountPercentage: 15 },
            { minScore: 200, maxScore: 999, discountPercentage: 20 },
          ],
          maxPlaysPerDay: 3,
          gameTimeLimit: 60,
          selectedGames: ['runner', 'flappy', 'tetris', 'snake', 'space-invaders', 'arkanoid', 'fruit-ninja'],
        },
        widgetSettings: {
          showOn: 'all_pages',
          position: 'bottom-right',
          buttonText: 'Play & Win!',
          buttonColor: '#007ace',
          popupTitle: 'Win Discount Codes!',
          popupDescription: 'Play games and earn discount codes for your purchase!',
        }
      });
      gameConfig = await GameConfigService.getConfig(shop);
    }

    // Get updated store data
    const updatedStore = await StoreService.getStore(shop);

    return res.status(200).json({
      success: true,
      message: 'Store activated successfully',
      store: {
        id: updatedStore?.id,
        shopDomain: updatedStore?.shopDomain,
        isActive: updatedStore?.isActive,
        hasAccessToken: !!updatedStore?.accessToken,
        scopes: updatedStore?.scopes,
        installedAt: updatedStore?.installedAt,
        updatedAt: updatedStore?.updatedAt
      },
      gameConfig: {
        id: gameConfig?.id,
        shopDomain: gameConfig?.shopDomain,
        isEnabled: gameConfig?.isEnabled,
        createdAt: gameConfig?.createdAt,
        updatedAt: gameConfig?.updatedAt
      }
    });

  } catch (error) {
    console.error('🔧 Store activation error:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
