/** @jsxImportSource react */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Text,
  Stack,
  Badge,
  DataTable,
  Spinner,
  TextField,
} from '@shopify/polaris';

interface CustomersTabProps {
  shop: string | string[] | undefined;
}

interface Customer {
  id: string;
  email: string;
  totalSessions: number;
  completedSessions: number;
  averageScore: number;
  bestScore: number;
  totalDiscountsEarned: number;
  totalDiscountsUsed: number;
  lastPlayedAt: string;
  status: 'active' | 'inactive';
}

interface CustomersSummary {
  totalCustomers: number;
  activeCustomers: number;
  averageSessionsPerCustomer: number;
  topPerformers: number;
}

export function CustomersTab({ shop }: CustomersTabProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [summary, setSummary] = useState<CustomersSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (shop) {
      loadCustomersData();
    }
  }, [shop]);

  const loadCustomersData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/customers?shop=${shop}`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
        setSummary(data.summary || {
          totalCustomers: 0,
          activeCustomers: 0,
          averageSessionsPerCustomer: 0,
          topPerformers: 0,
        });
      }
    } catch (error) {
      console.error('Failed to load customers data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const customersTableRows = filteredCustomers.map((customer) => [
    customer.email,
    customer.totalSessions.toString(),
    Math.round(customer.averageScore).toString(),
    customer.bestScore.toString(),
    customer.totalDiscountsEarned.toString(),
    customer.totalDiscountsUsed.toString(),
    customer.totalDiscountsUsed > 0 
      ? `${Math.round((customer.totalDiscountsUsed / customer.totalDiscountsEarned) * 100)}%`
      : '0%',
    new Date(customer.lastPlayedAt).toLocaleDateString(),
    <Badge status={customer.status === 'active' ? 'success' : 'attention'}>
      {customer.status}
    </Badge>,
  ]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <Spinner size="large" />
        <Text variant="bodyMd" as="p" color="subdued">
          Loading customers data...
        </Text>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {/* Summary Statistics */}
      {summary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
        }}>
          <Card>
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <Text variant="heading2xl" as="p">
                {summary.totalCustomers}
              </Text>
              <Text variant="headingMd" as="h3" color="subdued">
                Total Customers
              </Text>
              <Text variant="bodyMd" as="p" color="subdued">
                {summary.activeCustomers} active (30 days)
              </Text>
            </div>
          </Card>

          <Card>
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <Text variant="heading2xl" as="p">
                {summary.activeCustomers}
              </Text>
              <Text variant="headingMd" as="h3" color="subdued">
                Active Players
              </Text>
              <Text variant="bodyMd" as="p" color="subdued">
                Last 30 days
              </Text>
            </div>
          </Card>

          <Card>
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <Text variant="heading2xl" as="p">
                {Math.round(summary.averageSessionsPerCustomer)}
              </Text>
              <Text variant="headingMd" as="h3" color="subdued">
                Avg Sessions
              </Text>
              <Text variant="bodyMd" as="p" color="subdued">
                Per customer
              </Text>
            </div>
          </Card>

          <Card>
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <Text variant="heading2xl" as="p">
                {summary.topPerformers}
              </Text>
              <Text variant="headingMd" as="h3" color="subdued">
                Top Performers
              </Text>
              <Text variant="bodyMd" as="p" color="subdued">
                High engagement
              </Text>
            </div>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <div style={{ padding: '1.5rem' }}>
          <Stack distribution="equalSpacing" alignment="center">
            <Text variant="headingLg" as="h2">
              Customer Details
            </Text>
            <div style={{ minWidth: '300px' }}>
              <TextField
                label=""
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search customers by email..."
                clearButton
                onClearButtonClick={() => setSearchQuery('')}
              />
            </div>
          </Stack>
        </div>
      </Card>

      {/* Customers Table */}
      <Card>
        <div style={{ padding: '2rem' }}>
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
            footerContent={`Showing ${filteredCustomers.length} of ${customers.length} customers`}
          />
        </div>
      </Card>
    </div>
  );
}
