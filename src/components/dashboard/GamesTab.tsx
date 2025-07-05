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
  Modal,
  Frame,
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
}

const AVAILABLE_GAMES = [
  {
    id: 'dino',
    name: '🦕 Chrome Dino Runner',
    description: 'Classic endless runner inspired by Chrome\'s offline game. Jump over obstacles to score points.',
    difficulty: 'Medium',
    controls: 'Spacebar/Click to Jump',
    category: 'Arcade'
  },
  {
    id: 'flappy_bird',
    name: '🐦 Flappy Bird',
    description: 'Navigate through pipes by tapping to flap. Timing is everything!',
    difficulty: 'Hard',
    controls: 'Spacebar/Click to Flap',
    category: 'Arcade'
  },
  {
    id: 'tetris',
    name: '🧩 Tetris',
    description: 'Classic block-stacking puzzle game. Clear lines to score points.',
    difficulty: 'Medium',
    controls: 'Arrow Keys/Touch',
    category: 'Puzzle'
  },
  {
    id: 'snake',
    name: '🐍 Snake',
    description: 'Grow your snake by eating food, avoid walls and yourself.',
    difficulty: 'Easy',
    controls: 'Arrow Keys/Swipe',
    category: 'Arcade'
  },
  {
    id: 'space_invaders',
    name: '🚀 Space Invaders',
    description: 'Defend Earth from alien invasion. Shoot enemies to score points.',
    difficulty: 'Medium',
    controls: 'Arrow Keys + Spacebar/Touch',
    category: 'Arcade'
  },
  {
    id: 'arkanoid',
    name: '🎯 Arkanoid',
    description: 'Break all bricks with your paddle and ball. Classic brick breaker game.',
    difficulty: 'Medium',
    controls: 'Mouse/Touch to Move Paddle',
    category: 'Arcade'
  },
  {
    id: 'fruit_ninja',
    name: '🍎 Fruit Ninja',
    description: 'Slice fruits with your finger, avoid bombs. Fast-paced action game.',
    difficulty: 'Easy',
    controls: 'Mouse/Touch to Slice',
    category: 'Action'
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
      const response = await fetch(`/api/dashboard/settings?shop=${shop}`);
      const data = await response.json();

      if (data.success && data.settings.gameSettings) {
        setGameSettings(data.settings.gameSettings);
      } else {
        // Set default game settings if none exist
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
          ]
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Set default settings on error
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
        ]
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
      const currentResponse = await fetch(`/api/dashboard/settings?shop=${shop}`);
      const currentData = await currentResponse.json();

      const response = await fetch(`/api/dashboard/settings?shop=${shop}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameSettings,
          // Preserve existing settings
          widgetSettings: currentData.success ? currentData.settings.widgetSettings : {},
          targetingSettings: currentData.success ? currentData.settings.targetingSettings : {}
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
    const gameConfig = {
      gameType,
      discountTiers: [
        { minScore: 100, discount: 5, message: "Great job! 5% off!" },
        { minScore: 500, discount: 10, message: "Awesome! 10% off!" },
        { minScore: 1000, discount: 15, message: "Amazing! 15% off!" }
      ],
      maxAttempts: 999,
      minDiscount: 5,
      maxDiscount: 15,
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

      {/* Game Test Modal */}
      {showGameModal && testGameConfig && (
        <Modal
          open={showGameModal}
          onClose={closeGameModal}
          title={`Testing: ${AVAILABLE_GAMES.find(g => g.id === selectedGameForTest)?.name}`}
        >
          <Modal.Section>
            <div style={{
              width: '600px',
              height: '450px',
              position: 'relative',
              margin: '0 auto',
              border: '2px solid #e1e3e5',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <Game
                shopDomain={shop}
                onGameComplete={handleGameComplete}
                onClose={closeGameModal}
                gameConfig={testGameConfig}
              />
            </div>
          </Modal.Section>
        </Modal>
      )}
    </Layout>
  );
}
