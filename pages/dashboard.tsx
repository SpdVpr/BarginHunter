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
  Tabs,
  Frame,
  TopBar,
} from '@shopify/polaris';
import { ModernDashboardLayout } from '../src/components/dashboard/ModernDashboardLayout';
import { OverviewTab } from '../src/components/dashboard/OverviewTab';
import { AnalyticsTab } from '../src/components/dashboard/AnalyticsTab';
import { GamesTab } from '../src/components/dashboard/GamesTab';
import { NotificationBanner } from '../src/components/NotificationBanner';
import { DiscountsTab } from '../src/components/dashboard/DiscountsTab';
import { BillingTab } from '../src/components/dashboard/BillingTab';
import { WidgetDisplayTab } from '../src/components/dashboard/WidgetDisplayTab';
import { SettingsTab } from '../src/components/dashboard/SettingsTab';
import ShopifyAppBridge from '../src/components/ShopifyAppBridge';
import styles from '../src/styles/ModernDashboard.module.css';

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
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    {
      id: 'overview',
      content: 'Overview',
      panelID: 'overview-panel',
    },
    {
      id: 'analytics',
      content: 'Analytics',
      panelID: 'analytics-panel',
    },
    {
      id: 'games',
      content: '🎮 Games',
      panelID: 'games-panel',
    },
    {
      id: 'discounts',
      content: 'Discounts',
      panelID: 'discounts-panel',
    },
    {
      id: 'billing',
      content: 'Billing & Usage',
      panelID: 'billing-panel',
    },
    {
      id: 'widget',
      content: 'Widget Display',
      panelID: 'widget-panel',
    },
    {
      id: 'settings',
      content: 'Settings',
      panelID: 'settings-panel',
    },
  ];

  const handleTabChange = (selectedTabIndex: number) => {
    setSelectedTab(selectedTabIndex);
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 0:
        return <OverviewTab shop={shop} onTabChange={setSelectedTab} />;
      case 1:
        return <AnalyticsTab shop={shop} />;
      case 2:
        return <GamesTab shop={shop} />;
      case 3:
        return <DiscountsTab shop={shop} />;
      case 4:
        return <BillingTab shop={shop} />;
      case 5:
        return <WidgetDisplayTab shop={shop} />;
      case 6:
        return <SettingsTab shop={shop} />;
      default:
        return <OverviewTab shop={shop} onTabChange={setSelectedTab} />;
    }
  };

  // Add admin-dashboard classes when component mounts
  React.useEffect(() => {
    document.documentElement.classList.add('admin-dashboard-html');
    document.body.classList.add('admin-dashboard-body');
    const rootElement = document.getElementById('__next');
    if (rootElement) {
      rootElement.classList.add('admin-dashboard-page');
    }

    return () => {
      document.documentElement.classList.remove('admin-dashboard-html');
      document.body.classList.remove('admin-dashboard-body');
      if (rootElement) {
        rootElement.classList.remove('admin-dashboard-page');
      }
    };
  }, []);

  return (
    <ShopifyAppBridge>
      <ModernDashboardLayout shop={typeof shop === 'string' ? shop : ''}>
      <div className={`${styles.modernDashboard} admin-dashboard-page`}>
        {/* Modern Header */}
        <div className={styles.modernHeader}>
          <div className={styles.modernHeaderContent}>
            <div>
              <Text variant="headingXl" as="h1" color="subdued">
                Bargain Hunter
              </Text>
              <Text variant="bodyMd" as="p" color="subdued">
                {shop}
              </Text>
            </div>
            <Stack spacing="tight">
              <Button
                onClick={() => window.open(`/widget/game?shop=${shop}&test=true`, '_blank')}
              >
                Test Widget
              </Button>
              <Button
                primary
                onClick={() => setSelectedTab(4)}
              >
                Settings
              </Button>
            </Stack>
          </div>
        </div>

        {/* Notifications */}
        <NotificationBanner shop={typeof shop === 'string' ? shop : ''} />

        {/* Modern Tabs */}
        <div className={styles.modernTabsContainer}>
          <div className={styles.modernTabsContent}>
            <Tabs
              tabs={tabs}
              selected={selectedTab}
              onSelect={handleTabChange}
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className={styles.modernContent}>
          {renderTabContent()}
        </div>
      </div>
    </ModernDashboardLayout>
    </ShopifyAppBridge>
  );
}
