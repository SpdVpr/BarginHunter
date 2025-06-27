import { NextApiRequest, NextApiResponse } from 'next';
import { verifyWebhook } from '../../../../src/lib/shopify';
import { DiscountService } from '../../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook authenticity
    const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string;
    const body = JSON.stringify(req.body);
    
    if (!verifyWebhook(body, hmacHeader)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const order = req.body;
    const shopDomain = req.headers['x-shopify-shop-domain'] as string;

    console.log('Order created webhook received:', {
      orderId: order.id,
      shop: shopDomain,
      total: order.total_price,
      discountCodes: order.discount_codes,
    });

    // Check if order used any of our discount codes
    if (order.discount_codes && order.discount_codes.length > 0) {
      for (const discountCode of order.discount_codes) {
        // Check if this is one of our generated discount codes
        if (discountCode.code && discountCode.code.startsWith('BARGAIN')) {
          try {
            // Mark discount as used with order details
            await DiscountService.markDiscountUsed(
              discountCode.code,
              order.id.toString(),
              {
                orderValue: parseFloat(order.total_price || '0'),
                discountAmount: parseFloat(discountCode.amount || '0'),
                currency: order.currency || 'USD',
                customerEmail: order.email,
                orderDate: new Date(order.created_at),
                shopDomain
              }
            );
            console.log('✅ Marked discount as used with order data:', {
              code: discountCode.code,
              orderId: order.id,
              orderValue: order.total_price,
              discountAmount: discountCode.amount
            });
          } catch (error) {
            console.error('❌ Failed to mark discount as used:', error);
          }
        }
      }
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Order webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Disable body parsing to get raw body for webhook verification
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
