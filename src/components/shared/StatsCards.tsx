/** @jsxImportSource react */
import React from 'react';
import { Layout, Card, Text, Stack, Badge } from '@shopify/polaris';
import { SharedStats } from '../../hooks/useSharedStats';

interface StatsCardsProps {
  stats: SharedStats;
  variant?: 'overview' | 'detailed' | 'compact';
}

export function StatsCards({ stats, variant = 'overview' }: StatsCardsProps) {
  if (variant === 'compact') {
    return (
      <Layout>
        <Layout.Section oneHalf>
          <Card>
            <div style={{ padding: '1rem' }}>
              <Stack vertical spacing="tight">
                <Text variant="headingMd" as="h3">
                  Total Sessions
                </Text>
                <Text variant="heading2xl" as="p">
                  {stats.totalSessions.toLocaleString()}
                </Text>
                <Text variant="bodyMd" as="p" color="subdued">
                  {stats.completedSessions} completed ({stats.completionRate}%)
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
                  Discounts
                </Text>
                <Text variant="heading2xl" as="p">
                  {stats.totalDiscounts.toLocaleString()}
                </Text>
                <Text variant="bodyMd" as="p" color="subdued">
                  {stats.usedDiscounts} used ({stats.discountUsageRate}%)
                </Text>
              </Stack>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    );
  }

  if (variant === 'detailed') {
    return (
      <Layout>
        <Layout.Section oneThird>
          <Card>
            <div style={{ padding: '1rem' }}>
              <Stack vertical spacing="tight">
                <Text variant="headingMd" as="h3">
                  Game Sessions
                </Text>
                <Text variant="heading2xl" as="p">
                  {stats.totalSessions.toLocaleString()}
                </Text>
                <Stack spacing="tight">
                  <Badge status="success">
                    {stats.completedSessions} completed
                  </Badge>
                  <Badge>
                    {stats.completionRate}% completion rate
                  </Badge>
                </Stack>
                <Text variant="bodyMd" as="p" color="subdued">
                  {stats.today.sessions} sessions today
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
                  Discount Codes
                </Text>
                <Text variant="heading2xl" as="p">
                  {stats.totalDiscounts.toLocaleString()}
                </Text>
                <Stack spacing="tight">
                  <Badge status="success">
                    {stats.usedDiscounts} used
                  </Badge>
                  <Badge>
                    {stats.discountUsageRate}% usage rate
                  </Badge>
                </Stack>
                <Text variant="bodyMd" as="p" color="subdued">
                  {stats.today.discounts} generated today
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
                  Performance
                </Text>
                <Text variant="heading2xl" as="p">
                  {Math.round(stats.averageScore)}
                </Text>
                <Stack spacing="tight">
                  <Badge>
                    {stats.activeCustomers} active players
                  </Badge>
                  <Badge>
                    {stats.conversionRate}% conversion
                  </Badge>
                </Stack>
                <Text variant="bodyMd" as="p" color="subdued">
                  Average score per game
                </Text>
              </Stack>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    );
  }

  // Default overview variant
  return (
    <Layout>
      <Layout.Section oneQuarter>
        <Card>
          <div style={{ padding: '1rem' }}>
            <Stack vertical spacing="tight">
              <Text variant="headingMd" as="h3">
                Total Sessions
              </Text>
              <Text variant="heading2xl" as="p">
                {stats.totalSessions.toLocaleString()}
              </Text>
              <Text variant="bodyMd" as="p" color="subdued">
                {stats.completionRate}% completion rate
              </Text>
            </Stack>
          </div>
        </Card>
      </Layout.Section>

      <Layout.Section oneQuarter>
        <Card>
          <div style={{ padding: '1rem' }}>
            <Stack vertical spacing="tight">
              <Text variant="headingMd" as="h3">
                Discounts Generated
              </Text>
              <Text variant="heading2xl" as="p">
                {stats.totalDiscounts.toLocaleString()}
              </Text>
              <Text variant="bodyMd" as="p" color="subdued">
                {stats.usedDiscounts} used ({stats.discountUsageRate}%)
              </Text>
            </Stack>
          </div>
        </Card>
      </Layout.Section>

      <Layout.Section oneQuarter>
        <Card>
          <div style={{ padding: '1rem' }}>
            <Stack vertical spacing="tight">
              <Text variant="headingMd" as="h3">
                Active Players
              </Text>
              <Text variant="heading2xl" as="p">
                {stats.activeCustomers.toLocaleString()}
              </Text>
              <Text variant="bodyMd" as="p" color="subdued">
                {stats.uniqueCustomers} total unique
              </Text>
            </Stack>
          </div>
        </Card>
      </Layout.Section>

      <Layout.Section oneQuarter>
        <Card>
          <div style={{ padding: '1rem' }}>
            <Stack vertical spacing="tight">
              <Text variant="headingMd" as="h3">
                Revenue Impact
              </Text>
              <Text variant="heading2xl" as="p">
                ${stats.revenue.toLocaleString()}
              </Text>
              <Text variant="bodyMd" as="p" color="subdued">
                From {stats.usedDiscounts} orders
              </Text>
            </Stack>
          </div>
        </Card>
      </Layout.Section>
    </Layout>
  );
}

