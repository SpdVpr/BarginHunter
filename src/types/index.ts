// Core application types based on the specification

export interface GameState {
  isRunning: boolean;
  isPaused: boolean;
  score: number;
  distance: number;
  currentPhase: number;
  timeElapsed: number;
  powerUpsActive: PowerUp[];
}

export interface PowerUp {
  type: 'invincibility' | 'speed_boost' | 'score_multiplier';
  duration: number;
  startTime: number;
}

export interface PlayerEntity {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
  isJumping: boolean;
  isSliding: boolean;
  animationFrame: number;
}

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

export interface Obstacle extends GameObject {
  type: 'obstacle';
  obstacleType: 'cart' | 'queue' | 'fallen_goods' | 'wet_floor' | 'terminal';
}

export interface Collectible extends GameObject {
  type: 'collectible';
  collectibleType: 'discount_tag' | 'coin' | 'vip_pass' | 'mystery_box';
  discountValue?: number;
}

export interface DiscountTier {
  minScore: number;
  discount: number;
  message: string;
}

export interface GameConfiguration {
  isEnabled: boolean;
  minScoreForDiscount: number;
  maxPlaysPerCustomer: number;
  maxPlaysPerDay: number;
  discountTiers: DiscountTier[];
  gameSpeed: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ShopSettings {
  shopDomain: string;
  shopifyShopId: string;
  shopOwnerEmail: string;
  planType: 'free' | 'pro' | 'enterprise';
  isActive: boolean;
  installedAt: Date;
  lastActiveAt: Date;
  gameSettings: GameConfiguration;
  widgetSettings: WidgetConfiguration;
  appearance: AppearanceSettings;
  businessRules: BusinessRules;
}

export interface WidgetConfiguration {
  displayMode: 'popup' | 'floating_button';
  triggerEvent: 'immediate' | 'exit_intent' | 'time_delay' | 'scroll';
  triggerDelay?: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  showOn: 'all_pages' | 'product_pages' | 'collection_pages' | 'cart_page' | 'checkout_page' | 'custom' | 'url_targeting';
  customPages?: string[];
  targetUrls?: string[]; // URLs where widget should appear as popup
  // New targeting options
  userPercentage: number; // 0-100% of users who will see the widget
  testMode: boolean; // Enable test mode for debugging
  showDelay: number; // Delay in seconds before showing widget
  pageLoadTrigger: 'immediate' | 'after_delay' | 'on_scroll' | 'on_exit_intent';
  // Floating button configuration
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
  // Advanced targeting
  deviceTargeting: 'all' | 'desktop' | 'mobile' | 'tablet';
  geoTargeting?: string[]; // Country codes
  timeBasedRules?: {
    enabled: boolean;
    startTime?: string; // HH:MM format
    endTime?: string; // HH:MM format
    timezone?: string;
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  };
}

export interface AppearanceSettings {
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  customCSS?: string;
  backgroundTheme: 'default' | 'dark' | 'custom';
  customBackgroundUrl?: string;
}

export interface BusinessRules {
  excludeDiscountedProducts: boolean;
  minimumOrderAmount?: number;
  allowStackingDiscounts: boolean;
  discountExpiryHours: number;
  productCollections?: string[];
}

export interface GameSession {
  sessionId: string;
  customerId?: string;
  customerEmail?: string;
  ipAddress: string;
  userAgent: string;
  startedAt: Date;
  finishedAt?: Date;
  finalScore: number;
  maxCombo: number;
  distanceTraveled: number;
  objectsCollected: number;
  obstaclesHit: number;
  powerUpsUsed: number;
  discountEarned: number;
  discountCode?: string;
  discountUsed: boolean;
  discountUsedAt?: Date;
  orderValue?: number;
  gameVersion: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  browserType: string;
  sessionDuration: number;
  source: 'popup' | 'tab' | 'inline';
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface DiscountCode {
  code: string;
  discountPercent: number;
  discountAmount?: number;
  shopifyDiscountId: string;
  isUsed: boolean;
  usedAt?: Date;
  usedByCustomer?: string;
  orderIds?: string[];
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  gameSessionId: string;
  earnedScore: number;
  usageLimit: number;
  minimumOrderAmount?: number;
  applicableProducts?: string[];
  applicableCollections?: string[];
}

export interface DailyAnalytics {
  date: string;
  totalGames: number;
  uniquePlayers: number;
  averageScore: number;
  averageSessionDuration: number;
  totalDistanceTraveled: number;
  discountsGenerated: number;
  discountsUsed: number;
  conversionRate: number;
  totalRevenue: number;
  revenueFromGamers: number;
  averageOrderValue: number;
  revenuePerPlay: number;
  bounceRate: number;
  returnPlayerRate: number;
  shareRate: number;
  crashRate: number;
  averageLoadTime: number;
  mobileVsDesktop: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  topScores: Array<{
    score: number;
    customerId?: string;
    sessionId: string;
  }>;
  errors: Array<{
    type: string;
    count: number;
    lastOccurrence: Date;
  }>;
}
