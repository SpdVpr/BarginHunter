import { NextApiRequest, NextApiResponse } from 'next';
import { UpgradeRecommendationService } from '../../../src/lib/upgrade-recommendations';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop } = req.query;

    if (!shop) {
      return res.status(400).json({ 
        error: 'Missing shop parameter'
      });
    }

    console.log('💡 Getting upgrade recommendations for shop:', shop);

    // Get upgrade suggestions
    const suggestions = await UpgradeRecommendationService.getUpgradeSuggestions(shop as string);
    
    // Get personalized message
    const personalizedMessage = await UpgradeRecommendationService.getPersonalizedUpgradeMessage(shop as string);
    
    // Check if should recommend upgrade
    const shouldRecommend = await UpgradeRecommendationService.shouldRecommendUpgrade(shop as string);

    const response = {
      success: true,
      shouldRecommend,
      personalizedMessage,
      suggestions,
      upgradeUrl: `/dashboard/billing?shop=${shop}`
    };

    console.log('✅ Upgrade recommendations generated:', response);

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Failed to get upgrade recommendations:', error);
    res.status(500).json({
      error: 'Failed to get upgrade recommendations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
