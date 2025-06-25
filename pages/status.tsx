import React, { useState, useEffect } from 'react';
import { AppProvider, Page, Card, Layout, Banner, Text, Stack, Button, Badge } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';

interface StatusData {
  firebase: {
    configured: boolean;
    projectId: string;
    hasServiceAccount: boolean;
    hasWebConfig: boolean;
  };
  shopify: {
    configured: boolean;
    hasApiKey: boolean;
    hasApiSecret: boolean;
    hasWebhookSecret: boolean;
    apiKeyPreview: string;
  };
  application: {
    nodeEnv: string;
    appUrl: string;
    host: string;
  };
  readyForTesting: boolean;
  readyForShopify: boolean;
}

export default function StatusPage() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/test/status');
      const data = await response.json();
      setStatus(data.status);
    } catch (error) {
      console.error('Failed to load status:', error);
    } finally {
      setLoading(false);
    }
  };

  const testFirebase = async () => {
    try {
      const response = await fetch('/api/test/firebase');
      const data = await response.json();
      if (data.success) {
        alert('🎉 Firebase test successful!');
      } else {
        alert('❌ Firebase test failed: ' + data.error);
      }
    } catch (error) {
      alert('❌ Firebase test error: ' + error);
    }
  };

  if (loading) {
    return (
      <AppProvider i18n={{}}>
        <Page title="Loading...">
          <Text variant="bodyMd" as="p">Loading status...</Text>
        </Page>
      </AppProvider>
    );
  }

  if (!status) {
    return (
      <AppProvider i18n={{}}>
        <Page title="Error">
          <Banner status="critical">
            <p>Failed to load configuration status</p>
          </Banner>
        </Page>
      </AppProvider>
    );
  }

  return (
    <AppProvider i18n={{}}>
      <Page 
        title="🚀 Bargain Hunter - Configuration Status"
        primaryAction={{
          content: 'Test Firebase',
          onAction: testFirebase,
          disabled: !status.firebase.configured,
        }}
        secondaryActions={[
          {
            content: 'Full Test Suite',
            url: '/test',
          },
        ]}
      >
        <Layout>
          {/* Overall Status */}
          <Layout.Section>
            {status.readyForShopify ? (
              <Banner status="success">
                <p><strong>🎉 All systems ready!</strong> Firebase and Shopify are configured. You can start testing!</p>
              </Banner>
            ) : status.readyForTesting ? (
              <Banner status="info">
                <p><strong>🔥 Firebase ready!</strong> Now you need Shopify API keys to complete setup.</p>
              </Banner>
            ) : (
              <Banner status="warning">
                <p><strong>⚠️ Configuration needed</strong> Please configure Firebase and Shopify.</p>
              </Banner>
            )}
          </Layout.Section>

          {/* Firebase Status */}
          <Layout.Section>
            <Card sectioned>
              <Stack vertical spacing="loose">
                <Stack>
                  <Text variant="headingMd" as="h2">🔥 Firebase Configuration</Text>
                  <Badge status={status.firebase.configured ? 'success' : 'critical'}>
                    {status.firebase.configured ? 'Configured' : 'Not Configured'}
                  </Badge>
                </Stack>
                
                <Stack vertical spacing="tight">
                  <Stack>
                    <Text variant="bodyMd" as="p">Project ID:</Text>
                    <Badge status={status.firebase.projectId ? 'success' : 'critical'}>
                      {status.firebase.projectId || 'Not set'}
                    </Badge>
                  </Stack>

                  <Stack>
                    <Text variant="bodyMd" as="p">Service Account:</Text>
                    <Badge status={status.firebase.hasServiceAccount ? 'success' : 'critical'}>
                      {status.firebase.hasServiceAccount ? 'Configured' : 'Missing'}
                    </Badge>
                  </Stack>

                  <Stack>
                    <Text variant="bodyMd" as="p">Web Config:</Text>
                    <Badge status={status.firebase.hasWebConfig ? 'success' : 'critical'}>
                      {status.firebase.hasWebConfig ? 'Configured' : 'Missing'}
                    </Badge>
                  </Stack>
                </Stack>

                {status.firebase.configured && (
                  <Button onClick={testFirebase}>Test Firebase Connection</Button>
                )}
              </Stack>
            </Card>
          </Layout.Section>

          {/* Shopify Status */}
          <Layout.Section>
            <Card sectioned>
              <Stack vertical spacing="loose">
                <Stack>
                  <Text variant="headingMd" as="h2">🛍️ Shopify Configuration</Text>
                  <Badge status={status.shopify.configured ? 'success' : 'critical'}>
                    {status.shopify.configured ? 'Configured' : 'Not Configured'}
                  </Badge>
                </Stack>
                
                <Stack vertical spacing="tight">
                  <Stack>
                    <Text variant="bodyMd" as="p">API Key:</Text>
                    <Badge status={status.shopify.hasApiKey ? 'success' : 'critical'}>
                      {status.shopify.hasApiKey ? status.shopify.apiKeyPreview : 'Not set'}
                    </Badge>
                  </Stack>

                  <Stack>
                    <Text variant="bodyMd" as="p">API Secret:</Text>
                    <Badge status={status.shopify.hasApiSecret ? 'success' : 'critical'}>
                      {status.shopify.hasApiSecret ? 'Configured' : 'Missing'}
                    </Badge>
                  </Stack>

                  <Stack>
                    <Text variant="bodyMd" as="p">Webhook Secret:</Text>
                    <Badge status={status.shopify.hasWebhookSecret ? 'success' : 'critical'}>
                      {status.shopify.hasWebhookSecret ? 'Configured' : 'Missing'}
                    </Badge>
                  </Stack>
                </Stack>

                {!status.shopify.configured && (
                  <Stack>
                    <Button url="/SHOPIFY_QUICK_SETUP.md" external>
                      📖 Shopify Setup Guide
                    </Button>
                    <Button url="https://partners.shopify.com" external>
                      🛍️ Shopify Partners
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Card>
          </Layout.Section>

          {/* Application Info */}
          <Layout.Section>
            <Card sectioned>
              <Stack vertical spacing="loose">
                <Text variant="headingMd" as="h2">⚙️ Application Settings</Text>
                
                <Stack vertical spacing="tight">
                  <Stack>
                    <Text variant="bodyMd" as="p">Environment:</Text>
                    <Badge>{status.application.nodeEnv}</Badge>
                  </Stack>

                  <Stack>
                    <Text variant="bodyMd" as="p">App URL:</Text>
                    <Text variant="bodyMd" as="p" color="subdued">{status.application.appUrl}</Text>
                  </Stack>

                  <Stack>
                    <Text variant="bodyMd" as="p">Host:</Text>
                    <Text variant="bodyMd" as="p" color="subdued">{status.application.host}</Text>
                  </Stack>
                </Stack>
              </Stack>
            </Card>
          </Layout.Section>

          {/* Next Steps */}
          <Layout.Section>
            <Card sectioned>
              <Stack vertical spacing="loose">
                <Text variant="headingMd" as="h2">🎯 Next Steps</Text>
                
                {status.readyForShopify ? (
                  <Stack vertical spacing="tight">
                    <Text variant="bodyMd" as="p">✅ Configuration complete! You can now:</Text>
                    <Stack>
                      <Button primary url="/test">Run Full Tests</Button>
                      <Button url="/app?shop=your-store.myshopify.com">Test Shopify Install</Button>
                    </Stack>
                  </Stack>
                ) : status.readyForTesting ? (
                  <Stack vertical spacing="tight">
                    <Text variant="bodyMd" as="p">🔥 Firebase is ready! Next:</Text>
                    <Text variant="bodyMd" as="p">1. Create Shopify Partner account</Text>
                    <Text variant="bodyMd" as="p">2. Create development store</Text>
                    <Text variant="bodyMd" as="p">3. Create Shopify app</Text>
                    <Text variant="bodyMd" as="p">4. Get API keys and update .env.local</Text>
                    <Button primary external url="https://partners.shopify.com">
                      Start Shopify Setup
                    </Button>
                  </Stack>
                ) : (
                  <Stack vertical spacing="tight">
                    <Text variant="bodyMd" as="p">⚠️ Configuration needed:</Text>
                    <Text variant="bodyMd" as="p">1. Configure Firebase (service account + web config)</Text>
                    <Text variant="bodyMd" as="p">2. Configure Shopify (API keys)</Text>
                    <Stack>
                      <Button external url="/FIREBASE_SETUP.md">Firebase Guide</Button>
                      <Button external url="/SHOPIFY_QUICK_SETUP.md">Shopify Guide</Button>
                    </Stack>
                  </Stack>
                )}
              </Stack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </AppProvider>
  );
}
