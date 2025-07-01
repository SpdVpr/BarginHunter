// API Request and Response types

// Shopify Store Types
export interface ShopifyStore {
  id: string;
  shopDomain: string;
  accessToken: string;
  scopes: string[];
  isActive: boolean;
  installedAt: Date;
  updatedAt: Date;
  shopData: {
    name: string;
    email: string;
    domain: string;
    currency: string;
    timezone: string;
    plan_name: string;
  };
}

// Authentication
export interface InstallRequest {
  shop: string;
  hmac: string;
  timestamp: string;
  state: string;
}

export interface InstallResponse {
  success: boolean;
  authUrl: string;
  error?: string;
}

export interface CallbackRequest {
  shop: string;
  code: string;
  state: string;
  hmac: string;
  timestamp: string;
}

export interface CallbackResponse {
  success: boolean;
  accessToken?: string;
  shopData?: any;
  error?: string;
}

export interface SessionVerifyResponse {
  isValid: boolean;
  shop?: string;
  scopes?: string[];
  expiresAt?: number;
}

// Game API
export interface StartGameRequest {
  shopDomain: string;
  customerData?: {
    id?: string;
    email?: string;
  };
  source: 'popup' | 'tab' | 'inline';
  referrer?: string;
}

export interface StartGameResponse {
  success: boolean;
  sessionId: string;
  gameConfig: any;
  canPlay: boolean;
  playsRemaining?: number;
  error?: string;
  reason?: string;
  // Play limit details
  playsUsed?: number;
  maxPlays?: number;
  nextResetTime?: string;
  resetHours?: number;
}

export interface FinishGameRequest {
  sessionId: string;
  finalScore: number;
  gameData: {
    duration: number;
    objectsCollected: number;
    obstaclesHit: number;
    maxCombo: number;
    distanceTraveled: number;
  };
  playerEmail?: string;
}

export interface FinishGameResponse {
  success: boolean;
  discountEarned: number;
  discountCode?: string;
  expiresAt?: string;
  message: string;
  nextTierScore?: number;
  error?: string;
}

export interface ValidatePlayRequest {
  shopDomain: string;
  customerIdentifier: string;
}

export interface ValidatePlayResponse {
  canPlay: boolean;
  reason?: 'daily_limit' | 'rate_limit' | 'shop_inactive';
  playsRemaining: number;
  nextPlayAvailable?: string;
}

export interface LeaderboardResponse {
  success: boolean;
  leaderboard: Array<{
    rank: number;
    score: number;
    playerName: string;
    achievedAt: string;
  }>;
  playerRank?: number;
  totalPlayers: number;
}

// Admin API
export interface GetSettingsResponse {
  success: boolean;
  settings: any;
  error?: string;
}

export interface UpdateSettingsRequest {
  gameSettings?: Partial<any>;
  widgetSettings?: Partial<any>;
  appearance?: Partial<any>;
  businessRules?: Partial<any>;
}

export interface UpdateSettingsResponse {
  success: boolean;
  updatedSettings: any;
  error?: string;
}

export interface AnalyticsRequest {
  period: 'today' | 'week' | 'month' | 'quarter' | 'year';
  startDate?: string;
  endDate?: string;
  metrics?: string[];
}

export interface AnalyticsResponse {
  success: boolean;
  data: {
    overview: {
      totalGames: number;
      totalRevenue: number;
      conversionRate: number;
      averageOrderValue: number;
    };
    timeSeries: Array<{
      date: string;
      games: number;
      revenue: number;
      conversions: number;
    }>;
    topScores: Array<{
      score: number;
      date: string;
      discount: number;
    }>;
    demographics: {
      deviceTypes: Record<string, number>;
      referrers: Record<string, number>;
      geolocations: Record<string, number>;
    };
  };
  error?: string;
}

export interface DiscountCodesRequest {
  page?: number;
  limit?: number;
  status?: 'all' | 'used' | 'unused' | 'expired';
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface DiscountCodesResponse {
  success: boolean;
  codes: any[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
  summary: {
    totalGenerated: number;
    totalUsed: number;
    totalRevenue: number;
    averageDiscount: number;
  };
}

// Shopify Integration
export interface CreateDiscountRequest {
  shop: string;
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  value: number;
  usageLimit?: number;
  expiresAt?: string;
  minimumOrderAmount?: number;
  applicableProducts?: string[];
  applicableCollections?: string[];
}

export interface CreateDiscountResponse {
  success: boolean;
  shopifyDiscountId?: string;
  discountCode?: string;
  error?: string;
}

export interface DiscountUsageResponse {
  success: boolean;
  usageCount: number;
  orders: Array<{
    orderId: string;
    orderNumber: string;
    totalPrice: string;
    createdAt: string;
    customerEmail?: string;
  }>;
}

export interface InstallWidgetRequest {
  shop: string;
  widgetSettings: any;
}

export interface InstallWidgetResponse {
  success: boolean;
  scriptTagId?: string;
  widgetUrl?: string;
  error?: string;
}

export interface UpdateWidgetRequest {
  shop: string;
  scriptTagId: string;
  newSettings: any;
}

// Webhook types
export interface AppUninstalledWebhook {
  shop_domain: string;
  shop_id: number;
}

export interface OrderCreatedWebhook {
  id: number;
  order_number: string;
  total_price: string;
  discount_codes: Array<{
    code: string;
    amount: string;
    type: string;
  }>;
  customer?: {
    id: number;
    email: string;
  };
  created_at: string;
}

// Error types
export interface APIError {
  code: string;
  message: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}
