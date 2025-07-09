import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if this is a Shopify app context
    const { shop, hmac, host, timestamp, installed } = router.query;

    console.log('🔍 Root page - Query params:', router.query);

    if (shop) {
      // If this is a fresh installation (from OAuth callback)
      if (installed === 'true') {
        console.log('🔍 Fresh installation detected, redirecting to dashboard');
        const params = new URLSearchParams();
        if (shop) params.set('shop', shop as string);
        if (hmac) params.set('hmac', hmac as string);
        if (host) params.set('host', host as string);
        if (timestamp) params.set('timestamp', timestamp as string);

        router.push(`/dashboard?${params.toString()}`);
        return;
      }

      // For embedded app access, redirect to /app endpoint first
      // This ensures proper App Bridge initialization
      console.log('🔍 Shopify embedded app access, redirecting to /app');
      const params = new URLSearchParams();
      if (shop) params.set('shop', shop as string);
      if (hmac) params.set('hmac', hmac as string);
      if (host) params.set('host', host as string);
      if (timestamp) params.set('timestamp', timestamp as string);

      router.push(`/app?${params.toString()}`);
    } else {
      // Otherwise, show installation instructions
      router.push('/app');
    }
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '20px', color: '#666' }}>
          Loading Bargain Hunter...
        </p>
      </div>
    </div>
  );
}

// This page should not use the main app layout
Home.getLayout = function getLayout(page: React.ReactElement) {
  return page;
};