interface QuickStatsProps {
  stats: SharedStats;
  showToday?: boolean;
}

export function QuickStats({ stats, showToday = false }: QuickStatsProps) {
  return (
    <Card sectioned>
      <Stack distribution="equalSpacing" alignment="center">
        <Stack vertical spacing="extraTight">
          <Text variant="bodyMd" as="p" color="subdued">
            Sessions
          </Text>
          <Text variant="headingLg" as="p">
            {showToday ? stats.today.sessions : stats.totalSessions}
          </Text>
        </Stack>
        
        <Stack vertical spacing="extraTight">
          <Text variant="bodyMd" as="p" color="subdued">
            Completion Rate
          </Text>
          <Text variant="headingLg" as="p">
            {stats.completionRate}%
          </Text>
        </Stack>
        
        <Stack vertical spacing="extraTight">
          <Text variant="bodyMd" as="p" color="subdued">
            Discounts
          </Text>
          <Text variant="headingLg" as="p">
            {showToday ? stats.today.discounts : stats.totalDiscounts}
          </Text>
        </Stack>
        
        <Stack vertical spacing="extraTight">
          <Text variant="bodyMd" as="p" color="subdued">
            Usage Rate
          </Text>
          <Text variant="headingLg" as="p">
            {stats.discountUsageRate}%
          </Text>
        </Stack>
        
        <Stack vertical spacing="extraTight">
          <Text variant="bodyMd" as="p" color="subdued">
            Avg Score
          </Text>
          <Text variant="headingLg" as="p">
            {Math.round(stats.averageScore)}
          </Text>
        </Stack>
      </Stack>
    </Card>
  );
}

interface StatsLoadingProps {
  message?: string;
}

export function StatsLoading({ message = 'Loading statistics...' }: StatsLoadingProps) {
  return (
    <Layout>
      <Layout.Section oneQuarter>
        <Card>
          <div style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text variant="bodyMd" as="p" color="subdued">
                {message}
              </Text>
            </div>
          </div>
        </Card>
      </Layout.Section>
      
      <Layout.Section oneQuarter>
        <Card>
          <div style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text variant="bodyMd" as="p" color="subdued">
                Loading...
              </Text>
            </div>
          </div>
        </Card>
      </Layout.Section>
      
      <Layout.Section oneQuarter>
        <Card>
          <div style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text variant="bodyMd" as="p" color="subdued">
                Loading...
              </Text>
            </div>
          </div>
        </Card>
      </Layout.Section>
      
      <Layout.Section oneQuarter>
        <Card>
          <div style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text variant="bodyMd" as="p" color="subdued">
                Loading...
              </Text>
            </div>
          </div>
        </Card>
      </Layout.Section>
    </Layout>
  );
}
