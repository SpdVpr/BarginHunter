import React, { useState, useEffect } from 'react';
import EnhancedGameEngine from './EnhancedGameEngine';
import FlappyBirdEngine from './FlappyBirdEngine';
import TetrisEngine from './TetrisEngine';
import SnakeEngine from './SnakeEngine';
import SpaceInvadersEngine from './SpaceInvadersEngine';
import ArkanoidEngine from './ArkanoidEngine';
import FruitNinjaEngine from './FruitNinjaEngine';
import GameIntroScreen from './GameIntroScreen';
import GameOverScreen from './GameOverScreen';

interface GameProps {
  shopDomain: string;
  onGameComplete: (result: GameResult) => void;
  onClose: () => void;
  gameConfig?: any; // Optional: if provided, skip API loading
  adminTest?: boolean; // Optional: for admin testing with iframe dimensions
}

interface GameResult {
  score: number;
  discountEarned: number;
  discountCode?: string;
  gameData: any;
  isPlayLimitReached?: boolean; // Special flag for play limit reached
  playLimitInfo?: {
    playsUsed: number;
    maxPlays: number;
    nextResetTime?: string;
    resetHours?: number;
  };
}

const DEFAULT_DISCOUNT_TIERS = [
  { minScore: 0, discount: 0, message: "Keep hunting! 🔍" },
  { minScore: 150, discount: 5, message: "Nice start! 🎯" },
  { minScore: 300, discount: 10, message: "Getting warmer! 🔥" },
  { minScore: 500, discount: 15, message: "Bargain expert! 💡" },
  { minScore: 750, discount: 20, message: "Sale master! 👑" },
  { minScore: 1000, discount: 25, message: "LEGENDARY HUNTER! 🏆" }
];

