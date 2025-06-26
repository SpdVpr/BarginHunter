/** @jsxImportSource react */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  Badge,
  DataTable,
  Tabs,
  Stack,
  Heading,
  Banner,
  Spinner,
  Frame,
  TopBar,
  Navigation,
} from '@shopify/polaris';
import {
  HomeMinor,
  SettingsMinor,
  AnalyticsMinor,
  CustomersMinor,
  DiscountsMajor,
  GamesConsoleMajor,
} from '@shopify/polaris-icons';

interface DashboardStats {
  totalSessions: number;
  completedSessions: number;
  totalDiscounts: number;
  usedDiscounts: number;
  conversionRate: number;
  averageScore: number;
  activeCustomers: number;
  revenue: number;
}

interface RecentSession {
  id: string;
  customerEmail: string;
  score: number;
  discount: number;
  completedAt: string;
  status: 'completed' | 'abandoned';
}

export default function Dashboard() {
  const router = useRouter();
  const { shop } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [mobileNavigationActive, setMobileNavigationActive] = useState(false);

  useEffect(() => {
    if (shop) {
      loadDashboardData();
    }
  }, [shop]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load dashboard statistics
      const statsResponse = await fetch(`/api/dashboard/stats?shop=${shop}`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Load recent sessions
      const sessionsResponse = await fetch(`/api/dashboard/sessions?shop=${shop}&limit=10`);
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setRecentSessions(sessionsData.sessions || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMobileNavigation = () => {
    setMobileNavigationActive(!mobileNavigationActive);
  };

  const navigationMarkup = (
    <Navigation location="/">
      <Navigation.Section
        items={[
          {
            url: `/dashboard?shop=${shop}`,
            label: 'Dashboard',
            icon: HomeMinor,
            selected: selectedTab === 0,
          },
          {
            url: `/dashboard/analytics?shop=${shop}`,
            label: 'Analytics',
            icon: AnalyticsMinor,
            selected: selectedTab === 1,
          },
          {
            url: `/dashboard/customers?shop=${shop}`,
            label: 'Customers',
            icon: CustomersMinor,
            selected: selectedTab === 2,
          },
          {
            url: `/dashboard/discounts?shop=${shop}`,
            label: 'Discounts',
            icon: DiscountsMajor,
            selected: selectedTab === 3,
          },
          {
            url: `/dashboard/settings?shop=${shop}`,
            label: 'Settings',
            icon: SettingsMinor,
            selected: selectedTab === 4,
          },
        ]}
      />
    </Navigation>
  );

  const topBarMarkup = (
    <TopBar
      showNavigationToggle
      onNavigationToggle={toggleMobileNavigation}
    />
  );

  const tabs = [
    { id: 'overview', content: 'Overview' },
    { id: 'analytics', content: 'Analytics' },
    { id: 'customers', content: 'Customers' },
    { id: 'discounts', content: 'Discounts' },
    { id: 'settings', content: 'Settings' },
  ];

  const recentSessionsRows = recentSessions.map((session) => [
    session.customerEmail || 'Anonymous',
    session.score.toString(),
    session.discount > 0 ? `${session.discount}%` : 'No discount',
    <Badge status={session.status === 'completed' ? 'success' : 'attention'}>
      {session.status}
    </Badge>,
    new Date(session.completedAt).toLocaleDateString(),
  ]);

  if (loading) {
    return (
      <Frame>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="large" />
          <Text variant="bodyMd" as="p" color="subdued">
            Loading dashboard...
          </Text>
        </div>
      </Frame>
    );
  }

  return (
    <Frame
      topBar={topBarMarkup}
      navigation={navigationMarkup}
      showMobileNavigation={mobileNavigationActive}
      onNavigationDismiss={toggleMobileNavigation}
    >
      <Page
        title="Bargain Hunter Dashboard"
        subtitle={`Store: ${shop}`}
        primaryAction={{
          content: 'Configure Widget',
          onAction: () => router.push(`/dashboard/settings?shop=${shop}`),
        }}
        secondaryActions={[
          {
            content: 'Test Game',
            onAction: () => window.open(`/widget/game?shop=${shop}`, '_blank'),
          },
          {
            content: 'Analytics',
            onAction: () => router.push(`/dashboard/analytics?shop=${shop}`),
          },
        ]}
      >
        <Layout>
          <Layout.Section>
            <Banner
              title="Welcome to Bargain Hunter!"
              status="info"
              onDismiss={() => {}}
            >
              <p>
                Your gamified discount system is active. Monitor performance and
                customize settings to maximize engagement.
              </p>
            </Banner>
          </Layout.Section>

          <Layout.Section>
            <Card sectioned>
              <Stack distribution="equalSpacing" alignment="center">
                <Stack vertical spacing="tight">
                  <Text variant="headingMd" as="h3">Quick Controls</Text>
                  <Text variant="bodyMd" as="p" color="subdued">
                    Manage your widget settings and test functionality
                  </Text>
                </Stack>
                <Stack spacing="tight">
                  <Button
                    primary
                    onClick={() => router.push(`/dashboard/settings?shop=${shop}`)}
                  >
                    Widget Settings
                  </Button>
                  <Button
                    onClick={() => window.open(`/widget/game?shop=${shop}&test=true`, '_blank')}
                  >
                    Test Widget
                  </Button>
                  <Button
                    onClick={() => router.push(`/dashboard/analytics?shop=${shop}`)}
                  >
                    View Analytics
                  </Button>
                </Stack>
              </Stack>
            </Card>
          </Layout.Section>

          {stats && (
            <>
              <Layout.Section>
                <Layout>
                  <Layout.Section oneThird>
                    <Card>
                      <div style={{ padding: '1rem' }}>
                        <Stack vertical spacing="tight">
                          <Text variant="headingMd" as="h3">
                            Game Sessions
                          </Text>
                          <Text variant="heading2xl" as="p">
                            {stats.totalSessions}
                          </Text>
                          <Text variant="bodyMd" as="p" color="subdued">
                            {stats.completedSessions} completed ({Math.round((stats.completedSessions / stats.totalSessions) * 100)}%)
                          </Text>
                        </Stack>
                      </div>
                    </Card>
                  </Layout.Section>

                  <Layout.Section oneThird>
                    <Card>
                      <div style={{ padding: '1rem' }}>
                        <Stack vertical spacing="tight">
                          <Text variant="headingMd" as="h3">
                            Discounts Generated
                          </Text>
                          <Text variant="heading2xl" as="p">
                            {stats.totalDiscounts}
                          </Text>
                          <Text variant="bodyMd" as="p" color="subdued">
                            {stats.usedDiscounts} used ({Math.round((stats.usedDiscounts / stats.totalDiscounts) * 100)}%)
                          </Text>
                        </Stack>
                      </div>
                    </Card>
                  </Layout.Section>

                  <Layout.Section oneThird>
                    <Card>
                      <div style={{ padding: '1rem' }}>
                        <Stack vertical spacing="tight">
                          <Text variant="headingMd" as="h3">
                            Conversion Rate
                          </Text>
                          <Text variant="heading2xl" as="p">
                            {stats.conversionRate.toFixed(1)}%
                          </Text>
                          <Text variant="bodyMd" as="p" color="subdued">
                            Average score: {stats.averageScore}
                          </Text>
                        </Stack>
                      </div>
                    </Card>
                  </Layout.Section>
                </Layout>
              </Layout.Section>

              <Layout.Section>
                <Card>
                  <div style={{ padding: '1rem' }}>
                    <Stack vertical spacing="loose">
                      <Heading>Recent Game Sessions</Heading>
                      <DataTable
                        columnContentTypes={['text', 'numeric', 'text', 'text', 'text']}
                        headings={['Customer', 'Score', 'Discount', 'Status', 'Date']}
                        rows={recentSessionsRows}
                        footerContent={`Showing ${recentSessions.length} of ${stats.totalSessions} sessions`}
                      />
                    </Stack>
                  </div>
                </Card>
              </Layout.Section>
            </>
          )}

          <Layout.Section>
            <Card>
              <div style={{ padding: '1rem' }}>
                <Stack vertical spacing="loose">
                  <Heading>Quick Actions</Heading>
                  <Stack>
                    <Button
                      primary
                      onClick={() => router.push(`/dashboard/settings?shop=${shop}`)}
                    >
                      Configure Game Settings
                    </Button>
                    <Button
                      onClick={() => router.push(`/dashboard/analytics?shop=${shop}`)}
                    >
                      View Analytics
                    </Button>
                    <Button
                      onClick={() => window.open(`/widget/game?shop=${shop}`, '_blank')}
                    >
                      Test Game
                    </Button>
                  </Stack>
                </Stack>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  );
}
