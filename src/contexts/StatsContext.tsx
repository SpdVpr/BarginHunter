/** @jsxImportSource react */
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { SharedStats } from '../hooks/useSharedStats';

// Action types
type StatsAction =
  | { type: 'LOAD_START'; shop: string }
  | { type: 'LOAD_SUCCESS'; shop: string; data: SharedStats }
  | { type: 'LOAD_ERROR'; shop: string; error: string }
  | { type: 'INVALIDATE_CACHE'; shop?: string }
  | { type: 'UPDATE_STATS'; shop: string; updates: Partial<SharedStats> };

// State interface
interface StatsState {
  [shop: string]: {
    data: SharedStats | null;
    loading: boolean;
    error: string | null;
    lastUpdated: number;
  };
}

// Context interface
interface StatsContextType {
  getStats: (shop: string) => { data: SharedStats | null; loading: boolean; error: string | null };
  loadStats: (shop: string, forceRefresh?: boolean) => Promise<void>;
  invalidateCache: (shop?: string) => void;
  updateStats: (shop: string, updates: Partial<SharedStats>) => void;
}

// Default stats
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
  today: { sessions: 0, discounts: 0 },
  loading: false,
  error: null,
  lastUpdated: null,
};

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Reducer
function statsReducer(state: StatsState, action: StatsAction): StatsState {
  switch (action.type) {
    case 'LOAD_START':
      return {
        ...state,
        [action.shop]: {
          ...state[action.shop],
          loading: true,
          error: null,
        },
      };

    case 'LOAD_SUCCESS':
      return {
        ...state,
        [action.shop]: {
          data: action.data,
          loading: false,
          error: null,
          lastUpdated: Date.now(),
        },
      };

    case 'LOAD_ERROR':
      return {
        ...state,
        [action.shop]: {
          ...state[action.shop],
          loading: false,
          error: action.error,
        },
      };

    case 'INVALIDATE_CACHE':
      if (action.shop) {
        return {
          ...state,
          [action.shop]: {
            ...state[action.shop],
            lastUpdated: 0,
          },
        };
      } else {
        // Invalidate all caches
        const newState: StatsState = {};
        Object.keys(state).forEach(shop => {
          newState[shop] = {
            ...state[shop],
            lastUpdated: 0,
          };
        });
        return newState;
      }

    case 'UPDATE_STATS':
      const currentData = state[action.shop]?.data || defaultStats;
      return {
        ...state,
        [action.shop]: {
          ...state[action.shop],
          data: {
            ...currentData,
            ...action.updates,
            lastUpdated: new Date(),
          },
          lastUpdated: Date.now(),
        },
      };

    default:
      return state;
  }
}

// Create context
const StatsContext = createContext<StatsContextType | null>(null);

// Provider component
interface StatsProviderProps {
  children: React.ReactNode;
}

export function StatsProvider({ children }: StatsProviderProps) {
  const [state, dispatch] = useReducer(statsReducer, {});

  const getStats = useCallback((shop: string) => {
    const shopState = state[shop];
    return {
      data: shopState?.data || null,
      loading: shopState?.loading || false,
      error: shopState?.error || null,
    };
  }, [state]);

  const loadStats = useCallback(async (shop: string, forceRefresh = false) => {
    if (!shop) return;

    const shopState = state[shop];
    const now = Date.now();
    
    // Check if we have fresh data and don't need to refresh
    if (!forceRefresh && shopState?.data && shopState.lastUpdated && 
        (now - shopState.lastUpdated) < CACHE_DURATION) {
      return;
    }

    // Don't start a new request if one is already in progress
    if (shopState?.loading) {
      return;
    }

    dispatch({ type: 'LOAD_START', shop });

    try {
      const response = await fetch(`/api/dashboard/stats?shop=${shop}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load stats: ${response.statusText}`);
      }

      const data = await response.json();
      
      const statsData: SharedStats = {
        ...data,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      };

      dispatch({ type: 'LOAD_SUCCESS', shop, data: statsData });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'LOAD_ERROR', shop, error: errorMessage });
    }
  }, [state]);

  const invalidateCache = useCallback((shop?: string) => {
    dispatch({ type: 'INVALIDATE_CACHE', shop });
  }, []);

  const updateStats = useCallback((shop: string, updates: Partial<SharedStats>) => {
    dispatch({ type: 'UPDATE_STATS', shop, updates });
  }, []);

  const contextValue: StatsContextType = {
    getStats,
    loadStats,
    invalidateCache,
    updateStats,
  };

  return (
    <StatsContext.Provider value={contextValue}>
      {children}
    </StatsContext.Provider>
  );
}

// Hook to use the context
export function useStatsContext() {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStatsContext must be used within a StatsProvider');
  }
  return context;
}

// Enhanced hook that uses the context
export function useOptimizedStats(shop: string | string[] | undefined) {
  const { getStats, loadStats, invalidateCache, updateStats } = useStatsContext();
  const shopDomain = typeof shop === 'string' ? shop : '';
  
  const { data, loading, error } = getStats(shopDomain);

  // Load stats on mount and when shop changes
  useEffect(() => {
    if (shopDomain) {
      loadStats(shopDomain);
    }
  }, [shopDomain, loadStats]);

  const refreshStats = useCallback(() => {
    if (shopDomain) {
      return loadStats(shopDomain, true);
    }
    return Promise.resolve();
  }, [shopDomain, loadStats]);

  const clearCache = useCallback(() => {
    invalidateCache(shopDomain);
  }, [shopDomain, invalidateCache]);

  const updateStatsData = useCallback((updates: Partial<SharedStats>) => {
    if (shopDomain) {
      updateStats(shopDomain, updates);
    }
  }, [shopDomain, updateStats]);

  return {
    stats: data || defaultStats,
    isLoading: loading,
    error,
    refreshStats,
    clearCache,
    updateStats: updateStatsData,
  };
}