export default function Game({ shopDomain, onGameComplete, onClose, gameConfig: providedGameConfig, adminTest = false }: GameProps) {
  const [gameState, setGameState] = useState<'loading' | 'intro' | 'playing' | 'gameOver'>('loading');
  const [gameConfig, setGameConfig] = useState<any>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [currentScore, setCurrentScore] = useState(0);
  const [sessionId, setSessionId] = useState<string>('');
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [appearanceSettings, setAppearanceSettings] = useState<any>({
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    backgroundTheme: 'default'
  });

  // Calculate container style based on admin test mode and appearance settings
  const getContainerStyle = () => {
    // Get background from appearance settings with fallback
    const getBackground = () => {
      // Always prefer appearanceSettings if they have custom values, otherwise use gameConfig.appearance
      let settings = { ...appearanceSettings };

      // If gameConfig has appearance settings and appearanceSettings are still default, use gameConfig
      if (gameConfig?.appearance &&
          appearanceSettings.primaryColor === '#667eea' &&
          appearanceSettings.secondaryColor === '#764ba2') {
        settings = gameConfig.appearance;
      }

      console.log('🎨 getBackground - appearanceSettings:', appearanceSettings);
      console.log('🎨 getBackground - gameConfig.appearance:', gameConfig?.appearance);
      console.log('🎨 getBackground - final settings:', settings);

      const { primaryColor = '#667eea', secondaryColor = '#764ba2', backgroundTheme = 'default' } = settings;

      switch (backgroundTheme) {
        case 'dark':
          return 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)';
        case 'light':
          return 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)';
        case 'custom':
          return `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;
        default:
          return `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;
      }
    };

    if (adminTest) {
      // Use iframe dimensions for admin testing
      const isMobile = window.innerWidth < 768;
      return {
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        width: isMobile ? '370px' : '540px',
        height: isMobile ? '600px' : '700px',
        background: getBackground(),
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        overflow: 'hidden',
        boxSizing: 'border-box' as const,
        zIndex: 9999,
        borderRadius: '12px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
      };
    } else {
      // Fullscreen for normal widget
      return {
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        width: '100vw',
        height: '100vh',
        background: getBackground(),
        position: 'fixed' as const,
        top: 0,
        left: 0,
        overflow: 'hidden',
        boxSizing: 'border-box' as const,
        zIndex: 9999
      };
    }
  };

  // Load appearance settings immediately for loading screen
  useEffect(() => {
    const loadAppearanceSettings = async () => {
      try {
        const response = await fetch(`/api/game/config/${shopDomain}?t=${Date.now()}`);
        if (response.ok) {
          const config = await response.json();
          if (config.appearance) {
            console.log('🎨 Loading appearance settings:', config.appearance);
            setAppearanceSettings(config.appearance);
          } else {
            console.log('🎨 No appearance settings found in config');
          }
        }
      } catch (error) {
        console.error('Failed to load appearance settings:', error);
      }
    };

    if (shopDomain) {
      loadAppearanceSettings();
    }
  }, [shopDomain]);

  // Load game configuration
  useEffect(() => {
    const loadGameConfig = async () => {
      // If gameConfig is provided as prop, use it directly (for admin testing)
      if (providedGameConfig) {
        setGameConfig(providedGameConfig);
        // Always show intro screen first
        setGameState('intro');
        return;
      }

      try {
        // Add cache busting to ensure fresh config
        const response = await fetch(`/api/game/config/${shopDomain}?t=${Date.now()}`);
        if (response.ok) {
          const config = await response.json();
          // Extract game settings from nested structure
          setGameConfig({
            discountTiers: config.gameSettings?.discountTiers || DEFAULT_DISCOUNT_TIERS,
            gameType: config.gameSettings?.gameType || 'dino',
            gameSpeed: config.gameSettings?.gameSpeed || 1,
            difficulty: config.gameSettings?.difficulty || 'medium',
            maxAttempts: config.gameSettings?.maxPlaysPerCustomer || 3,
            maxPlaysPerDay: config.gameSettings?.maxPlaysPerDay || 10,
            minDiscount: Math.min(...(config.gameSettings?.discountTiers || DEFAULT_DISCOUNT_TIERS).map((t: any) => t.discount).filter((d: number) => d > 0)),
            maxDiscount: Math.max(...(config.gameSettings?.discountTiers || DEFAULT_DISCOUNT_TIERS).map((t: any) => t.discount)),
            shopName: config.shopName || shopDomain,
            // Include appearance settings - prefer loaded appearanceSettings over defaults
            appearance: config.appearance || appearanceSettings
          });
        } else {
          // Use default config
          setGameConfig({
            discountTiers: DEFAULT_DISCOUNT_TIERS,
            gameType: 'dino',
            gameSpeed: 1,
            difficulty: 'medium',
            maxAttempts: 3,
            maxPlaysPerDay: 10,
            minDiscount: 5,
            maxDiscount: 25,
            shopName: shopDomain,
            appearance: appearanceSettings
          });
        }
      } catch (error) {
        console.error('Failed to load game config:', error);
        // Use default config
        setGameConfig({
          discountTiers: DEFAULT_DISCOUNT_TIERS,
          gameType: 'dino',
          gameSpeed: 1,
          difficulty: 'medium',
          maxAttempts: 3,
          minDiscount: 5,
          maxDiscount: 25,
          shopName: shopDomain,
          appearance: appearanceSettings
        });
      } finally {
        // Always show intro screen first
        setGameState('intro');
      }
    };

    loadGameConfig();
  }, [shopDomain]);

  // Start game session function
  const startGameSession = async () => {
    try {
      console.log('🎮 Starting game session for shop:', shopDomain);

      const response = await fetch('/api/game/start-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopDomain,
          customerData: {
            // Try to get customer data from Shopify if available
            id: (window as any).ShopifyAnalytics?.meta?.page?.customerId || undefined,
            email: undefined // Will be filled by IP address fallback
          },
          source: 'popup',
          referrer: window.location.href
        }),
      });

      const data = await response.json();
      console.log('🎮 Start session response:', data);

      if (response.ok && data.success) {
        setSessionId(data.sessionId);
        console.log('🎮 Real session created:', data.sessionId);
      } else {
        console.error('🎮 Failed to start game session:', data.error);

        // Check if this is a discount code limit error - DO NOT bypass with temp session
        if (!data.canPlay && (data.reason === 'code_limit' || data.reason === 'ip_limit' || data.reason === 'daily_limit' || (data.error && data.error.includes('limit')))) {
          console.log('🎮 Discount code limit reached - blocking game start');
          console.log('🎮 Discount code limit info received:', data);
          console.log('🎮 codesUsed:', data.codesUsed, 'maxCodes:', data.maxCodes);
          console.log('🎮 nextResetTime:', data.nextResetTime, 'resetHours:', data.resetHours);

          // Show discount code limit message to user
          setGameState('gameOver');
          setGameResult({
            score: 0,
            discountEarned: 0,
            discountCode: undefined,
            isPlayLimitReached: true, // Special flag for discount code limit
            playLimitInfo: {
              playsUsed: data.codesUsed || data.playsUsed || 0, // Use new codesUsed field, fallback to old
              maxPlays: data.maxCodes || data.maxPlays || 1, // Use new maxCodes field, fallback to old
              nextResetTime: data.nextResetTime,
              resetHours: data.resetHours || 24
            },
            gameData: {
              duration: 0,
              objectsCollected: 0,
              obstaclesHit: 0,
              maxCombo: 0,
              distanceTraveled: 0
            }
          });
          return; // Don't create temp session for play limits!
        }

        // NO MORE TEMP SESSIONS - show error message instead
        console.error('🎮 API error - showing error message');
        setGameState('gameOver');
        setGameResult({
          score: 0,
          discountEarned: 0,
          discountCode: undefined,
          isPlayLimitReached: false,
          message: 'Unable to start game. Please try again later.',
          gameData: {
            duration: 0,
            objectsCollected: 0,
            obstaclesHit: 0,
            maxCombo: 0,
            distanceTraveled: 0
          }
        });
        return;
      }
    } catch (error) {
      console.error('🎮 Network error starting game session:', error);
      // NO MORE TEMP SESSIONS - show error message instead
      setGameState('gameOver');
      setGameResult({
        score: 0,
        discountEarned: 0,
        discountCode: undefined,
        isPlayLimitReached: false,
        message: 'Network error. Please check your connection and try again.',
        gameData: {
          duration: 0,
          objectsCollected: 0,
          obstaclesHit: 0,
          maxCombo: 0,
          distanceTraveled: 0
        }
      });
      return;
    }
  };

  // Auto-start session when entering playing state
  useEffect(() => {
    if (gameState === 'playing') {
      startGameSession();
    }
  }, [gameState, shopDomain]);

  const handleGameEnd = async (score: number, gameData: any) => {
    try {
      console.log('🎮 Finishing game session:', { sessionId, score, gameData });
      console.log('🎮 Current sessionId value:', sessionId);
      console.log('🎮 SessionId type:', typeof sessionId);

      // Increment attempts used
      setAttemptsUsed(prev => prev + 1);

      // Calculate discount earned
      const discountTier = gameConfig.discountTiers
        .slice()
        .reverse()
        .find((tier: any) => score >= tier.minScore);

      const discountEarned = discountTier?.discount || 0;

      // Prepare game data in the expected format
      const formattedGameData = {
        duration: gameData?.duration || 0,
        objectsCollected: gameData?.objectsCollected || 0,
        obstaclesHit: gameData?.obstaclesHit || 0,
        maxCombo: gameData?.maxCombo || 0,
        distanceTraveled: gameData?.distanceTraveled || 0
      };

      // Check if sessionId exists
      if (!sessionId) {
        console.error('❌ No sessionId available for finish-session API call');
        console.log('🎮 Creating fallback sessionId for API call');
        // Create a fallback sessionId
        const fallbackSessionId = `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log('🎮 Using fallback sessionId:', fallbackSessionId);
      }

      const requestBody = {
        sessionId: sessionId || `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        finalScore: score,
        gameData: formattedGameData,
        playerEmail: undefined // Optional
      };

      console.log('🎮 Sending finish-session request:', JSON.stringify(requestBody, null, 2));

      // Finish game session
      const response = await fetch('/api/game/finish-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      let discountCode: string | undefined;

      const data = await response.json();
      console.log('🎮 Finish session response status:', response.status);
      console.log('🎮 Finish session response data:', JSON.stringify(data, null, 2));

      if (response.ok && data.success) {
        discountCode = data.discountCode;
        console.log('✅ Discount code received from API:', discountCode);
      } else {
        console.error('❌ Failed to finish game session - Status:', response.status);
        console.error('❌ Error data:', JSON.stringify(data, null, 2));

        // Generate a mock discount code for demo
        if (discountEarned > 0) {
          discountCode = `HUNTER${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
          console.log('🎯 Generated fallback discount code:', discountCode);
        }
      }

      const result: GameResult = {
        score,
        discountEarned,
        discountCode,
        gameData
      };

      console.log('🎮 Final game result:', JSON.stringify(result, null, 2));
      console.log('🎮 Setting game state to gameOver with result');

      setGameResult(result);
      setGameState('gameOver');
      onGameComplete(result);
    } catch (error) {
      console.error('Failed to finish game session:', error);
      
      // Fallback result
      const discountTier = gameConfig.discountTiers
        .slice()
        .reverse()
        .find((tier: any) => score >= tier.minScore);
      
      const result: GameResult = {
        score,
        discountEarned: discountTier?.discount || 0,
        discountCode: discountTier?.discount > 0 ? `HUNTER${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}` : undefined,
        gameData
      };

      setGameResult(result);
      setGameState('gameOver');
      onGameComplete(result);
    }
  };

  const handlePlayAgain = () => {
    setGameResult(null);
    setCurrentScore(0);
    setGameState('loading');
    
    // Restart the game
    setTimeout(() => {
      setGameState('playing');
    }, 500);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      console.log('Discount code copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy discount code:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
  };

  if (gameState === 'loading') {
    return (
      <div style={{
        ...getContainerStyle(),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div className="loading-spinner"></div>
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          Loading Bargain Hunter...
        </p>
      </div>
    );
  }

  if (gameState === 'intro') {
    return (
      <GameIntroScreen
        gameConfig={{...gameConfig, shopName: shopDomain}}
        onStartGame={() => {
          setGameState('playing');
          // Start game session immediately
          startGameSession();
        }}
        onClose={onClose}
        attemptsUsed={attemptsUsed}
      />
    );
  }



  if (gameState === 'gameOver' && gameResult) {
    return (
      <GameOverScreen
        finalScore={gameResult.score}
        discountEarned={gameResult.discountEarned}
        discountCode={gameResult.discountCode}
        discountTiers={gameConfig.discountTiers}
        onPlayAgain={handlePlayAgain}
        onClose={onClose}
        onCopyCode={handleCopyCode}
        isPlayLimitReached={gameResult.isPlayLimitReached}
        playLimitInfo={gameResult.playLimitInfo}
      />
    );
  }

  return (
    <div style={getContainerStyle()}>
      {/* Score display removed - EnhancedGameEngine draws its own score */}

      {gameConfig.gameType === 'flappy_bird' ? (
        <FlappyBirdEngine
          onGameEnd={handleGameEnd}
          onScoreUpdate={setCurrentScore}
          gameConfig={gameConfig}
          onShowIntro={() => setGameState('intro')}
          adminTest={adminTest}
          onClose={adminTest ? onClose : undefined}
        />
      ) : gameConfig.gameType === 'tetris' ? (
        <TetrisEngine
          onGameEnd={handleGameEnd}
          onScoreUpdate={setCurrentScore}
          gameConfig={gameConfig}
          onShowIntro={() => setGameState('intro')}
          adminTest={adminTest}
          onClose={adminTest ? onClose : undefined}
        />
      ) : gameConfig.gameType === 'snake' ? (
        <SnakeEngine
          onGameEnd={handleGameEnd}
          onScoreUpdate={setCurrentScore}
          gameConfig={gameConfig}
          onShowIntro={() => setGameState('intro')}
          adminTest={adminTest}
          onClose={adminTest ? onClose : undefined}
        />
      ) : gameConfig.gameType === 'space_invaders' ? (
        <SpaceInvadersEngine
          onGameEnd={handleGameEnd}
          onScoreUpdate={setCurrentScore}
          gameConfig={gameConfig}
          onShowIntro={() => setGameState('intro')}
          adminTest={adminTest}
          onClose={adminTest ? onClose : undefined}
        />
      ) : gameConfig.gameType === 'arkanoid' ? (
        <ArkanoidEngine
          onGameEnd={handleGameEnd}
          onScoreUpdate={setCurrentScore}
          gameConfig={gameConfig}
          onShowIntro={() => setGameState('intro')}
          adminTest={adminTest}
          onClose={adminTest ? onClose : undefined}
        />
      ) : gameConfig.gameType === 'fruit_ninja' ? (
        <FruitNinjaEngine
          onGameEnd={handleGameEnd}
          onScoreUpdate={setCurrentScore}
          gameConfig={gameConfig}
          onShowIntro={() => setGameState('intro')}
          adminTest={adminTest}
          onClose={adminTest ? onClose : undefined}
        />
      ) : (
        <EnhancedGameEngine
          onGameEnd={handleGameEnd}
          onScoreUpdate={setCurrentScore}
          gameConfig={gameConfig}
          onShowIntro={() => setGameState('intro')}
          adminTest={adminTest}
          onClose={adminTest ? onClose : undefined}
        />
      )}
    </div>
  );
}
