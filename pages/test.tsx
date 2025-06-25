import React, { useState } from 'react';
import { Page, Card, Layout, Button, Banner, Text, Stack, TextField, AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';

export default function TestPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [testShop, setTestShop] = useState('test-store.myshopify.com');

  const addResult = (test: string, success: boolean, data?: any, error?: string) => {
    setResults(prev => [...prev, {
      test,
      success,
      data,
      error,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runTest = async (testName: string, url: string, options?: RequestInit) => {
    try {
      console.log(`Running test: ${testName}`);
      const response = await fetch(url, options);
      const data = await response.json();
      
      if (response.ok) {
        addResult(testName, true, data);
      } else {
        addResult(testName, false, data, `HTTP ${response.status}`);
      }
    } catch (error) {
      addResult(testName, false, null, error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setResults([]);

    // Test 1: Firebase Connection
    await runTest('Firebase Connection', '/api/test/firebase');

    // Test 2: Game Config API
    await runTest('Game Config API', `/api/game/config/${testShop}`);

    // Test 3: Start Game Session
    await runTest('Start Game Session', '/api/game/start-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopDomain: testShop,
        customerData: { email: 'test@example.com' },
        source: 'popup'
      })
    });

    // Test 4: Dashboard Stats (will fail without store, but tests API)
    await runTest('Dashboard Stats', `/api/dashboard/stats?shop=${testShop}`);

    // Test 5: Store API (will return 404, but tests endpoint)
    await runTest('Store API', `/api/stores/${testShop}`);

    setLoading(false);
  };

  const createTestStore = async () => {
    setLoading(true);
    try {
      // Create a test store record
      const response = await fetch('/api/test/create-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopDomain: testShop,
          accessToken: 'test_token',
          shopData: {
            name: 'Test Store',
            email: 'test@store.com',
            domain: testShop,
            currency: 'USD',
            timezone: 'UTC',
            planName: 'basic'
          }
        })
      });

      const data = await response.json();
      addResult('Create Test Store', response.ok, data);
    } catch (error) {
      addResult('Create Test Store', false, null, error instanceof Error ? error.message : 'Unknown error');
    }
    setLoading(false);
  };

  return (
    <AppProvider i18n={{}}>
      <Page title="Backend Function Tests">
      <Layout>
        <Layout.Section>
          <Banner title="Backend Testing" status="info">
            <p>This page tests all backend functions and API endpoints.</p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card sectioned>
            <Stack vertical>
              <TextField
                label="Test Shop Domain"
                value={testShop}
                onChange={setTestShop}
                placeholder="test-store.myshopify.com"
              />
              
              <Stack>
                <Button 
                  primary 
                  onClick={runAllTests} 
                  loading={loading}
                >
                  Run All Tests
                </Button>
                
                <Button 
                  onClick={createTestStore} 
                  loading={loading}
                >
                  Create Test Store
                </Button>
                
                <Button 
                  onClick={() => setResults([])}
                  disabled={loading}
                >
                  Clear Results
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card title="Test Results">
            <div style={{ padding: '1rem' }}>
              {results.length === 0 ? (
                <Text variant="bodyMd" color="subdued">
                  No tests run yet. Click "Run All Tests" to start.
                </Text>
              ) : (
                <Stack vertical spacing="loose">
                  {results.map((result, index) => (
                    <Card key={index} sectioned>
                      <Stack vertical spacing="tight">
                        <Stack>
                          <Text variant="headingMd" as="h3">
                            {result.test}
                          </Text>
                          <div style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: result.success ? '#d4edda' : '#f8d7da',
                            color: result.success ? '#155724' : '#721c24',
                            fontSize: '0.875rem',
                            fontWeight: 'bold'
                          }}>
                            {result.success ? '✅ PASS' : '❌ FAIL'}
                          </div>
                          <Text variant="bodyMd" color="subdued">
                            {result.timestamp}
                          </Text>
                        </Stack>
                        
                        {result.error && (
                          <Text variant="bodyMd" color="critical">
                            Error: {result.error}
                          </Text>
                        )}
                        
                        {result.data && (
                          <details>
                            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                              View Response Data
                            </summary>
                            <pre style={{
                              background: '#f8f9fa',
                              padding: '1rem',
                              borderRadius: '4px',
                              overflow: 'auto',
                              fontSize: '0.875rem',
                              marginTop: '0.5rem'
                            }}>
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              )}
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
    </AppProvider>
  );
}
