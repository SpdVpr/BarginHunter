import { shopifyApi, LATEST_API_VERSION, Session } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';
import crypto from 'crypto';

// Initialize Shopify API
export const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SHOPIFY_SCOPES?.split(',') || [
    'read_products',
    'write_discounts',
    'read_customers',
    'write_script_tags',
    'read_orders'
  ],
  hostName: process.env.HOST || 'localhost:3000',
  hostScheme: process.env.NODE_ENV === 'production' ? 'https' : 'http',
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
});

// Shopify session management
export class ShopifySessionManager {
  static createSession(shop: string, accessToken: string): Session {
    return new Session({
      id: `offline_${shop}`,
      shop,
      state: 'offline',
      isOnline: false,
      accessToken,
    });
  }

  static async validateSession(session: Session): Promise<boolean> {
    try {
      const client = new shopify.clients.Rest({ session });
      await client.get({ path: 'shop' });
      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }
}

// Webhook verification
export function verifyWebhook(data: string, hmacHeader: string): boolean {
  const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('SHOPIFY_WEBHOOK_SECRET is not configured');
  }

  const calculatedHmac = crypto
    .createHmac('sha256', webhookSecret)
    .update(data, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(calculatedHmac, 'base64'),
    Buffer.from(hmacHeader, 'base64')
  );
}

// OAuth helpers
export function generateAuthUrl(shop: string, state: string): string {
  const host = process.env.HOST || 'localhost:3000';
  const redirectUri = host.startsWith('http') ? `${host}/api/auth/callback` : `https://${host}/api/auth/callback`;

  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${process.env.SHOPIFY_SCOPES}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  console.log('Generated OAuth URL:', authUrl);
  return authUrl;
}

export async function exchangeCodeForToken(shop: string, code: string, state: string) {
  try {
    // Manual token exchange for better error handling
    const tokenUrl = `https://${shop}/admin/oauth/access_token`;
    const tokenData = {
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code: code,
    };

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenData),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    const tokenResponse = await response.json();

    // Create session object
    const session = {
      id: `${shop}_${Date.now()}`,
      shop: shop,
      state: state,
      isOnline: false,
      accessToken: tokenResponse.access_token,
      scope: tokenResponse.scope,
    };

    return session;
  } catch (error) {
    console.error('Token exchange failed:', error);
    throw error;
  }
}

// Shop data fetcher
export async function getShopData(session: Session) {
  try {
    const client = new shopify.clients.Rest({ session });
    const response = await client.get({ path: 'shop' });
    return response.body.shop;
  } catch (error) {
    console.error('Failed to fetch shop data:', error);
    throw error;
  }
}

// Product management
export async function getProducts(session: Session, limit = 50) {
  try {
    const client = new shopify.clients.Rest({ session });
    const response = await client.get({
      path: 'products',
      query: { limit: limit.toString() },
    });
    return response.body.products;
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
}

// Discount code management
export async function createDiscountCode(
  session: Session,
  discountData: {
    code: string;
    value: number;
    type: 'percentage' | 'fixed_amount';
    usage_limit?: number;
    expires_at?: string;
  }
) {
  try {
    const client = new shopify.clients.Rest({ session });
    
    const priceRule = await client.post({
      path: 'price_rules',
      data: {
        price_rule: {
          title: `Bargain Hunter - ${discountData.code}`,
          target_type: 'line_item',
          target_selection: 'all',
          allocation_method: 'across',
          value_type: discountData.type,
          value: discountData.type === 'percentage' ? `-${discountData.value}` : `-${discountData.value * 100}`,
          customer_selection: 'all',
          usage_limit: discountData.usage_limit || 1,
          starts_at: new Date().toISOString(),
          ends_at: discountData.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    });

    const discountCode = await client.post({
      path: `price_rules/${priceRule.body.price_rule.id}/discount_codes`,
      data: {
        discount_code: {
          code: discountData.code,
        },
      },
    });

    return {
      priceRule: priceRule.body.price_rule,
      discountCode: discountCode.body.discount_code,
    };
  } catch (error) {
    console.error('Failed to create discount code:', error);
    throw error;
  }
}

// Script tag management for widget injection
export async function installScriptTag(session: Session, shopDomain: string) {
  try {
    const client = new shopify.clients.Rest({ session });

    const scriptSrc = `${process.env.NEXT_PUBLIC_APP_URL}/api/widget/embed?shop=${shopDomain}`;

    const response = await client.post({
      path: 'script_tags',
      data: {
        script_tag: {
          event: 'onload',
          src: scriptSrc,
          display_scope: 'online_store',
        },
      },
    });

    return response.body.script_tag;
  } catch (error) {
    console.error('Failed to install script tag:', error);
    throw error;
  }
}

// Webhook management
export async function installWebhooks(session: Session) {
  try {
    const client = new shopify.clients.Rest({ session });
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

    const webhooks = [
      {
        topic: 'orders/create',
        address: `${baseUrl}/api/webhooks/orders/create`,
        format: 'json'
      },
      {
        topic: 'app/uninstalled',
        address: `${baseUrl}/api/webhooks/app/uninstalled`,
        format: 'json'
      },
      {
        topic: 'customers/create',
        address: `${baseUrl}/api/webhooks/customers/create`,
        format: 'json'
      }
    ];

    const installedWebhooks = [];

    for (const webhook of webhooks) {
      try {
        const response = await client.post({
          path: 'webhooks',
          data: { webhook },
        });
        installedWebhooks.push(response.body.webhook);
        console.log(`✅ Webhook installed: ${webhook.topic} -> ${webhook.address}`);
      } catch (error) {
        console.error(`❌ Failed to install webhook ${webhook.topic}:`, error);
      }
    }

    return installedWebhooks;
  } catch (error) {
    console.error('Failed to install webhooks:', error);
    throw error;
  }
}

export async function uninstallScriptTag(session: Session, scriptTagId: number) {
  try {
    const client = new shopify.clients.Rest({ session });
    await client.delete({ path: `script_tags/${scriptTagId}` });
    return true;
  } catch (error) {
    console.error('Failed to uninstall script tag:', error);
    throw error;
  }
}

// Customer data
export async function getCustomer(session: Session, customerId: string) {
  try {
    const client = new shopify.clients.Rest({ session });
    const response = await client.get({ path: `customers/${customerId}` });
    return response.body.customer;
  } catch (error) {
    console.error('Failed to fetch customer:', error);
    throw error;
  }
}

// Order data
export async function getOrders(session: Session, limit = 50) {
  try {
    const client = new shopify.clients.Rest({ session });
    const response = await client.get({
      path: 'orders',
      query: { limit: limit.toString(), status: 'any' },
    });
    return response.body.orders;
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    throw error;
  }
}
