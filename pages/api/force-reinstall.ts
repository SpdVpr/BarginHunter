import { NextApiRequest, NextApiResponse } from 'next';
import { StoreService } from '../../src/lib/database';
import { installScriptTag } from '../../src/lib/shopify';
import shopify from '../../src/lib/shopify-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop } = req.body;

    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ 
        error: 'Shop parameter is required' 
      });
    }

    console.log('🔧 Force Reinstall: Starting for shop:', shop);

    // Get existing store
    const existingStore = await StoreService.getStore(shop);
    if (!existingStore) {
      return res.status(404).json({
        success: false,
        error: 'Store not found. Please install the app first.'
      });
    }

    console.log('🔧 Force Reinstall: Store found:', {
      id: existingStore.id,
      currentScriptTagId: existingStore.scriptTagId
    });

    // Create session for API calls
    const session = {
      shop,
      accessToken: existingStore.accessToken
    };

    // Try to install script tag
    try {
      console.log('🔧 Force Reinstall: Installing script tag...');
      const scriptTag = await installScriptTag(session as any, shop);
      console.log('🔧 Force Reinstall: Script tag installed:', {
        id: scriptTag.id,
        src: scriptTag.src
      });

      // Update store with new script tag ID
      await StoreService.updateStore(shop, { 
        scriptTagId: scriptTag.id 
      });

      return res.json({
        success: true,
        message: 'Script tag installed successfully',
        scriptTag: {
          id: scriptTag.id,
          src: scriptTag.src
        }
      });

    } catch (scriptError) {
      console.error('🔧 Force Reinstall: Script installation failed:', scriptError);
      
      return res.status(500).json({
        success: false,
        error: 'Failed to install script tag',
        details: scriptError instanceof Error ? scriptError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('🔧 Force Reinstall: General error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to force reinstall',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
