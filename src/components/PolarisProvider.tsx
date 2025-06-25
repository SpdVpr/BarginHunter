import React from 'react';
import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';

interface PolarisProviderProps {
  children: React.ReactNode;
}

export default function PolarisProvider({ children }: PolarisProviderProps) {
  return (
    <AppProvider i18n={{}}>
      {children}
    </AppProvider>
  );
}
