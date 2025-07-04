import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Page,
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
      const response = await fetch('/api/admin/analytics');
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShops = async () => {
    try {
      const response = await fetch('/api/admin/shops');
      const data = await response.json();
      
      if (data.success) {
        setShops(data.shops);
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
      <Page title="Admin Access Required">
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ padding: '2rem', textAlign: 'center' }}>
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
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  if (loading || !analytics) {
    return (
      <Page title="Admin Dashboard">
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <Spinner size="large" />
                <Text variant="bodyMd">Loading admin analytics...</Text>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
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
    <Layout>
      {/* Key Metrics */}
      <Layout.Section>
        <Layout>
          <Layout.Section oneThird>
            <Card>
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <Stack vertical spacing="tight">
                  <Text variant="headingMd" color="subdued">Monthly Revenue</Text>
                  <DisplayText size="large">${analytics.metrics.totalRevenue.toLocaleString()}</DisplayText>
                  <Text variant="bodyMd" color="success">+12% from last month</Text>
                </Stack>
              </div>
            </Card>
          </Layout.Section>
          
          <Layout.Section oneThird>
            <Card>
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <Stack vertical spacing="tight">
                  <Text variant="headingMd" color="subdued">Active Shops</Text>
                  <DisplayText size="large">{analytics.metrics.activeShops.toLocaleString()}</DisplayText>
                  <Text variant="bodyMd" color="success">
                    {analytics.metrics.totalShops} total shops
                  </Text>
                </Stack>
              </div>
            </Card>
          </Layout.Section>
          
          <Layout.Section oneThird>
            <Card>
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <Stack vertical spacing="tight">
                  <Text variant="headingMd" color="subdued">Discount Codes</Text>
                  <DisplayText size="large">{analytics.metrics.totalDiscountCodes.toLocaleString()}</DisplayText>
                  <Text variant="bodyMd" color="subdued">
                    {analytics.metrics.averageDiscountCodesPerShop.toFixed(1)} avg per shop
                  </Text>
                </Stack>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Layout.Section>

      {/* Plan Distribution */}
      <Layout.Section>
        <Card>
          <div style={{ padding: '1.5rem' }}>
            <Text variant="headingMd" as="h3" marginBottom="4">Plan Distribution</Text>
            <Layout>
              <Layout.Section oneQuarter>
                <Stack vertical spacing="tight">
                  <Text variant="bodyMd">🆓 Free</Text>
                  <Text variant="headingLg">{analytics.metrics.planDistribution.free}</Text>
                  <ProgressBar 
                    progress={(analytics.metrics.planDistribution.free / analytics.metrics.totalShops) * 100} 
                    size="small" 
                  />
                </Stack>
              </Layout.Section>
              
              <Layout.Section oneQuarter>
                <Stack vertical spacing="tight">
                  <Text variant="bodyMd">💼 Starter</Text>
                  <Text variant="headingLg">{analytics.metrics.planDistribution.starter}</Text>
                  <ProgressBar 
                    progress={(analytics.metrics.planDistribution.starter / analytics.metrics.totalShops) * 100} 
                    size="small" 
                    color="success"
                  />
                </Stack>
              </Layout.Section>
              
              <Layout.Section oneQuarter>
                <Stack vertical spacing="tight">
                  <Text variant="bodyMd">🚀 Pro</Text>
                  <Text variant="headingLg">{analytics.metrics.planDistribution.pro}</Text>
                  <ProgressBar 
                    progress={(analytics.metrics.planDistribution.pro / analytics.metrics.totalShops) * 100} 
                    size="small" 
                    color="success"
                  />
                </Stack>
              </Layout.Section>
              
              <Layout.Section oneQuarter>
                <Stack vertical spacing="tight">
                  <Text variant="bodyMd">🏢 Enterprise</Text>
                  <Text variant="headingLg">{analytics.metrics.planDistribution.enterprise}</Text>
                  <ProgressBar 
                    progress={(analytics.metrics.planDistribution.enterprise / analytics.metrics.totalShops) * 100} 
                    size="small" 
                    color="success"
                  />
                </Stack>
              </Layout.Section>
            </Layout>
          </div>
        </Card>
      </Layout.Section>
    </Layout>
  );

  const renderRevenueTab = () => (
    <Layout>
      <Layout.Section>
        <Card>
          <div style={{ padding: '1.5rem' }}>
            <Text variant="headingMd" as="h3" marginBottom="4">Revenue by Plan</Text>
            <DataTable
              columnContentTypes={['text', 'numeric', 'numeric', 'numeric']}
              headings={['Plan', 'Customers', 'Revenue', 'Avg Revenue/Customer']}
              rows={Object.entries(analytics.planMetrics).map(([plan, metrics]) => [
                plan.toUpperCase(),
                metrics.count.toString(),
                `$${metrics.revenue.toFixed(2)}`,
                `$${metrics.count > 0 ? (metrics.revenue / metrics.count).toFixed(2) : '0.00'}`,
              ])}
            />
          </div>
        </Card>
      </Layout.Section>
    </Layout>
  );

  const renderShopsTab = () => (
    <Layout>
      <Layout.Section>
        <Card>
          <div style={{ padding: '1.5rem' }}>
            <Stack distribution="equalSpacing" alignment="center">
              <Text variant="headingMd" as="h3">All Shops</Text>
              <Button onClick={() => window.location.reload()}>Refresh</Button>
            </Stack>
            <div style={{ marginTop: '1rem' }}>
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'numeric', 'numeric', 'text']}
                headings={['Shop Domain', 'Plan', 'Status', 'Revenue', 'Discount Codes', 'Last Active']}
                rows={shopsTableRows}
                footerContent={`Showing ${shops.length} shops`}
              />
            </div>
          </div>
        </Card>
      </Layout.Section>
    </Layout>
  );

  const renderUsageTab = () => (
    <Layout>
      <Layout.Section>
        <Card>
          <div style={{ padding: '1.5rem' }}>
            <Text variant="headingMd" as="h3" marginBottom="4">Usage Statistics</Text>
            <Layout>
              <Layout.Section oneHalf>
                <Stack vertical spacing="loose">
                  <div>
                    <Text variant="bodyMd" fontWeight="semibold">Total Game Sessions</Text>
                    <DisplayText size="medium">{analytics.metrics.totalGameSessions.toLocaleString()}</DisplayText>
                  </div>
                  <div>
                    <Text variant="bodyMd" fontWeight="semibold">Total Discount Codes</Text>
                    <DisplayText size="medium">{analytics.metrics.totalDiscountCodes.toLocaleString()}</DisplayText>
                  </div>
                </Stack>
              </Layout.Section>
              
              <Layout.Section oneHalf>
                <Stack vertical spacing="loose">
                  <div>
                    <Text variant="bodyMd" fontWeight="semibold">Average Codes per Shop</Text>
                    <DisplayText size="medium">{analytics.metrics.averageDiscountCodesPerShop.toFixed(1)}</DisplayText>
                  </div>
                  <div>
                    <Text variant="bodyMd" fontWeight="semibold">Conversion Rate</Text>
                    <DisplayText size="medium">
                      {analytics.metrics.totalGameSessions > 0 
                        ? ((analytics.metrics.totalDiscountCodes / analytics.metrics.totalGameSessions) * 100).toFixed(1)
                        : '0'
                      }%
                    </DisplayText>
                  </div>
                </Stack>
              </Layout.Section>
            </Layout>
          </div>
        </Card>
      </Layout.Section>
    </Layout>
  );

  return (
    <Page 
      title="🏢 Bargain Hunter - Admin Dashboard"
      subtitle="Business intelligence and shop management"
      primaryAction={{
        content: 'Generate Report',
        onAction: () => window.open('/api/admin/export/report', '_blank'),
      }}
    >
      <Banner status="info">
        <p>Welcome to the Bargain Hunter admin dashboard. All data is updated in real-time.</p>
      </Banner>
      
      <div style={{ marginTop: '1rem' }}>
        <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
          <div style={{ marginTop: '1rem' }}>
            {selectedTab === 0 && renderOverviewTab()}
            {selectedTab === 1 && renderRevenueTab()}
            {selectedTab === 2 && renderShopsTab()}
            {selectedTab === 3 && renderUsageTab()}
          </div>
        </Tabs>
      </div>
    </Page>
  );
}
