import { NextApiRequest, NextApiResponse } from 'next';
import { DiscountService } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Enable CORS for testing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { discountCode, orderValue = 100, discountAmount = 10, shop = 'barginhuntertest.myshopify.com' } = req.method === 'GET' ? req.query : req.body;

    if (!discountCode) {
      return res.status(400).json({ error: 'Discount code is required' });
    }

    console.log('🧪 Testing webhook order processing for code:', discountCode);

    // Simulate order webhook data
    const mockOrderData = {
      orderValue: parseFloat(orderValue),
      discountAmount: parseFloat(discountAmount),
      currency: 'CZK',
      customerEmail: 'test@example.com',
      orderDate: new Date(),
      shopDomain: shop
    };

    // Mark discount as used with order data
    await DiscountService.markDiscountUsed(
      discountCode,
      `test-order-${Date.now()}`,
      mockOrderData
    );

    console.log('✅ Test webhook processing completed for:', discountCode);

    return res.json({
      success: true,
      message: 'Test webhook processed successfully',
      discountCode,
      orderData: mockOrderData
    });

  } catch (error) {
    console.error('🧪 Test webhook error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
