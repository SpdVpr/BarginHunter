/** @jsxImportSource react */
import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Text,
  Button,
  Stack,
  Select,
  Banner,
  Spinner,
  Badge,
} from '@shopify/polaris';
import Game from '../Game/Game';

interface GamesTabProps {
  shop: string;
}

interface GameSettings {
  isEnabled: boolean;
  gameType: 'dino' | 'flappy_bird' | 'tetris' | 'snake' | 'space_invaders' | 'arkanoid' | 'fruit_ninja';
  minScoreForDiscount: number;
  maxPlaysPerCustomer: number;
  maxPlaysPerDay: number;
  playLimitResetHours: number;
  gameSpeed: number;
  difficulty: 'easy' | 'medium' | 'hard';
  testMode: boolean;
  discountTiers: Array<{
    minScore: number;
    discount: number;
    message: string;
  }>;
  // Game-specific score ranges
  gameSpecificSettings?: {
    [gameId: string]: {
      discountTiers: Array<{
        minScore: number;
        discount: number;
        message: string;
      }>;
    };
  };
}

const AVAILABLE_GAMES = [
  {
    id: 'dino',
    name: '🏃 Runner',
    description: 'Classic endless runner game. Jump over obstacles to score points and earn discounts.',
    difficulty: 'Medium',
    controls: 'Spacebar/Click to Jump',
    category: 'Arcade',
    defaultScoreRanges: [
      { minScore: 25, discount: 3, message: 'First steps! 🦕' },
      { minScore: 50, discount: 5, message: 'Good start! 🎯' },
      { minScore: 100, discount: 8, message: 'Getting better! 🏃' },
      { minScore: 150, discount: 10, message: 'Nice jumping! 🦕' },
      { minScore: 300, discount: 15, message: 'Dino master! 🏆' }
    ]
  },
  {
    id: 'flappy_bird',
    name: '🐦 Flappy Bird',
    description: 'Navigate through pipes by tapping to flap. Timing is everything!',
    difficulty: 'Hard',
    controls: 'Spacebar/Click to Flap',
    category: 'Arcade',
    defaultScoreRanges: [
      { minScore: 1, discount: 3, message: 'First flight! 🐦' },
      { minScore: 3, discount: 5, message: 'Learning to fly! 🪶' },
      { minScore: 7, discount: 8, message: 'Steady flight! ✈️' },
      { minScore: 15, discount: 12, message: 'Flying high! 🚁' },
      { minScore: 25, discount: 15, message: 'Bird master! 🏆' }
    ]
  },
  {
    id: 'tetris',
    name: '🧩 Tetris',
    description: 'Classic block-stacking puzzle game. Clear lines to score points.',
    difficulty: 'Medium',
    controls: 'Arrow Keys/Touch',
    category: 'Puzzle',
    defaultScoreRanges: [
      { minScore: 200, discount: 3, message: 'First lines! 🧩' },
      { minScore: 500, discount: 5, message: 'Line clearer! 📏' },
      { minScore: 1000, discount: 8, message: 'Block stacker! 🎯' },
      { minScore: 2000, discount: 12, message: 'Tetris pro! 🎮' },
      { minScore: 4000, discount: 15, message: 'Tetris legend! 🏆' }
    ]
  },
  {
    id: 'snake',
    name: '🐍 Snake',
    description: 'Grow your snake by eating food, avoid walls and yourself.',
    difficulty: 'Easy',
    controls: 'Arrow Keys/Swipe',
    category: 'Arcade',
    defaultScoreRanges: [
      { minScore: 3, discount: 3, message: 'Baby snake! 🐍' },
      { minScore: 8, discount: 5, message: 'Growing snake! 🐛' },
      { minScore: 15, discount: 8, message: 'Long snake! 📏' },
      { minScore: 25, discount: 12, message: 'Giant snake! 🐲' },
      { minScore: 40, discount: 15, message: 'Snake champion! 🏆' }
    ]
  },
  {
    id: 'space_invaders',
    name: '🚀 Space Invaders',
    description: 'Defend Earth from alien invasion. Shoot enemies to score points.',
    difficulty: 'Medium',
    controls: 'Arrow Keys + Spacebar/Touch',
    category: 'Arcade',
    defaultScoreRanges: [
      { minScore: 100, discount: 3, message: 'Space cadet! 🚀' },
      { minScore: 300, discount: 5, message: 'Space defender! 🛡️' },
      { minScore: 600, discount: 8, message: 'Alien hunter! 👽' },
      { minScore: 1200, discount: 12, message: 'Space commander! 🎖️' },
      { minScore: 2000, discount: 15, message: 'Galaxy hero! 🏆' }
    ]
  },
  {
    id: 'arkanoid',
    name: '🎯 Arkanoid',
    description: 'Break all bricks with your paddle and ball. Classic brick breaker game.',
    difficulty: 'Medium',
    controls: 'Mouse/Touch to Move Paddle',
    category: 'Arcade',
    defaultScoreRanges: [
      { minScore: 150, discount: 3, message: 'First bricks! 🧱' },
      { minScore: 400, discount: 5, message: 'Brick breaker! 🎯' },
      { minScore: 800, discount: 8, message: 'Paddle pro! 🏓' },
      { minScore: 1500, discount: 12, message: 'Block destroyer! 💥' },
      { minScore: 3000, discount: 15, message: 'Arkanoid legend! 🏆' }
    ]
  },
  {
    id: 'fruit_ninja',
    name: '🍎 Fruit Ninja',
    description: 'Slice fruits with your finger, avoid bombs. Fast-paced action game.',
    difficulty: 'Easy',
    controls: 'Mouse/Touch to Slice',
    category: 'Action',
    defaultScoreRanges: [
      { minScore: 25, discount: 3, message: 'Fruit apprentice! 🍎' },
      { minScore: 60, discount: 5, message: 'Fruit slicer! 🔪' },
      { minScore: 120, discount: 8, message: 'Ninja skills! 🥷' },
      { minScore: 200, discount: 12, message: 'Slice master! ⚔️' },
      { minScore: 350, discount: 15, message: 'Fruit legend! 🏆' }
    ]
  }
];

