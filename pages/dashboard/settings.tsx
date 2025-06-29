import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Select,
  Checkbox,
  Button,
  Stack,
  Heading,
  Banner,
  Spinner,
  ColorPicker,
  RangeSlider,
  Toast,
} from '@shopify/polaris';
import { DashboardLayout } from '../../src/components/shared/DashboardLayout';

interface GameSettings {
  isEnabled: boolean;
  gameType: 'dino' | 'flappy_bird' | 'tetris' | 'snake';
  minScoreForDiscount: number;
  maxPlaysPerCustomer: number;
  maxPlaysPerDay: number;
  gameSpeed: number;
  difficulty: 'easy' | 'medium' | 'hard';
  discountTiers: Array<{
    minScore: number;
    discount: number;
    message: string;
  }>;
}

interface WidgetSettings {
  displayMode: 'popup' | 'tab' | 'inline';
  triggerEvent: 'immediate' | 'scroll' | 'exit_intent' | 'time_delay';
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  showOn: 'all_pages' | 'product_pages' | 'cart_page' | 'checkout_page' | 'collection_pages' | 'custom';
  timeDelay?: number;
  scrollPercentage?: number;
  customPages?: string[];
  // New targeting options
  userPercentage: number;
  testMode: boolean;
  showDelay: number;
  pageLoadTrigger: 'immediate' | 'after_delay' | 'on_scroll' | 'on_exit_intent';
  deviceTargeting: 'all' | 'desktop' | 'mobile' | 'tablet';
  geoTargeting?: string[];
  timeBasedRules?: {
    enabled: boolean;
    startTime?: string;
    endTime?: string;
    timezone?: string;
    daysOfWeek?: number[];
  };
}

interface AppearanceSettings {
  primaryColor: string;
  secondaryColor: string;
  backgroundTheme: 'default' | 'dark' | 'light' | 'custom';
}

interface BusinessRules {
  excludeDiscountedProducts: boolean;
  allowStackingDiscounts: boolean;
  discountExpiryHours: number;
  minimumOrderValue?: number;
}

