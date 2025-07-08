/** @jsxImportSource react */
import React, { useState } from 'react';
import { Frame, TopBar, Toast } from '@shopify/polaris';

interface ModernDashboardLayoutProps {
  children: React.ReactNode;
  shop: string;
}

interface AdminDashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function ModernDashboardLayout({ children, shop }: ModernDashboardLayoutProps) {
  const [mobileNavigationActive, setMobileNavigationActive] = useState(false);
  const [userMenuActive, setUserMenuActive] = useState(false);
  const [toastActive, setToastActive] = useState(false);

  const toggleMobileNavigation = () => {
    setMobileNavigationActive(!mobileNavigationActive);
  };

  const toggleUserMenu = () => {
    setUserMenuActive(!userMenuActive);
  };

  const userMenuActions = [
    {
      items: [
        {
          content: 'Test Widget',
          onAction: () => window.open(`/widget/game?shop=${shop}&test=true`, '_blank'),
        },
        {
          content: 'View Store',
          onAction: () => window.open(`https://${shop}`, '_blank'),
        },
      ],
    },
    {
      items: [
        {
          content: 'Help & Support',
          onAction: () => {
            setToastActive(true);
          },
        },
      ],
    },
  ];

  const topBarMarkup = (
    <TopBar
      showNavigationToggle={false}
    />
  );

  const toastMarkup = toastActive ? (
    <Toast
      content="Help documentation coming soon!"
      onDismiss={() => setToastActive(false)}
    />
  ) : null;

  return (
    <Frame
      topBar={topBarMarkup}
      showMobileNavigation={mobileNavigationActive}
      onNavigationDismiss={toggleMobileNavigation}
    >
      {toastMarkup}
      {children}
    </Frame>
  );
}

export function AdminDashboardLayout({ children, title = "Admin Dashboard", subtitle }: AdminDashboardLayoutProps) {
  const [mobileNavigationActive, setMobileNavigationActive] = useState(false);
  const [toastActive, setToastActive] = useState(false);

  const toggleMobileNavigation = () => {
    setMobileNavigationActive(!mobileNavigationActive);
  };

  const topBarMarkup = (
    <TopBar
      showNavigationToggle={false}
    />
  );

  const toastMarkup = toastActive ? (
    <Toast
      content="Admin action completed!"
      onDismiss={() => setToastActive(false)}
    />
  ) : null;

  return (
    <Frame
      topBar={topBarMarkup}
      showMobileNavigation={mobileNavigationActive}
      onNavigationDismiss={toggleMobileNavigation}
    >
      {toastMarkup}
      {children}
    </Frame>
  );
}
