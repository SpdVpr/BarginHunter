import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Page, Card, Layout, Button, Banner, Spinner, Text } from '@shopify/polaris';
import ShopifyAppBridge from '../src/components/ShopifyAppBridge';

export default function ShopifyApp() {
  const router = useRouter();
  const { shop, installed, error: errorParam } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 App.tsx - Router query:', router.query);
    console.log('🔍 App.tsx - Shop parameter:', shop);

    // Check for error parameters
    if (errorParam) {
      console.log('🔍 Error parameter detected:', errorParam);
      const errorMessages = {
        shop_required: 'Shop parameter is required for installation.',
        invalid_shop: 'Invalid shop domain format.',
        install_failed: 'Installation failed. Please try again.',
      };
      setError(errorMessages[errorParam as keyof typeof errorMessages] || 'An error occurred during installation.');
      setLoading(false);
      return;
    }

    // If no shop parameter, show installation instructions
    if (!shop) {
      console.log('🔍 No shop parameter found, showing installation page');
      setLoading(false);
      return;
    }

    // If just installed, redirect to dashboard
    if (installed === 'true') {
      console.log('🔍 Installation completed, redirecting to dashboard');
      const { hmac, host, timestamp } = router.query;
      const params = new URLSearchParams();
      if (shop) params.set('shop', shop as string);
      if (hmac) params.set('hmac', hmac as string);
      if (host) params.set('host', host as string);
      if (timestamp) params.set('timestamp', timestamp as string);

      router.push(`/dashboard?${params.toString()}`);
      return;
    }

    // Check if shop is already installed
    checkInstallation();
  }, [shop, installed, router]);

  const checkInstallation = async () => {
    try {
      console.log('🔍 Checking installation for shop:', shop);

      // Check if this is coming from OAuth callback with code parameter
      const urlParams = new URLSearchParams(window.location.search);
      const hasCode = urlParams.has('code');
      const hasInstalled = urlParams.has('installed');

      if (hasCode) {
        console.log('🔍 OAuth code detected, processing installation...');
        // Let the OAuth flow handle this
        setLoading(false);
        return;
      }

      if (hasInstalled) {
        console.log('🔍 Installation completed, redirecting to dashboard...');
        const { hmac, host, timestamp } = router.query;
        const params = new URLSearchParams();
        if (shop) params.set('shop', shop as string);
        if (hmac) params.set('hmac', hmac as string);
        if (host) params.set('host', host as string);
        if (timestamp) params.set('timestamp', timestamp as string);

        router.push(`/dashboard?${params.toString()}`);
        return;
      }

      if (shop && typeof shop === 'string') {
        // Check if this is coming from Shopify admin
        const { hmac, host, timestamp } = router.query;
        const hasShopifyParams = hmac && host && timestamp;

        console.log('🔍 Checking installation for shop:', shop);
        console.log('🔍 Has Shopify params:', !!hasShopifyParams);

        if (hasShopifyParams) {
          // This is coming from Shopify admin - check if app is actually installed
          console.log('🔍 Shopify params detected, checking if app is installed');

          try {
            const response = await fetch(`/api/check-installation?shop=${shop}`);
            const data = await response.json();

            console.log('🔍 Installation check response:', JSON.stringify(data, null, 2));

            const isInstalled = data.success && data.installed;

            console.log('🔍 Installation status:', {
              success: data.success,
              installed: data.installed,
              reason: data.reason,
              isInstalled
            });

            if (isInstalled) {
              // App is installed - redirect to dashboard
              console.log('🔍 App is installed, redirecting to dashboard');
              const params = new URLSearchParams();
              if (shop) params.set('shop', shop as string);
              if (hmac) params.set('hmac', hmac as string);
              if (host) params.set('host', host as string);
              if (timestamp) params.set('timestamp', timestamp as string);

              // Use replace instead of push to avoid back button issues
              router.replace(`/dashboard?${params.toString()}`);
              return;
            } else {
              // App is not installed - show installation page
              console.log('🔍 App is not installed, showing installation page');
              console.log('🔍 Reason:', data.reason);
              setLoading(false);
              return;
            }
          } catch (error) {
            console.error('🔍 Error checking installation:', error);
            // On error, show installation page to be safe
            setLoading(false);
            return;
          }
        } else {
          // Direct access without Shopify params - check if app is installed
          console.log('🔍 No Shopify params, checking installation status');

          try {
            const response = await fetch(`/api/check-installation?shop=${shop}`);
            const data = await response.json();

            console.log('🔍 Direct access installation check:', JSON.stringify(data, null, 2));

            const isInstalled = data.success && data.installed;

            if (isInstalled) {
              console.log('🔍 Store is installed, redirecting to dashboard for direct access');
              // For direct access to installed app, redirect to dashboard
              router.push(`/dashboard?shop=${shop}`);
              return;
            } else {
              console.log('🔍 No active store found, showing installation page');
              setLoading(false);
              return;
            }
          } catch (error) {
            console.error('🔍 Error checking installation:', error);
            setLoading(false);
            return;
          }
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('🔍 Installation check error:', err);
      console.log('🔍 Assuming app needs installation due to error');
      setLoading(false);
    }
  };

  const handleInstall = async () => {
    try {
      setLoading(true);
      console.log('🔄 Starting installation for shop:', shop);

      // Redirect directly to install API for cleaner flow
      const installUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/install?shop=${shop}&fresh_install=true`;
      console.log('🔄 Install URL:', installUrl);

      // Try to use App Bridge for OAuth redirect if available
      if ((window as any).shopifyOAuthRedirect) {
        console.log('🔄 Using App Bridge for OAuth redirect');
        (window as any).shopifyOAuthRedirect(installUrl);
        return;
      }

      // Check if we're in an embedded context (iframe)
      if (window.top !== window.self) {
        console.log('🔄 Embedded context detected, using top window for OAuth');
        // We're in an iframe, need to redirect the top window
        window.top!.location.href = installUrl;
      } else {
        console.log('🔄 Direct context, using normal redirect');
        // We're not in an iframe, normal redirect
        window.location.href = installUrl;
      }

    } catch (err) {
      console.error('Installation error:', err);
      setError(err instanceof Error ? err.message : 'Installation failed');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Spinner size="large" />
        <Text variant="bodyMd" as="p" color="subdued">
          Loading...
        </Text>
      </div>
    );
  }

  // Show installation instructions if no shop parameter
  if (!shop) {
    return (
      <>
        <Head>
          <title>Bargain Hunter - Shopify App</title>
          <meta name="description" content="Gamified discount system for Shopify stores" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <Page title="Bargain Hunter">
          <Layout>
            <Layout.Section>
              <Banner
                title="Welcome to Bargain Hunter!"
                status="info"
              >
                <p>
                  This is a Shopify app that adds gamified discount functionality to your store.
                  To get started, install the app from the Shopify App Store or contact your developer.
                </p>
              </Banner>
            </Layout.Section>

            <Layout.Section>
              <Card sectioned>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <h1 style={{
                    fontSize: '2.5rem',
                    marginBottom: '1rem',
                    color: '#202223'
                  }}>
                    🎯 Bargain Hunter
                  </h1>
                  
                  <p style={{
                    fontSize: '1.1rem',
                    color: '#6d7175',
                    marginBottom: '2rem',
                    lineHeight: '1.6'
                  }}>
                    Engage your customers with fun mini-games and reward them with discounts based on their performance.
                  </p>

                  <div style={{ marginBottom: '2rem' }}>
                    <h3>Features:</h3>
                    <ul style={{ textAlign: 'left', display: 'inline-block' }}>
                      <li>🎮 Interactive mini-games</li>
                      <li>🏆 Score-based discount tiers</li>
                      <li>📊 Analytics and reporting</li>
                      <li>⚙️ Customizable game settings</li>
                      <li>🎨 Branded widget appearance</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </Layout.Section>
          </Layout>
        </Page>
      </>
    );
  }

  // Show installation page for specific shop
  return (
    <ShopifyAppBridge>
      <Head>
        <title>Install Bargain Hunter - {shop}</title>
        <meta name="description" content="Install Bargain Hunter app for your Shopify store" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Page title={`Install Bargain Hunter for ${shop}`}>
        <Layout>
          <Layout.Section>
            {error && (
              <Banner
                title="Installation Error"
                status="critical"
                onDismiss={() => setError(null)}
              >
                <p>{error}</p>
              </Banner>
            )}
          </Layout.Section>

          <Layout.Section>
            <Card sectioned>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <h1 style={{
                  fontSize: '2.5rem',
                  marginBottom: '1rem',
                  color: '#202223'
                }}>
                  🎯 Ready to Install Bargain Hunter?
                </h1>
                
                <p style={{
                  fontSize: '1.1rem',
                  color: '#6d7175',
                  marginBottom: '2rem',
                  lineHeight: '1.6'
                }}>
                  Click the button below to install Bargain Hunter on your store: <strong>{shop}</strong>
                </p>

                <Button
                  primary
                  size="large"
                  onClick={handleInstall}
                  loading={loading}
                >
                  Install Bargain Hunter
                </Button>

                <div style={{ marginTop: '2rem', color: '#6d7175' }}>
                  <p>This will redirect you to Shopify to authorize the app installation.</p>
                </div>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </ShopifyAppBridge>
  );
}
