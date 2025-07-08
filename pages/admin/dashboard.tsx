import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Layout,
  Card,
  Text,
  Button,
  Stack,
  Badge,
  DataTable,
  Banner,
  Spinner,
  Tabs,
  ProgressBar,
  DisplayText,
} from '@shopify/polaris';
import { AdminDashboardLayout } from '../../src/components/dashboard/ModernDashboardLayout';
import { ResponsiveAdminStats, ResponsiveDataTable } from '../../src/components/admin/ResponsiveAdminStats';
import styles from '../../src/styles/AdminDashboard.module.css';

interface AdminAnalytics {
  metrics: {
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    totalShops: number;
    activeShops: number;
    planDistribution: {
      free: number;
      starter: number;
      pro: number;
      enterprise: number;
    };
    totalGameSessions: number;
    totalDiscountCodes: number;
    averageDiscountCodesPerShop: number;
  };
  planMetrics: {
    [key: string]: {
      count: number;
      revenue: number;
      averageUsage: number;
    };
  };
}

interface ShopData {
  shopDomain: string;
  plan: string;
  status: string;
  revenue: number;
  discountCodes: number;
  lastActive: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [shops, setShops] = useState<ShopData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalytics();
      fetchShops();
    }
  }, [isAuthenticated]);

  const checkAuthentication = async () => {
    try {
      const response = await fetch('/api/admin/auth/check');
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/analytics', {
        headers: {
          'x-admin-email': 'admin@bargainhunter.com', // Add admin email header
        },
      });
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        console.error('Analytics fetch failed:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShops = async () => {
    try {
      const response = await fetch('/api/admin/shops', {
        headers: {
          'x-admin-email': 'admin@bargainhunter.com', // Add admin email header
        },
      });
      const data = await response.json();

      if (data.success) {
        setShops(data.shops);
      } else {
        console.error('Shops fetch failed:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch shops:', error);
    }
  };

  const handleLogin = () => {
    window.location.href = '/api/admin/auth/login';
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spinner size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdminDashboardLayout title="Admin Access Required">
        <div className={styles.adminDashboard}>
          <div className={styles.errorContainer}>
            <Stack vertical spacing="loose">
              <DisplayText size="medium">🔐 Admin Dashboard</DisplayText>
              <Text variant="bodyMd">
                This area is restricted to authorized administrators only.
              </Text>
              <Button primary onClick={handleLogin}>
                Login as Admin
              </Button>
            </Stack>
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  if (loading || !analytics) {
    return (
      <AdminDashboardLayout title="Admin Dashboard">
        <div className={styles.adminDashboard}>
          <div className={styles.loadingContainer}>
            <Spinner size="large" />
            <Text variant="bodyMd">Loading admin analytics...</Text>
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  const tabs = [
    { id: 'overview', content: 'Overview' },
    { id: 'revenue', content: 'Revenue' },
    { id: 'shops', content: 'Shops' },
    { id: 'usage', content: 'Usage' },
  ];

  const shopsTableRows = shops.map((shop) => [
    shop.shopDomain,
    <Badge key={shop.plan} status={shop.plan === 'free' ? 'info' : 'success'}>
      {shop.plan.toUpperCase()}
    </Badge>,
    <Badge key={shop.status} status={shop.status === 'active' ? 'success' : 'warning'}>
      {shop.status}
    </Badge>,
    `$${shop.revenue.toFixed(2)}`,
    shop.discountCodes.toLocaleString(),
    shop.lastActive,
  ]);

  const renderOverviewTab = () => (
    <ResponsiveAdminStats metrics={analytics.metrics} />
  );

  const renderRevenueTab = () => (
    <ResponsiveDataTable
      title="💰 Revenue by Plan"
      columnContentTypes={['text', 'numeric', 'numeric', 'numeric']}
      headings={['Plan', 'Customers', 'Revenue', 'Avg Revenue/Customer']}
      rows={Object.entries(analytics.planMetrics).map(([plan, metrics]) => [
        plan.toUpperCase(),
        metrics.count.toString(),
        `$${metrics.revenue.toFixed(2)}`,
        `$${metrics.count > 0 ? (metrics.revenue / metrics.count).toFixed(2) : '0.00'}`,
      ])}
    />
  );

  const renderShopsTab = () => (
    <ResponsiveDataTable
      title="🏪 All Shops"
      columnContentTypes={['text', 'text', 'text', 'numeric', 'numeric', 'text']}
      headings={['Shop Domain', 'Plan', 'Status', 'Revenue', 'Discount Codes', 'Last Active']}
      rows={shopsTableRows}
      footerContent={`Showing ${shops.length} shops`}
      actions={<Button onClick={() => window.location.reload()}>Refresh</Button>}
    />
  );

  const renderUsageTab = () => (
    <div>
      <div className={styles.adminCard}>
        <div className={styles.adminCardHeader}>
          <Text variant="headingMd" as="h3">📊 Usage Statistics</Text>
        </div>
        <div className={styles.adminCardContent}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div className={styles.adminStatCard}>
              <Stack vertical spacing="loose">
                <div>
                  <Text variant="bodyMd" fontWeight="semibold">🎮 Total Game Sessions</Text>
                  <DisplayText size="medium">{analytics.metrics.totalGameSessions.toLocaleString()}</DisplayText>
                </div>
                <div>
                  <Text variant="bodyMd" fontWeight="semibold">🎫 Total Discount Codes</Text>
                  <DisplayText size="medium">{analytics.metrics.totalDiscountCodes.toLocaleString()}</DisplayText>
                </div>
              </Stack>
            </div>

            <div className={styles.adminStatCard}>
              <Stack vertical spacing="loose">
                <div>
                  <Text variant="bodyMd" fontWeight="semibold">📈 Average Codes per Shop</Text>
                  <DisplayText size="medium">{analytics.metrics.averageDiscountCodesPerShop.toFixed(1)}</DisplayText>
                </div>
                <div>
                  <Text variant="bodyMd" fontWeight="semibold">🎯 Conversion Rate</Text>
                  <DisplayText size="medium">
                    {analytics.metrics.totalGameSessions > 0
                      ? ((analytics.metrics.totalDiscountCodes / analytics.metrics.totalGameSessions) * 100).toFixed(1)
                      : '0'
                    }%
                  </DisplayText>
                </div>
              </Stack>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AdminDashboardLayout
      title="🏢 Bargain Hunter - Admin Dashboard"
      subtitle="Business intelligence and shop management"
    >
      <div className={`${styles.adminDashboard} admin-dashboard-page`}>
        {/* Modern Header */}
        <div className={styles.adminHeader}>
          <div className={styles.adminHeaderContent}>
            <div className={styles.adminTitle}>
              <Text variant="headingXl" as="h1" color="subdued">
                🏢 Bargain Hunter - Admin Dashboard
              </Text>
              <Text variant="bodyMd" as="p" color="subdued">
                Business intelligence and shop management
              </Text>
            </div>
            <div className={styles.adminActions}>
              <Button
                onClick={() => window.open('/api/admin/export/report', '_blank')}
              >
                Generate Report
              </Button>
            </div>
          </div>
        </div>

        {/* Banner */}
        <div className={styles.adminBanner}>
          <Banner status="info">
            <p>Welcome to the Bargain Hunter admin dashboard. All data is updated in real-time.</p>
          </Banner>
        </div>

        {/* Modern Tabs */}
        <div className={styles.adminTabsContainer}>
          <div className={styles.adminTabsContent}>
            <Tabs
              tabs={tabs}
              selected={selectedTab}
              onSelect={setSelectedTab}
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className={styles.adminContent}>
          {selectedTab === 0 && renderOverviewTab()}
          {selectedTab === 1 && renderRevenueTab()}
          {selectedTab === 2 && renderShopsTab()}
          {selectedTab === 3 && renderUsageTab()}
        </div>
      </div>
    </AdminDashboardLayout>
  );
}
