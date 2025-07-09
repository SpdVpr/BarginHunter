/** @jsxImportSource react */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Text,
  Stack,
  Badge,
  DataTable,
  Spinner,
  Select,
} from '@shopify/polaris';
import styles from './ResponsiveGrid.module.css';

interface DiscountsTabProps {
  shop: string | string[] | undefined;
}

interface DiscountCode {
  id: string;
  code: string;
  value: number;
  customerEmail: string;
  isUsed: boolean;
  createdAt: string;
  usedAt?: string;
  orderValue?: number;
}

interface DiscountsSummary {
  total: number;
  used: number;
  unused: number;
  totalValue: number;
  usedValue: number;
  averageOrderValue: number;
}

export function DiscountsTab({ shop }: DiscountsTabProps) {
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [summary, setSummary] = useState<DiscountsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (shop) {
      loadDiscountsData();
    }
  }, [shop]);

  const loadDiscountsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/discounts?shop=${shop}`);
      if (response.ok) {
        const data = await response.json();
        setDiscounts(data.discounts || []);
        setSummary(data.summary || {
          total: 0,
          used: 0,
          unused: 0,
          totalValue: 0,
          usedValue: 0,
          averageOrderValue: 0,
        });
      }
    } catch (error) {
      console.error('Failed to load discounts data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { label: 'All Discounts', value: 'all' },
    { label: 'Used Only', value: 'used' },
    { label: 'Unused Only', value: 'unused' },
  ];

  const filteredDiscounts = discounts.filter(discount => {
    if (statusFilter === 'used') return discount.isUsed;
    if (statusFilter === 'unused') return !discount.isUsed;
    return true;
  });

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

  const discountsTableRows = filteredDiscounts.map((discount) => [
    discount.code,
    `${discount.value}%`,
    discount.customerEmail || 'Anonymous',
    <Badge status={discount.isUsed ? 'success' : 'attention'}>
      {discount.isUsed ? 'Used' : 'Unused'}
    </Badge>,
    formatDateForMobile(new Date(discount.createdAt)),
    discount.usedAt ? formatDateForMobile(new Date(discount.usedAt)) : '-',
    discount.orderValue ? `$${discount.orderValue.toFixed(2)}` : '-',
  ]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <Spinner size="large" />
        <Text variant="bodyMd" as="p" color="subdued">
          Loading discounts data...
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Summary Statistics */}
      {summary && (
        <div className={styles.section}>
          <div className={styles.responsiveGrid}>
            <Card>
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <Text variant="heading2xl" as="p">
                  {summary.total}
                </Text>
                <Text variant="headingMd" as="h3" color="subdued">
                  Total Generated
                </Text>
                <Text variant="bodyMd" as="p" color="subdued">
                  Discount codes
                </Text>
              </div>
            </Card>

            <Card>
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <Text variant="heading2xl" as="p">
                  {summary.used}
                </Text>
                <Text variant="headingMd" as="h3" color="subdued">
                  Used Codes
                </Text>
                <Badge status="success">
                  {Math.round((summary.used / Math.max(summary.total, 1)) * 100)}% usage rate
                </Badge>
              </div>
            </Card>

            <Card>
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <Text variant="heading2xl" as="p">
                  {summary.unused}
                </Text>
                <Text variant="headingMd" as="h3" color="subdued">
                  Unused Codes
                </Text>
                <Text variant="bodyMd" as="p" color="subdued">
                  Available for use
                </Text>
              </div>
            </Card>

            <Card>
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <Text variant="heading2xl" as="p">
                  ${(summary.averageOrderValue || 0).toFixed(0)}
                </Text>
                <Text variant="headingMd" as="h3" color="subdued">
                  Avg Order Value
                </Text>
                <Text variant="bodyMd" as="p" color="subdued">
                  With discount
                </Text>
              </div>
            </Card>

            <Card>
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <Text variant="heading2xl" as="p">
                  ${(summary.totalValue || 0).toFixed(0)}
                </Text>
                <Text variant="headingMd" as="h3" color="subdued">
                  Total Discount Value
                </Text>
                <Text variant="bodyMd" as="p" color="subdued">
                  All generated codes
                </Text>
              </div>
            </Card>

            <Card>
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <Text variant="heading2xl" as="p">
                  ${(summary.usedValue || 0).toFixed(0)}
                </Text>
                <Text variant="headingMd" as="h3" color="subdued">
                  Used Discount Value
                </Text>
                <Text variant="bodyMd" as="p" color="subdued">
                  Customer savings
                </Text>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className={styles.section}>
        <Card>
          <div style={{ padding: '1.5rem' }}>
            <Stack distribution="equalSpacing" alignment="center">
              <Text variant="headingLg" as="h2">
                Discount Codes
              </Text>
              <div style={{ minWidth: '200px' }}>
                <Select
                  label=""
                  options={statusOptions}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
              </div>
            </Stack>
          </div>
        </Card>
      </div>

      {/* Discounts Table */}
      <div className={styles.section}>
        <Card>
          <div style={{ padding: '2rem' }}>
            <div className={styles.tableContainer}>
              <DataTable
                columnContentTypes={[
                  'text',
                  'text',
                  'text',
                  'text',
                  'text',
                  'text',
                  'text',
                ]}
                headings={[
                  'Code',
                  'Discount',
                  'Customer',
                  'Status',
                  'Created',
                  'Used Date',
                  'Order Value',
                ]}
                rows={discountsTableRows}
                footerContent={`Showing ${filteredDiscounts.length} of ${discounts.length} discount codes`}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
