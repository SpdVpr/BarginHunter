import { useState, useEffect } from 'react';
import {
  Card,
  Text,
  Button,
  Stack,
  Badge,
  ProgressBar,
  Banner,
  Modal,
  TextContainer,
  Spinner,
} from '@shopify/polaris';

interface BillingTabProps {
  shop: string | string[] | undefined;
}

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

export function BillingTab({ shop }: BillingTabProps) {
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

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageStatus = (percentage: number) => {
    if (percentage >= 95) return 'critical';
    if (percentage >= 80) return 'warning';
    return 'success';
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Spinner size="large" />
        <Text variant="bodyMd">Loading billing information...</Text>
      </div>
    );
  }

  if (!billingData) {
    return (
      <Banner status="critical">
        <p>Failed to load billing information. Please refresh the page.</p>
      </Banner>
    );
  }

  const currentPlan = billingData.availablePlans.find(p => p.id === billingData.subscription.plan);
  const usage = billingData.usage;

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {/* Current Plan Status */}
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

      {/* Usage Statistics */}
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

            {/* All Other Features - Always Unlimited */}
            <div>
              <Stack distribution="equalSpacing" alignment="center">
                <Text variant="bodyMd">All Other Features</Text>
                <Text variant="bodyMd" color="success">
                  ∞ (Unlimited)
                </Text>
              </Stack>
              <Text variant="bodyMd" color="subdued" marginTop="2">
                Analytics, branding, webhooks, multiple games, fraud protection
              </Text>
            </div>
          </Stack>
        </div>
      </Card>

      {/* Recommendations */}
      {billingData.recommendations.length > 0 && (
        <Banner status="info">
          <Stack vertical spacing="tight">
            <Text variant="bodyMd" fontWeight="semibold">Recommendations</Text>
            {billingData.recommendations.map((rec, index) => (
              <Text key={index} variant="bodyMd">• {rec}</Text>
            ))}
          </Stack>
        </Banner>
      )}

      {/* Available Plans */}
      <Card>
        <div style={{ padding: '1.5rem' }}>
          <Stack vertical spacing="loose">
            <Text variant="headingMd" as="h3">Choose Your Plan</Text>
            <Text variant="bodyMd" color="subdued">
              All plans include the same features. Only the number of discount codes per month differs.
            </Text>
          </Stack>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
            {billingData.availablePlans.map((plan) => {
              const isCurrent = plan.id === billingData.subscription.plan;
              const isRecommended = plan.id === 'pro';
              
              return (
                <Card key={plan.id} subdued={isCurrent}>
                  <div style={{ 
                    padding: '1.5rem',
                    border: isRecommended ? '2px solid #008060' : isCurrent ? '2px solid #637381' : '1px solid #e1e3e5',
                    borderRadius: '8px',
                    position: 'relative'
                  }}>
                    {isRecommended && (
                      <div style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#008060',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        RECOMMENDED
                      </div>
                    )}
                    
                    <Stack vertical spacing="tight">
                      <Stack distribution="equalSpacing" alignment="center">
                        <Text variant="headingMd" fontWeight="bold">{plan.name}</Text>
                        {isCurrent && (
                          <Badge status="success">Current Plan</Badge>
                        )}
                      </Stack>
                      
                      <Stack vertical spacing="extraTight">
                        <Text variant="headingXl" as="h2" color={plan.price === 0 ? 'subdued' : 'success'}>
                          {plan.price === 0 ? 'Free' : `$${plan.price}`}
                        </Text>
                        {plan.price > 0 && (
                          <Text variant="bodyMd" color="subdued">per month</Text>
                        )}
                      </Stack>
                      
                      <div style={{ padding: '1rem 0' }}>
                        <Text variant="bodyMd" fontWeight="semibold" color="success">
                          {plan.limits?.maxDiscountCodes === -1 
                            ? '∞ Unlimited discount codes'
                            : `${plan.limits?.maxDiscountCodes?.toLocaleString()} discount codes/month`
                          }
                        </Text>
                      </div>
                      
                      <div style={{ marginTop: '1.5rem' }}>
                        {!isCurrent && plan.price > 0 ? (
                          <Button 
                            primary={isRecommended}
                            onClick={() => handleUpgrade(plan.id)}
                            fullWidth
                            size="large"
                          >
                            Upgrade to {plan.name}
                          </Button>
                        ) : isCurrent ? (
                          <Button disabled fullWidth size="large">
                            Current Plan
                          </Button>
                        ) : (
                          <Button disabled fullWidth size="large">
                            Free Plan
                          </Button>
                        )}
                      </div>
                      
                      {plan.trialDays && !isCurrent && (
                        <Text variant="bodyMd" color="subdued" alignment="center">
                          {plan.trialDays} days free trial
                        </Text>
                      )}
                    </Stack>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </Card>

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
    </div>
  );
}
