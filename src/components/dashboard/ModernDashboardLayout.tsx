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
    />
  );

  const toastMarkup = toastActive ? (
    <Toast
      content="Help documentation coming soon!"
      onDismiss={() => setToastActive(false)}
    />
  ) : null;

  return (
    <div style={{
      minHeight: '100vh',
      height: 'auto',
      maxHeight: 'none',
      overflow: 'auto',
      position: 'relative',
      width: '100%',
    }}>
      {toastMarkup}
      <div style={{
        overflow: 'auto',
        height: 'auto',
        maxHeight: 'none',
        width: '100%',
      }}>
        {children}
      </div>
    </div>
  );
}
