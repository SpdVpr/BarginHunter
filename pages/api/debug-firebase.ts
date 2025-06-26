import { NextApiRequest, NextApiResponse } from 'next';
import { GameConfigService } from '../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔥 Firebase Debug: Starting test...');
    
    // Test Firebase connection
    const testShop = 'barginhuntertest.myshopify.com';
    
    console.log('🔥 Firebase Debug: Testing getConfig...');
    const config = await GameConfigService.getConfig(testShop);
    console.log('🔥 Firebase Debug: Config retrieved:', !!config);
    
    if (config) {
      console.log('🔥 Firebase Debug: Config exists, testing update...');
      
      // Test simple update
      const testUpdate = {
        shopDomain: testShop,
        isEnabled: true,
        gameSettings: {
          minScoreForDiscount: 150,
          maxPlaysPerCustomer: 3,
          maxPlaysPerDay: 10,
          discountTiers: [
            { minScore: 0, discount: 0, message: "Keep hunting! 🔍" },
            { minScore: 150, discount: 5, message: "Nice start! 🎯" }
          ],
          gameSpeed: 1,
          difficulty: 'medium' as 'easy' | 'medium' | 'hard',
        },
        widgetSettings: {
          displayMode: 'tab' as 'popup' | 'tab' | 'inline',
          triggerEvent: 'immediate' as 'immediate' | 'scroll' | 'exit_intent' | 'time_delay',
          position: 'bottom-right' as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center',
          showOn: 'all_pages' as 'all_pages' | 'product_pages' | 'cart_page' | 'checkout_page' | 'collection_pages' | 'custom',
          customPages: [],
          userPercentage: 100,
          testMode: false,
          showDelay: 0,
          pageLoadTrigger: 'immediate' as 'immediate' | 'scroll' | 'exit_intent' | 'time_delay',
          deviceTargeting: 'all' as 'all' | 'desktop' | 'mobile',
          geoTargeting: [],
          timeBasedRules: {
            enabled: false,
          },
        },
        appearance: {
          primaryColor: '#ff6b6b',
          secondaryColor: '#4ecdc4',
          backgroundTheme: 'default' as 'default' | 'dark' | 'light' | 'custom',
          customCSS: '',
        },
        businessRules: {
          excludeDiscountedProducts: false,
          allowStackingDiscounts: false,
          discountExpiryHours: 24,
          minimumOrderValue: 0,
          excludedProductIds: [],
          excludedCollectionIds: [],
        },
      };
      
      console.log('🔥 Firebase Debug: Attempting createOrUpdateConfig...');
      await GameConfigService.createOrUpdateConfig(testUpdate);
      console.log('🔥 Firebase Debug: Update successful!');
      
      return res.json({
        success: true,
        message: 'Firebase connection and update test successful',
        configExists: true
      });
    } else {
      console.log('🔥 Firebase Debug: No config found, testing create...');
      
      // Test create
      const newConfig = {
        shopDomain: testShop,
        isEnabled: true,
        gameSettings: {
          minScoreForDiscount: 150,
          maxPlaysPerCustomer: 3,
          maxPlaysPerDay: 10,
          discountTiers: [
            { minScore: 0, discount: 0, message: "Keep hunting! 🔍" },
            { minScore: 150, discount: 5, message: "Nice start! 🎯" }
          ],
          gameSpeed: 1,
          difficulty: 'medium' as 'easy' | 'medium' | 'hard',
        },
        widgetSettings: {
          displayMode: 'tab' as 'popup' | 'tab' | 'inline',
          triggerEvent: 'immediate' as 'immediate' | 'scroll' | 'exit_intent' | 'time_delay',
          position: 'bottom-right' as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center',
          showOn: 'all_pages' as 'all_pages' | 'product_pages' | 'cart_page' | 'checkout_page' | 'collection_pages' | 'custom',
          customPages: [],
          userPercentage: 100,
          testMode: false,
          showDelay: 0,
          pageLoadTrigger: 'immediate' as 'immediate' | 'scroll' | 'exit_intent' | 'time_delay',
          deviceTargeting: 'all' as 'all' | 'desktop' | 'mobile',
          geoTargeting: [],
          timeBasedRules: {
            enabled: false,
          },
        },
        appearance: {
          primaryColor: '#ff6b6b',
          secondaryColor: '#4ecdc4',
          backgroundTheme: 'default' as 'default' | 'dark' | 'light' | 'custom',
          customCSS: '',
        },
        businessRules: {
          excludeDiscountedProducts: false,
          allowStackingDiscounts: false,
          discountExpiryHours: 24,
          minimumOrderValue: 0,
          excludedProductIds: [],
          excludedCollectionIds: [],
        },
      };
      
      console.log('🔥 Firebase Debug: Creating new config...');
      await GameConfigService.createOrUpdateConfig(newConfig);
      console.log('🔥 Firebase Debug: Create successful!');
      
      return res.json({
        success: true,
        message: 'Firebase connection and create test successful',
        configExists: false
      });
    }
    
  } catch (error) {
    console.error('🔥 Firebase Debug: Error occurred:', error);
    console.error('🔥 Firebase Debug: Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('🔥 Firebase Debug: Error message:', error instanceof Error ? error.message : 'Unknown error');
    
    return res.status(500).json({
      success: false,
      error: 'Firebase test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
  }
}
