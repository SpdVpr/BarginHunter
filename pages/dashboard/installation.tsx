import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  Stack,
  Banner,
  TextContainer,
  Heading,
  List,
  Code,
} from '@shopify/polaris';

export default function Installation() {
  const router = useRouter();
  const { shop } = router.query;
  const [installing, setInstalling] = useState(false);
  const [installResult, setInstallResult] = useState<string | null>(null);

  const handleInstallScript = async () => {
    setInstalling(true);
    setInstallResult(null);

    try {
      // This would require access token - for now show manual instructions
      setInstallResult('Please follow the manual installation steps below.');
    } catch (error) {
      setInstallResult('Installation failed. Please use manual method.');
    } finally {
      setInstalling(false);
    }
  };

  const embedScript = `<!-- Bargain Hunter Widget -->
<script>
  (function() {
    if (window.Shopify && window.Shopify.shop === '${shop}') {
      var script = document.createElement('script');
      script.src = 'https://bargin-hunter2.vercel.app/api/widget/embed.js?shop=${shop}';
      script.async = true;
      document.head.appendChild(script);
    }
  })();
</script>`;

  return (
    <Page
      breadcrumbs={[{ content: 'Dashboard', url: `/dashboard?shop=${shop}` }]}
      title="Widget Installation"
      subtitle="Add the Bargain Hunter widget to your store"
    >
      <Layout>
        <Layout.Section>
          <Banner status="info">
            <p>
              To display the Bargain Hunter widget on your store, you need to add a small script to your theme.
            </p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Heading>Automatic Installation</Heading>
              <TextContainer>
                <p>Click the button below to automatically install the widget script:</p>
              </TextContainer>
              <Button
                primary
                loading={installing}
                onClick={handleInstallScript}
              >
                Install Widget Script
              </Button>
              {installResult && (
                <Banner status="warning">
                  <p>{installResult}</p>
                </Banner>
              )}
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Heading>Manual Installation</Heading>
              <TextContainer>
                <p>If automatic installation doesn't work, follow these steps:</p>
              </TextContainer>
              
              <List type="number">
                <List.Item>
                  Go to <strong>Online Store</strong> → <strong>Themes</strong> in your Shopify admin
                </List.Item>
                <List.Item>
                  Click <strong>Actions</strong> → <strong>Edit code</strong> on your active theme
                </List.Item>
                <List.Item>
                  Find the <strong>theme.liquid</strong> file (usually in Templates or Layout)
                </List.Item>
                <List.Item>
                  Add the following script just before the closing <Code>&lt;/body&gt;</Code> tag:
                </List.Item>
              </List>

              <Card sectioned>
                <Stack vertical spacing="tight">
                  <Text variant="headingMd" as="h4">Script Code:</Text>
                  <div style={{ 
                    backgroundColor: '#f6f6f7', 
                    padding: '12px', 
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    whiteSpace: 'pre-wrap',
                    overflow: 'auto'
                  }}>
                    {embedScript}
                  </div>
                  <Button
                    onClick={() => navigator.clipboard.writeText(embedScript)}
                  >
                    Copy Script
                  </Button>
                </Stack>
              </Card>

              <List type="number" start={5}>
                <List.Item>
                  Click <strong>Save</strong> to save your changes
                </List.Item>
                <List.Item>
                  Visit your store to test the widget
                </List.Item>
              </List>
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Heading>Testing the Widget</Heading>
              <TextContainer>
                <p>After installation, you can test the widget:</p>
              </TextContainer>
              
              <List type="bullet">
                <List.Item>
                  Make sure <strong>Test Mode</strong> is enabled in Widget Settings
                </List.Item>
                <List.Item>
                  Visit your store in a new browser window/incognito mode
                </List.Item>
                <List.Item>
                  The widget should appear according to your settings
                </List.Item>
                <List.Item>
                  Check browser console (F12) for any error messages
                </List.Item>
              </List>

              <Stack distribution="equalSpacing">
                <Button
                  onClick={() => router.push(`/dashboard/settings?shop=${shop}`)}
                >
                  Widget Settings
                </Button>
                <Button
                  onClick={() => window.open(`https://${shop}`, '_blank')}
                >
                  Visit Store
                </Button>
                <Button
                  onClick={() => window.open(`/widget/game?shop=${shop}&test=true`, '_blank')}
                >
                  Test Widget
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Heading>Troubleshooting</Heading>
              
              <List type="bullet">
                <List.Item>
                  <strong>Widget not appearing:</strong> Check if Test Mode is enabled and User Percentage is above 0%
                </List.Item>
                <List.Item>
                  <strong>Script errors:</strong> Verify the script was added correctly to theme.liquid
                </List.Item>
                <List.Item>
                  <strong>Wrong timing:</strong> Check Page Load Trigger and Show Delay settings
                </List.Item>
                <List.Item>
                  <strong>Device issues:</strong> Verify Device Targeting matches your test device
                </List.Item>
              </List>

              <Banner status="info">
                <p>
                  Need help? Check the browser console (F12) for error messages or contact support.
                </p>
              </Banner>
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
