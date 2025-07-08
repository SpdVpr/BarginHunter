/** @jsxImportSource react */
import React from 'react';
import {
  Card,
  Text,
  Stack,
  Badge,
  DataTable,
  DisplayText,
  ProgressBar,
} from '@shopify/polaris';
import styles from '../../styles/AdminDashboard.module.css';

interface AdminMetrics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  totalShops: number;
  activeShops: number;
  planDistribution: {
    free: number;
    starter: number;
    pro: number;
    enterprise: number;
  };
  totalGameSessions: number;
  totalDiscountCodes: number;
  averageDiscountCodesPerShop: number;
}

interface ResponsiveAdminStatsProps {
  metrics: AdminMetrics;
}

interface ResponsiveStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: string;
}

function ResponsiveStatCard({ title, value, subtitle, trend, icon }: ResponsiveStatCardProps) {
  return (
    <div className={styles.adminStatCard} style={{ cursor: 'default' }}>
      <Stack vertical spacing="tight">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem'
        }}>
          {icon && (
            <span style={{
              fontSize: '1.5rem',
              minWidth: '2rem',
              textAlign: 'center'
            }}>
              {icon}
            </span>
          )}
          <Text variant="headingMd" color="subdued">{title}</Text>
        </div>

        <div style={{ marginBottom: '0.5rem' }}>
          <DisplayText size="large">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </DisplayText>
        </div>

        {subtitle && (
          <div style={{ marginBottom: '0.25rem' }}>
            <Text variant="bodyMd" color="subdued">
              {subtitle}
            </Text>
          </div>
        )}

        {trend && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.25rem 0.5rem',
            backgroundColor: trend.isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderRadius: '4px',
            width: 'fit-content'
          }}>
            <span style={{
              color: trend.isPositive ? '#10b981' : '#ef4444',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}>
              {trend.isPositive ? '↗' : '↘'}
            </span>
            <Text variant="bodyMd" color={trend.isPositive ? 'success' : 'critical'}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </Text>
          </div>
        )}
      </Stack>
    </div>
  );
}

