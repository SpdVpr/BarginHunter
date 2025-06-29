/** @jsxImportSource react */
import React, { useState } from 'react';
import { Frame, TopBar, Navigation } from '@shopify/polaris';
import {
  HomeMinor,
  SettingsMinor,
  AnalyticsMinor,
  CustomersMinor,
  DiscountsMajor,
} from '@shopify/polaris-icons';

interface DashboardLayoutProps {
  children: React.ReactNode;
  shop: string;
  currentPage: 'dashboard' | 'analytics' | 'customers' | 'discounts' | 'settings';
}

export function DashboardLayout({ children, shop, currentPage }: DashboardLayoutProps) {
  const [mobileNavigationActive, setMobileNavigationActive] = useState(false);

  const toggleMobileNavigation = () => {
    setMobileNavigationActive(!mobileNavigationActive);
  };

  const navigationMarkup = (
    <Navigation location="/">
      <Navigation.Section
        items={[
          {
            url: `/dashboard?shop=${shop}`,
            label: 'Dashboard',
            icon: HomeMinor,
            selected: currentPage === 'dashboard',
          },
          {
            url: `/dashboard/analytics?shop=${shop}`,
            label: 'Analytics',
            icon: AnalyticsMinor,
            selected: currentPage === 'analytics',
          },
          {
            url: `/dashboard/customers?shop=${shop}`,
            label: 'Customers',
            icon: CustomersMinor,
            selected: currentPage === 'customers',
          },
          {
            url: `/dashboard/discounts?shop=${shop}`,
            label: 'Discounts',
            icon: DiscountsMajor,
            selected: currentPage === 'discounts',
          },
          {
            url: `/dashboard/settings?shop=${shop}`,
            label: 'Settings',
            icon: SettingsMinor,
            selected: currentPage === 'settings',
          },
        ]}
      />
    </Navigation>
  );

  const topBarMarkup = (
    <TopBar
      showNavigationToggle
      onNavigationToggle={toggleMobileNavigation}
    />
  );

  return (
    <Frame
      topBar={topBarMarkup}
      navigation={navigationMarkup}
      showMobileNavigation={mobileNavigationActive}
      onNavigationDismiss={toggleMobileNavigation}
    >
      {children}
    </Frame>
  );
}
