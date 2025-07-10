import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function EmbeddedRedirect() {
  const router = useRouter();
  const { shop, host, target } = router.query;

  useEffect(() => {
    console.log('🔄 Embedded redirect starting...', { shop, host, target });

    if (!shop || !host || !target) {
      console.error('❌ Missing required parameters for embedded redirect');
      return;
    }

    // Load Shopify App Bridge and redirect
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@shopify/app-bridge@3';
    script.onload = () => {
      try {
        const { createApp, Redirect } = (window as any).ShopifyAppBridge;

        if (!createApp) {
          console.error('❌ Shopify App Bridge not loaded');
          return;
        }

        const app = createApp({
          apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY,
          host: host as string,
          forceRedirect: true,
        });

        console.log('✅ App Bridge initialized for embedded redirect');

        // Redirect to target page within Shopify admin
        const redirect = Redirect.create(app);
        redirect.dispatch(Redirect.Action.APP, target as string);

        console.log('🔄 Redirecting to:', target);

      } catch (error) {
        console.error('❌ Failed to initialize App Bridge for redirect:', error);
        // Fallback to direct redirect
        window.location.href = target as string;
      }
    };

    script.onerror = () => {
      console.error('❌ Failed to load App Bridge script');
      // Fallback to direct redirect
      window.location.href = target as string;
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [shop, host, target]);

  // Don't render anything - this is just for redirecting
  return null;
}
