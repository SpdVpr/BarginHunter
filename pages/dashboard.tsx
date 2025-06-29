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
  Stack,
  Banner,
  Spinner,
} from '@shopify/polaris';
import { DashboardLayout } from '../src/components/shared/DashboardLayout';
import { StatsCards, QuickStats, StatsLoading } from '../src/components/shared/StatsCards';
import { useSharedStats } from '../src/hooks/useSharedStats';

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
  const { stats, isLoading, error, refreshStats } = useSharedStats(shop);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  useEffect(() => {
    if (shop) {
      loadRecentSessions();
    }
  }, [shop]);

  const loadRecentSessions = async () => {
    try {
      setSessionsLoading(true);

      // Load recent discount codes (same data as Analytics)
      const discountsResponse = await fetch(`/api/dashboard/discounts?shop=${shop}`);
      if (discountsResponse.ok) {
        const discountsData = await discountsResponse.json();
        // Convert discount codes to session format for display
        const recentDiscounts = (discountsData.discounts || [])
          .filter((discount: any) => discount.isUsed) // Only show used discounts
          .slice(0, 10) // Limit to 10 most recent
          .map((discount: any) => ({
            id: discount.id,
            customerEmail: discount.customerEmail || 'Anonymous',
            score: Math.round(discount.value * 20), // Estimate score from discount (5% = ~100 points)
            discount: discount.value,
            status: 'completed' as const,
            completedAt: discount.usedAt || discount.createdAt,
          }));
        setRecentSessions(recentDiscounts);
      }
    } catch (error) {
      console.error('Failed to load recent sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  };



  const recentSessionsRows = recentSessions.map((session) => [
    session.customerEmail || 'Anonymous',
    session.score.toString(),
    session.discount > 0 ? `${session.discount}%` : 'No discount',
    <Badge status="success">Used</Badge>,
    new Date(session.completedAt).toLocaleDateString(),
  ]);

  if (isLoading) {
    return (
      <DashboardLayout shop={typeof shop === 'string' ? shop : ''} currentPage="dashboard">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="large" />
          <Text variant="bodyMd" as="p" color="subdued">
            Loading dashboard...
          </Text>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout shop={typeof shop === 'string' ? shop : ''} currentPage="dashboard">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Banner status="critical">
            <Text variant="bodyMd" as="p">
              Failed to load dashboard data: {error}
            </Text>
          </Banner>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout shop={typeof shop === 'string' ? shop : ''} currentPage="dashboard">
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
                  <Button
                    onClick={() => router.push(`/dashboard/installation?shop=${shop}`)}
                  >
                    Widget Status
                  </Button>
                </Stack>
              </Stack>
            </Card>
          </Layout.Section>

          {/* Statistics Overview */}
          <Layout.Section>
            <StatsCards stats={stats} variant="overview" />
          </Layout.Section>

          {/* Today's Quick Stats */}
          <Layout.Section>
            <QuickStats stats={stats} showToday={true} />
          </Layout.Section>

          {/* Recent Activity */}
          <Layout.Section>
            <Card>
              <div style={{ padding: '1rem' }}>
                <Stack vertical spacing="loose">
                  <Text variant="headingMd" as="h3">Recent Successful Games</Text>
                  {sessionsLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <Spinner size="small" />
                      <Text variant="bodyMd" as="p" color="subdued">
                        Loading recent sessions...
                      </Text>
                    </div>
                  ) : (
                    <DataTable
                      columnContentTypes={['text', 'numeric', 'text', 'text', 'text']}
                      headings={['Customer', 'Score', 'Discount', 'Status', 'Date']}
                      rows={recentSessionsRows}
                      footerContent={`Showing ${recentSessions.length} recent sessions`}
                    />
                  )}
                </Stack>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </DashboardLayout>
  );
}
