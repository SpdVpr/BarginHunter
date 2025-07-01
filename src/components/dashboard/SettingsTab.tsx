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
  showOn: 'all_pages' | 'product_pages' | 'cart_page' | 'checkout_page' | 'collection_pages';
  userPercentage: number;
  testMode: boolean;
  showDelay: number;
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
      
      // Load game settings
      const gameResponse = await fetch(`/api/dashboard/settings?shop=${shop}`);
      if (gameResponse.ok) {
        const gameData = await gameResponse.json();
        setGameSettings(gameData.gameSettings);
        setWidgetSettings(gameData.widgetSettings);
      }

      // Load intro settings
      const introResponse = await fetch(`/api/dashboard/intro-settings?shop=${shop}`);
      if (introResponse.ok) {
        const introData = await introResponse.json();
        setIntroSettings(introData);
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
      
      // Save game and widget settings
      const gameResponse = await fetch(`/api/dashboard/settings?shop=${shop}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameSettings,
          widgetSettings,
        }),
      });

      // Save intro settings
      const introResponse = await fetch(`/api/dashboard/intro-settings?shop=${shop}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(introSettings),
      });

      if (gameResponse.ok && introResponse.ok) {
        setToastMessage('Settings saved successfully!');
        setToastActive(true);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setToastMessage('Failed to save settings. Please try again.');
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
                  ]}
                  value={widgetSettings.showOn}
                  onChange={(value) => setWidgetSettings({...widgetSettings, showOn: value as any})}
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
                  label="Test Mode (show to all users)"
                  checked={widgetSettings.testMode}
                  onChange={(checked) => setWidgetSettings({...widgetSettings, testMode: checked})}
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
          {selectedSettingsTab === 2 && renderIntroSettings()}
        </div>
      </Card>
    </div>
  );
}