export function ResponsiveAdminStats({ metrics }: ResponsiveAdminStatsProps) {
  return (
    <div>
      {/* Key Metrics Grid */}
      <div className={styles.adminStatsGrid}>
        <ResponsiveStatCard
          title="Monthly Revenue"
          value={`$${metrics.totalRevenue.toLocaleString()}`}
          subtitle="+12% from last month"
          trend={{ value: 12, isPositive: true }}
          icon="💰"
        />
        
        <ResponsiveStatCard
          title="Active Shops"
          value={metrics.activeShops}
          subtitle={`${metrics.totalShops} total shops`}
          trend={{ value: 8, isPositive: true }}
          icon="🏪"
        />
        
        <ResponsiveStatCard
          title="Discount Codes"
          value={metrics.totalDiscountCodes}
          subtitle={`${metrics.averageDiscountCodesPerShop.toFixed(1)} avg per shop`}
          trend={{ value: 15, isPositive: true }}
          icon="🎫"
        />
        
        <ResponsiveStatCard
          title="Game Sessions"
          value={metrics.totalGameSessions}
          subtitle="Total gameplay sessions"
          trend={{ value: 22, isPositive: true }}
          icon="🎮"
        />
      </div>

      {/* Plan Distribution */}
      <div className={styles.adminCard}>
        <div className={styles.adminCardHeader}>
          <Text variant="headingMd" as="h3">Plan Distribution</Text>
        </div>
        <div className={styles.adminCardContent}>
          <div className={styles.adminStatsGrid}>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <Stack vertical spacing="tight">
                <Text variant="bodyMd">🆓 Free</Text>
                <Text variant="headingLg">{metrics.planDistribution.free}</Text>
                <ProgressBar 
                  progress={(metrics.planDistribution.free / metrics.totalShops) * 100} 
                  size="small" 
                />
                <Text variant="bodyMd" color="subdued">
                  {((metrics.planDistribution.free / metrics.totalShops) * 100).toFixed(1)}%
                </Text>
              </Stack>
            </div>
            
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <Stack vertical spacing="tight">
                <Text variant="bodyMd">💼 Starter</Text>
                <Text variant="headingLg">{metrics.planDistribution.starter}</Text>
                <ProgressBar 
                  progress={(metrics.planDistribution.starter / metrics.totalShops) * 100} 
                  size="small" 
                  color="success"
                />
                <Text variant="bodyMd" color="subdued">
                  {((metrics.planDistribution.starter / metrics.totalShops) * 100).toFixed(1)}%
                </Text>
              </Stack>
            </div>
            
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <Stack vertical spacing="tight">
                <Text variant="bodyMd">🚀 Pro</Text>
                <Text variant="headingLg">{metrics.planDistribution.pro}</Text>
                <ProgressBar 
                  progress={(metrics.planDistribution.pro / metrics.totalShops) * 100} 
                  size="small" 
                  color="success"
                />
                <Text variant="bodyMd" color="subdued">
                  {((metrics.planDistribution.pro / metrics.totalShops) * 100).toFixed(1)}%
                </Text>
              </Stack>
            </div>
            
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <Stack vertical spacing="tight">
                <Text variant="bodyMd">🏢 Enterprise</Text>
                <Text variant="headingLg">{metrics.planDistribution.enterprise}</Text>
                <ProgressBar 
                  progress={(metrics.planDistribution.enterprise / metrics.totalShops) * 100} 
                  size="small" 
                  color="success"
                />
                <Text variant="bodyMd" color="subdued">
                  {((metrics.planDistribution.enterprise / metrics.totalShops) * 100).toFixed(1)}%
                </Text>
              </Stack>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className={styles.adminCard}>
          <div className={styles.adminCardHeader}>
            <Text variant="headingMd" as="h3">📊 Performance Metrics</Text>
          </div>
          <div className={styles.adminCardContent}>
            <Stack vertical spacing="loose">
              <div>
                <Text variant="bodyMd" fontWeight="semibold">Monthly Recurring Revenue</Text>
                <DisplayText size="medium">${metrics.monthlyRecurringRevenue.toLocaleString()}</DisplayText>
              </div>
              <div>
                <Text variant="bodyMd" fontWeight="semibold">Active Shop Rate</Text>
                <DisplayText size="medium">
                  {((metrics.activeShops / metrics.totalShops) * 100).toFixed(1)}%
                </DisplayText>
              </div>
            </Stack>
          </div>
        </div>
        
        <div className={styles.adminCard}>
          <div className={styles.adminCardHeader}>
            <Text variant="headingMd" as="h3">📈 Growth Indicators</Text>
          </div>
          <div className={styles.adminCardContent}>
            <Stack vertical spacing="loose">
              <div>
                <Text variant="bodyMd" fontWeight="semibold">Revenue per Shop</Text>
                <DisplayText size="medium">
                  ${(metrics.totalRevenue / metrics.totalShops).toFixed(2)}
                </DisplayText>
              </div>
              <div>
                <Text variant="bodyMd" fontWeight="semibold">Conversion Rate</Text>
                <DisplayText size="medium">
                  {metrics.totalGameSessions > 0 
                    ? ((metrics.totalDiscountCodes / metrics.totalGameSessions) * 100).toFixed(1)
                    : '0'
                  }%
                </DisplayText>
              </div>
            </Stack>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ResponsiveDataTableProps {
  title: string;
  columnContentTypes: string[];
  headings: string[];
  rows: any[][];
  footerContent?: string;
  actions?: React.ReactNode;
}

export function ResponsiveDataTable({ 
  title, 
  columnContentTypes, 
  headings, 
  rows, 
  footerContent,
  actions 
}: ResponsiveDataTableProps) {
  return (
    <div className={styles.adminCard}>
      <div className={styles.adminCardHeader}>
        <Stack distribution="equalSpacing" alignment="center">
          <Text variant="headingMd" as="h3">{title}</Text>
          {actions}
        </Stack>
      </div>
      <div className={styles.adminCardContent}>
        <div className={styles.adminTable}>
          <DataTable
            columnContentTypes={columnContentTypes}
            headings={headings}
            rows={rows}
            footerContent={footerContent}
          />
        </div>
      </div>
    </div>
  );
}
