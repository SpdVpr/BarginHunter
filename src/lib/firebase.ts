import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
let app;
if (getApps().length === 0) {
  let serviceAccount;

  // Try to use the full service account JSON first
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      console.log('Using FIREBASE_SERVICE_ACCOUNT_KEY');
    } catch (error) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error);
    }
  }

  // Fallback to individual environment variables
  if (!serviceAccount) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PROJECT_ID) {
      throw new Error('Missing Firebase configuration. Please check your environment variables.');
    }

    serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    };
    console.log('Using individual Firebase environment variables');
  }

  app = initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.projectId || process.env.FIREBASE_PROJECT_ID,
  });
} else {
  app = getApps()[0];
}

export const db = getFirestore(app);
export const auth = getAuth(app);
export { Timestamp };

// Collection references
export const collections = {
  stores: 'stores',
  gameConfigs: 'gameConfigs',
  gameSessions: 'gameSessions',
  gameScores: 'gameScores',
  discountCodes: 'discountCodes',
  analytics: 'analytics',
  customers: 'customers',
} as const;

// Database interfaces
export interface StoreDocument {
  id: string;
  shopDomain: string;
  accessToken: string;
  scopes: string[];
  isActive: boolean;
  installedAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  shopData: {
    name: string;
    email: string;
    domain: string;
    currency: string;
    timezone: string;
    planName: string;
  };
  scriptTagId?: number;
  subscription?: {
    plan: 'free' | 'basic' | 'premium';
    status: 'active' | 'cancelled' | 'past_due';
    currentPeriodEnd: FirebaseFirestore.Timestamp;
  };
}

export interface GameConfigDocument {
  id: string;
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
    showOn: 'all_pages' | 'product_pages' | 'cart_page' | 'checkout_page' | 'collection_pages' | 'custom';
    timeDelay?: number;
    scrollPercentage?: number;
    customPages?: string[];
    // New targeting options
    userPercentage: number;
    testMode: boolean;
    showDelay: number;
    pageLoadTrigger: 'immediate' | 'after_delay' | 'on_scroll' | 'on_exit_intent';
    deviceTargeting: 'all' | 'desktop' | 'mobile' | 'tablet';
    geoTargeting?: string[];
    timeBasedRules?: {
      enabled: boolean;
      startTime?: string;
      endTime?: string;
      timezone?: string;
      daysOfWeek?: number[];
    };
  };
  appearance: {
    primaryColor: string;
    secondaryColor: string;
    backgroundTheme: 'default' | 'dark' | 'light' | 'custom';
    customCSS?: string;
  };
  businessRules: {
    excludeDiscountedProducts: boolean;
    allowStackingDiscounts: boolean;
    discountExpiryHours: number;
    minimumOrderValue?: number;
    excludedProductIds?: string[];
    excludedCollectionIds?: string[];
  };
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface GameSessionDocument {
  id: string;
  shopDomain: string;
  customerId?: string;
  customerEmail?: string;
  sessionId: string;
  startedAt: FirebaseFirestore.Timestamp;
  endedAt?: FirebaseFirestore.Timestamp;
  finalScore?: number;
  discountEarned?: number;
  discountCode?: string;
  gameData: {
    moves: number;
    timeSpent: number;
    difficulty: string;
    version: string;
  };
  source: 'popup' | 'tab' | 'inline';
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  completed: boolean;
}

export interface GameScoreDocument {
  id: string;
  shopDomain: string;
  customerId?: string;
  customerEmail?: string;
  sessionId: string;
  score: number;
  achievedAt: FirebaseFirestore.Timestamp;
  discountEarned: number;
  discountCode?: string;
  gameData: {
    moves: number;
    timeSpent: number;
    difficulty: string;
  };
}

export interface DiscountCodeDocument {
  id: string;
  shopDomain: string;
  code: string;
  value: number;
  type: 'percentage' | 'fixed_amount';
  priceRuleId: string;
  discountCodeId: string;
  customerId?: string;
  customerEmail?: string;
  sessionId: string;
  createdAt: FirebaseFirestore.Timestamp;
  expiresAt: FirebaseFirestore.Timestamp;
  usedAt?: FirebaseFirestore.Timestamp;
  orderId?: string;
  isUsed: boolean;
}

export interface AnalyticsDocument {
  id: string;
  shopDomain: string;
  date: string; // YYYY-MM-DD format
  metrics: {
    totalSessions: number;
    completedSessions: number;
    totalDiscountsGenerated: number;
    totalDiscountsUsed: number;
    totalRevenue: number;
    averageScore: number;
    averageTimeSpent: number;
    conversionRate: number;
    uniqueCustomers: number;
  };
  hourlyBreakdown: Array<{
    hour: number;
    sessions: number;
    completions: number;
    discounts: number;
  }>;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface CustomerDocument {
  id: string;
  shopDomain: string;
  customerId?: string;
  email?: string;
  totalSessions: number;
  totalScore: number;
  bestScore: number;
  totalDiscountsEarned: number;
  totalDiscountsUsed: number;
  firstPlayedAt: FirebaseFirestore.Timestamp;
  lastPlayedAt: FirebaseFirestore.Timestamp;
  preferences: {
    difficulty?: string;
    notifications: boolean;
  };
}
