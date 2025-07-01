/** @jsxImportSource react */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Text,
  Stack,
  Badge,
  DataTable,
  Spinner,
  Layout,
} from '@shopify/polaris';
import { useSharedStats } from '../../hooks/useSharedStats';
import { ModernStatsCards } from './ModernStatsCards';

interface OverviewTabProps {
  shop: string | string[] | undefined;
}

interface RecentSession {
  id: string;
  customerEmail: string;
  score: number;
  discount: number;
  completedAt: string;
  status: 'completed' | 'abandoned';
}

export function OverviewTab({ shop }: OverviewTabProps) {
  const { stats, isLoading, error } = useSharedStats(shop);
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
      const discountsResponse = await fetch(`/api/dashboard/discounts?shop=${shop}`);
      if (discountsResponse.ok) {
        const discountsData = await discountsResponse.json();
        const recentDiscounts = (discountsData.discounts || [])
          .filter((discount: any) => discount.isUsed)
          .slice(0, 10)
          .map((discount: any) => ({
            id: discount.id,
            customerEmail: discount.customerEmail || 'Anonymous',
            score: Math.round(discount.value * 20),
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
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <Spinner size="large" />
        <Text variant="bodyMd" as="p" color="subdued">
          Loading overview...
        </Text>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {/* Modern Stats Grid */}
      <ModernStatsCards stats={stats} variant="grid" />

      {/* Recent Activity */}
      <Card>
        <div style={{ padding: '2rem' }}>
          <Stack vertical spacing="loose">
            <Text variant="headingLg" as="h2">
              Recent Activity
            </Text>
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
    </div>
  );
}
