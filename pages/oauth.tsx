import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function OAuthPage() {
  const router = useRouter();
  const { shop } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shop) {
      setError('Shop parameter is required');
      setLoading(false);
      return;
    }

    console.log('🔄 OAuth page - Starting installation for shop:', shop);

    // Redirect to install API immediately
    const installUrl = `/api/auth/install?shop=${shop}&fresh_install=true`;
    console.log('🔄 OAuth page - Redirecting to:', installUrl);
    
    // Use a small delay to ensure the page loads properly
    setTimeout(() => {
      window.location.href = installUrl;
    }, 100);

  }, [shop]);

  return (
    <>
      <Head>
        <title>Installing Bargain Hunter...</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: '#f6f6f7'
      }}>
        <div style={{ 
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          maxWidth: '400px'
        }}>
          {error ? (
            <>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
              <h1 style={{ color: '#d72c0d', marginBottom: '1rem' }}>Installation Error</h1>
              <p style={{ color: '#666' }}>{error}</p>
            </>
          ) : (
            <>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
              <h1 style={{ color: '#202223', marginBottom: '1rem' }}>Installing Bargain Hunter</h1>
              <p style={{ color: '#666', marginBottom: '1rem' }}>
                Redirecting to Shopify for authorization...
              </p>
              <p style={{ color: '#999', fontSize: '0.9rem' }}>
                Shop: {shop}
              </p>
              
              {/* Loading animation */}
              <div style={{
                display: 'inline-block',
                width: '20px',
                height: '20px',
                border: '3px solid #f3f3f3',
                borderTop: '3px solid #5c6ac4',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginTop: '1rem'
              }}></div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

// This page should not use the main app layout
OAuthPage.getLayout = function getLayout(page: React.ReactElement) {
  return page;
};
