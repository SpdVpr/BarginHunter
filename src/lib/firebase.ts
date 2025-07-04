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
      console.error('Missing Firebase configuration:', {
        hasPrivateKey: !!privateKey,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
        privateKeyLength: privateKey?.length || 0
      });
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
  subscriptions: 'subscriptions',
  usageTracking: 'usageTracking',
  billingHistory: 'billingHistory',
  notifications: 'notifications',
  adminAnalytics: 'adminAnalytics',
  adminUsers: 'adminUsers',
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
  // Basic subscription info - detailed info in subscriptions collection
  currentPlan: 'free' | 'starter' | 'pro' | 'enterprise';
  subscriptionStatus: 'active' | 'cancelled' | 'past_due' | 'trialing';
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
    displayMode: 'popup' | 'tab' | 'inline' | 'floating_button';
    triggerEvent: 'immediate' | 'scroll' | 'exit_intent' | 'time_delay';
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    showOn: 'all_pages' | 'product_pages' | 'cart_page' | 'checkout_page' | 'collection_pages' | 'custom' | 'url_targeting';
    timeDelay?: number;
    scrollPercentage?: number;
    customPages?: string[];
    targetUrls?: string[];
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
    floatingButton?: {
      text: string;
      icon: string;
      backgroundColor: string;
      textColor: string;
      borderRadius: number;
      size: 'small' | 'medium' | 'large';
      position: {
        desktop: 'top-left' | 'top-right' | 'middle-left' | 'middle-right' | 'bottom-left' | 'bottom-right';
        mobile: 'top-left' | 'top-right' | 'middle-left' | 'middle-right' | 'bottom-left' | 'bottom-right';
      };
      offset: {
        desktop: { x: number; y: number };
        mobile: { x: number; y: number };
      };
      animation: 'none' | 'pulse' | 'bounce' | 'shake';
      showOnHover: boolean;
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

// Subscription management
export interface SubscriptionDocument {
  id: string;
  shopDomain: string;
  shopifyChargeId?: string; // Shopify recurring charge ID
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing' | 'pending';
  billingCycle: 'monthly' | 'yearly';
  price: number;
  currency: string;
  trialEndsAt?: FirebaseFirestore.Timestamp;
  currentPeriodStart: FirebaseFirestore.Timestamp;
  currentPeriodEnd: FirebaseFirestore.Timestamp;
  cancelAtPeriodEnd: boolean;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  planLimits: {
    maxGameSessions: number; // -1 for unlimited
    maxDiscountCodes: number; // -1 for unlimited
    analyticsRetentionDays: number;
    customBranding: boolean;
    advancedAnalytics: boolean;
    prioritySupport: boolean;
    webhookIntegrations: boolean;
    abTesting: boolean;
    multipleGameTypes: boolean;
    fraudProtection: boolean;
  };
}

// Usage tracking for billing limits
export interface UsageTrackingDocument {
  id: string;
  shopDomain: string;
  month: string; // YYYY-MM format
  year: number;
  usage: {
    gameSessions: number;
    discountCodesGenerated: number;
    analyticsRequests: number;
    webhookCalls: number;
    abTestVariants: number;
  };
  limits: {
    maxGameSessions: number;
    maxDiscountCodes: number;
    maxAnalyticsRequests: number;
    maxWebhookCalls: number;
    maxAbTestVariants: number;
  };
  warnings: {
    gameSessionsWarning80: boolean;
    gameSessionsWarning95: boolean;
    discountCodesWarning80: boolean;
    discountCodesWarning95: boolean;
  };
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

// Billing history and transactions
export interface BillingHistoryDocument {
  id: string;
  shopDomain: string;
  shopifyChargeId?: string;
  type: 'subscription' | 'upgrade' | 'downgrade' | 'cancellation' | 'refund';
  amount: number;
  currency: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  description: string;
  billingDate: FirebaseFirestore.Timestamp;
  periodStart: FirebaseFirestore.Timestamp;
  periodEnd: FirebaseFirestore.Timestamp;
  invoiceUrl?: string;
  metadata?: {
    previousPlan?: string;
    newPlan?: string;
    reason?: string;
  };
  createdAt: FirebaseFirestore.Timestamp;
}

// Notifications for billing and usage
export interface NotificationDocument {
  id: string;
  shopDomain: string;
  type: 'usage_warning' | 'usage_limit' | 'billing_reminder' | 'upgrade_suggestion' | 'payment_failed';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  actionRequired: boolean;
  actionUrl?: string;
  actionText?: string;
  metadata?: {
    usageType?: string;
    currentUsage?: number;
    limit?: number;
    suggestedPlan?: string;
  };
  createdAt: FirebaseFirestore.Timestamp;
  readAt?: FirebaseFirestore.Timestamp;
  expiresAt?: FirebaseFirestore.Timestamp;
}

// Admin analytics for business intelligence
export interface AdminAnalyticsDocument {
  id: string;
  date: string; // YYYY-MM-DD format
  metrics: {
    // Revenue metrics
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    newRevenue: number;
    churnedRevenue: number;

    // Customer metrics
    totalShops: number;
    activeShops: number;
    newShops: number;
    churnedShops: number;

    // Plan distribution
    planDistribution: {
      free: number;
      starter: number;
      pro: number;
      enterprise: number;
    };

    // Usage metrics
    totalGameSessions: number;
    totalDiscountCodes: number;
    averageDiscountCodesPerShop: number;

    // Conversion metrics
    freeToStarterConversion: number;
    starterToProConversion: number;
    proToEnterpriseConversion: number;

    // Support metrics
    totalNotifications: number;
    upgradeRecommendations: number;
    limitWarnings: number;
  };

  // Detailed breakdowns
  planMetrics: {
    [planId: string]: {
      count: number;
      revenue: number;
      averageUsage: number;
      churnRate: number;
    };
  };

  // Geographic data
  topCountries: Array<{
    country: string;
    shops: number;
    revenue: number;
  }>;

  // Performance metrics
  systemMetrics: {
    apiCalls: number;
    errorRate: number;
    averageResponseTime: number;
    uptime: number;
  };

  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

// Admin users for access control
export interface AdminUserDocument {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'support';
  permissions: {
    viewAnalytics: boolean;
    manageShops: boolean;
    manageBilling: boolean;
    viewSupport: boolean;
    systemAdmin: boolean;
  };
  lastLoginAt?: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
  isActive: boolean;
}
