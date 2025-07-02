/** @jsxImportSource react */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Text,
  Stack,
  FormLayout,
  Select,
  TextField,
  Button,
  Banner,
  Spinner,
  Checkbox,
  RangeSlider,
  ColorPicker,
  ButtonGroup,
} from '@shopify/polaris';

interface WidgetDisplayTabProps {
  shop: string | string[] | undefined;
}

interface FloatingButtonConfig {
  text: string;
  icon: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  size: 'small' | 'medium' | 'large';
  position: {
    desktop: 'top-left' | 'top-right' | 'middle-left' | 'middle-right' | 'bottom-left' | 'bottom-right';
    mobile: 'top-left' | 'top-right' | 'middle-left' | 'middle-right' | 'bottom-left' | 'bottom-right';
  };
  offset: {
    desktop: { x: number; y: number };
    mobile: { x: number; y: number };
  };
  animation: 'none' | 'pulse' | 'bounce' | 'shake';
  showOnHover: boolean;
}

interface WidgetSettings {
  displayMode: 'popup' | 'tab' | 'floating_button' | 'inline';
  triggerEvent: 'immediate' | 'time_delay' | 'exit_intent' | 'scroll';
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showOn: 'all_pages' | 'homepage' | 'product_pages' | 'collection_pages' | 'cart_page' | 'checkout_page' | 'custom';
  customPages: string[];
  userPercentage: number;
  testMode: boolean;
  showDelay: number;
  pageLoadTrigger: 'immediate' | 'after_delay' | 'on_scroll' | 'on_exit_intent';
  deviceTargeting: 'all' | 'mobile' | 'tablet' | 'desktop';
  geoTargeting: string[];
  timeBasedRules: {
    enabled: boolean;
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
  };
  floatingButton?: FloatingButtonConfig;
}

