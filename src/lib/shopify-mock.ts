// Mock Shopify implementation for demo/development mode
// This allows the app to run without real Shopify credentials

class MockShopifySession {
  constructor(public config: any) {}
}

class MockShopifyClient {
  constructor(public session: any) {}

  async get(options: any) {
    console.log('Mock Shopify GET:', options.path);
    
    if (options.path === 'shop') {
      return {
        body: {
          shop: {
            id: 12345,
            name: 'Demo Store',
            email: 'demo@store.com',
            domain: 'demo-store.myshopify.com',
            currency: 'USD',
            timezone: 'UTC',
            plan_name: 'basic',
          }
        }
      };
    }

    if (options.path === 'products') {
      return {
        body: {
          products: [
            {
              id: 1,
              title: 'Demo Product 1',
              handle: 'demo-product-1',
              vendor: 'Demo Vendor',
              product_type: 'Demo Type',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 2,
              title: 'Demo Product 2',
              handle: 'demo-product-2',
              vendor: 'Demo Vendor',
              product_type: 'Demo Type',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          ]
        }
      };
    }

    return { body: {} };
  }

  async post(options: any) {
    console.log('Mock Shopify POST:', options.path, options.data);
    
    if (options.path === 'price_rules') {
      return {
        body: {
          price_rule: {
            id: Math.floor(Math.random() * 1000000),
            title: options.data.price_rule.title,
            value_type: options.data.price_rule.value_type,
            value: options.data.price_rule.value,
            customer_selection: options.data.price_rule.customer_selection,
            target_type: options.data.price_rule.target_type,
            target_selection: options.data.price_rule.target_selection,
            allocation_method: options.data.price_rule.allocation_method,
            usage_limit: options.data.price_rule.usage_limit,
            starts_at: options.data.price_rule.starts_at,
            ends_at: options.data.price_rule.ends_at,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        }
      };
    }

    if (options.path.includes('discount_codes')) {
      return {
        body: {
          discount_code: {
            id: Math.floor(Math.random() * 1000000),
            code: options.data.discount_code.code,
            usage_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        }
      };
    }

    if (options.path === 'script_tags') {
      return {
        body: {
          script_tag: {
            id: Math.floor(Math.random() * 1000000),
            src: options.data.script_tag.src,
            event: options.data.script_tag.event,
            display_scope: options.data.script_tag.display_scope,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        }
      };
    }

    return { body: {} };
  }

  async delete(options: any) {
    console.log('Mock Shopify DELETE:', options.path);
    return { body: {} };
  }
}

// Mock Shopify API
export const shopify = {
  clients: {
    Rest: MockShopifyClient,
  },
  auth: {
    buildAuthURL: (options: any) => {
      console.log('Mock buildAuthURL:', options);
      return `https://demo-store.myshopify.com/admin/oauth/authorize?client_id=demo&scope=${options.scopes}&redirect_uri=http://localhost:3000/api/auth/callback&state=${options.state}`;
    },
    callback: async (options: any) => {
      console.log('Mock auth callback:', options);
      return {
        session: new MockShopifySession({
          id: 'demo_session',
          shop: 'demo-store.myshopify.com',
          accessToken: 'demo_access_token',
          scope: 'read_products,write_discounts,read_customers,write_script_tags,read_orders',
        })
      };
    },
  },
};

// Mock session manager
export class ShopifySessionManager {
  static createSession(shop: string, accessToken: string) {
    return new MockShopifySession({
      id: `offline_${shop}`,
      shop,
      state: 'offline',
      isOnline: false,
      accessToken,
    });
  }

  static async validateSession(session: any): Promise<boolean> {
    console.log('Mock validateSession:', session);
    return true;
  }
}

// Mock webhook verification
export function verifyWebhook(data: string, hmacHeader: string): boolean {
  console.log('Mock verifyWebhook - always returns true in demo mode');
  return true;
}

// Mock OAuth helpers
export function generateAuthUrl(shop: string, state: string): string {
  console.log('Mock generateAuthUrl:', shop, state);
  return `https://${shop}/admin/oauth/authorize?client_id=demo&scope=read_products,write_discounts&redirect_uri=http://localhost:3000/api/auth/callback&state=${state}`;
}

export async function exchangeCodeForToken(shop: string, code: string, state: string) {
  console.log('Mock exchangeCodeForToken:', shop, code, state);
  return new MockShopifySession({
    id: `offline_${shop}`,
    shop,
    accessToken: 'demo_access_token',
    scope: 'read_products,write_discounts,read_customers,write_script_tags,read_orders',
  });
}

// Mock shop data fetcher
export async function getShopData(session: any) {
  console.log('Mock getShopData:', session);
  return {
    id: 12345,
    name: 'Demo Store',
    email: 'demo@store.com',
    domain: session.shop || 'demo-store.myshopify.com',
    currency: 'USD',
    timezone: 'UTC',
    plan_name: 'basic',
  };
}

// Mock product management
export async function getProducts(session: any, limit = 50) {
  console.log('Mock getProducts:', session, limit);
  return [
    {
      id: 1,
      title: 'Demo Product 1',
      handle: 'demo-product-1',
      vendor: 'Demo Vendor',
    },
    {
      id: 2,
      title: 'Demo Product 2',
      handle: 'demo-product-2',
      vendor: 'Demo Vendor',
    }
  ];
}

// Mock discount code management
export async function createDiscountCode(session: any, discountData: any) {
  console.log('Mock createDiscountCode:', session, discountData);
  
  const priceRuleId = Math.floor(Math.random() * 1000000);
  const discountCodeId = Math.floor(Math.random() * 1000000);
  
  return {
    priceRule: {
      id: priceRuleId,
      title: `Bargain Hunter - ${discountData.code}`,
      value_type: discountData.type,
      value: discountData.type === 'percentage' ? `-${discountData.value}` : `-${discountData.value * 100}`,
      created_at: new Date().toISOString(),
    },
    discountCode: {
      id: discountCodeId,
      code: discountData.code,
      usage_count: 0,
      created_at: new Date().toISOString(),
    },
  };
}

// Mock script tag management
export async function installScriptTag(session: any, shopDomain: string) {
  console.log('Mock installScriptTag:', session, shopDomain);
  return {
    id: Math.floor(Math.random() * 1000000),
    src: `http://localhost:3000/api/widget/embed?shop=${shopDomain}`,
    event: 'onload',
    display_scope: 'online_store',
    created_at: new Date().toISOString(),
  };
}

export async function uninstallScriptTag(session: any, scriptTagId: number) {
  console.log('Mock uninstallScriptTag:', session, scriptTagId);
  return true;
}

// Mock customer data
export async function getCustomer(session: any, customerId: string) {
  console.log('Mock getCustomer:', session, customerId);
  return {
    id: customerId,
    email: 'demo@customer.com',
    first_name: 'Demo',
    last_name: 'Customer',
    created_at: new Date().toISOString(),
  };
}

// Mock order data
export async function getOrders(session: any, limit = 50) {
  console.log('Mock getOrders:', session, limit);
  return [
    {
      id: 1,
      order_number: 1001,
      total_price: '99.99',
      currency: 'USD',
      created_at: new Date().toISOString(),
      customer: {
        id: 1,
        email: 'demo@customer.com',
      },
    }
  ];
}

console.log('🔧 Using Mock Shopify for development/demo mode');