export default function Settings() {
  const router = useRouter();
  const { shop } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [widgetSettings, setWidgetSettings] = useState<WidgetSettings | null>(null);
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings | null>(null);
  const [businessRules, setBusinessRules] = useState<BusinessRules | null>(null);
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [reinstalling, setReinstalling] = useState(false);

  useEffect(() => {
    if (shop) {
      loadSettings();
    }
  }, [shop]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/game/config/${shop}`);
      if (response.ok) {
        const config = await response.json();

        // Ensure gameSettings have default values
        const gameSettings = {
          ...config.gameSettings,
          gameType: config.gameSettings?.gameType || 'dino',
          discountTiers: config.gameSettings?.discountTiers || [
            { minScore: 100, discount: 5, message: 'Great job! You earned 5% off!' },
            { minScore: 300, discount: 10, message: 'Amazing! You earned 10% off!' },
            { minScore: 500, discount: 15, message: 'Incredible! You earned 15% off!' }
          ]
        };
        setGameSettings(gameSettings);

        // Ensure widget settings have all new properties with defaults
        const widgetSettings = {
          ...config.widgetSettings,
          userPercentage: config.widgetSettings.userPercentage ?? 100,
          testMode: config.widgetSettings.testMode ?? false,
          showDelay: config.widgetSettings.showDelay ?? 0,
          pageLoadTrigger: config.widgetSettings.pageLoadTrigger || 'immediate',
          deviceTargeting: config.widgetSettings.deviceTargeting || 'all',
          geoTargeting: config.widgetSettings.geoTargeting || [],
          customPages: config.widgetSettings.customPages || [],
          timeBasedRules: config.widgetSettings.timeBasedRules || {
            enabled: false,
            startTime: undefined,
            endTime: undefined,
            timezone: undefined,
            daysOfWeek: undefined,
          },
        };
        setWidgetSettings(widgetSettings);

        setAppearanceSettings(config.appearance);
        setBusinessRules(config.businessRules);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      // Check if all required settings are loaded
      if (!gameSettings || !widgetSettings || !appearanceSettings || !businessRules) {
        console.error('Settings not loaded yet:', {
          gameSettings: !!gameSettings,
          widgetSettings: !!widgetSettings,
          appearanceSettings: !!appearanceSettings,
          businessRules: !!businessRules
        });
        setToastMessage('Settings not loaded yet. Please wait and try again.');
        setToastActive(true);
        return;
      }

      console.log('Saving settings:', {
        shop,
        gameSettings,
        widgetSettings,
        appearanceSettings,
        businessRules
      });

      const response = await fetch(`/api/dashboard/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shop,
          gameSettings,
          widgetSettings,
          appearance: appearanceSettings,
          businessRules,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Settings saved successfully:', result);
        setToastMessage('Settings saved successfully!');
        setToastActive(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to save settings:', response.status, errorData);
        throw new Error(`Failed to save settings: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setToastMessage(`Failed to save settings: ${error.message}`);
      setToastActive(true);
    } finally {
      setSaving(false);
    }
  };

  const forceReinstall = async () => {
    try {
      setReinstalling(true);
      const response = await fetch('/api/force-reinstall', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shop }),
      });

      const result = await response.json();

      if (result.success) {
        setToastMessage('Widget script reinstalled successfully! Please check your store.');
        setToastActive(true);
      } else {
        throw new Error(result.error || 'Failed to reinstall');
      }
    } catch (error) {
      console.error('Failed to reinstall:', error);
      setToastMessage('Failed to reinstall widget script. Please try again.');
      setToastActive(true);
    } finally {
      setReinstalling(false);
    }
  };

  const toastMarkup = toastActive ? (
    <Toast
      content={toastMessage}
      onDismiss={() => setToastActive(false)}
    />
  ) : null;

  if (loading) {
    return (
      <DashboardLayout shop={typeof shop === 'string' ? shop : ''} currentPage="settings">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="large" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout shop={typeof shop === 'string' ? shop : ''} currentPage="settings">
      {toastMarkup}
      <Page
        title="Game Settings"
        subtitle={`Configure your Bargain Hunter game for ${shop}`}
        primaryAction={{
          content: 'Save Settings',
          onAction: saveSettings,
          loading: saving,
        }}
        secondaryActions={[
          {
            content: 'Test Game',
            onAction: () => window.open(`/widget/game?shop=${shop}`, '_blank'),
          },
          {
            content: 'Reinstall Widget',
            onAction: forceReinstall,
            loading: reinstalling,
          },
        ]}
      >
        <Layout>
          <Layout.Section>
            <Banner
              title="Game Configuration"
              status="info"
            >
              <p>
                Customize your game settings to match your store's needs and maximize customer engagement.
              </p>
            </Banner>
          </Layout.Section>

          {gameSettings && (
            <Layout.Section>
              <Card sectioned>
                <Heading>Game Settings</Heading>
                <FormLayout>
                  <Checkbox
                    label="Enable game"
                    checked={gameSettings.isEnabled}
                    onChange={(checked) =>
                      setGameSettings({ ...gameSettings, isEnabled: checked })
                    }
                  />

                  <Select
                    label="Game Type"
                    options={[
                      { label: '🦕 Dino Runner (Chrome Dino style)', value: 'dino' },
                      { label: '🐦 Flappy Bird (Tap to fly)', value: 'flappy_bird' },
                      { label: '🧩 Tetris (Click to rotate)', value: 'tetris' },
                      { label: '🐍 Snake (Arrow keys or click)', value: 'snake' },
                    ]}
                    value={gameSettings.gameType}
                    onChange={(value) =>
                      setGameSettings({
                        ...gameSettings,
                        gameType: value as 'dino' | 'flappy_bird' | 'tetris' | 'snake'
                      })
                    }
                    helpText="Choose which game your customers will play"
                  />
                  
                  <TextField
                    label="Minimum score for discount"
                    type="number"
                    value={gameSettings.minScoreForDiscount.toString()}
                    onChange={(value) =>
                      setGameSettings({
                        ...gameSettings,
                        minScoreForDiscount: parseInt(value) || 0
                      })
                    }
                    helpText="Minimum score required to earn a discount"
                    autoComplete="off"
                  />

                  <TextField
                    label="Max plays per customer"
                    type="number"
                    value={gameSettings.maxPlaysPerCustomer.toString()}
                    onChange={(value) =>
                      setGameSettings({
                        ...gameSettings,
                        maxPlaysPerCustomer: parseInt(value) || 1
                      })
                    }
                    helpText="Maximum number of times a customer can play"
                    autoComplete="off"
                  />

                  <TextField
                    label="Max plays per day"
                    type="number"
                    value={gameSettings.maxPlaysPerDay.toString()}
                    onChange={(value) =>
                      setGameSettings({
                        ...gameSettings,
                        maxPlaysPerDay: parseInt(value) || 10
                      })
                    }
                    helpText="Maximum total plays across all customers per day"
                    autoComplete="off"
                  />

                  <Select
                    label="Difficulty"
                    options={[
                      { label: 'Easy', value: 'easy' },
                      { label: 'Medium', value: 'medium' },
                      { label: 'Hard', value: 'hard' },
                    ]}
                    value={gameSettings.difficulty}
                    onChange={(value) => 
                      setGameSettings({ 
                        ...gameSettings, 
                        difficulty: value as 'easy' | 'medium' | 'hard' 
                      })
                    }
                  />

                  <div>
                    <label>Game Speed: {gameSettings.gameSpeed}x</label>
                    <RangeSlider
                      label="Game speed"
                      value={gameSettings.gameSpeed}
                      min={0.5}
                      max={2}
                      step={0.1}
                      onChange={(value) =>
                        setGameSettings({ ...gameSettings, gameSpeed: value as number })
                      }
                    />
                  </div>
                </FormLayout>
              </Card>
            </Layout.Section>
          )}

          {/* Discount Tiers Configuration */}
          {gameSettings && (
            <Layout.Section>
              <Card sectioned>
                <Heading>Discount Tiers</Heading>
                <p style={{ marginBottom: '20px', color: '#666' }}>
                  Configure what discount customers get for reaching certain scores. You can add multiple tiers.
                </p>

                {gameSettings.discountTiers?.map((tier, index) => (
                  <div key={index} style={{
                    border: '1px solid #e1e3e5',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '16px',
                    background: '#fafbfb'
                  }}>
                    <Stack distribution="equalSpacing" alignment="center">
                      <Stack.Item fill>
                        <FormLayout>
                          <Stack>
                            <Stack.Item fill>
                              <TextField
                                label="Minimum Score"
                                type="number"
                                value={tier.minScore.toString()}
                                onChange={(value) => {
                                  const newTiers = [...gameSettings.discountTiers];
                                  newTiers[index] = { ...tier, minScore: parseInt(value) || 0 };
                                  setGameSettings({ ...gameSettings, discountTiers: newTiers });
                                }}
                                helpText="Points needed to earn this discount"
                              />
                            </Stack.Item>
                            <Stack.Item fill>
                              <TextField
                                label="Discount %"
                                type="number"
                                value={tier.discount.toString()}
                                onChange={(value) => {
                                  const newTiers = [...gameSettings.discountTiers];
                                  newTiers[index] = { ...tier, discount: parseInt(value) || 0 };
                                  setGameSettings({ ...gameSettings, discountTiers: newTiers });
                                }}
                                helpText="Percentage discount (1-100)"
                                suffix="%"
                              />
                            </Stack.Item>
                          </Stack>
                          <TextField
                            label="Success Message"
                            value={tier.message}
                            onChange={(value) => {
                              const newTiers = [...gameSettings.discountTiers];
                              newTiers[index] = { ...tier, message: value };
                              setGameSettings({ ...gameSettings, discountTiers: newTiers });
                            }}
                            helpText="Message shown when customer earns this discount"
                            placeholder="Congratulations! You earned a discount!"
                          />
                        </FormLayout>
                      </Stack.Item>
                      <Button
                        destructive
                        onClick={() => {
                          const newTiers = gameSettings.discountTiers.filter((_, i) => i !== index);
                          setGameSettings({ ...gameSettings, discountTiers: newTiers });
                        }}
                        disabled={gameSettings.discountTiers.length <= 1}
                      >
                        Remove
                      </Button>
                    </Stack>
                  </div>
                ))}

                <Button
                  onClick={() => {
                    const newTier = {
                      minScore: 100,
                      discount: 5,
                      message: 'Congratulations! You earned a discount!'
                    };
                    setGameSettings({
                      ...gameSettings,
                      discountTiers: [...(gameSettings.discountTiers || []), newTier]
                    });
                  }}
                >
                  Add Discount Tier
                </Button>
              </Card>
            </Layout.Section>
          )}

          {widgetSettings && (
            <Layout.Section>
              <Card sectioned>
                <Heading>Widget Settings</Heading>
                <FormLayout>
                  <Select
                    label="Display mode"
                    options={[
                      { label: 'Popup', value: 'popup' },
                      { label: 'Tab', value: 'tab' },
                      { label: 'Inline', value: 'inline' },
                    ]}
                    value={widgetSettings.displayMode}
                    onChange={(value) => 
                      setWidgetSettings({ 
                        ...widgetSettings, 
                        displayMode: value as 'popup' | 'tab' | 'inline' 
                      })
                    }
                  />

                  <Select
                    label="Trigger event"
                    options={[
                      { label: 'Immediate', value: 'immediate' },
                      { label: 'On scroll', value: 'scroll' },
                      { label: 'Exit intent', value: 'exit_intent' },
                      { label: 'Time delay', value: 'time_delay' },
                    ]}
                    value={widgetSettings.triggerEvent}
                    onChange={(value) => 
                      setWidgetSettings({ 
                        ...widgetSettings, 
                        triggerEvent: value as any 
                      })
                    }
                  />

                  <Select
                    label="Position"
                    options={[
                      { label: 'Top Left', value: 'top-left' },
                      { label: 'Top Right', value: 'top-right' },
                      { label: 'Bottom Left', value: 'bottom-left' },
                      { label: 'Bottom Right', value: 'bottom-right' },
                      { label: 'Center', value: 'center' },
                    ]}
                    value={widgetSettings.position}
                    onChange={(value) => 
                      setWidgetSettings({ 
                        ...widgetSettings, 
                        position: value as any 
                      })
                    }
                  />

                  <Select
                    label="Show on"
                    options={[
                      { label: 'All pages', value: 'all_pages' },
                      { label: 'Homepage', value: 'homepage' },
                      { label: 'Product pages', value: 'product_pages' },
                      { label: 'Cart page', value: 'cart_page' },
                      { label: 'Checkout page', value: 'checkout_page' },
                      { label: 'Collection pages', value: 'collection_pages' },
                      { label: 'Custom pages', value: 'custom' },
                    ]}
                    value={widgetSettings.showOn}
                    onChange={(value) =>
                      setWidgetSettings({
                        ...widgetSettings,
                        showOn: value as any
                      })
                    }
                  />

                  {widgetSettings.showOn === 'custom' && (
                    <TextField
                      label="Custom pages (comma separated URLs)"
                      value={widgetSettings.customPages?.join(', ') || ''}
                      onChange={(value) =>
                        setWidgetSettings({
                          ...widgetSettings,
                          customPages: value.split(',').map(p => p.trim()).filter(p => p)
                        })
                      }
                      helpText="Enter specific page URLs where the widget should appear"
                      autoComplete="off"
                    />
                  )}
                </FormLayout>
              </Card>
            </Layout.Section>
          )}

          {widgetSettings && (
            <Layout.Section>
              <Card sectioned>
                <Heading>Targeting & Display Rules</Heading>
                <FormLayout>
                  <div>
                    <label>User Percentage: {widgetSettings.userPercentage || 100}%</label>
                    <RangeSlider
                      label="Percentage of users who will see the widget"
                      value={widgetSettings.userPercentage || 100}
                      min={0}
                      max={100}
                      step={1}
                      onChange={(value) =>
                        setWidgetSettings({
                          ...widgetSettings,
                          userPercentage: value as number
                        })
                      }
                    />
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      Set to 100% to show to all users, 50% for every second user, etc.
                    </p>
                  </div>

                  <Checkbox
                    label="Enable Test Mode"
                    checked={widgetSettings.testMode || false}
                    onChange={(checked) =>
                      setWidgetSettings({
                        ...widgetSettings,
                        testMode: checked
                      })
                    }
                    helpText="Test mode shows the widget to all users regardless of percentage settings"
                  />

                  <TextField
                    label="Show delay (seconds)"
                    type="number"
                    value={(widgetSettings.showDelay || 0).toString()}
                    onChange={(value) =>
                      setWidgetSettings({
                        ...widgetSettings,
                        showDelay: parseInt(value) || 0
                      })
                    }
                    helpText="Delay before showing the widget after page load"
                    autoComplete="off"
                  />

                  <Select
                    label="Page Load Trigger"
                    options={[
                      { label: 'Immediate', value: 'immediate' },
                      { label: 'After delay', value: 'after_delay' },
                      { label: 'On scroll', value: 'on_scroll' },
                      { label: 'On exit intent', value: 'on_exit_intent' },
                    ]}
                    value={widgetSettings.pageLoadTrigger || 'immediate'}
                    onChange={(value) =>
                      setWidgetSettings({
                        ...widgetSettings,
                        pageLoadTrigger: value as any
                      })
                    }
                  />

                  <Select
                    label="Device Targeting"
                    options={[
                      { label: 'All devices', value: 'all' },
                      { label: 'Desktop only', value: 'desktop' },
                      { label: 'Mobile only', value: 'mobile' },
                      { label: 'Tablet only', value: 'tablet' },
                    ]}
                    value={widgetSettings.deviceTargeting || 'all'}
                    onChange={(value) =>
                      setWidgetSettings({
                        ...widgetSettings,
                        deviceTargeting: value as any
                      })
                    }
                  />
                </FormLayout>
              </Card>
            </Layout.Section>
          )}

          {businessRules && (
            <Layout.Section>
              <Card sectioned>
                <Heading>Business Rules</Heading>
                <FormLayout>
                  <Checkbox
                    label="Exclude already discounted products"
                    checked={businessRules.excludeDiscountedProducts}
                    onChange={(checked) => 
                      setBusinessRules({ 
                        ...businessRules, 
                        excludeDiscountedProducts: checked 
                      })
                    }
                  />

                  <Checkbox
                    label="Allow stacking with other discounts"
                    checked={businessRules.allowStackingDiscounts}
                    onChange={(checked) => 
                      setBusinessRules({ 
                        ...businessRules, 
                        allowStackingDiscounts: checked 
                      })
                    }
                  />

                  <TextField
                    label="Discount expiry (hours)"
                    type="number"
                    value={businessRules.discountExpiryHours.toString()}
                    onChange={(value) =>
                      setBusinessRules({
                        ...businessRules,
                        discountExpiryHours: parseInt(value) || 24
                      })
                    }
                    helpText="How long discounts remain valid"
                    autoComplete="off"
                  />

                  <TextField
                    label="Minimum order value"
                    type="number"
                    value={businessRules.minimumOrderValue?.toString() || ''}
                    onChange={(value) =>
                      setBusinessRules({
                        ...businessRules,
                        minimumOrderValue: value ? parseInt(value) : undefined
                      })
                    }
                    helpText="Minimum order value to use discount (optional)"
                    autoComplete="off"
                  />
                </FormLayout>
              </Card>
            </Layout.Section>
          )}
        </Layout>
      </Page>
    </DashboardLayout>
  );
}
