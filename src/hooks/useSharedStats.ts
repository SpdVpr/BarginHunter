import { useState, useEffect, useCallback } from 'react';

// Unified statistics interface
export interface SharedStats {
  // Basic metrics
  totalSessions: number;
  completedSessions: number;
  totalDiscounts: number;
  usedDiscounts: number;
  
  // Calculated rates
  conversionRate: number;
  completionRate: number;
  discountUsageRate: number;
  
  // Score metrics
  averageScore: number;
  totalScore: number;
  
  // Customer metrics
  activeCustomers: number;
  uniqueCustomers: number;
  
  // Revenue metrics
  revenue: number;
  totalOrderValue: number;
  totalDiscountAmount: number;
  
  // Time-based metrics
  today: {
    sessions: number;
    discounts: number;
  };
  
  // Loading states
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Cache for shared statistics
const statsCache = new Map<string, { data: SharedStats; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Default empty stats
const defaultStats: SharedStats = {
  totalSessions: 0,
  completedSessions: 0,
  totalDiscounts: 0,
  usedDiscounts: 0,
  conversionRate: 0,
  completionRate: 0,
  discountUsageRate: 0,
  averageScore: 0,
  totalScore: 0,
  activeCustomers: 0,
  uniqueCustomers: 0,
  revenue: 0,
  totalOrderValue: 0,
  totalDiscountAmount: 0,
  today: {
    sessions: 0,
    discounts: 0,
  },
  loading: false,
  error: null,
  lastUpdated: null,
};

export function useSharedStats(shop: string | string[] | undefined) {
  const [stats, setStats] = useState<SharedStats>(defaultStats);
  const shopDomain = typeof shop === 'string' ? shop : '';

  const loadStats = useCallback(async (forceRefresh = false) => {
    if (!shopDomain) return;

    const cacheKey = `stats-${shopDomain}`;
    const cached = statsCache.get(cacheKey);
    
    // Use cache if available and not expired
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setStats(cached.data);
      return;
    }

    setStats(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`/api/dashboard/stats?shop=${shopDomain}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load stats: ${response.statusText}`);
      }

      const data = await response.json();
      
      const newStats: SharedStats = {
        ...data,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      };

      // Cache the results
      statsCache.set(cacheKey, {
        data: newStats,
        timestamp: Date.now(),
      });

      setStats(newStats);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to load shared stats:', error);
      
      setStats(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, [shopDomain]);

  const refreshStats = useCallback(() => {
    return loadStats(true);
  }, [loadStats]);

  const clearCache = useCallback(() => {
    const cacheKey = `stats-${shopDomain}`;
    statsCache.delete(cacheKey);
  }, [shopDomain]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    refreshStats,
    clearCache,
    isLoading: stats.loading,
    error: stats.error,
  };
}

// Hook for analytics-specific data
export interface AnalyticsData {
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  metrics: {
    totalSessions: number;
    completedSessions: number;
    completionRate: number;
    totalDiscounts: number;
    usedDiscounts: number;
    discountUsageRate: number;
    averageScore: number;
    uniqueCustomers: number;
    estimatedRevenue: number;
  };
  timeSeries: Array<{
    date: string;
    sessions: number;
    completedSessions: number;
    discounts: number;
    usedDiscounts: number;
    averageScore: number;
  }>;
  hourlyBreakdown: Array<{
    hour: number;
    sessions: number;
    completions: number;
    discounts: number;
  }>;
  topScores: Array<{
    customerEmail: string;
    score: number;
    discount: number;
    achievedAt: string;
  }>;
  sourceBreakdown: Record<string, number>;
}

// Cache for analytics data
const analyticsCache = new Map<string, { data: AnalyticsData; timestamp: number }>();
const ANALYTICS_CACHE_DURATION = 3 * 60 * 1000; // 3 minutes

export function useAnalyticsData(shop: string | string[] | undefined, period = '7d') {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shopDomain = typeof shop === 'string' ? shop : '';

  const loadAnalyticsData = useCallback(async (forceRefresh = false) => {
    if (!shopDomain) return;

    const cacheKey = `analytics-${shopDomain}-${period}`;
    const cached = analyticsCache.get(cacheKey);

    // Use cache if available and not expired
    if (!forceRefresh && cached && Date.now() - cached.timestamp < ANALYTICS_CACHE_DURATION) {
      setAnalyticsData(cached.data);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try main analytics API first
      let response = await fetch(`/api/stores/${shopDomain}/analytics?period=${period}`);

      // If main API fails, try simple version
      if (!response.ok) {
        console.log('🔄 Main analytics API failed, trying simple version...');
        response = await fetch(`/api/stores/${shopDomain}/analytics-simple?period=${period}`);
      }

      if (!response.ok) {
        throw new Error(`Failed to load analytics: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache the results
      analyticsCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      setAnalyticsData(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to load analytics data:', error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [shopDomain, period]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  return {
    analyticsData,
    loading,
    error,
    refreshAnalytics: () => loadAnalyticsData(true),
  };
}

// Hook for customers data
export interface CustomersData {
  customers: Array<{
    id: string;
    email?: string;
    customerId?: string;
    totalSessions: number;
    totalScore: number;
    bestScore: number;
    totalDiscountsEarned: number;
    totalDiscountsUsed: number;
    firstPlayedAt: string;
    lastPlayedAt: string;
    averageScore: number;
    discountUsageRate: number;
  }>;
  summary: {
    totalCustomers: number;
    activeCustomers: number;
    totalSessions: number;
    totalDiscountsEarned: number;
    totalDiscountsUsed: number;
    averageScore: number;
    discountUsageRate: number;
  };
}

// Cache for customers data
const customersCache = new Map<string, { data: CustomersData; timestamp: number }>();
const CUSTOMERS_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export function useCustomersData(shop: string | string[] | undefined) {
  const [customersData, setCustomersData] = useState<CustomersData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shopDomain = typeof shop === 'string' ? shop : '';

  const loadCustomersData = useCallback(async (forceRefresh = false) => {
    if (!shopDomain) return;

    const cacheKey = `customers-${shopDomain}`;
    const cached = customersCache.get(cacheKey);

    // Use cache if available and not expired
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CUSTOMERS_CACHE_DURATION) {
      setCustomersData(cached.data);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try main customers API first
      let response = await fetch(`/api/stores/${shopDomain}/customers`);

      // If main API fails, try simple version
      if (!response.ok) {
        console.log('🔄 Main customers API failed, trying simple version...');
        response = await fetch(`/api/stores/${shopDomain}/customers-simple`);
      }

      if (!response.ok) {
        throw new Error(`Failed to load customers: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache the results
      customersCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      setCustomersData(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to load customers data:', error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [shopDomain]);

  useEffect(() => {
    loadCustomersData();
  }, [loadCustomersData]);

  return {
    customersData,
    loading,
    error,
    refreshCustomers: () => loadCustomersData(true),
  };
}
