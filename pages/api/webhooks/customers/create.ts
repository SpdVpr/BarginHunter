import { NextApiRequest, NextApiResponse } from 'next';
import { verifyWebhook } from '../../../../src/lib/shopify';
import { CustomerService } from '../../../../src/lib/database';

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

    const customer = req.body;
    const shopDomain = req.headers['x-shopify-shop-domain'] as string;

    console.log('Customer created webhook received:', {
      customerId: customer.id,
      email: customer.email,
      shop: shopDomain,
    });

    // Check if we already have this customer in our system
    const existingCustomer = await CustomerService.getCustomer(shopDomain, customer.id.toString());
    
    if (!existingCustomer && customer.email) {
      // Create customer record with default values
      await CustomerService.createOrUpdateCustomer({
        shopDomain,
        customerId: customer.id.toString(),
        email: customer.email,
        totalSessions: 0,
        totalScore: 0,
        bestScore: 0,
        totalDiscountsEarned: 0,
        totalDiscountsUsed: 0,
        preferences: {
          notifications: true,
        },
      });
      
      console.log('Customer record created for:', customer.email);
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Customer webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
