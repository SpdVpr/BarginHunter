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
import { CustomersTab } from '../src/components/dashboard/CustomersTab';
import { DiscountsTab } from '../src/components/dashboard/DiscountsTab';
import { SettingsTab } from '../src/components/dashboard/SettingsTab';
import '../src/styles/modern-dashboard.css';

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
      id: 'customers',
      content: 'Customers',
      panelID: 'customers-panel',
    },
    {
      id: 'discounts',
      content: 'Discounts',
      panelID: 'discounts-panel',
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
        return <OverviewTab shop={shop} />;
      case 1:
        return <AnalyticsTab shop={shop} />;
      case 2:
        return <CustomersTab shop={shop} />;
      case 3:
        return <DiscountsTab shop={shop} />;
      case 4:
        return <SettingsTab shop={shop} />;
      default:
        return <OverviewTab shop={shop} />;
    }
  };

  return (
    <ModernDashboardLayout shop={typeof shop === 'string' ? shop : ''}>
      <div className="modern-dashboard">
        {/* Modern Header */}
        <div className="modern-header">
          <div className="modern-header-content">
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

        {/* Modern Tabs */}
        <div className="modern-tabs-container">
          <div className="modern-tabs-content">
            <Tabs
              tabs={tabs}
              selected={selectedTab}
              onSelect={handleTabChange}
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="modern-content">
          {renderTabContent()}
        </div>
      </div>
    </ModernDashboardLayout>
  );
}
