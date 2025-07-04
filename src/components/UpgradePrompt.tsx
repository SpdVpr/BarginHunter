import { useState } from 'react';
import { Modal, Text, Button, Stack, Card, Badge } from '@shopify/polaris';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  currentUsage: number;
  limit: number;
  shop: string;
  message?: string;
}

const PLAN_INFO = {
  free: { name: '🆓 Free Tier', limit: 100, price: 0 },
  starter: { name: '💼 Starter', limit: 1000, price: 19 },
  pro: { name: '🚀 Pro', limit: 10000, price: 39 },
  enterprise: { name: '🏢 Enterprise', limit: 100000, price: 99 },
};

export function UpgradePrompt({ 
  isOpen, 
  onClose, 
  currentPlan, 
  currentUsage, 
  limit, 
  shop, 
  message 
}: UpgradePromptProps) {
  const [upgrading, setUpgrading] = useState(false);

  const getNextPlans = () => {
    const plans = [];
    if (currentPlan === 'free') {
      plans.push('starter', 'pro', 'enterprise');
    } else if (currentPlan === 'starter') {
      plans.push('pro', 'enterprise');
    } else if (currentPlan === 'pro') {
      plans.push('enterprise');
    }
    return plans;
  };

  const handleUpgrade = async (planId: string) => {
    try {
      setUpgrading(true);
      const response = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop, planId }),
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
    }
  };

  const nextPlans = getNextPlans();

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Upgrade Your Plan"
      primaryAction={{
        content: 'Maybe Later',
        onAction: onClose,
      }}
    >
      <Modal.Section>
        <Stack vertical spacing="loose">
          <Card>
            <div style={{ padding: '1rem' }}>
              <Stack vertical spacing="tight">
                <Text variant="headingMd" as="h3">Current Usage</Text>
                <Stack distribution="equalSpacing" alignment="center">
                  <Text variant="bodyMd">
                    Discount Codes: {currentUsage} / {limit}
                  </Text>
                  <Badge status={currentUsage >= limit ? 'critical' : currentUsage >= limit * 0.8 ? 'warning' : 'success'}>
                    {Math.round((currentUsage / limit) * 100)}% Used
                  </Badge>
                </Stack>
                {message && (
                  <Text variant="bodyMd" color="subdued">
                    {message}
                  </Text>
                )}
              </Stack>
            </div>
          </Card>

          <Text variant="headingMd" as="h3">Available Upgrades</Text>
          
          <Stack vertical spacing="tight">
            {nextPlans.map((planId) => {
              const plan = PLAN_INFO[planId as keyof typeof PLAN_INFO];
              const isRecommended = planId === nextPlans[0];
              
              return (
                <Card key={planId}>
                  <div style={{ padding: '1rem' }}>
                    <Stack distribution="equalSpacing" alignment="center">
                      <Stack vertical spacing="extraTight">
                        <Stack spacing="tight" alignment="center">
                          <Text variant="headingMd" as="h4">
                            {plan.name}
                          </Text>
                          {isRecommended && (
                            <Badge status="info">Recommended</Badge>
                          )}
                        </Stack>
                        <Text variant="bodyMd" color="subdued">
                          {plan.limit.toLocaleString()} discount codes/month
                        </Text>
                        <Text variant="headingLg" as="h3">
                          ${plan.price}/month
                        </Text>
                      </Stack>
                      <Button
                        primary={isRecommended}
                        loading={upgrading}
                        onClick={() => handleUpgrade(planId)}
                      >
                        Upgrade Now
                      </Button>
                    </Stack>
                  </div>
                </Card>
              );
            })}
          </Stack>

          <Card>
            <div style={{ padding: '1rem' }}>
              <Stack vertical spacing="tight">
                <Text variant="headingMd" as="h3">✨ All Plans Include</Text>
                <Stack vertical spacing="extraTight">
                  <Text variant="bodyMd">• Unlimited game sessions</Text>
                  <Text variant="bodyMd">• Advanced analytics & reporting</Text>
                  <Text variant="bodyMd">• Custom branding & themes</Text>
                  <Text variant="bodyMd">• A/B testing capabilities</Text>
                  <Text variant="bodyMd">• Priority support</Text>
                  <Text variant="bodyMd">• Webhook integrations</Text>
                  <Text variant="bodyMd">• Multiple game types</Text>
                  <Text variant="bodyMd">• Advanced fraud protection</Text>
                </Stack>
                <Text variant="bodyMd" color="subdued" marginTop="2">
                  The only difference between plans is the number of discount codes you can generate per month.
                </Text>
              </Stack>
            </div>
          </Card>
        </Stack>
      </Modal.Section>
    </Modal>
  );
}
