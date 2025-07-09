/** @jsxImportSource react */
import React, { useState } from 'react';
import {
  Card,
  Text,
  Stack,
  Badge,
  DataTable,
  Spinner,
  Select,
  Layout,
} from '@shopify/polaris';
import { useAnalyticsData } from '../../hooks/useAnalyticsData';
import styles from './ResponsiveGrid.module.css';

interface AnalyticsTabProps {
  shop: string | string[] | undefined;
}

export function AnalyticsTab({ shop }: AnalyticsTabProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const { analyticsData, loading, error } = useAnalyticsData(shop, selectedPeriod);

  const periodOptions = [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
    { label: 'Last year', value: '1y' },
  ];

  const formatDateForMobile = (date: Date) => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      // Short format for mobile: MM/DD
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit'
      });
    }
    return date.toLocaleDateString();
  };

  const topScoresRows = analyticsData?.topScores?.map((score) => [
    score.customerEmail,
    score.score.toString(),
    `${score.discount}%`,
    formatDateForMobile(new Date(score.achievedAt)),
  ]) || [];

  const hourlyRows = analyticsData?.hourlyBreakdown?.map((hour) => [
    `${hour.hour}:00`,
    hour.sessions.toString(),
    hour.completions.toString(),
    hour.discounts.toString(),
    `${Math.round((hour.completions / Math.max(hour.sessions, 1)) * 100)}%`,
  ]) || [];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <Spinner size="large" />
        <Text variant="bodyMd" as="p" color="subdued">
          Loading analytics...
        </Text>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Text variant="bodyMd" as="p" color="critical">
            Error loading analytics: {error}
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <div className={styles.container}>
      {/* Period Selector */}
      <div className={styles.section}>
        <Card>
          <div style={{ padding: '1.5rem' }}>
            <Stack distribution="equalSpacing" alignment="center">
              <Text variant="headingLg" as="h2">
                Analytics Dashboard
              </Text>
              <div style={{ minWidth: '200px' }}>
                <Select
                  label=""
                  options={periodOptions}
                  value={selectedPeriod}
                  onChange={setSelectedPeriod}
                />
              </div>
            </Stack>
          </div>
        </Card>
      </div>

      {analyticsData && (
        <>
          {/* Key Metrics Cards - Simple responsive grid */}
          <div className={styles.responsiveGrid}>
            <Card>
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <Text variant="heading2xl" as="p">
                  {analyticsData.metrics.totalSessions}
                </Text>
                <Text variant="headingMd" as="h3" color="subdued">
                  Total Sessions
                </Text>
                <Badge status="info">
                  {analyticsData.metrics.completedSessions} completed
                </Badge>
              </div>
            </Card>

            <Card>
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <Text variant="heading2xl" as="p">
                  {Math.round(analyticsData.metrics.completionRate)}%
                </Text>
                <Text variant="headingMd" as="h3" color="subdued">
                  Completion Rate
                </Text>
                <Badge status={analyticsData.metrics.completionRate > 50 ? "success" : "attention"}>
                  {analyticsData.metrics.completionRate > 50 ? "Good" : "Needs improvement"}
                </Badge>
              </div>
            </Card>

            <Card>
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <Text variant="heading2xl" as="p">
                  {analyticsData.metrics.totalDiscounts}
                </Text>
                <Text variant="headingMd" as="h3" color="subdued">
                  Discounts Generated
                </Text>
                <Badge status="success">
                  {analyticsData.metrics.usedDiscounts} used
                </Badge>
              </div>
            </Card>

            <Card>
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <Text variant="heading2xl" as="p">
                  ${analyticsData.metrics.estimatedRevenue.toLocaleString()}
                </Text>
                <Text variant="headingMd" as="h3" color="subdued">
                  Estimated Revenue
                </Text>
                <Badge status="success">
                  From discount usage
                </Badge>
              </div>
            </Card>

            <Card>
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <Text variant="heading2xl" as="p">
                  {Math.round(analyticsData.metrics.averageScore)}
                </Text>
                <Text variant="headingMd" as="h3" color="subdued">
                  Average Score
                </Text>
                <Text variant="bodyMd" as="p" color="subdued">
                  Points per game
                </Text>
              </div>
            </Card>

            <Card>
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <Text variant="heading2xl" as="p">
                  {analyticsData.metrics.uniqueCustomers}
                </Text>
                <Text variant="headingMd" as="h3" color="subdued">
                  Unique Players
                </Text>
                <Text variant="bodyMd" as="p" color="subdued">
                  Individual customers
                </Text>
              </div>
            </Card>
          </div>

          {/* Top Scores Table */}
          <div className={styles.section}>
            <Card>
              <div style={{ padding: '2rem' }}>
                <Stack vertical spacing="loose">
                  <Text variant="headingLg" as="h2">
                    Top Scores
                  </Text>
                  <div className={styles.tableContainer}>
                    <DataTable
                      columnContentTypes={['text', 'numeric', 'text', 'text']}
                      headings={['Customer', 'Score', 'Discount', 'Date']}
                      rows={topScoresRows}
                      footerContent={`Top ${topScoresRows.length} scores in selected period`}
                    />
                  </div>
                </Stack>
              </div>
            </Card>
          </div>

          {/* Hourly Activity */}
          <div className={styles.section}>
            <Card>
              <div style={{ padding: '2rem' }}>
                <Stack vertical spacing="loose">
                  <Text variant="headingLg" as="h2">
                    Hourly Activity
                  </Text>
                  <div className={styles.tableContainer}>
                    <DataTable
                      columnContentTypes={['text', 'numeric', 'numeric', 'numeric', 'text']}
                      headings={['Hour', 'Sessions', 'Completions', 'Discounts', 'Completion Rate']}
                      rows={hourlyRows}
                      footerContent="24-hour activity breakdown"
                    />
                  </div>
                </Stack>
              </div>
            </Card>
          </div>

          {/* Traffic Sources */}
          <div>
            <Card>
              <div style={{ padding: '2rem' }}>
                <Stack vertical spacing="loose">
                  <Text variant="headingLg" as="h2">
                    Traffic Sources
                  </Text>
                  <Stack>
                    {analyticsData.sourceBreakdown && Object.entries(analyticsData.sourceBreakdown).map(([source, count]) => (
                      <Badge key={source} status="info">
                        {`${source}: ${String(count)}`}
                      </Badge>
                    ))}
                  </Stack>
                </Stack>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
