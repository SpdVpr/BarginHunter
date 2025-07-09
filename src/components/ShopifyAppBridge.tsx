import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface ShopifyAppBridgeProps {
  children: React.ReactNode;
}

declare global {
  interface Window {
    shopifyApp?: any;
  }
}

export function ShopifyAppBridge({ children }: ShopifyAppBridgeProps) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const { shop, host } = router.query;

  useEffect(() => {
    if (!shop || !host) {
      console.log('Missing shop or host parameter');
      return;
    }

    // Load Shopify App Bridge
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@shopify/app-bridge@3';
    script.onload = () => {
      initializeAppBridge();
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [shop, host]);

  const initializeAppBridge = () => {
    try {
      const { createApp, Redirect } = (window as any).ShopifyAppBridge;

      if (!createApp) {
        console.error('Shopify App Bridge not loaded');
        return;
      }

      const app = createApp({
        apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY,
        host: host as string,
        forceRedirect: true,
      });

      // Store app instance globally
      window.shopifyApp = app;

      // Add global function for OAuth redirects
      (window as any).shopifyOAuthRedirect = (url: string) => {
        console.log('🔄 App Bridge OAuth redirect:', url);
        const redirect = Redirect.create(app);
        redirect.dispatch(Redirect.Action.REMOTE, url);
      };

      console.log('✅ Shopify App Bridge initialized');
      setIsReady(true);

    } catch (error) {
      console.error('Failed to initialize Shopify App Bridge:', error);
      // Still render children even if App Bridge fails
      setIsReady(true);
    }
  };

  // Always render children, but log if App Bridge is not ready
  useEffect(() => {
    if (isReady) {
      console.log('🚀 App Bridge ready, rendering application');
    }
  }, [isReady]);

  return <>{children}</>;
}

export default ShopifyAppBridge;
