import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../src/lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop, confirm } = req.body;

    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ 
        error: 'Shop parameter is required' 
      });
    }

    if (confirm !== 'RESET') {
      return res.status(400).json({ 
        error: 'Confirmation required. Send confirm: "RESET"' 
      });
    }

    console.log('Resetting shop configuration for:', shop);

    // Delete all configurations for this shop
    const configsRef = db.collection('gameConfigs');
    const snapshot = await configsRef.where('shopDomain', '==', shop).get();
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();

    console.log(`Deleted ${snapshot.docs.length} configurations for shop:`, shop);

    return res.json({
      success: true,
      message: `Shop configuration reset successfully. Deleted ${snapshot.docs.length} configurations.`,
      shop: shop,
    });

  } catch (error) {
    console.error('Reset shop error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reset shop configuration',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
