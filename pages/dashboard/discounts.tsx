/** @jsxImportSource react */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Page,
  Layout,
  Card,
  Text,
  Badge,
  DataTable,
  Stack,
  Heading,
  Banner,
  Spinner,
  Button,
  Filters,
  ProgressBar,
} from '@shopify/polaris';

interface DiscountData {
  id: string;
  code: string;
  value: number;
  type: string;
  isUsed: boolean;
  createdAt: string;
  usedAt?: string;
  customerEmail?: string;
  orderId?: string;
  orderValue?: number;
  discountAmount?: number;
  actualRevenue?: number;
  currency: string;
  daysToExpiry?: number;
}

interface DiscountSummary {
  total: number;
  used: number;
  unused: number;
  usageRate: number;
  totalRevenue: number;
  totalDiscountAmount: number;
  averageOrderValue: number;
  recentActivity: {
    generated: number;
    used: number;
    revenue: number;
  };
  tierBreakdown: Array<{
    tier: string;
    total: number;
    used: number;
    usageRate: number;
    revenue: number;
  }>;
}

export default function DiscountAnalytics() {
  const router = useRouter();
  const { shop } = router.query;
  const [loading, setLoading] = useState(true);
  const [discounts, setDiscounts] = useState<DiscountData[]>([]);
  const [summary, setSummary] = useState<DiscountSummary | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (shop) {
      loadDiscountData();
    }
  }, [shop, statusFilter]);

  const loadDiscountData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/discounts?shop=${shop}&status=${statusFilter}&limit=100`);
      const data = await response.json();
      
      if (data.success) {
        setDiscounts(data.discounts);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to load discount data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (discount: DiscountData) => {
    if (discount.isUsed) {
      return <Badge status="success">Used</Badge>;
    }
    if (discount.daysToExpiry !== null && discount.daysToExpiry < 0) {
      return <Badge status="critical">Expired</Badge>;
    }
    if (discount.daysToExpiry !== null && discount.daysToExpiry <= 1) {
      return <Badge status="warning">Expires Soon</Badge>;
    }
    return <Badge>Active</Badge>;
  };

  const discountRows = discounts.map(discount => [
    discount.code,
    `${discount.value}${discount.type === 'percentage' ? '%' : ` ${discount.currency}`}`,
    getStatusBadge(discount),
    discount.customerEmail || 'Anonymous',
    formatDate(discount.createdAt),
    discount.usedAt ? formatDate(discount.usedAt) : '-',
    discount.orderValue ? formatCurrency(discount.orderValue, discount.currency) : '-',
    discount.actualRevenue ? formatCurrency(discount.actualRevenue, discount.currency) : '-',
  ]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Spinner size="large" />
        <Text variant="bodyMd" as="p" color="subdued">
          Loading discount analytics...
        </Text>
      </div>
    );
  }

  return (
    <Page
      title="Discount Code Analytics"
      backAction={{
        content: 'Dashboard',
        onAction: () => router.push(`/dashboard?shop=${shop}`)
      }}
    >
      <Layout>
        {summary && (
          <>
            <Layout.Section>
              <Layout>
                <Layout.Section oneThird>
                  <Card>
                    <div style={{ padding: '1rem' }}>
                      <Stack vertical spacing="tight">
                        <Text variant="headingMd" as="h3">Total Generated</Text>
                        <Text variant="heading2xl" as="p">{summary.total}</Text>
                        <Text variant="bodyMd" as="p" color="subdued">Discount codes</Text>
                      </Stack>
                    </div>
                  </Card>
                </Layout.Section>

                <Layout.Section oneThird>
                  <Card>
                    <div style={{ padding: '1rem' }}>
                      <Stack vertical spacing="tight">
                        <Text variant="headingMd" as="h3">Usage Rate</Text>
                        <Text variant="heading2xl" as="p">{summary.usageRate.toFixed(1)}%</Text>
                        <ProgressBar progress={summary.usageRate} size="small" />
                        <Text variant="bodyMd" as="p" color="subdued">
                          {summary.used} of {summary.total} codes used
                        </Text>
                      </Stack>
                    </div>
                  </Card>
                </Layout.Section>

                <Layout.Section oneThird>
                  <Card>
                    <div style={{ padding: '1rem' }}>
                      <Stack vertical spacing="tight">
                        <Text variant="headingMd" as="h3">Total Revenue</Text>
                        <Text variant="heading2xl" as="p">{formatCurrency(summary.totalRevenue)}</Text>
                        <Text variant="bodyMd" as="p" color="subdued">
                          From {summary.used} orders
                        </Text>
                      </Stack>
                    </div>
                  </Card>
                </Layout.Section>
              </Layout>
            </Layout.Section>

            <Layout.Section>
              <Layout>
                <Layout.Section oneHalf>
                  <Card>
                    <div style={{ padding: '1rem' }}>
                      <Stack vertical spacing="loose">
                        <Heading>Recent Activity (7 days)</Heading>
                        <Stack>
                          <div>
                            <Text variant="headingMd" as="p">{summary.recentActivity.generated}</Text>
                            <Text variant="bodyMd" as="p" color="subdued">Generated</Text>
                          </div>
                          <div>
                            <Text variant="headingMd" as="p">{summary.recentActivity.used}</Text>
                            <Text variant="bodyMd" as="p" color="subdued">Used</Text>
                          </div>
                          <div>
                            <Text variant="headingMd" as="p">{formatCurrency(summary.recentActivity.revenue)}</Text>
                            <Text variant="bodyMd" as="p" color="subdued">Revenue</Text>
                          </div>
                        </Stack>
                      </Stack>
                    </div>
                  </Card>
                </Layout.Section>

                <Layout.Section oneHalf>
                  <Card>
                    <div style={{ padding: '1rem' }}>
                      <Stack vertical spacing="loose">
                        <Heading>Discount Tiers Performance</Heading>
                        {summary.tierBreakdown.map(tier => (
                          <div key={tier.tier}>
                            <Stack distribution="equalSpacing">
                              <Text variant="bodyMd" as="p">{tier.tier} off</Text>
                              <Text variant="bodyMd" as="p">{tier.used}/{tier.total}</Text>
                              <Text variant="bodyMd" as="p">{formatCurrency(tier.revenue)}</Text>
                            </Stack>
                            <ProgressBar progress={tier.usageRate} size="small" />
                          </div>
                        ))}
                      </Stack>
                    </div>
                  </Card>
                </Layout.Section>
              </Layout>
            </Layout.Section>
          </>
        )}

        <Layout.Section>
          <Card>
            <div style={{ padding: '1rem' }}>
              <Stack vertical spacing="loose">
                <Stack distribution="equalSpacing">
                  <Heading>Discount Codes</Heading>
                  <Stack>
                    <Button 
                      pressed={statusFilter === 'all'}
                      onClick={() => setStatusFilter('all')}
                    >
                      All
                    </Button>
                    <Button 
                      pressed={statusFilter === 'used'}
                      onClick={() => setStatusFilter('used')}
                    >
                      Used
                    </Button>
                    <Button 
                      pressed={statusFilter === 'unused'}
                      onClick={() => setStatusFilter('unused')}
                    >
                      Unused
                    </Button>
                  </Stack>
                </Stack>

                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text', 'numeric', 'numeric']}
                  headings={['Code', 'Discount', 'Status', 'Customer', 'Created', 'Used', 'Order Value', 'Revenue']}
                  rows={discountRows}
                  footerContent={`Showing ${discounts.length} discount codes`}
                />
              </Stack>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
