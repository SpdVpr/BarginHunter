/** @jsxImportSource react */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  TextField,
  ColorPicker,
  Select,
  Banner,
  Toast,
  Frame,
  Stack,
  FormLayout,
  Checkbox,
  RangeSlider,
} from '@shopify/polaris';
import { DashboardLayout } from '../../src/components/shared/DashboardLayout';

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
  customCSS: string;
}

const DEFAULT_INTRO_SETTINGS: IntroSettings = {
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
  customCSS: '',
};

export default function IntroSettingsPage() {
  const router = useRouter();
  const { shop } = router.query;
  const [settings, setSettings] = useState<IntroSettings>(DEFAULT_INTRO_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (shop) {
      loadSettings();
    }
  }, [shop]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/intro-settings?shop=${shop}`);
      if (response.ok) {
        const data = await response.json();
        setSettings({ ...DEFAULT_INTRO_SETTINGS, ...data });
      }
    } catch (error) {
      console.error('Failed to load intro settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/intro-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shop,
          settings,
        }),
      });

      if (response.ok) {
        setToastMessage('Intro screen settings saved successfully!');
        setToastActive(true);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save intro settings:', error);
      setToastMessage('Failed to save settings. Please try again.');
      setToastActive(true);
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: keyof IntroSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const previewStyle = {
    background: `linear-gradient(135deg, ${settings.backgroundColor} 0%, ${settings.backgroundColor}dd 100%)`,
    color: settings.textColor,
    borderRadius: `${settings.borderRadius}px`,
    padding: `${settings.padding}px`,
    textAlign: 'center' as const,
    minHeight: '200px',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
  };

  const buttonStyle = {
    background: settings.buttonColor,
    color: settings.buttonTextColor,
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  };

  const toastMarkup = toastActive ? (
    <Toast
      content={toastMessage}
      onDismiss={() => setToastActive(false)}
    />
  ) : null;

  if (loading) {
    return (
      <DashboardLayout shop={typeof shop === 'string' ? shop : ''} currentPage="intro-settings">
        <Page title="Loading...">
          <Layout>
            <Layout.Section>
              <Card sectioned>
                <Text variant="bodyMd" as="p">Loading intro screen settings...</Text>
              </Card>
            </Layout.Section>
          </Layout>
        </Page>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout shop={typeof shop === 'string' ? shop : ''} currentPage="intro-settings">
      <Frame>
        {toastMarkup}
        <Page
          title="Intro Screen Settings"
          subtitle={`Customize the intro screen for ${shop}`}
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
              content: 'Reset to Default',
              onAction: () => setSettings(DEFAULT_INTRO_SETTINGS),
            },
          ]}
        >
          <Layout>
            <Layout.Section>
              <Banner
                title="Intro Screen Customization"
                status="info"
              >
                <p>
                  Customize the appearance and content of your game's intro screen to match your brand.
                  Changes will be visible to customers when they start the game.
                </p>
              </Banner>
            </Layout.Section>

            <Layout.Section oneHalf>
              <Card title="Content Settings" sectioned>
                <FormLayout>
                  <TextField
                    label="Game Title"
                    value={settings.title}
                    onChange={(value) => handleFieldChange('title', value)}
                    helpText="The main title displayed on the intro screen"
                  />
                  
                  <TextField
                    label="Subtitle"
                    value={settings.subtitle}
                    onChange={(value) => handleFieldChange('subtitle', value)}
                    helpText="Short description below the title"
                  />
                  
                  <TextField
                    label="Discount Text"
                    value={settings.discountText}
                    onChange={(value) => handleFieldChange('discountText', value)}
                    helpText="Use {minDiscount} and {maxDiscount} placeholders"
                  />
                  
                  <Checkbox
                    label="Show Emojis"
                    checked={settings.showEmojis}
                    onChange={(value) => handleFieldChange('showEmojis', value)}
                    helpText="Display emoji icons in the interface"
                  />
                </FormLayout>
              </Card>
            </Layout.Section>

            <Layout.Section oneHalf>
              <Card title="Preview" sectioned>
                <div style={previewStyle}>
                  <h1 style={{ margin: '0', fontSize: '24px' }}>
                    {settings.showEmojis ? '🦕 ' : ''}{settings.title}
                  </h1>
                  <p style={{ margin: '0', opacity: 0.9 }}>
                    {settings.subtitle}
                  </p>
                  <div style={{
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    padding: '8px',
                    margin: '8px 0',
                  }}>
                    <h2 style={{ margin: '0', fontSize: '18px', color: '#FFD700' }}>
                      {settings.showEmojis ? '💰 ' : ''}{settings.discountText.replace('{minDiscount}', '5').replace('{maxDiscount}', '25')}
                    </h2>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={buttonStyle}>
                      {settings.showEmojis ? '🚀 ' : ''}Start
                    </button>
                    <button style={{
                      ...buttonStyle,
                      background: 'rgba(255,255,255,0.2)',
                      color: settings.textColor,
                    }}>
                      {settings.showEmojis ? '❌ ' : ''}Close
                    </button>
                  </div>
                </div>
              </Card>
            </Layout.Section>

            <Layout.Section oneHalf>
              <Card title="Colors" sectioned>
                <FormLayout>
                  <div>
                    <Text variant="bodyMd" as="p">Background Color</Text>
                    <ColorPicker
                      onChange={(value) => handleFieldChange('backgroundColor', value.hex)}
                      color={{ hex: settings.backgroundColor }}
                    />
                  </div>
                  
                  <div>
                    <Text variant="bodyMd" as="p">Text Color</Text>
                    <ColorPicker
                      onChange={(value) => handleFieldChange('textColor', value.hex)}
                      color={{ hex: settings.textColor }}
                    />
                  </div>
                  
                  <div>
                    <Text variant="bodyMd" as="p">Button Color</Text>
                    <ColorPicker
                      onChange={(value) => handleFieldChange('buttonColor', value.hex)}
                      color={{ hex: settings.buttonColor }}
                    />
                  </div>
                  
                  <div>
                    <Text variant="bodyMd" as="p">Button Text Color</Text>
                    <ColorPicker
                      onChange={(value) => handleFieldChange('buttonTextColor', value.hex)}
                      color={{ hex: settings.buttonTextColor }}
                    />
                  </div>
                </FormLayout>
              </Card>
            </Layout.Section>

            <Layout.Section oneHalf>
              <Card title="Layout" sectioned>
                <FormLayout>
                  <RangeSlider
                    label="Border Radius"
                    value={settings.borderRadius}
                    onChange={(value) => handleFieldChange('borderRadius', value)}
                    min={0}
                    max={30}
                    step={1}
                    suffix={`${settings.borderRadius}px`}
                  />
                  
                  <RangeSlider
                    label="Padding"
                    value={settings.padding}
                    onChange={(value) => handleFieldChange('padding', value)}
                    min={4}
                    max={40}
                    step={2}
                    suffix={`${settings.padding}px`}
                  />
                </FormLayout>
              </Card>
            </Layout.Section>

            <Layout.Section>
              <Card title="Advanced Customization" sectioned>
                <FormLayout>
                  <TextField
                    label="Custom CSS"
                    value={settings.customCSS}
                    onChange={(value) => handleFieldChange('customCSS', value)}
                    multiline={6}
                    helpText="Add custom CSS to further customize the intro screen appearance"
                    placeholder=".game-intro-container { /* your custom styles */ }"
                  />
                </FormLayout>
              </Card>
            </Layout.Section>
          </Layout>
        </Page>
      </Frame>
    </DashboardLayout>
  );
}
