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
  Button,
  ProgressBar,
  Banner,
} from '@shopify/polaris';
import { useSharedStats } from '../../hooks/useSharedStats';
import styles from './ResponsiveGrid.module.css';

interface OverviewTabProps {
  shop: string | string[] | undefined;
  onTabChange?: (tabIndex: number) => void;
}

interface BillingInfo {
  currentPlan: string;
  discountCodesUsed: number;
  discountCodesLimit: number;
  usagePercentage: number;
  canUpgrade: boolean;
}

interface RecentSession {
  id: string;
  customerEmail: string;
  score: number;
  discount: number;
  completedAt: string;
  status: 'completed' | 'abandoned';
}

export function OverviewTab({ shop, onTabChange }: OverviewTabProps) {
  const { stats, isLoading, error } = useSharedStats(shop);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);

  useEffect(() => {
    if (shop) {
      loadRecentSessions();
      loadBillingInfo();
    }
  }, [shop]);

  const loadRecentSessions = async () => {
    try {
      setSessionsLoading(true);
      const discountsResponse = await fetch(`/api/dashboard/discounts?shop=${shop}&limit=20`);
      if (discountsResponse.ok) {
        const discountsData = await discountsResponse.json();
        // Show all recent discounts (both used and unused), prioritizing used ones
        const allDiscounts = discountsData.discounts || [];
        const usedDiscounts = allDiscounts.filter((discount: any) => discount.isUsed);
        const unusedDiscounts = allDiscounts.filter((discount: any) => !discount.isUsed);

        // Combine used and unused, with used ones first
        const combinedDiscounts = [...usedDiscounts, ...unusedDiscounts]
          .slice(0, 10)
          .map((discount: any) => ({
            id: discount.id,
            customerEmail: discount.customerEmail || 'Anonymous',
            score: Math.round(discount.value * 20),
            discount: discount.value,
            status: discount.isUsed ? 'completed' as const : 'generated' as const,
            completedAt: discount.usedAt || discount.createdAt,
          }));
        setRecentSessions(combinedDiscounts);
      }
    } catch (error) {
      console.error('Failed to load recent sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadBillingInfo = async () => {
    try {
      setBillingLoading(true);
      const response = await fetch(`/api/usage/check-limits?shop=${shop}&action=discountCode`);
      if (response.ok) {
        const data = await response.json();
        setBillingInfo({
          currentPlan: data.plan || 'free',
          discountCodesUsed: data.usage?.current || 0,
          discountCodesLimit: data.usage?.limit === 'unlimited' ? -1 : (data.usage?.limit || 100),
          usagePercentage: data.usage?.percentage || 0,
          canUpgrade: data.plan !== 'enterprise',
        });
      }
    } catch (error) {
      console.error('Failed to load billing info:', error);
      // Fallback to free plan
      setBillingInfo({
        currentPlan: 'free',
        discountCodesUsed: 0,
        discountCodesLimit: 100,
        usagePercentage: 0,
        canUpgrade: true,
      });
    } finally {
      setBillingLoading(false);
    }
  };

  const handleUpgrade = () => {
    if (onTabChange) {
      onTabChange(3); // Switch to billing tab (index 3)
    } else {
      // Fallback for standalone usage
      window.location.href = `/dashboard/billing?shop=${shop}`;
    }
  };

  const getPlanDisplayName = (plan: string) => {
    const planNames = {
      free: '🆓 Free Tier',
      starter: '💼 Starter',
      pro: '🚀 Pro',
      enterprise: '🏢 Enterprise'
    };
    return planNames[plan as keyof typeof planNames] || plan;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 95) return 'critical';
    if (percentage >= 80) return 'warning';
    return 'success';
  };

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

  const recentSessionsRows = recentSessions.map((session) => [
    session.customerEmail || 'Anonymous',
    session.score.toString(),
    session.discount > 0 ? `${session.discount}%` : 'No discount',
    <Badge status={session.status === 'completed' ? 'success' : 'info'}>
      {session.status === 'completed' ? 'Used' : 'Generated'}
    </Badge>,
    formatDateForMobile(new Date(session.completedAt)),
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
    <div className={styles.container}>
      {/* Billing Status Card - Most Important */}
      <div className={styles.section}>
        {billingLoading ? (
          <Card>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <Spinner size="small" />
              <Text variant="bodyMd">Loading billing information...</Text>
            </div>
          </Card>
        ) : billingInfo ? (
        <Card>
          <div style={{ padding: '1.5rem' }}>
            <Stack distribution="equalSpacing" alignment="center">
              <Stack vertical spacing="tight">
                <Stack spacing="tight" alignment="center">
                  <Text variant="headingMd" as="h3">Current Plan</Text>
                  <Badge status={billingInfo.currentPlan === 'free' ? 'info' : 'success'}>
                    {getPlanDisplayName(billingInfo.currentPlan)}
                  </Badge>
                </Stack>

                <Stack vertical spacing="tight">
                  <Stack distribution="equalSpacing" alignment="center">
                    <Text variant="bodyMd" fontWeight="semibold">Discount Codes This Month</Text>
                    <Text variant="bodyMd">
                      {billingInfo.discountCodesUsed} / {billingInfo.discountCodesLimit === -1 ? '∞' : billingInfo.discountCodesLimit.toLocaleString()}
                    </Text>
                  </Stack>

                  {billingInfo.discountCodesLimit !== -1 && (
                    <ProgressBar
                      progress={billingInfo.usagePercentage}
                      size="small"
                      color={getUsageColor(billingInfo.usagePercentage)}
                    />
                  )}

                  {billingInfo.usagePercentage >= 80 && billingInfo.discountCodesLimit !== -1 && (
                    <Text variant="bodyMd" color={billingInfo.usagePercentage >= 95 ? 'critical' : 'warning'}>
                      {billingInfo.usagePercentage >= 95
                        ? '⚠️ Almost at limit! Upgrade to avoid interruption.'
                        : '📈 High usage detected. Consider upgrading.'
                      }
                    </Text>
                  )}
                </Stack>
              </Stack>

              {billingInfo.canUpgrade && (
                <Stack vertical spacing="tight">
                  <Button
                    primary={billingInfo.usagePercentage >= 80}
                    size="large"
                    onClick={handleUpgrade}
                  >
                    {billingInfo.usagePercentage >= 95 ? 'Upgrade Now!' : 'Upgrade Plan'}
                  </Button>
                  <Text variant="bodyMd" color="subdued" alignment="center">
                    Get more discount codes
                  </Text>
                </Stack>
              )}
            </Stack>
          </div>
        </Card>
        ) : null}
      </div>

      {/* Usage Warning Banner */}
      {billingInfo && billingInfo.usagePercentage >= 95 && billingInfo.discountCodesLimit !== -1 && (
        <div className={styles.section}>
          <Banner status="critical">
            <Stack vertical spacing="tight">
              <Text variant="bodyMd" fontWeight="semibold">
                🚨 Discount Code Limit Almost Reached!
              </Text>
              <Text variant="bodyMd">
                You've used {billingInfo.discountCodesUsed} of {billingInfo.discountCodesLimit} discount codes this month.
                Upgrade your plan to continue generating codes for your customers.
              </Text>
              <div>
                <Button primary onClick={handleUpgrade}>
                  View Upgrade Options
                </Button>
              </div>
            </Stack>
          </Banner>
        </div>
      )}

      {/* Stats Cards - Simple responsive grid */}
      <div className={styles.responsiveGrid}>
        <Card>
          <div style={{ padding: '1.5rem', textAlign: 'center' }}>
            <Text variant="heading2xl" as="p">
              {stats.totalSessions}
            </Text>
            <Text variant="headingMd" as="h3" color="subdued">
              Total Sessions
            </Text>
            <Badge status="info">
              {stats.completedSessions} completed
            </Badge>
          </div>
        </Card>

        <Card>
          <div style={{ padding: '1.5rem', textAlign: 'center' }}>
            <Text variant="heading2xl" as="p">
              {Math.round(stats.completionRate)}%
            </Text>
            <Text variant="headingMd" as="h3" color="subdued">
              Completion Rate
            </Text>
            <Badge status={stats.completionRate > 50 ? "success" : "attention"}>
              {stats.completionRate > 50 ? "Good" : "Needs improvement"}
            </Badge>
          </div>
        </Card>

        <Card>
          <div style={{ padding: '1.5rem', textAlign: 'center' }}>
            <Text variant="heading2xl" as="p">
              {stats.totalDiscounts}
            </Text>
            <Text variant="headingMd" as="h3" color="subdued">
              Discounts Generated
            </Text>
            <Badge status="success">
              Active codes
            </Badge>
          </div>
        </Card>

        <Card>
          <div style={{ padding: '1.5rem', textAlign: 'center' }}>
            <Text variant="heading2xl" as="p">
              {Math.round(stats.averageScore)}
            </Text>
            <Text variant="headingMd" as="h3" color="subdued">
              Average Score
            </Text>
            <Text variant="bodyMd" as="p" color="subdued">
              Points per game
            </Text>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div>
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
                <div className={styles.tableContainer}>
                  <DataTable
                    columnContentTypes={['text', 'numeric', 'text', 'text', 'text']}
                    headings={['Customer', 'Score', 'Discount', 'Status', 'Date']}
                    rows={recentSessionsRows}
                    footerContent={`Showing ${recentSessions.length} recent sessions`}
                  />
                </div>
              )}
            </Stack>
          </div>
        </Card>
      </div>
    </div>
  );
}
