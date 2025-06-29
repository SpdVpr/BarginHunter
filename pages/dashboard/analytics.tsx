import React, { useState } from 'react';
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
  Badge,
  ProgressBar,
} from '@shopify/polaris';
import { DashboardLayout } from '../../src/components/shared/DashboardLayout';
import { StatsCards, StatsLoading } from '../../src/components/shared/StatsCards';
import { useAnalyticsData } from '../../src/hooks/useSharedStats';

export default function Analytics() {
  const router = useRouter();
  const { shop } = router.query;

  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const { analyticsData, loading, error, refreshAnalytics } = useAnalyticsData(shop, selectedPeriod);

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
      <DashboardLayout shop={typeof shop === 'string' ? shop : ''} currentPage="analytics">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="large" />
          <Text variant="bodyMd" as="p" color="subdued">
            Loading analytics...
          </Text>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout shop={typeof shop === 'string' ? shop : ''} currentPage="analytics">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Text variant="bodyMd" as="p" color="critical">
            Failed to load analytics: {error}
          </Text>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout shop={typeof shop === 'string' ? shop : ''} currentPage="analytics">
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
              {/* Convert analytics data to shared stats format for display */}
              <Layout.Section>
                <StatsCards
                  stats={{
                    totalSessions: analyticsData.metrics.totalSessions,
                    completedSessions: analyticsData.metrics.completedSessions,
                    totalDiscounts: analyticsData.metrics.totalDiscounts,
                    usedDiscounts: analyticsData.metrics.usedDiscounts,
                    conversionRate: analyticsData.metrics.completionRate,
                    completionRate: analyticsData.metrics.completionRate,
                    discountUsageRate: analyticsData.metrics.discountUsageRate,
                    averageScore: analyticsData.metrics.averageScore,
                    totalScore: 0,
                    activeCustomers: analyticsData.metrics.uniqueCustomers,
                    uniqueCustomers: analyticsData.metrics.uniqueCustomers,
                    revenue: analyticsData.metrics.estimatedRevenue,
                    totalOrderValue: 0,
                    totalDiscountAmount: 0,
                    today: { sessions: 0, discounts: 0 },
                    loading: false,
                    error: null,
                    lastUpdated: new Date(),
                  }}
                  variant="detailed"
                />
              </Layout.Section>

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
                            {String(analyticsData.metrics.completedSessions)} of {String(analyticsData.metrics.totalSessions)} sessions completed
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
                            {String(analyticsData.metrics.usedDiscounts)} of {String(analyticsData.metrics.totalDiscounts)} discounts used
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
                            {String(analyticsData.metrics.uniqueCustomers)}
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
                            {`${source}: ${String(count)}`}
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
    </DashboardLayout>
  );
}

