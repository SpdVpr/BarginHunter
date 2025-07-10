import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Page,
  Card,
  Layout,
  Text,
  Button,
  Banner,
  List,
  Stack,
  Spinner,
  Badge
} from '@shopify/polaris';
import ShopifyAppBridge from '../src/components/ShopifyAppBridge';

export default function InstallationComplete() {
  const router = useRouter();
  const { shop } = router.query;
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (shop) {
      setLoading(false);
    }
  }, [shop]);

  const checkInstallation = async () => {
    if (!shop) return;
    
    setChecking(true);
    try {
      const response = await fetch(`/api/check-installation?shop=${shop}`);
      const data = await response.json();
      
      if (data.success && data.installed) {
        // Installation is complete, redirect to dashboard
        router.push(`/dashboard?shop=${shop}`);
      } else {
        console.log('Installation not yet complete:', data.reason);
      }
    } catch (error) {
      console.error('Error checking installation:', error);
    } finally {
      setChecking(false);
    }
  };

  const goToDashboard = () => {
    // Use App Bridge navigation for embedded apps
    if (window.shopifyApp && (window as any).ShopifyAppBridge) {
      const { Redirect } = (window as any).ShopifyAppBridge;
      const redirect = Redirect.create(window.shopifyApp);
      redirect.dispatch(Redirect.Action.APP, `/dashboard?shop=${shop}`);
    } else {
      // Fallback to regular navigation
      router.push(`/dashboard?shop=${shop}`);
    }
  };

  if (loading) {
    return (
      <Page>
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Spinner size="large" />
                <Text variant="bodyMd" as="p">Loading...</Text>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <ShopifyAppBridge>
      <Page
        title="Installation Complete!"
        subtitle={`Bargain Hunter has been installed for ${shop}`}
      >
        <Layout>
          <Layout.Section>
            <Banner
              title="🎉 Installation Successful!"
              status="success"
            >
              <p>
                Bargain Hunter has been successfully installed in your Shopify store. 
                Your customers can now play games to earn discount codes!
              </p>
            </Banner>
          </Layout.Section>

          <Layout.Section>
            <Card title="What's Next?">
              <Stack vertical spacing="loose">
                <Text variant="bodyMd" as="p">
                  Your app is now ready to use. Here's what you can do:
                </Text>
                
                <List type="number">
                  <List.Item>
                    <strong>Access your dashboard</strong> - Configure games, view analytics, and manage settings
                  </List.Item>
                  <List.Item>
                    <strong>Test the widget</strong> - Try the game widget to see how it works for customers
                  </List.Item>
                  <List.Item>
                    <strong>Customize settings</strong> - Set discount tiers, game difficulty, and display options
                  </List.Item>
                  <List.Item>
                    <strong>Monitor performance</strong> - Track customer engagement and discount usage
                  </List.Item>
                </List>

                <Stack distribution="leading" spacing="tight">
                  <Button
                    primary
                    onClick={goToDashboard}
                    loading={checking}
                  >
                    Go to Dashboard
                  </Button>
                  
                  <Button
                    onClick={checkInstallation}
                    loading={checking}
                  >
                    {checking ? 'Checking...' : 'Verify Installation'}
                  </Button>
                </Stack>
              </Stack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card title="Important Note">
              <Stack vertical spacing="tight">
                <Text variant="bodyMd" as="p">
                  <strong>For the best experience:</strong> After installation, the app should automatically 
                  redirect you to the dashboard when accessed from your Shopify admin. If you see the 
                  installation screen again, please contact support.
                </Text>
                
                <Banner
                  title="App URL Configuration"
                  status="info"
                >
                  <p>
                    If you continue to see the installation screen when clicking the app in your 
                    Shopify admin, the App URL may need to be updated in the Partner Dashboard. 
                    This is a one-time configuration that ensures smooth access to your dashboard.
                  </p>
                </Banner>
              </Stack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card title="Quick Actions">
              <Stack distribution="leading" spacing="tight">
                <Button
                  onClick={() => window.open(`/widget/game?shop=${shop}&test=true`, '_blank')}
                >
                  Test Game Widget
                </Button>
                
                <Button
                  onClick={() => {
                    if (window.shopifyApp && (window as any).ShopifyAppBridge) {
                      const { Redirect } = (window as any).ShopifyAppBridge;
                      const redirect = Redirect.create(window.shopifyApp);
                      redirect.dispatch(Redirect.Action.APP, `/dashboard?shop=${shop}&tab=settings`);
                    } else {
                      router.push(`/dashboard?shop=${shop}&tab=settings`);
                    }
                  }}
                >
                  Configure Settings
                </Button>

                <Button
                  onClick={() => {
                    if (window.shopifyApp && (window as any).ShopifyAppBridge) {
                      const { Redirect } = (window as any).ShopifyAppBridge;
                      const redirect = Redirect.create(window.shopifyApp);
                      redirect.dispatch(Redirect.Action.APP, `/dashboard?shop=${shop}&tab=analytics`);
                    } else {
                      router.push(`/dashboard?shop=${shop}&tab=analytics`);
                    }
                  }}
                >
                  View Analytics
                </Button>
              </Stack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </ShopifyAppBridge>
  );
}
