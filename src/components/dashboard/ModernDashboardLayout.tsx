/** @jsxImportSource react */
import React, { useState } from 'react';
import { Frame, TopBar, Toast } from '@shopify/polaris';

interface ModernDashboardLayoutProps {
  children: React.ReactNode;
  shop: string;
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
      userMenu={{
        actions: userMenuActions,
        name: shop,
        detail: 'Bargain Hunter Dashboard',
        initials: shop.charAt(0).toUpperCase(),
        open: userMenuActive,
        onToggle: toggleUserMenu,
      }}
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
