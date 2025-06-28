import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if this is a Shopify app context
    const { shop, hmac, host, timestamp } = router.query;

    if (shop) {
      // If shop parameter exists, this is a Shopify app access
      // Redirect to dashboard with all Shopify parameters
      const params = new URLSearchParams();
      if (shop) params.set('shop', shop as string);
      if (hmac) params.set('hmac', hmac as string);
      if (host) params.set('host', host as string);
      if (timestamp) params.set('timestamp', timestamp as string);

      router.push(`/dashboard?${params.toString()}`);
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