export function WidgetDisplayTab({ shop }: WidgetDisplayTabProps) {
  const [widgetSettings, setWidgetSettings] = useState<WidgetSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getDefaultFloatingButton = (): FloatingButtonConfig => ({
    text: 'Play Game',
    icon: '🎮',
    backgroundColor: '#ff6b6b',
    textColor: '#ffffff',
    borderRadius: 25,
    size: 'medium',
    position: {
      desktop: 'bottom-right',
      mobile: 'bottom-right'
    },
    offset: {
      desktop: { x: 20, y: 20 },
      mobile: { x: 15, y: 15 }
    },
    animation: 'pulse',
    showOnHover: false
  });

  useEffect(() => {
    if (shop) {
      loadWidgetSettings();
    }
  }, [shop]);

  const loadWidgetSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/game/config/${shop}`);
      if (response.ok) {
        const config = await response.json();
        const settings = {
          ...config.widgetSettings,
          floatingButton: config.widgetSettings?.floatingButton || getDefaultFloatingButton()
        };
        setWidgetSettings(settings);
      }
    } catch (error) {
      console.error('Failed to load widget settings:', error);
      setMessage({ type: 'error', text: 'Failed to load widget settings' });
    } finally {
      setLoading(false);
    }
  };

  const saveWidgetSettings = async () => {
    if (!widgetSettings) return;

    try {
      setSaving(true);
      const response = await fetch('/api/dashboard/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop,
          widgetSettings
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Widget display settings saved successfully!' });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save widget settings:', error);
      setMessage({ type: 'error', text: 'Failed to save widget settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <Spinner size="large" />
        <Text variant="bodyMd" as="p" color="subdued">
          Loading widget display settings...
        </Text>
      </div>
    );
  }

  if (!widgetSettings) return null;

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {message && (
        <Banner
          status={message.type === 'success' ? 'success' : 'critical'}
          onDismiss={() => setMessage(null)}
        >
          {message.text}
        </Banner>
      )}

      {/* Widget Display Mode Selection */}
      <Card>
        <div style={{ padding: '2rem' }}>
          <Stack vertical spacing="loose">
            <Text variant="headingLg" as="h3">
              🎮 Widget Display Mode
            </Text>
            <Text variant="bodyMd" color="subdued">
              Choose how your game widget appears to customers
            </Text>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              {/* Popup Modal Option */}
              <div 
                onClick={() => setWidgetSettings({...widgetSettings, displayMode: 'popup'})}
                style={{
                  border: widgetSettings.displayMode === 'popup' ? '2px solid #008060' : '2px solid #e1e3e5',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  backgroundColor: widgetSettings.displayMode === 'popup' ? '#f6f6f7' : 'white',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🪟</span>
                  <Text variant="headingMd" as="h4">Popup Modal</Text>
                  {widgetSettings.displayMode === 'popup' && <span style={{ color: '#008060' }}>✓</span>}
                </div>
                <Text variant="bodyMd" color="subdued">
                  Game opens in a modal overlay. Appears automatically after page load.
                </Text>
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#6d7175' }}>
                  Best for: High engagement, immediate attention
                </div>
              </div>

              {/* Side Tab Option */}
              <div 
                onClick={() => setWidgetSettings({...widgetSettings, displayMode: 'tab'})}
                style={{
                  border: widgetSettings.displayMode === 'tab' ? '2px solid #008060' : '2px solid #e1e3e5',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  backgroundColor: widgetSettings.displayMode === 'tab' ? '#f6f6f7' : 'white',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>📑</span>
                  <Text variant="headingMd" as="h4">Side Tab</Text>
                  {widgetSettings.displayMode === 'tab' && <span style={{ color: '#008060' }}>✓</span>}
                </div>
                <Text variant="bodyMd" color="subdued">
                  Persistent tab on the side of the screen. Always visible but not intrusive.
                </Text>
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#6d7175' }}>
                  Best for: Constant visibility, moderate engagement
                </div>
              </div>

              {/* Floating Button Option */}
              <div 
                onClick={() => setWidgetSettings({...widgetSettings, displayMode: 'floating_button'})}
                style={{
                  border: widgetSettings.displayMode === 'floating_button' ? '2px solid #008060' : '2px solid #e1e3e5',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  backgroundColor: widgetSettings.displayMode === 'floating_button' ? '#f6f6f7' : 'white',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🎯</span>
                  <Text variant="headingMd" as="h4">Floating Button</Text>
                  {widgetSettings.displayMode === 'floating_button' && <span style={{ color: '#008060' }}>✓</span>}
                </div>
                <Text variant="bodyMd" color="subdued">
                  Modern floating button. Non-intrusive, users click when interested.
                </Text>
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#6d7175' }}>
                  Best for: User choice, modern design, mobile-friendly
                </div>
              </div>
            </div>
          </Stack>
        </div>
      </Card>

      {/* Widget Targeting Settings */}
      <Card>
        <div style={{ padding: '2rem' }}>
          <Stack vertical spacing="loose">
            <Text variant="headingLg" as="h3">
              🎯 Widget Targeting
            </Text>
            <FormLayout>
              <Select
                label="Show Widget On"
                options={[
                  { label: 'All Pages', value: 'all_pages' },
                  { label: 'Homepage Only', value: 'homepage' },
                  { label: 'Product Pages', value: 'product_pages' },
                  { label: 'Collection Pages', value: 'collection_pages' },
                  { label: 'Cart Page', value: 'cart_page' },
                  { label: 'Custom Pages', value: 'custom' },
                ]}
                value={widgetSettings.showOn}
                onChange={(value) => setWidgetSettings({...widgetSettings, showOn: value as any})}
              />

              <RangeSlider
                label={`User Percentage: ${widgetSettings.userPercentage}%`}
                value={widgetSettings.userPercentage}
                onChange={(value) => setWidgetSettings({...widgetSettings, userPercentage: value})}
                min={0}
                max={100}
                step={5}
                helpText="Percentage of users who will see the widget"
              />

              <Select
                label="Device Targeting"
                options={[
                  { label: 'All Devices', value: 'all' },
                  { label: 'Mobile Only', value: 'mobile' },
                  { label: 'Desktop Only', value: 'desktop' },
                  { label: 'Tablet Only', value: 'tablet' },
                ]}
                value={widgetSettings.deviceTargeting}
                onChange={(value) => setWidgetSettings({...widgetSettings, deviceTargeting: value as any})}
              />

              <Checkbox
                label="Test Mode (only visible to admin)"
                checked={widgetSettings.testMode}
                onChange={(checked) => setWidgetSettings({...widgetSettings, testMode: checked})}
              />
            </FormLayout>
          </Stack>
        </div>
      </Card>

      {/* Floating Button Settings - Only show when floating button is selected */}
      {widgetSettings.displayMode === 'floating_button' && (
        <Card>
          <div style={{ padding: '2rem' }}>
            <Stack vertical spacing="loose">
              <Text variant="headingLg" as="h3">
                🎯 Floating Button Settings
              </Text>
              <FormLayout>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <TextField
                    label="Button Text"
                    value={widgetSettings.floatingButton?.text || 'Play Game'}
                    onChange={(value) => setWidgetSettings({
                      ...widgetSettings,
                      floatingButton: {
                        ...getDefaultFloatingButton(),
                        ...widgetSettings.floatingButton,
                        text: value
                      }
                    })}
                  />

                  <TextField
                    label="Button Icon"
                    value={widgetSettings.floatingButton?.icon || '🎮'}
                    onChange={(value) => setWidgetSettings({
                      ...widgetSettings,
                      floatingButton: {
                        ...getDefaultFloatingButton(),
                        ...widgetSettings.floatingButton,
                        icon: value
                      }
                    })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Select
                    label="Desktop Position"
                    options={[
                      { label: 'Top Left', value: 'top-left' },
                      { label: 'Top Right', value: 'top-right' },
                      { label: 'Middle Left', value: 'middle-left' },
                      { label: 'Middle Right', value: 'middle-right' },
                      { label: 'Bottom Left', value: 'bottom-left' },
                      { label: 'Bottom Right', value: 'bottom-right' },
                    ]}
                    value={widgetSettings.floatingButton?.position?.desktop || 'bottom-right'}
                    onChange={(value) => setWidgetSettings({
                      ...widgetSettings,
                      floatingButton: {
                        ...getDefaultFloatingButton(),
                        ...widgetSettings.floatingButton,
                        position: {
                          ...widgetSettings.floatingButton?.position,
                          desktop: value as any
                        }
                      }
                    })}
                  />

                  <Select
                    label="Mobile Position"
                    options={[
                      { label: 'Top Left', value: 'top-left' },
                      { label: 'Top Right', value: 'top-right' },
                      { label: 'Middle Left', value: 'middle-left' },
                      { label: 'Middle Right', value: 'middle-right' },
                      { label: 'Bottom Left', value: 'bottom-left' },
                      { label: 'Bottom Right', value: 'bottom-right' },
                    ]}
                    value={widgetSettings.floatingButton?.position?.mobile || 'bottom-right'}
                    onChange={(value) => setWidgetSettings({
                      ...widgetSettings,
                      floatingButton: {
                        ...getDefaultFloatingButton(),
                        ...widgetSettings.floatingButton,
                        position: {
                          ...widgetSettings.floatingButton?.position,
                          mobile: value as any
                        }
                      }
                    })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Select
                    label="Button Size"
                    options={[
                      { label: 'Small', value: 'small' },
                      { label: 'Medium', value: 'medium' },
                      { label: 'Large', value: 'large' },
                    ]}
                    value={widgetSettings.floatingButton?.size || 'medium'}
                    onChange={(value) => setWidgetSettings({
                      ...widgetSettings,
                      floatingButton: {
                        ...getDefaultFloatingButton(),
                        ...widgetSettings.floatingButton,
                        size: value as any
                      }
                    })}
                  />

                  <Select
                    label="Animation"
                    options={[
                      { label: 'None', value: 'none' },
                      { label: 'Pulse', value: 'pulse' },
                      { label: 'Bounce', value: 'bounce' },
                      { label: 'Shake', value: 'shake' },
                    ]}
                    value={widgetSettings.floatingButton?.animation || 'pulse'}
                    onChange={(value) => setWidgetSettings({
                      ...widgetSettings,
                      floatingButton: {
                        ...getDefaultFloatingButton(),
                        ...widgetSettings.floatingButton,
                        animation: value as any
                      }
                    })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <TextField
                    label="Background Color"
                    value={widgetSettings.floatingButton?.backgroundColor || '#ff6b6b'}
                    onChange={(value) => setWidgetSettings({
                      ...widgetSettings,
                      floatingButton: {
                        ...getDefaultFloatingButton(),
                        ...widgetSettings.floatingButton,
                        backgroundColor: value
                      }
                    })}
                  />

                  <TextField
                    label="Text Color"
                    value={widgetSettings.floatingButton?.textColor || '#ffffff'}
                    onChange={(value) => setWidgetSettings({
                      ...widgetSettings,
                      floatingButton: {
                        ...getDefaultFloatingButton(),
                        ...widgetSettings.floatingButton,
                        textColor: value
                      }
                    })}
                  />
                </div>
              </FormLayout>
            </Stack>
          </div>
        </Card>
      )}

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          primary
          loading={saving}
          onClick={saveWidgetSettings}
        >
          Save Widget Display Settings
        </Button>
      </div>
    </div>
  );
}
