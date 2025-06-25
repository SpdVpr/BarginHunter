import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Page,
  Layout,
  Card,
  Text,
  Select,
  DataTable,
  Stack,
  Heading,
  Spinner,
  Frame,
  TopBar,
  Navigation,
  Badge,
  ProgressBar,
} from '@shopify/polaris';
import {
  HomeMinor,
  SettingsMinor,
  AnalyticsMinor,
  CustomersMinor,
  DiscountsMajor,
} from '@shopify/polaris-icons';

interface AnalyticsData {
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

export default function Analytics() {
  const router = useRouter();
  const { shop } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [mobileNavigationActive, setMobileNavigationActive] = useState(false);

  useEffect(() => {
    if (shop) {
      loadAnalyticsData();
    }
  }, [shop, selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stores/${shop}/analytics?period=${selectedPeriod}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
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
          },
          {
            url: `/dashboard/analytics?shop=${shop}`,
            label: 'Analytics',
            icon: AnalyticsMinor,
            selected: true,
          },
          {
            url: `/dashboard/customers?shop=${shop}`,
            label: 'Customers',
            icon: CustomersMinor,
          },
          {
            url: `/dashboard/discounts?shop=${shop}`,
            label: 'Discounts',
            icon: DiscountsMajor,
          },
          {
            url: `/dashboard/settings?shop=${shop}`,
            label: 'Settings',
            icon: SettingsMinor,
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

  const periodOptions = [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
    { label: 'Last year', value: '1y' },
  ];

  const topScoresRows = analyticsData?.topScores.map((score) => [
    score.customerEmail,
    score.score.toString(),
    `${score.discount}%`,
    new Date(score.achievedAt).toLocaleDateString(),
  ]) || [];

  const hourlyRows = analyticsData?.hourlyBreakdown.map((hour) => [
    `${hour.hour}:00`,
    hour.sessions.toString(),
    hour.completions.toString(),
    hour.discounts.toString(),
    hour.sessions > 0 ? `${Math.round((hour.completions / hour.sessions) * 100)}%` : '0%',
  ]) || [];

  if (loading) {
    return (
      <Frame>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="large" />
          <Text variant="bodyMd" as="p" color="subdued">
            Loading analytics...
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
        title="Analytics"
        subtitle={`Performance insights for ${shop}`}
        primaryAction={{
          content: 'Export Data',
          onAction: () => {
            // TODO: Implement data export
            console.log('Export analytics data');
          },
        }}
      >
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <Stack>
                <Heading>Time Period</Heading>
                <Select
                  label=""
                  options={periodOptions}
                  value={selectedPeriod}
                  onChange={setSelectedPeriod}
                />
              </Stack>
            </Card>
          </Layout.Section>

          {analyticsData && (
            <>
              <Layout.Section>
                <Layout>
                  <Layout.Section oneHalf>
                    <Card>
                      <div style={{ padding: '1rem' }}>
                        <Stack vertical spacing="tight">
                          <Text variant="headingMd" as="h3">
                            Game Performance
                          </Text>
                          <Text variant="heading2xl" as="p">
                            {analyticsData.metrics.completionRate.toFixed(1)}%
                          </Text>
                          <Text variant="bodyMd" as="p" color="subdued">
                            Completion Rate
                          </Text>
                          <ProgressBar 
                            progress={analyticsData.metrics.completionRate} 
                            size="small" 
                          />
                          <Text variant="bodyMd" as="p" color="subdued">
                            {analyticsData.metrics.completedSessions} of {analyticsData.metrics.totalSessions} sessions completed
                          </Text>
                        </Stack>
                      </div>
                    </Card>
                  </Layout.Section>

                  <Layout.Section oneHalf>
                    <Card>
                      <div style={{ padding: '1rem' }}>
                        <Stack vertical spacing="tight">
                          <Text variant="headingMd" as="h3">
                            Discount Usage
                          </Text>
                          <Text variant="heading2xl" as="p">
                            {analyticsData.metrics.discountUsageRate.toFixed(1)}%
                          </Text>
                          <Text variant="bodyMd" as="p" color="subdued">
                            Usage Rate
                          </Text>
                          <ProgressBar 
                            progress={analyticsData.metrics.discountUsageRate} 
                            size="small" 
                          />
                          <Text variant="bodyMd" as="p" color="subdued">
                            {analyticsData.metrics.usedDiscounts} of {analyticsData.metrics.totalDiscounts} discounts used
                          </Text>
                        </Stack>
                      </div>
                    </Card>
                  </Layout.Section>
                </Layout>
              </Layout.Section>

              <Layout.Section>
                <Layout>
                  <Layout.Section oneThird>
                    <Card>
                      <div style={{ padding: '1rem' }}>
                        <Stack vertical spacing="tight">
                          <Text variant="headingMd" as="h3">
                            Average Score
                          </Text>
                          <Text variant="heading2xl" as="p">
                            {Math.round(analyticsData.metrics.averageScore)}
                          </Text>
                          <Text variant="bodyMd" as="p" color="subdued">
                            Points per completed game
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
                            Unique Players
                          </Text>
                          <Text variant="heading2xl" as="p">
                            {analyticsData.metrics.uniqueCustomers}
                          </Text>
                          <Text variant="bodyMd" as="p" color="subdued">
                            Individual customers
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
                            Est. Revenue
                          </Text>
                          <Text variant="heading2xl" as="p">
                            ${analyticsData.metrics.estimatedRevenue.toFixed(0)}
                          </Text>
                          <Text variant="bodyMd" as="p" color="subdued">
                            From discount usage
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
                      <Heading>Top Scores</Heading>
                      <DataTable
                        columnContentTypes={['text', 'numeric', 'text', 'text']}
                        headings={['Customer', 'Score', 'Discount', 'Date']}
                        rows={topScoresRows}
                        footerContent={`Showing top ${analyticsData.topScores.length} scores`}
                      />
                    </Stack>
                  </div>
                </Card>
              </Layout.Section>

              <Layout.Section>
                <Card>
                  <div style={{ padding: '1rem' }}>
                    <Stack vertical spacing="loose">
                      <Heading>Hourly Activity</Heading>
                      <DataTable
                        columnContentTypes={['text', 'numeric', 'numeric', 'numeric', 'text']}
                        headings={['Hour', 'Sessions', 'Completions', 'Discounts', 'Completion Rate']}
                        rows={hourlyRows}
                        footerContent="24-hour activity breakdown"
                      />
                    </Stack>
                  </div>
                </Card>
              </Layout.Section>

              <Layout.Section>
                <Card>
                  <div style={{ padding: '1rem' }}>
                    <Stack vertical spacing="loose">
                      <Heading>Traffic Sources</Heading>
                      <Stack>
                        {Object.entries(analyticsData.sourceBreakdown).map(([source, count]) => (
                          <Badge key={source} status="info">
                            {source}: {count}
                          </Badge>
                        ))}
                      </Stack>
                    </Stack>
                  </div>
                </Card>
              </Layout.Section>
            </>
          )}
        </Layout>
      </Page>
    </Frame>
  );
}
