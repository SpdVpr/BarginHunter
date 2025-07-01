/** @jsxImportSource react */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Text,
  Stack,
  Button,
  FormLayout,
  TextField,
  Select,
  Checkbox,
  RangeSlider,
  Tabs,
  Toast,
  Spinner,
  ColorPicker,
  Banner,
} from '@shopify/polaris';

interface SettingsTabProps {
  shop: string | string[] | undefined;
}

interface GameSettings {
  isEnabled: boolean;
  gameType: 'dino' | 'flappy_bird' | 'tetris' | 'snake' | 'space_invaders';
  minScoreForDiscount: number;
  maxPlaysPerCustomer: number;
  maxPlaysPerDay: number;
  gameSpeed: number;
  difficulty: 'easy' | 'medium' | 'hard';
  testMode: boolean; // Moved from widget settings
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
  showOn: 'all_pages' | 'product_pages' | 'cart_page' | 'checkout_page' | 'collection_pages' | 'custom' | 'url_targeting';
  timeDelay?: number;
  scrollPercentage?: number;
  customPages?: string[];
  targetUrls?: string[]; // New: URLs where widget should appear
  userPercentage: number;
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

interface IntroSettings {
  title: string;
  subtitle: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  discountText: string;
  showEmojis: boolean;
  borderRadius: number;
  padding: number;
}

export function SettingsTab({ shop }: SettingsTabProps) {
  const [selectedSettingsTab, setSelectedSettingsTab] = useState(0);
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [widgetSettings, setWidgetSettings] = useState<WidgetSettings | null>(null);
  const [introSettings, setIntroSettings] = useState<IntroSettings | null>(null);
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings | null>(null);
  const [businessRules, setBusinessRules] = useState<BusinessRules | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const settingsTabs = [
    {
      id: 'game',
      content: 'Game Settings',
      panelID: 'game-settings-panel',
    },
    {
      id: 'widget',
      content: 'Widget Settings',
      panelID: 'widget-settings-panel',
    },
    {
      id: 'appearance',
      content: 'Appearance',
      panelID: 'appearance-settings-panel',
    },
    {
      id: 'business',
      content: 'Business Rules',
      panelID: 'business-settings-panel',
    },
    {
      id: 'intro',
      content: 'Intro Screen',
      panelID: 'intro-settings-panel',
    },
  ];

  useEffect(() => {
    if (shop) {
      loadAllSettings();
    }
  }, [shop]);

  const loadAllSettings = async () => {
    try {
      setLoading(true);

      // Load game config (contains all settings)
      const configResponse = await fetch(`/api/game/config/${shop}`);
      if (configResponse.ok) {
        const config = await configResponse.json();

        // Set game settings with defaults
        const gameSettings = {
          ...config.gameSettings,
          gameType: config.gameSettings?.gameType || 'dino',
          testMode: config.widgetSettings?.testMode ?? false, // Moved from widget settings
          discountTiers: config.gameSettings?.discountTiers || [
            { minScore: 100, discount: 5, message: 'Great job! You earned 5% off!' },
            { minScore: 300, discount: 10, message: 'Amazing! You earned 10% off!' },
            { minScore: 500, discount: 15, message: 'Incredible! You earned 15% off!' }
          ]
        };
        setGameSettings(gameSettings);

        // Set widget settings with defaults
        const widgetSettings = {
          ...config.widgetSettings,
          userPercentage: config.widgetSettings?.userPercentage ?? 100,
          showDelay: config.widgetSettings?.showDelay ?? 0,
          pageLoadTrigger: config.widgetSettings?.pageLoadTrigger || 'immediate',
          deviceTargeting: config.widgetSettings?.deviceTargeting || 'all',
          geoTargeting: config.widgetSettings?.geoTargeting || [],
          customPages: config.widgetSettings?.customPages || [],
          targetUrls: config.widgetSettings?.targetUrls || [],
          timeBasedRules: config.widgetSettings?.timeBasedRules || {
            enabled: false,
          },
        };
        setWidgetSettings(widgetSettings);

        setAppearanceSettings(config.appearance || {
          primaryColor: '#667eea',
          secondaryColor: '#764ba2',
          backgroundTheme: 'default',
        });

        setBusinessRules(config.businessRules || {
          excludeDiscountedProducts: false,
          allowStackingDiscounts: false,
          discountExpiryHours: 24,
          minimumOrderValue: 0,
        });
      }

      // Load intro settings
      const introResponse = await fetch(`/api/dashboard/intro-settings?shop=${shop}`);
      if (introResponse.ok) {
        const introData = await introResponse.json();
        setIntroSettings(introData);
      } else {
        // Set default intro settings
        setIntroSettings({
          title: 'Bargain Hunter',
          subtitle: 'Jump & earn discounts!',
          backgroundColor: '#667eea',
          textColor: '#ffffff',
          buttonColor: '#28a745',
          buttonTextColor: '#ffffff',
          discountText: 'Win {minDiscount}% - {maxDiscount}% OFF!',
          showEmojis: true,
          borderRadius: 12,
          padding: 12,
        });
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

      // Prepare all settings data
      const settingsData = {
        shop,
        gameSettings: gameSettings || {
          isEnabled: true,
          gameType: 'dino',
          minScoreForDiscount: 100,
          maxPlaysPerCustomer: 5,
          maxPlaysPerDay: 10,
          gameSpeed: 1,
          difficulty: 'medium',
          discountTiers: [
            { minScore: 100, discount: 5, message: 'Great job! You earned 5% off!' },
            { minScore: 300, discount: 10, message: 'Amazing! You earned 10% off!' },
            { minScore: 500, discount: 15, message: 'Incredible! You earned 15% off!' }
          ]
        },
        widgetSettings: widgetSettings || {
          displayMode: 'popup',
          triggerEvent: 'immediate',
          position: 'center',
          showOn: 'all_pages',
          userPercentage: 100,
          testMode: false,
          showDelay: 0,
          pageLoadTrigger: 'immediate',
          deviceTargeting: 'all',
          customPages: [],
          targetUrls: [],
        },
        appearance: appearanceSettings || {
          primaryColor: '#667eea',
          secondaryColor: '#764ba2',
          backgroundTheme: 'default',
        },
        businessRules: businessRules || {
          excludeDiscountedProducts: false,
          allowStackingDiscounts: false,
          discountExpiryHours: 24,
          minimumOrderValue: 0,
        }
      };

      // Save main settings
      const gameResponse = await fetch(`/api/dashboard/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData),
      });

      // Save intro settings separately
      const introResponse = await fetch(`/api/dashboard/intro-settings?shop=${shop}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(introSettings),
      });

      if (gameResponse.ok && introResponse.ok) {
        setToastMessage('Settings saved successfully!');
        setToastActive(true);
      } else {
        const gameError = await gameResponse.text();
        const introError = await introResponse.text();
        console.error('Settings API errors:', { gameError, introError });
        throw new Error(`Failed to save settings: ${gameError || introError}`);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setToastMessage(`Failed to save settings: ${error.message}`);
      setToastActive(true);
    } finally {
      setSaving(false);
    }
  };

  const renderGameSettings = () => {
    if (!gameSettings) return null;

    return (
      <div style={{ display: 'grid', gap: '2rem' }}>
        <Card>
          <div style={{ padding: '2rem' }}>
            <Stack vertical spacing="loose">
              <Text variant="headingLg" as="h3">
                Game Configuration
              </Text>
              <FormLayout>
                <Checkbox
                  label="Enable Game Widget"
                  checked={gameSettings.isEnabled}
                  onChange={(checked) => setGameSettings({...gameSettings, isEnabled: checked})}
                />

                <Checkbox
                  label="Test Mode (show only to admin for testing)"
                  checked={gameSettings.testMode}
                  onChange={(checked) => setGameSettings({...gameSettings, testMode: checked})}
                  helpText="When enabled, the game widget will only be visible to you for testing and configuration. Disable this to make the widget visible to all customers according to your targeting settings."
                />
                
                <Select
                  label="Game Type"
                  options={[
                    { label: 'Chrome Dino Runner', value: 'dino' },
                    { label: 'Flappy Bird', value: 'flappy_bird' },
                    { label: 'Tetris', value: 'tetris' },
                    { label: 'Snake', value: 'snake' },
                    { label: 'Space Invaders', value: 'space_invaders' },
                  ]}
                  value={gameSettings.gameType}
                  onChange={(value) => setGameSettings({...gameSettings, gameType: value as any})}
                />

                <TextField
                  label="Minimum Score for Discount"
                  type="number"
                  value={gameSettings.minScoreForDiscount.toString()}
                  onChange={(value) => setGameSettings({...gameSettings, minScoreForDiscount: parseInt(value) || 0})}
                />

                <TextField
                  label="Max Plays per Customer"
                  type="number"
                  value={gameSettings.maxPlaysPerCustomer.toString()}
                  onChange={(value) => setGameSettings({...gameSettings, maxPlaysPerCustomer: parseInt(value) || 0})}
                />

                <Select
                  label="Difficulty Level"
                  options={[
                    { label: 'Easy', value: 'easy' },
                    { label: 'Medium', value: 'medium' },
                    { label: 'Hard', value: 'hard' },
                  ]}
                  value={gameSettings.difficulty}
                  onChange={(value) => setGameSettings({...gameSettings, difficulty: value as any})}
                />
              </FormLayout>
            </Stack>
          </div>
        </Card>
      </div>
    );
  };

  const renderWidgetSettings = () => {
    if (!widgetSettings) return null;

    return (
      <div style={{ display: 'grid', gap: '2rem' }}>
        <Card>
          <div style={{ padding: '2rem' }}>
            <Stack vertical spacing="loose">
              <Text variant="headingLg" as="h3">
                Widget Display
              </Text>
              <FormLayout>
                <Select
                  label="Display Mode"
                  options={[
                    { label: 'Popup Modal', value: 'popup' },
                    { label: 'Side Tab', value: 'tab' },
                    { label: 'Inline Widget', value: 'inline' },
                  ]}
                  value={widgetSettings.displayMode}
                  onChange={(value) => setWidgetSettings({...widgetSettings, displayMode: value as any})}
                />

                <Select
                  label="Show Widget On"
                  options={[
                    { label: 'All Pages', value: 'all_pages' },
                    { label: 'Product Pages Only', value: 'product_pages' },
                    { label: 'Cart Page Only', value: 'cart_page' },
                    { label: 'Collection Pages', value: 'collection_pages' },
                    { label: 'Custom Pages', value: 'custom' },
                    { label: 'Specific URLs (Direct Link)', value: 'url_targeting' },
                  ]}
                  value={widgetSettings.showOn}
                  onChange={(value) => setWidgetSettings({...widgetSettings, showOn: value as any})}
                />

                {widgetSettings.showOn === 'custom' && (
                  <TextField
                    label="Custom Pages (comma separated URLs)"
                    value={widgetSettings.customPages?.join(', ') || ''}
                    onChange={(value) => setWidgetSettings({
                      ...widgetSettings,
                      customPages: value.split(',').map(p => p.trim()).filter(Boolean)
                    })}
                    helpText="Enter page URLs where the widget should appear"
                  />
                )}

                {widgetSettings.showOn === 'url_targeting' && (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <TextField
                      label="Target URLs (one per line)"
                      value={widgetSettings.targetUrls?.join('\n') || ''}
                      onChange={(value) => setWidgetSettings({
                        ...widgetSettings,
                        targetUrls: value.split('\n').map(url => url.trim()).filter(Boolean)
                      })}
                      multiline={4}
                      helpText="Enter complete URLs where the widget popup should appear. When someone visits these URLs, the game popup will show immediately."
                      placeholder="https://example.com/special-offer&#10;https://example.com/sale&#10;https://example.com/discount"
                    />
                    <div style={{
                      padding: '1rem',
                      background: '#f6f6f7',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#637381'
                    }}>
                      <strong>How URL Targeting Works:</strong>
                      <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                        <li>Widget will appear as popup when someone visits the exact URLs listed above</li>
                        <li>Perfect for special landing pages, promotional campaigns, or direct links</li>
                        <li>Example: Share https://yourstore.com/special-offer and visitors will see the game popup</li>
                        <li>URLs must be complete including https://</li>
                      </ul>
                    </div>
                  </div>
                )}

                <Select
                  label="Page Load Trigger"
                  options={[
                    { label: 'Immediate', value: 'immediate' },
                    { label: 'After Delay', value: 'after_delay' },
                    { label: 'On Scroll', value: 'on_scroll' },
                    { label: 'On Exit Intent', value: 'on_exit_intent' },
                  ]}
                  value={widgetSettings.pageLoadTrigger}
                  onChange={(value) => setWidgetSettings({...widgetSettings, pageLoadTrigger: value as any})}
                />

                {widgetSettings.pageLoadTrigger === 'after_delay' && (
                  <TextField
                    label="Delay (seconds)"
                    type="number"
                    value={widgetSettings.timeDelay?.toString() || '3'}
                    onChange={(value) => setWidgetSettings({...widgetSettings, timeDelay: parseInt(value) || 3})}
                  />
                )}

                {widgetSettings.pageLoadTrigger === 'on_scroll' && (
                  <div>
                    <Text variant="bodyMd" as="p">
                      Scroll Percentage: {widgetSettings.scrollPercentage || 50}%
                    </Text>
                    <RangeSlider
                      label=""
                      value={widgetSettings.scrollPercentage || 50}
                      min={10}
                      max={90}
                      step={10}
                      onChange={(value) => setWidgetSettings({...widgetSettings, scrollPercentage: value})}
                    />
                  </div>
                )}

                <Select
                  label="Device Targeting"
                  options={[
                    { label: 'All Devices', value: 'all' },
                    { label: 'Desktop Only', value: 'desktop' },
                    { label: 'Mobile Only', value: 'mobile' },
                    { label: 'Tablet Only', value: 'tablet' },
                  ]}
                  value={widgetSettings.deviceTargeting}
                  onChange={(value) => setWidgetSettings({...widgetSettings, deviceTargeting: value as any})}
                />

                <div>
                  <Text variant="bodyMd" as="p">
                    User Targeting: {widgetSettings.userPercentage}%
                  </Text>
                  <RangeSlider
                    label=""
                    value={widgetSettings.userPercentage}
                    min={0}
                    max={100}
                    step={5}
                    onChange={(value) => setWidgetSettings({...widgetSettings, userPercentage: value})}
                  />
                </div>



                <Checkbox
                  label="Enable Time-Based Rules"
                  checked={widgetSettings.timeBasedRules?.enabled || false}
                  onChange={(checked) => setWidgetSettings({
                    ...widgetSettings,
                    timeBasedRules: { ...widgetSettings.timeBasedRules, enabled: checked }
                  })}
                />

                {widgetSettings.timeBasedRules?.enabled && (
                  <>
                    <TextField
                      label="Start Time (24h format)"
                      value={widgetSettings.timeBasedRules?.startTime || '09:00'}
                      onChange={(value) => setWidgetSettings({
                        ...widgetSettings,
                        timeBasedRules: { ...widgetSettings.timeBasedRules, startTime: value }
                      })}
                    />
                    <TextField
                      label="End Time (24h format)"
                      value={widgetSettings.timeBasedRules?.endTime || '17:00'}
                      onChange={(value) => setWidgetSettings({
                        ...widgetSettings,
                        timeBasedRules: { ...widgetSettings.timeBasedRules, endTime: value }
                      })}
                    />
                  </>
                )}
              </FormLayout>
            </Stack>
          </div>
        </Card>
      </div>
    );
  };

  const renderAppearanceSettings = () => {
    if (!appearanceSettings) return null;

    return (
      <div style={{ display: 'grid', gap: '2rem' }}>
        <Card>
          <div style={{ padding: '2rem' }}>
            <Stack vertical spacing="loose">
              <Text variant="headingLg" as="h3">
                Theme & Colors
              </Text>
              <FormLayout>
                <Select
                  label="Background Theme"
                  options={[
                    { label: 'Default Gradient', value: 'default' },
                    { label: 'Dark Theme', value: 'dark' },
                    { label: 'Light Theme', value: 'light' },
                    { label: 'Custom', value: 'custom' },
                  ]}
                  value={appearanceSettings.backgroundTheme}
                  onChange={(value) => setAppearanceSettings({...appearanceSettings, backgroundTheme: value as any})}
                />

                <TextField
                  label="Primary Color"
                  value={appearanceSettings.primaryColor}
                  onChange={(value) => setAppearanceSettings({...appearanceSettings, primaryColor: value})}
                  type="color"
                />

                <TextField
                  label="Secondary Color"
                  value={appearanceSettings.secondaryColor}
                  onChange={(value) => setAppearanceSettings({...appearanceSettings, secondaryColor: value})}
                  type="color"
                />
              </FormLayout>
            </Stack>
          </div>
        </Card>

        {/* Preview */}
        <Card>
          <div style={{ padding: '2rem' }}>
            <Stack vertical spacing="loose">
              <Text variant="headingLg" as="h3">
                Preview
              </Text>
              <div style={{
                background: `linear-gradient(135deg, ${appearanceSettings.primaryColor} 0%, ${appearanceSettings.secondaryColor} 100%)`,
                padding: '2rem',
                borderRadius: '12px',
                color: 'white',
                textAlign: 'center',
              }}>
                <Text variant="headingMd" as="h4" color="inherit">
                  Sample Widget Preview
                </Text>
                <Text variant="bodyMd" as="p" color="inherit">
                  This is how your widget will look with the selected colors
                </Text>
              </div>
            </Stack>
          </div>
        </Card>
      </div>
    );
  };

  const renderBusinessRules = () => {
    if (!businessRules) return null;

    return (
      <div style={{ display: 'grid', gap: '2rem' }}>
        <Card>
          <div style={{ padding: '2rem' }}>
            <Stack vertical spacing="loose">
              <Text variant="headingLg" as="h3">
                Discount Rules
              </Text>
              <FormLayout>
                <Checkbox
                  label="Exclude already discounted products"
                  checked={businessRules.excludeDiscountedProducts}
                  onChange={(checked) => setBusinessRules({...businessRules, excludeDiscountedProducts: checked})}
                  helpText="Prevent game discounts on products that already have discounts"
                />

                <Checkbox
                  label="Allow stacking with other discounts"
                  checked={businessRules.allowStackingDiscounts}
                  onChange={(checked) => setBusinessRules({...businessRules, allowStackingDiscounts: checked})}
                  helpText="Allow game discounts to combine with other discount codes"
                />

                <TextField
                  label="Discount Expiry (hours)"
                  type="number"
                  value={businessRules.discountExpiryHours.toString()}
                  onChange={(value) => setBusinessRules({...businessRules, discountExpiryHours: parseInt(value) || 24})}
                  helpText="How long discount codes remain valid"
                />

                <TextField
                  label="Minimum Order Value ($)"
                  type="number"
                  value={businessRules.minimumOrderValue?.toString() || '0'}
                  onChange={(value) => setBusinessRules({...businessRules, minimumOrderValue: parseInt(value) || 0})}
                  helpText="Minimum cart value required to use discount (0 = no minimum)"
                />
              </FormLayout>
            </Stack>
          </div>
        </Card>
      </div>
    );
  };

  const renderIntroSettings = () => {
    if (!introSettings) return null;

    return (
      <div style={{ display: 'grid', gap: '2rem' }}>
        <Card>
          <div style={{ padding: '2rem' }}>
            <Stack vertical spacing="loose">
              <Text variant="headingLg" as="h3">
                Intro Screen Customization
              </Text>
              <FormLayout>
                <TextField
                  label="Title"
                  value={introSettings.title}
                  onChange={(value) => setIntroSettings({...introSettings, title: value})}
                />

                <TextField
                  label="Subtitle"
                  value={introSettings.subtitle}
                  onChange={(value) => setIntroSettings({...introSettings, subtitle: value})}
                />

                <TextField
                  label="Discount Text"
                  value={introSettings.discountText}
                  onChange={(value) => setIntroSettings({...introSettings, discountText: value})}
                  helpText="Use {minDiscount} and {maxDiscount} as placeholders"
                />

                <Checkbox
                  label="Show Emojis"
                  checked={introSettings.showEmojis}
                  onChange={(checked) => setIntroSettings({...introSettings, showEmojis: checked})}
                />

                <div>
                  <Text variant="bodyMd" as="p">
                    Border Radius: {introSettings.borderRadius}px
                  </Text>
                  <RangeSlider
                    label=""
                    value={introSettings.borderRadius}
                    min={0}
                    max={30}
                    step={2}
                    onChange={(value) => setIntroSettings({...introSettings, borderRadius: value})}
                  />
                </div>

                <div>
                  <Text variant="bodyMd" as="p">
                    Padding: {introSettings.padding}px
                  </Text>
                  <RangeSlider
                    label=""
                    value={introSettings.padding}
                    min={8}
                    max={32}
                    step={4}
                    onChange={(value) => setIntroSettings({...introSettings, padding: value})}
                  />
                </div>
              </FormLayout>
            </Stack>
          </div>
        </Card>

        {/* Preview Card */}
        <Card>
          <div style={{ padding: '2rem' }}>
            <Stack vertical spacing="loose">
              <Text variant="headingLg" as="h3">
                Preview
              </Text>
              <div style={{
                background: introSettings.backgroundColor,
                color: introSettings.textColor,
                borderRadius: `${introSettings.borderRadius}px`,
                padding: `${introSettings.padding}px`,
                textAlign: 'center',
                maxWidth: '400px',
                margin: '0 auto',
              }}>
                <h1 style={{ margin: '0', fontSize: '24px' }}>
                  {introSettings.showEmojis ? '🦕 ' : ''}{introSettings.title}
                </h1>
                <p style={{ margin: '0', opacity: 0.9 }}>
                  {introSettings.subtitle}
                </p>
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  padding: '8px',
                  margin: '8px 0',
                }}>
                  <h2 style={{ margin: '0', fontSize: '18px', color: '#FFD700' }}>
                    {introSettings.showEmojis ? '💰 ' : ''}{introSettings.discountText.replace('{minDiscount}', '5').replace('{maxDiscount}', '25')}
                  </h2>
                </div>
              </div>
            </Stack>
          </div>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <Spinner size="large" />
        <Text variant="bodyMd" as="p" color="subdued">
          Loading settings...
        </Text>
      </div>
    );
  }

  const toastMarkup = toastActive ? (
    <Toast
      content={toastMessage}
      onDismiss={() => setToastActive(false)}
    />
  ) : null;

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {toastMarkup}
      
      {/* Settings Header */}
      <Card>
        <div style={{ padding: '1.5rem' }}>
          <Stack distribution="equalSpacing" alignment="center">
            <Text variant="headingLg" as="h2">
              Configuration Settings
            </Text>
            <Button
              primary
              loading={saving}
              onClick={saveSettings}
            >
              Save All Settings
            </Button>
          </Stack>
        </div>
      </Card>

      {/* Settings Tabs */}
      <Card>
        <Tabs
          tabs={settingsTabs}
          selected={selectedSettingsTab}
          onSelect={setSelectedSettingsTab}
        />
        <div style={{ padding: '2rem' }}>
          {selectedSettingsTab === 0 && renderGameSettings()}
          {selectedSettingsTab === 1 && renderWidgetSettings()}
          {selectedSettingsTab === 2 && renderAppearanceSettings()}
          {selectedSettingsTab === 3 && renderBusinessRules()}
          {selectedSettingsTab === 4 && renderIntroSettings()}
        </div>
      </Card>
    </div>
  );
}
