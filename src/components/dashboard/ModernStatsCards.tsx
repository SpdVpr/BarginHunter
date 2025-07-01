/** @jsxImportSource react */
import React from 'react';
import { Card, Text, Stack, Badge } from '@shopify/polaris';
import { SharedStats } from '../../hooks/useSharedStats';

interface ModernStatsCardsProps {
  stats: SharedStats;
  variant?: 'grid' | 'row';
}

interface ModernStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: { text: string; status: 'success' | 'info' | 'attention' | 'warning' | 'critical' };
  gradient: string;
  icon?: string;
  trend?: { value: number; isPositive: boolean };
}

function ModernStatCard({ title, value, subtitle, badge, gradient, icon, trend }: ModernStatCardProps) {
  return (
    <Card>
      <div style={{
        padding: '2rem',
        background: gradient,
        color: 'white',
        borderRadius: '12px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100px',
          height: '100px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          transform: 'translate(30px, -30px)',
        }} />
        
        <Stack vertical spacing="tight">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text variant="headingMd" as="h3" color="inherit">
              {title}
            </Text>
            {icon && (
              <div style={{ fontSize: '24px', opacity: 0.8 }}>
                {icon}
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <Text variant="heading2xl" as="p" color="inherit">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Text>
            {trend && (
              <div style={{
                fontSize: '14px',
                color: trend.isPositive ? '#4ade80' : '#f87171',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}>
                {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
              </div>
            )}
          </div>
          
          {subtitle && (
            <Text variant="bodyMd" as="p" color="inherit" style={{ opacity: 0.9 }}>
              {subtitle}
            </Text>
          )}
          
          {badge && (
            <div style={{ marginTop: '0.5rem' }}>
              <Badge status={badge.status}>
                {badge.text}
              </Badge>
            </div>
          )}
        </Stack>
      </div>
    </Card>
  );
}

export function ModernStatsCards({ stats, variant = 'grid' }: ModernStatsCardsProps) {
  const containerStyle = variant === 'grid' 
    ? {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
      }
    : {
        display: 'flex',
        gap: '1.5rem',
        overflowX: 'auto',
        paddingBottom: '1rem',
      };

  return (
    <div style={containerStyle}>
      {/* Total Sessions */}
      <ModernStatCard
        title="Total Sessions"
        value={stats.totalSessions}
        subtitle={`${stats.completedSessions} completed`}
        badge={{
          text: `${stats.completionRate}% completion rate`,
          status: stats.completionRate > 50 ? 'success' : 'attention'
        }}
        gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        icon="🎮"
        trend={{ value: 12, isPositive: true }}
      />

      {/* Revenue */}
      <ModernStatCard
        title="Estimated Revenue"
        value={`$${stats.revenue?.toLocaleString() || '0'}`}
        subtitle={`From ${stats.usedDiscounts} used discounts`}
        badge={{
          text: `${stats.discountUsageRate}% usage rate`,
          status: 'success'
        }}
        gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
        icon="💰"
        trend={{ value: 8, isPositive: true }}
      />

      {/* Active Players */}
      <ModernStatCard
        title="Active Players"
        value={stats.uniqueCustomers || 0}
        subtitle="Unique customers playing"
        badge={{
          text: `${stats.activeCustomers || 0} this month`,
          status: 'info'
        }}
        gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
        icon="👥"
        trend={{ value: 15, isPositive: true }}
      />

      {/* Average Score */}
      <ModernStatCard
        title="Average Score"
        value={Math.round(stats.averageScore || 0)}
        subtitle="Points per completed game"
        badge={{
          text: `${stats.totalDiscounts} discounts generated`,
          status: 'info'
        }}
        gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
        icon="🏆"
        trend={{ value: 5, isPositive: true }}
      />

      {/* Conversion Rate */}
      <ModernStatCard
        title="Conversion Rate"
        value={`${stats.conversionRate || 0}%`}
        subtitle="Games to purchases"
        badge={{
          text: stats.conversionRate > 3 ? 'Excellent' : 'Good',
          status: stats.conversionRate > 3 ? 'success' : 'info'
        }}
        gradient="linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
        icon="📈"
        trend={{ value: 3, isPositive: true }}
      />

      {/* Today's Activity */}
      <ModernStatCard
        title="Today's Activity"
        value={stats.today?.sessions || 0}
        subtitle={`${stats.today?.discounts || 0} discounts earned`}
        badge={{
          text: 'Live data',
          status: 'success'
        }}
        gradient="linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"
        icon="📊"
        trend={{ value: 20, isPositive: true }}
      />
    </div>
  );
}

// Quick Stats Component for smaller displays
export function QuickModernStats({ stats }: { stats: SharedStats }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
    }}>
      <Card>
        <div style={{ padding: '1.5rem', textAlign: 'center' }}>
          <Text variant="heading2xl" as="p">
            {stats.totalSessions.toLocaleString()}
          </Text>
          <Text variant="bodyMd" as="p" color="subdued">
            Total Sessions
          </Text>
        </div>
      </Card>

      <Card>
        <div style={{ padding: '1.5rem', textAlign: 'center' }}>
          <Text variant="heading2xl" as="p">
            ${stats.revenue?.toLocaleString() || '0'}
          </Text>
          <Text variant="bodyMd" as="p" color="subdued">
            Revenue
          </Text>
        </div>
      </Card>

      <Card>
        <div style={{ padding: '1.5rem', textAlign: 'center' }}>
          <Text variant="heading2xl" as="p">
            {stats.uniqueCustomers || 0}
          </Text>
          <Text variant="bodyMd" as="p" color="subdued">
            Players
          </Text>
        </div>
      </Card>

      <Card>
        <div style={{ padding: '1.5rem', textAlign: 'center' }}>
          <Text variant="heading2xl" as="p">
            {stats.completionRate}%
          </Text>
          <Text variant="bodyMd" as="p" color="subdued">
            Completion
          </Text>
        </div>
      </Card>
    </div>
  );
}
