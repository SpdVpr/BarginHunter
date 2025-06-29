/** @jsxImportSource react */
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Page,
  Layout,
  Card,
  Text,
  DataTable,
  Stack,
  Badge,
  Spinner,
  TextField,
  Select,
} from '@shopify/polaris';
import { DashboardLayout } from '../../src/components/shared/DashboardLayout';
import { StatsCards } from '../../src/components/shared/StatsCards';
import { useCustomersData } from '../../src/hooks/useSharedStats';

interface Customer {
  id: string;
  email?: string;
  customerId?: string;
  totalSessions: number;
  totalScore: number;
  bestScore: number;
  totalDiscountsEarned: number;
  totalDiscountsUsed: number;
  firstPlayedAt: string;
  lastPlayedAt: string;
  lastSessionScore: number;
  recentSessions: number;
  usedDiscountsCount: number;
  averageScore: number;
  discountUsageRate: number;
  preferences: {
    difficulty?: string;
    notifications: boolean;
  };
}

interface CustomersSummary {
  totalCustomers: number;
  activeCustomers: number;
  totalSessions: number;
  totalDiscountsEarned: number;
  totalDiscountsUsed: number;
  averageScore: number;
  discountUsageRate: number;
}

export default function CustomersPage() {
  const router = useRouter();
  const { shop } = router.query;
  const { customersData, loading, error, refreshCustomers } = useCustomersData(shop);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('lastPlayedAt');

  if (loading) {
    return (
      <DashboardLayout shop={typeof shop === 'string' ? shop : ''} currentPage="customers">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="large" />
          <Text variant="bodyMd" as="p" color="subdued">
            Loading customers...
          </Text>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !customersData) {
    return (
      <DashboardLayout shop={typeof shop === 'string' ? shop : ''} currentPage="customers">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Text variant="bodyMd" as="p" color="critical">
            Failed to load customers data: {error || 'Unknown error'}
          </Text>
        </div>
      </DashboardLayout>
    );
  }

  // Filter and sort customers
  const filteredCustomers = customersData.customers
    .filter(customer => 
      !searchQuery || 
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.customerId?.includes(searchQuery)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'lastPlayedAt':
          return new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime();
        case 'totalSessions':
          return b.totalSessions - a.totalSessions;
        case 'bestScore':
          return b.bestScore - a.bestScore;
        case 'totalDiscountsEarned':
          return b.totalDiscountsEarned - a.totalDiscountsEarned;
        default:
          return 0;
      }
    });

  const customersTableRows = filteredCustomers.map((customer) => [
    customer.email || customer.customerId || 'Anonymous',
    customer.totalSessions.toString(),
    customer.averageScore.toString(),
    customer.bestScore.toString(),
    customer.totalDiscountsEarned.toString(),
    customer.totalDiscountsUsed.toString(),
    `${customer.discountUsageRate}%`,
    new Date(customer.lastPlayedAt).toLocaleDateString(),
    customer.recentSessions > 0 ? (
      <Badge status="success">Active</Badge>
    ) : (
      <Badge>Inactive</Badge>
    ),
  ]);

  const sortOptions = [
    { label: 'Last Played', value: 'lastPlayedAt' },
    { label: 'Total Sessions', value: 'totalSessions' },
    { label: 'Best Score', value: 'bestScore' },
    { label: 'Discounts Earned', value: 'totalDiscountsEarned' },
  ];

  // Convert customers summary to shared stats format
  const customerStats = {
    totalSessions: customersData.summary.totalSessions,
    completedSessions: customersData.summary.totalSessions, // Assume all customer sessions are completed
    totalDiscounts: customersData.summary.totalDiscountsEarned,
    usedDiscounts: customersData.summary.totalDiscountsUsed,
    conversionRate: 0, // Not applicable for customers view
    completionRate: 100, // Assume 100% for customer view
    discountUsageRate: customersData.summary.discountUsageRate,
    averageScore: customersData.summary.averageScore,
    totalScore: 0, // Not needed
    activeCustomers: customersData.summary.activeCustomers,
    uniqueCustomers: customersData.summary.totalCustomers,
    revenue: 0, // Not calculated here
    totalOrderValue: 0,
    totalDiscountAmount: 0,
    today: { sessions: 0, discounts: 0 },
    loading: false,
    error: null,
    lastUpdated: new Date(),
  };

  return (
    <DashboardLayout shop={typeof shop === 'string' ? shop : ''} currentPage="customers">
      <Page
        title="Customers"
        subtitle={`Customer insights for ${shop}`}
      >
        <Layout>
          {/* Summary Statistics */}
          <Layout.Section>
            <Layout>
              <Layout.Section oneThird>
                <Card>
                  <div style={{ padding: '1rem' }}>
                    <Stack vertical spacing="tight">
                      <Text variant="headingMd" as="h3">
                        Total Customers
                      </Text>
                      <Text variant="heading2xl" as="p">
                        {customersData.summary.totalCustomers}
                      </Text>
                      <Text variant="bodyMd" as="p" color="subdued">
                        {customersData.summary.activeCustomers} active (30 days)
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
                        Average Score
                      </Text>
                      <Text variant="heading2xl" as="p">
                        {customersData.summary.averageScore}
                      </Text>
                      <Text variant="bodyMd" as="p" color="subdued">
                        Points per session
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
                        Discount Usage
                      </Text>
                      <Text variant="heading2xl" as="p">
                        {customersData.summary.discountUsageRate}%
                      </Text>
                      <Text variant="bodyMd" as="p" color="subdued">
                        {customersData.summary.totalDiscountsUsed} of {customersData.summary.totalDiscountsEarned} used
                      </Text>
                    </Stack>
                  </div>
                </Card>
              </Layout.Section>
            </Layout>
          </Layout.Section>

          {/* Filters and Search */}
          <Layout.Section>
            <Card sectioned>
              <Stack distribution="equalSpacing" alignment="center">
                <Stack.Item fill>
                  <TextField
                    label=""
                    placeholder="Search customers by email or ID..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                    clearButton
                    onClearButtonClick={() => setSearchQuery('')}
                  />
                </Stack.Item>
                <Select
                  label=""
                  options={sortOptions}
                  value={sortBy}
                  onChange={setSortBy}
                />
              </Stack>
            </Card>
          </Layout.Section>

          {/* Customers Table */}
          <Layout.Section>
            <Card>
              <DataTable
                columnContentTypes={[
                  'text',
                  'numeric',
                  'numeric',
                  'numeric',
                  'numeric',
                  'numeric',
                  'text',
                  'text',
                  'text',
                ]}
                headings={[
                  'Customer',
                  'Sessions',
                  'Avg Score',
                  'Best Score',
                  'Discounts Earned',
                  'Discounts Used',
                  'Usage Rate',
                  'Last Played',
                  'Status',
                ]}
                rows={customersTableRows}
                footerContent={`Showing ${filteredCustomers.length} of ${customersData.customers.length} customers`}
              />
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </DashboardLayout>
  );
}