export function GamesTab({ shop }: GamesTabProps) {
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedGameForTest, setSelectedGameForTest] = useState<string>('');
  const [showGameModal, setShowGameModal] = useState(false);
  const [testGameConfig, setTestGameConfig] = useState<any>(null);

  useEffect(() => {
    loadSettings();
  }, [shop]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/game/config/${shop}`);
      const data = await response.json();

      if (data.success && data.gameSettings) {
        setGameSettings(data.gameSettings);
      } else {
        // Set default game settings if none exist
        const defaultGameSpecificSettings: { [key: string]: { discountTiers: any[] } } = {};
        AVAILABLE_GAMES.forEach(game => {
          defaultGameSpecificSettings[game.id] = {
            discountTiers: game.defaultScoreRanges
          };
        });

        setGameSettings({
          isEnabled: true,
          gameType: 'dino',
          minScoreForDiscount: 100,
          maxPlaysPerCustomer: 5,
          maxPlaysPerDay: 10,
          playLimitResetHours: 24,
          gameSpeed: 1,
          difficulty: 'medium',
          testMode: false,
          discountTiers: [
            { minScore: 100, discount: 5, message: 'Great job! You earned 5% off!' },
            { minScore: 300, discount: 10, message: 'Amazing! You earned 10% off!' },
            { minScore: 500, discount: 15, message: 'Excellent! You earned 15% off!' }
          ],
          gameSpecificSettings: defaultGameSpecificSettings
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Set default settings on error
      const defaultGameSpecificSettings: { [key: string]: { discountTiers: any[] } } = {};
      AVAILABLE_GAMES.forEach(game => {
        defaultGameSpecificSettings[game.id] = {
          discountTiers: game.defaultScoreRanges
        };
      });

      setGameSettings({
        isEnabled: true,
        gameType: 'dino',
        minScoreForDiscount: 100,
        maxPlaysPerCustomer: 5,
        maxPlaysPerDay: 10,
        playLimitResetHours: 24,
        gameSpeed: 1,
        difficulty: 'medium',
        testMode: false,
        discountTiers: [
          { minScore: 100, discount: 5, message: 'Great job! You earned 5% off!' },
          { minScore: 300, discount: 10, message: 'Amazing! You earned 10% off!' },
          { minScore: 500, discount: 15, message: 'Excellent! You earned 15% off!' }
        ],
        gameSpecificSettings: defaultGameSpecificSettings
      });
    } finally {
      setLoading(false);
    }
  };

  const saveGameSettings = async () => {
    if (!gameSettings) return;

    try {
      setSaving(true);

      // First load current settings to preserve other settings
      const currentResponse = await fetch(`/api/game/config/${shop}`);
      const currentData = await currentResponse.json();

      const response = await fetch(`/api/dashboard/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shop: shop,
          gameSettings,
          // Preserve existing settings
          widgetSettings: currentData.success ? currentData.widgetSettings : {
            displayMode: 'popup',
            triggerEvent: 'immediate',
            position: 'center',
            showOn: 'all_pages',
            userPercentage: 100,
            testMode: false
          },
          appearance: currentData.success ? currentData.appearance : {
            primaryColor: '#667eea',
            secondaryColor: '#764ba2',
            backgroundTheme: 'default'
          },
          businessRules: currentData.success ? currentData.businessRules : {
            excludeDiscountedProducts: false,
            allowStackingDiscounts: false,
            discountExpiryHours: 24
          }
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save settings');
      }

      // Show success message
      alert('Game settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save game settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const testGame = (gameType: string) => {
    // Get game-specific settings from admin panel or use defaults
    const gameSpecificTiers = gameSettings?.gameSpecificSettings?.[gameType]?.discountTiers;
    const defaultTiers = AVAILABLE_GAMES.find(g => g.id === gameType)?.defaultScoreRanges || [];
    const discountTiers = gameSpecificTiers || defaultTiers;

    const gameConfig = {
      gameType,
      discountTiers: discountTiers,
      maxAttempts: 999,
      minDiscount: Math.min(...discountTiers.map(t => t.discount)),
      maxDiscount: Math.max(...discountTiers.map(t => t.discount)),
      testMode: true
    };

    setTestGameConfig(gameConfig);
    setSelectedGameForTest(gameType);
    setShowGameModal(true);
  };

  const closeGameModal = () => {
    setShowGameModal(false);
    setSelectedGameForTest('');
    setTestGameConfig(null);
  };

  const updateGameSpecificSettings = (gameId: string, tierIndex: number, field: 'minScore' | 'discount', value: number) => {
    if (!gameSettings) return;

    const currentGameSettings = gameSettings.gameSpecificSettings || {};
    const currentGameTiers = currentGameSettings[gameId]?.discountTiers ||
      AVAILABLE_GAMES.find(g => g.id === gameId)?.defaultScoreRanges || [];

    const updatedTiers = [...currentGameTiers];
    if (updatedTiers[tierIndex]) {
      updatedTiers[tierIndex] = {
        ...updatedTiers[tierIndex],
        [field]: value
      };
    }

    setGameSettings({
      ...gameSettings,
      gameSpecificSettings: {
        ...currentGameSettings,
        [gameId]: {
          discountTiers: updatedTiers
        }
      }
    });
  };

  const handleGameComplete = (result: any) => {
    console.log('Game completed with result:', result);
    // Just close the modal for testing
    closeGameModal();
  };

  if (loading) {
    return (
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <Spinner size="large" />
              <Text variant="bodyMd" as="p" color="subdued">
                Loading game settings...
              </Text>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    );
  }

  return (
    <Layout>
      <Layout.Section>
        <Banner status="info">
          <p>
            <strong>🎮 Games Management</strong> - Select and configure which game your customers will play to earn discounts. 
            Test any game directly in the admin panel before making it live.
          </p>
        </Banner>
      </Layout.Section>

      {/* Current Game Selection */}
      <Layout.Section>
        <Card>
          <div style={{ padding: '1.5rem' }}>
            <Stack distribution="equalSpacing" alignment="center">
              <div>
                <Text variant="headingMd" as="h3">Current Game Selection</Text>
                <Text variant="bodyMd" as="p" color="subdued">
                  Choose which game your customers will play
                </Text>
              </div>
              <Badge status={gameSettings?.isEnabled ? 'success' : 'critical'}>
                {gameSettings?.isEnabled ? 'Active' : 'Disabled'}
              </Badge>
            </Stack>

            <div style={{ marginTop: '1.5rem' }}>
              <Select
                label="Selected Game"
                options={AVAILABLE_GAMES.map(game => ({
                  label: game.name,
                  value: game.id
                }))}
                value={gameSettings?.gameType || ''}
                onChange={(value) => {
                  if (gameSettings) {
                    setGameSettings({
                      ...gameSettings,
                      gameType: value as any
                    });
                  }
                }}
                helpText="This is the game your customers will play to earn discount codes"
              />
            </div>

            <div style={{ marginTop: '1rem' }}>
              <Stack spacing="tight">
                <Button
                  primary
                  onClick={saveGameSettings}
                  loading={saving}
                  disabled={!gameSettings}
                >
                  Save Game Selection
                </Button>
                {gameSettings?.gameType && (
                  <Button
                    onClick={() => testGame(gameSettings.gameType)}
                  >
                    🎮 Test Current Game
                  </Button>
                )}
              </Stack>
            </div>
          </div>
        </Card>
      </Layout.Section>

      {/* Available Games Grid */}
      <Layout.Section>
        <Card>
          <div style={{ padding: '1.5rem' }}>
            <Text variant="headingMd" as="h3" marginBottom="4">
              Available Games
            </Text>
            <Text variant="bodyMd" as="p" color="subdued" marginBottom="6">
              Test any game to see how it plays before selecting it for your customers
            </Text>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
              marginTop: '1.5rem'
            }}>
              {AVAILABLE_GAMES.map((game) => (
                <Card key={game.id}>
                  <div style={{ padding: '1.5rem' }}>
                    <Stack vertical spacing="tight">
                      <Stack distribution="equalSpacing" alignment="center">
                        <Text variant="headingSm" as="h4">{game.name}</Text>
                        <Badge status={gameSettings?.gameType === game.id ? 'success' : 'info'}>
                          {gameSettings?.gameType === game.id ? 'Selected' : game.category}
                        </Badge>
                      </Stack>
                      
                      <Text variant="bodyMd" as="p" color="subdued">
                        {game.description}
                      </Text>
                      
                      <Stack spacing="extraTight">
                        <Text variant="bodySm" as="p">
                          <strong>Difficulty:</strong> {game.difficulty}
                        </Text>
                        <Text variant="bodySm" as="p">
                          <strong>Controls:</strong> {game.controls}
                        </Text>
                      </Stack>

                      {/* Score Settings for this game */}
                      <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
                        <Text variant="headingXs" as="h5" style={{ marginBottom: '0.5rem' }}>
                          Score & Discount Settings
                        </Text>
                        {game.defaultScoreRanges.map((range, index) => {
                          const currentSettings = gameSettings?.gameSpecificSettings?.[game.id]?.discountTiers || game.defaultScoreRanges;
                          const currentRange = currentSettings[index] || range;

                          return (
                            <div key={index} style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <input
                                type="number"
                                placeholder="Min Score"
                                value={currentRange.minScore}
                                onChange={(e) => {
                                  const newScore = parseInt(e.target.value) || 0;
                                  updateGameSpecificSettings(game.id, index, 'minScore', newScore);
                                }}
                                style={{ width: '80px', padding: '4px', fontSize: '12px' }}
                              />
                              <span style={{ fontSize: '12px' }}>pts =</span>
                              <input
                                type="number"
                                placeholder="Discount %"
                                value={currentRange.discount}
                                onChange={(e) => {
                                  const newDiscount = parseInt(e.target.value) || 0;
                                  updateGameSpecificSettings(game.id, index, 'discount', newDiscount);
                                }}
                                style={{ width: '60px', padding: '4px', fontSize: '12px' }}
                              />
                              <span style={{ fontSize: '12px' }}>% off</span>
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ marginTop: '1rem' }}>
                        <Stack spacing="tight">
                          <Button
                            onClick={() => testGame(game.id)}
                            size="slim"
                          >
                            🎮 Test Game
                          </Button>
                          {gameSettings?.gameType !== game.id && (
                            <Button
                              primary
                              size="slim"
                              onClick={() => {
                                if (gameSettings) {
                                  setGameSettings({
                                    ...gameSettings,
                                    gameType: game.id as any
                                  });
                                }
                              }}
                            >
                              Select This Game
                            </Button>
                          )}
                        </Stack>
                      </div>
                    </Stack>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Card>
      </Layout.Section>

      {/* Game Test Popup - Same dimensions as frontend iframe */}
      {showGameModal && testGameConfig && (
        <Game
          shopDomain={shop}
          onGameComplete={handleGameComplete}
          onClose={closeGameModal}
          gameConfig={testGameConfig}
          adminTest={true}
        />
      )}
    </Layout>
  );
}
