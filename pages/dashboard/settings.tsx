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
  Frame,
  TopBar,
  Navigation,
  ColorPicker,
  RangeSlider,
  Toast,
} from '@shopify/polaris';
import {
  HomeMinor,
  SettingsMinor,
  AnalyticsMinor,
  CustomersMinor,
  DiscountsMajor,
} from '@shopify/polaris-icons';

interface GameSettings {
  isEnabled: boolean;
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
  showOn: 'all_pages' | 'product_pages' | 'cart_page' | 'checkout_page';
  timeDelay?: number;
  scrollPercentage?: number;
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
  const [mobileNavigationActive, setMobileNavigationActive] = useState(false);

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
        setGameSettings(config.gameSettings);
        setWidgetSettings(config.widgetSettings);
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
        setToastMessage('Settings saved successfully!');
        setToastActive(true);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setToastMessage('Failed to save settings. Please try again.');
      setToastActive(true);
    } finally {
      setSaving(false);
    }
  };

  const toggleMobileNavigation = () => {
    setMobileNavigationActive(!mobileNavigationActive);
  };

  const navigationMarkup = (
    <Navigation location="/">
      <Navigation.Section
        items={[
          {
            url: `/dashboard?shop=${shop}`,
            label: 'Dashboard',
            icon: HomeMinor,
          },
          {
            url: `/dashboard/analytics?shop=${shop}`,
            label: 'Analytics',
            icon: AnalyticsMinor,
          },
          {
            url: `/dashboard/customers?shop=${shop}`,
            label: 'Customers',
            icon: CustomersMinor,
          },
          {
            url: `/dashboard/discounts?shop=${shop}`,
            label: 'Discounts',
            icon: DiscountsMajor,
          },
          {
            url: `/dashboard/settings?shop=${shop}`,
            label: 'Settings',
            icon: SettingsMinor,
            selected: true,
          },
        ]}
      />
    </Navigation>
  );

  const topBarMarkup = (
    <TopBar
      showNavigationToggle
      onNavigationToggle={toggleMobileNavigation}
    />
  );

  const toastMarkup = toastActive ? (
    <Toast
      content={toastMessage}
      onDismiss={() => setToastActive(false)}
    />
  ) : null;

  if (loading) {
    return (
      <Frame>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner size="large" />
        </div>
      </Frame>
    );
  }

  return (
    <Frame
      topBar={topBarMarkup}
      navigation={navigationMarkup}
      showMobileNavigation={mobileNavigationActive}
      onNavigationDismiss={toggleMobileNavigation}
    >
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
                        setGameSettings({ ...gameSettings, gameSpeed: value })
                      }
                    />
                  </div>
                </FormLayout>
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
                      { label: 'Product pages', value: 'product_pages' },
                      { label: 'Cart page', value: 'cart_page' },
                      { label: 'Checkout page', value: 'checkout_page' },
                    ]}
                    value={widgetSettings.showOn}
                    onChange={(value) => 
                      setWidgetSettings({ 
                        ...widgetSettings, 
                        showOn: value as any 
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
                  />
                </FormLayout>
              </Card>
            </Layout.Section>
          )}
        </Layout>
      </Page>
    </Frame>
  );
}
