import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔧 DEBUG: Method:', req.method);
  console.log('🔧 DEBUG: Headers:', JSON.stringify(req.headers, null, 2));
  console.log('🔧 DEBUG: Body:', JSON.stringify(req.body, null, 2));
  console.log('🔧 DEBUG: Query:', JSON.stringify(req.query, null, 2));

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop, gameSettings, widgetSettings, appearance, businessRules } = req.body;

    console.log('🔧 DEBUG: Extracted values:');
    console.log('  - shop:', shop, typeof shop);
    console.log('  - gameSettings:', !!gameSettings, typeof gameSettings);
    console.log('  - widgetSettings:', !!widgetSettings, typeof widgetSettings);
    console.log('  - appearance:', !!appearance, typeof appearance);
    console.log('  - businessRules:', !!businessRules, typeof businessRules);

    if (gameSettings) {
      console.log('🔧 DEBUG: gameSettings details:');
      console.log('  - isEnabled:', gameSettings.isEnabled, typeof gameSettings.isEnabled);
      console.log('  - minScoreForDiscount:', gameSettings.minScoreForDiscount, typeof gameSettings.minScoreForDiscount);
      console.log('  - maxPlaysPerCustomer:', gameSettings.maxPlaysPerCustomer, typeof gameSettings.maxPlaysPerCustomer);
      console.log('  - maxPlaysPerDay:', gameSettings.maxPlaysPerDay, typeof gameSettings.maxPlaysPerDay);
      console.log('  - gameSpeed:', gameSettings.gameSpeed, typeof gameSettings.gameSpeed);
      console.log('  - difficulty:', gameSettings.difficulty, typeof gameSettings.difficulty);
      console.log('  - discountTiers:', Array.isArray(gameSettings.discountTiers), gameSettings.discountTiers?.length);
    }

    if (widgetSettings) {
      console.log('🔧 DEBUG: widgetSettings details:');
      console.log('  - displayMode:', widgetSettings.displayMode, typeof widgetSettings.displayMode);
      console.log('  - triggerEvent:', widgetSettings.triggerEvent, typeof widgetSettings.triggerEvent);
      console.log('  - position:', widgetSettings.position, typeof widgetSettings.position);
      console.log('  - showOn:', widgetSettings.showOn, typeof widgetSettings.showOn);
      console.log('  - userPercentage:', widgetSettings.userPercentage, typeof widgetSettings.userPercentage);
      console.log('  - testMode:', widgetSettings.testMode, typeof widgetSettings.testMode);
      console.log('  - showDelay:', widgetSettings.showDelay, typeof widgetSettings.showDelay);
    }

    if (appearance) {
      console.log('🔧 DEBUG: appearance details:');
      console.log('  - primaryColor:', appearance.primaryColor, typeof appearance.primaryColor);
      console.log('  - secondaryColor:', appearance.secondaryColor, typeof appearance.secondaryColor);
      console.log('  - backgroundTheme:', appearance.backgroundTheme, typeof appearance.backgroundTheme);
    }

    if (businessRules) {
      console.log('🔧 DEBUG: businessRules details:');
      console.log('  - excludeDiscountedProducts:', businessRules.excludeDiscountedProducts, typeof businessRules.excludeDiscountedProducts);
      console.log('  - allowStackingDiscounts:', businessRules.allowStackingDiscounts, typeof businessRules.allowStackingDiscounts);
      console.log('  - discountExpiryHours:', businessRules.discountExpiryHours, typeof businessRules.discountExpiryHours);
    }

    return res.json({
      success: true,
      message: 'Debug complete - check server logs',
      receivedData: {
        shop: !!shop,
        gameSettings: !!gameSettings,
        widgetSettings: !!widgetSettings,
        appearance: !!appearance,
        businessRules: !!businessRules
      }
    });

  } catch (error) {
    console.error('🔧 DEBUG: Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
