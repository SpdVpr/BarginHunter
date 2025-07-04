import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  Stack,
  Badge,
  ProgressBar,
  Banner,
  DataTable,
  Modal,
  TextContainer,
} from '@shopify/polaris';
import { DashboardLayout } from '../../src/components/shared/DashboardLayout';

interface BillingData {
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd?: string;
    planLimits: any;
  };
  usage: {
    usage: {
      gameSessions: number;
      discountCodesGenerated: number;
      analyticsRequests: number;
    };
    limits: {
      maxGameSessions: number;
      maxDiscountCodes: number;
      maxAnalyticsRequests: number;
    };
  };
  availablePlans: any[];
  recommendations: string[];
}

export default function BillingPage() {
  const router = useRouter();
  const { shop } = router.query;
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    if (shop) {
      fetchBillingData();
    }
  }, [shop]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/billing/status?shop=${shop}`);
      const data = await response.json();
      
      if (data.success) {
        setBillingData(data);
      }
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    setSelectedPlan(planId);
    setUpgradeModalOpen(true);
  };

  const confirmUpgrade = async () => {
    try {
      setUpgrading(true);
      const response = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop, planId: selectedPlan }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Redirect to Shopify billing confirmation
        window.top!.location.href = data.confirmationUrl;
      } else {
        throw new Error(data.message || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Upgrade failed:', error);
      alert('Failed to upgrade. Please try again.');
    } finally {
      setUpgrading(false);
      setUpgradeModalOpen(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout shop={typeof shop === 'string' ? shop : ''} currentPage="billing">
        <Page title="Billing & Usage">
          <Layout>
            <Layout.Section>
              <Card>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <Text variant="bodyMd">Loading billing information...</Text>
                </div>
              </Card>
            </Layout.Section>
          </Layout>
        </Page>
      </DashboardLayout>
    );
  }

  if (!billingData) {
    return (
      <DashboardLayout shop={typeof shop === 'string' ? shop : ''} currentPage="billing">
        <Page title="Billing & Usage">
          <Layout>
            <Layout.Section>
              <Banner status="critical">
                <p>Failed to load billing information. Please refresh the page.</p>
              </Banner>
            </Layout.Section>
          </Layout>
        </Page>
      </DashboardLayout>
    );
  }

  const currentPlan = billingData.availablePlans.find(p => p.id === billingData.subscription.plan);
  const usage = billingData.usage;

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageStatus = (percentage: number) => {
    if (percentage >= 95) return 'critical';
    if (percentage >= 80) return 'warning';
    return 'success';
  };

  return (
    <DashboardLayout shop={typeof shop === 'string' ? shop : ''} currentPage="billing">
      <Page
        title="Billing & Usage"
        subtitle={`Manage your subscription and monitor usage for ${shop}`}
      >
        <Layout>
          {/* Current Plan */}
          <Layout.Section>
            <Card>
              <div style={{ padding: '1.5rem' }}>
                <Stack distribution="equalSpacing" alignment="center">
                  <Stack vertical spacing="tight">
                    <Text variant="headingMd" as="h3">Current Plan</Text>
                    <Stack spacing="tight" alignment="center">
                      <Text variant="headingLg" as="h2">
                        {currentPlan?.name || 'Free'}
                      </Text>
                      <Badge status={billingData.subscription.status === 'active' ? 'success' : 'warning'}>
                        {billingData.subscription.status}
                      </Badge>
                    </Stack>
                    {currentPlan?.price > 0 && (
                      <Text variant="bodyMd" color="subdued">
                        ${currentPlan.price}/month
                      </Text>
                    )}
                  </Stack>
                  {billingData.subscription.plan === 'free' && (
                    <Stack spacing="tight">
                      <Button onClick={() => handleUpgrade('starter')}>
                        Upgrade to Starter
                      </Button>
                      <Button primary onClick={() => handleUpgrade('pro')}>
                        Upgrade to Pro
                      </Button>
                    </Stack>
                  )}
                  {billingData.subscription.plan === 'starter' && (
                    <Button primary onClick={() => handleUpgrade('pro')}>
                      Upgrade to Pro
                    </Button>
                  )}
                  {billingData.subscription.plan === 'pro' && (
                    <Button onClick={() => handleUpgrade('enterprise')}>
                      Upgrade to Enterprise
                    </Button>
                  )}
                </Stack>
              </div>
            </Card>
          </Layout.Section>

          {/* Usage Statistics */}
          <Layout.Section>
            <Card>
              <div style={{ padding: '1.5rem' }}>
                <Text variant="headingMd" as="h3" marginBottom="4">Usage This Month</Text>
                
                <Stack vertical spacing="loose">
                  {/* Game Sessions - Always Unlimited */}
                  <div>
                    <Stack distribution="equalSpacing" alignment="center">
                      <Text variant="bodyMd">Game Sessions</Text>
                      <Text variant="bodyMd" color="success">
                        {usage.usage.gameSessions} / ∞ (Unlimited)
                      </Text>
                    </Stack>
                  </div>

                  {/* Discount Codes - The Only Limited Resource */}
                  <div>
                    <Stack distribution="equalSpacing" alignment="center">
                      <Text variant="bodyMd" fontWeight="semibold">Discount Codes Generated</Text>
                      <Text variant="bodyMd">
                        {usage.usage.discountCodesGenerated} / {usage.limits.maxDiscountCodes === -1 ? '∞' : usage.limits.maxDiscountCodes.toLocaleString()}
                      </Text>
                    </Stack>
                    {usage.limits.maxDiscountCodes !== -1 && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <ProgressBar
                          progress={getUsagePercentage(usage.usage.discountCodesGenerated, usage.limits.maxDiscountCodes)}
                          size="small"
                          color={getUsageStatus(getUsagePercentage(usage.usage.discountCodesGenerated, usage.limits.maxDiscountCodes))}
                        />
                      </div>
                    )}
                  </div>

                  {/* Analytics - Always Unlimited */}
                  <div>
                    <Stack distribution="equalSpacing" alignment="center">
                      <Text variant="bodyMd">Analytics & Reporting</Text>
                      <Text variant="bodyMd" color="success">
                        ∞ (Unlimited)
                      </Text>
                    </Stack>
                  </div>

                  {/* All Other Features - Always Unlimited */}
                  <div>
                    <Stack distribution="equalSpacing" alignment="center">
                      <Text variant="bodyMd">All Other Features</Text>
                      <Text variant="bodyMd" color="success">
                        ∞ (Unlimited)
                      </Text>
                    </Stack>
                    <Text variant="bodyMd" color="subdued" marginTop="2">
                      Custom branding, A/B testing, webhooks, multiple games, fraud protection
                    </Text>
                  </div>
                </Stack>
              </div>
            </Card>
          </Layout.Section>

          {/* Recommendations */}
          {billingData.recommendations.length > 0 && (
            <Layout.Section>
              <Banner status="info">
                <Stack vertical spacing="tight">
                  <Text variant="bodyMd" fontWeight="semibold">Recommendations</Text>
                  {billingData.recommendations.map((rec, index) => (
                    <Text key={index} variant="bodyMd">• {rec}</Text>
                  ))}
                </Stack>
              </Banner>
            </Layout.Section>
          )}

          {/* Available Plans */}
          <Layout.Section>
            <Card>
              <div style={{ padding: '1.5rem' }}>
                <Text variant="headingMd" as="h3" marginBottom="4">Available Plans</Text>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                  {billingData.availablePlans.map((plan) => (
                    <Card key={plan.id} subdued={plan.id === billingData.subscription.plan}>
                      <div style={{ padding: '1rem' }}>
                        <Stack vertical spacing="tight">
                          <Stack distribution="equalSpacing" alignment="center">
                            <Text variant="headingMd">{plan.name}</Text>
                            {plan.id === billingData.subscription.plan && (
                              <Badge status="success">Current</Badge>
                            )}
                          </Stack>
                          
                          <Text variant="headingLg" as="h3">
                            {plan.price === 0 ? 'Free' : `$${plan.price}/month`}
                          </Text>
                          
                          <Stack vertical spacing="extraTight">
                            {plan.features.map((feature: string, index: number) => (
                              <Text key={index} variant="bodyMd">• {feature}</Text>
                            ))}
                          </Stack>
                          
                          {plan.id !== billingData.subscription.plan && plan.price > 0 && (
                            <Button 
                              primary={plan.id === 'pro'} 
                              onClick={() => handleUpgrade(plan.id)}
                              fullWidth
                            >
                              Upgrade to {plan.name}
                            </Button>
                          )}
                        </Stack>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </Card>
          </Layout.Section>
        </Layout>

        {/* Upgrade Confirmation Modal */}
        <Modal
          open={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          title="Confirm Upgrade"
          primaryAction={{
            content: 'Confirm Upgrade',
            onAction: confirmUpgrade,
            loading: upgrading,
          }}
          secondaryActions={[
            {
              content: 'Cancel',
              onAction: () => setUpgradeModalOpen(false),
            },
          ]}
        >
          <Modal.Section>
            <TextContainer>
              <p>
                You are about to upgrade to the{' '}
                <strong>{billingData.availablePlans.find(p => p.id === selectedPlan)?.name}</strong> plan.
              </p>
              <p>
                You will be redirected to Shopify to complete the payment process.
              </p>
            </TextContainer>
          </Modal.Section>
        </Modal>
      </Page>
    </DashboardLayout>
  );
}
