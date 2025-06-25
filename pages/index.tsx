import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/demo');
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
