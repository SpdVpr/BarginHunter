import { useState, useEffect } from 'react';

interface AnalyticsMetrics {
  totalSessions: number;
  completedSessions: number;
  totalDiscounts: number;
  usedDiscounts: number;
  completionRate: number;
  discountUsageRate: number;
  averageScore: number;
  uniqueCustomers: number;
  estimatedRevenue: number;
}

interface TopScore {
  customerEmail: string;
  score: number;
  discount: number;
  achievedAt: string;
}

interface HourlyBreakdown {
  hour: number;
  sessions: number;
  completions: number;
  discounts: number;
}

interface AnalyticsData {
  metrics: AnalyticsMetrics;
  topScores: TopScore[];
  hourlyBreakdown: HourlyBreakdown[];
  sourceBreakdown: Record<string, number>;
}

export function useAnalyticsData(shop: string | string[] | undefined, period: string = '30d') {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shop) return;

    const loadAnalyticsData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/dashboard/analytics?shop=${shop}&period=${period}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load analytics: ${response.statusText}`);
        }

        const data = await response.json();
        setAnalyticsData(data);
      } catch (err) {
        console.error('Error loading analytics data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics data');
        setAnalyticsData(null);
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, [shop, period]);

  const refreshAnalytics = () => {
    if (shop) {
      setLoading(true);
      // Trigger reload by changing a dependency
    }
  };

  return {
    analyticsData,
    loading,
    error,
    refreshAnalytics,
  };
}
