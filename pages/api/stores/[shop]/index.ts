import { NextApiRequest, NextApiResponse } from 'next';
import { StoreService } from '../../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { shop } = req.query;

  if (!shop || typeof shop !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: 'Shop domain is required' 
    });
  }

  switch (req.method) {
    case 'GET':
      return handleGetStore(req, res, shop);
    case 'PUT':
      return handleUpdateStore(req, res, shop);
    case 'DELETE':
      return handleDeleteStore(req, res, shop);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetStore(req: NextApiRequest, res: NextApiResponse, shop: string) {
  try {
    // Temporarily bypass Firebase and return 404 to trigger installation
    console.log('Bypassing Firebase check for shop:', shop);
    return res.status(404).json({
      success: false,
      error: 'Store not found - triggering installation'
    });

    // Original Firebase code (commented out):
    // const store = await StoreService.getStore(shop);
    // if (!store) {
      return res.status(404).json({ 
        success: false, 
        error: 'Store not found' 
      });
    }

    // Remove sensitive information
    const { accessToken, ...publicStoreData } = store;

    return res.json({
      success: true,
      store: publicStoreData,
    });

  } catch (error) {
    console.error('Get store error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve store information' 
    });
  }
}

async function handleUpdateStore(req: NextApiRequest, res: NextApiResponse, shop: string) {
  try {
    const { isActive, subscription } = req.body;

    const updates: any = {};
    
    if (typeof isActive === 'boolean') {
      updates.isActive = isActive;
    }
    
    if (subscription) {
      updates.subscription = subscription;
    }

    await StoreService.updateStore(shop, updates);

    return res.json({
      success: true,
      message: 'Store updated successfully',
    });

  } catch (error) {
    console.error('Update store error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to update store' 
    });
  }
}

async function handleDeleteStore(req: NextApiRequest, res: NextApiResponse, shop: string) {
  try {
    await StoreService.deactivateStore(shop);

    return res.json({
      success: true,
      message: 'Store deactivated successfully',
    });

  } catch (error) {
    console.error('Delete store error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to deactivate store' 
    });
  }
}
