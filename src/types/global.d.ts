// Global type definitions for Vercel deployment optimization

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SHOPIFY_API_KEY: string;
      SHOPIFY_API_SECRET: string;
      SHOPIFY_SCOPES: string;
      SHOPIFY_WEBHOOK_SECRET: string;
      HOST: string;
      NODE_ENV: 'development' | 'production' | 'test';
      FIREBASE_PROJECT_ID: string;
      FIREBASE_CLIENT_EMAIL: string;
      FIREBASE_PRIVATE_KEY: string;
      FIREBASE_API_KEY: string;
      FIREBASE_AUTH_DOMAIN: string;
      FIREBASE_DATABASE_URL: string;
      FIREBASE_STORAGE_BUCKET: string;
      FIREBASE_MESSAGING_SENDER_ID: string;
      FIREBASE_APP_ID: string;
    }
  }
}

// Shopify API types
export interface ShopifySession {
  id: string;
  shop: string;
  state: string;
  isOnline: boolean;
  scope?: string;
  expires?: Date;
  accessToken?: string;
  userId?: string;
}

// Polaris component prop types
export interface PolarisTextProps {
  variant?: string;
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  children: React.ReactNode;
  color?: string;
}

export interface PolarisTextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  helpText?: string;
  autoComplete: string;
}

export interface PolarisBannerProps {
  status?: 'success' | 'info' | 'warning' | 'critical';
  children: React.ReactNode;
}

export interface PolarisRangeSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

// Game types
export interface GameObject {
  id: string;
  type: 'obstacle' | 'collectible';
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  value?: number;
}

export interface Collectible extends GameObject {
  type: 'collectible';
  value: number;
}

// Firebase types
export interface GameConfigDocument {
  shopDomain: string;
  isEnabled: boolean;
  gameSettings: {
    minScoreForDiscount: number;
    maxPlaysPerCustomer: number;
    maxPlaysPerDay: number;
    discountTiers: Array<{
      minScore: number;
      discount: number;
      message: string;
    }>;
    gameSpeed: number;
    difficulty: 'easy' | 'medium' | 'hard';
  };
  widgetSettings: {
    displayMode: 'popup' | 'tab' | 'inline';
    triggerEvent: 'immediate' | 'scroll' | 'exit_intent' | 'time_delay';
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    showOn: 'all_pages' | 'product_pages' | 'cart_page' | 'checkout_page';
  };
  appearance: {
    primaryColor: string;
    secondaryColor: string;
    backgroundTheme: 'default' | 'dark' | 'light' | 'custom';
  };
  businessRules: {
    discountExpiryHours: number;
    minimumOrderValue?: number;
  };
  createdAt: any;
  updatedAt: any;
}

export interface GameSessionDocument {
  shopDomain: string;
  customerId?: string;
  customerEmail?: string;
  sessionId: string;
  gameData: {
    moves: number;
    timeSpent: number;
    difficulty: string;
    version: string;
  };
  source: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  completed: boolean;
  createdAt: any;
  updatedAt: any;
}

export {};
