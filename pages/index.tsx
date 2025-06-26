import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if this is a Shopify app context
    const { shop } = router.query;

    if (shop) {
      // If shop parameter exists, this is a Shopify app access
      router.push(`/app?shop=${shop}`);
    } else {
      // Otherwise, redirect to demo
      router.push('/demo');
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
          Redirecting to Bargain Hunter Demo...
        </p>
      </div>
    </div>
  );
}

// This page should not use the main app layout
Home.getLayout = function getLayout(page: React.ReactElement) {
  return page;
};
