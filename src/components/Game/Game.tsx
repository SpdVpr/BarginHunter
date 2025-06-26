import React, { useState, useEffect } from 'react';
import SimpleGameEngine from './SimpleGameEngine';
import GameOverScreen from './GameOverScreen';

interface GameProps {
  shopDomain: string;
  onGameComplete: (result: GameResult) => void;
  onClose: () => void;
}

interface GameResult {
  score: number;
  discountEarned: number;
  discountCode?: string;
  gameData: any;
}

const DEFAULT_DISCOUNT_TIERS = [
  { minScore: 0, discount: 0, message: "Keep hunting! 🔍" },
  { minScore: 150, discount: 5, message: "Nice start! 🎯" },
  { minScore: 300, discount: 10, message: "Getting warmer! 🔥" },
  { minScore: 500, discount: 15, message: "Bargain expert! 💡" },
  { minScore: 750, discount: 20, message: "Sale master! 👑" },
  { minScore: 1000, discount: 25, message: "LEGENDARY HUNTER! 🏆" }
];

export default function Game({ shopDomain, onGameComplete, onClose }: GameProps) {
  const [gameState, setGameState] = useState<'loading' | 'playing' | 'gameOver'>('loading');
  const [gameConfig, setGameConfig] = useState<any>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [currentScore, setCurrentScore] = useState(0);
  const [sessionId, setSessionId] = useState<string>('');

  // Load game configuration
  useEffect(() => {
    const loadGameConfig = async () => {
      try {
        // TODO: Replace with actual API call
        const response = await fetch(`/api/game/config/${shopDomain}`);
        if (response.ok) {
          const config = await response.json();
          // Extract game settings from nested structure
          setGameConfig({
            discountTiers: config.gameSettings?.discountTiers || DEFAULT_DISCOUNT_TIERS,
            gameSpeed: config.gameSettings?.gameSpeed || 1,
            difficulty: config.gameSettings?.difficulty || 'medium',
            minScoreForDiscount: config.gameSettings?.minScoreForDiscount || 150,
            maxPlaysPerCustomer: config.gameSettings?.maxPlaysPerCustomer || 3,
            maxPlaysPerDay: config.gameSettings?.maxPlaysPerDay || 10
          });
        } else {
          // Use default config
          setGameConfig({
            discountTiers: DEFAULT_DISCOUNT_TIERS,
            gameSpeed: 1,
            difficulty: 'medium',
            minScoreForDiscount: 150,
            maxPlaysPerCustomer: 3,
            maxPlaysPerDay: 10
          });
        }
      } catch (error) {
        console.error('Failed to load game config:', error);
        // Use default config
        setGameConfig({
          discountTiers: DEFAULT_DISCOUNT_TIERS,
          gameSpeed: 1,
          difficulty: 'medium'
        });
      } finally {
        setGameState('playing');
      }
    };

    loadGameConfig();
  }, [shopDomain]);

  // Start game session
  useEffect(() => {
    const startGameSession = async () => {
      try {
        const response = await fetch('/api/game/start-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shopDomain,
            source: 'popup', // TODO: Make this dynamic
            referrer: window.location.href
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setSessionId(data.sessionId);
        }
      } catch (error) {
        console.error('Failed to start game session:', error);
        // Generate a temporary session ID
        setSessionId(`temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
      }
    };

    if (gameState === 'playing') {
      startGameSession();
    }
  }, [gameState, shopDomain]);

  const handleGameEnd = async (score: number, gameData: any) => {
    try {
      // Calculate discount earned
      const discountTier = gameConfig.discountTiers
        .slice()
        .reverse()
        .find((tier: any) => score >= tier.minScore);
      
      const discountEarned = discountTier?.discount || 0;

      // Finish game session
      const response = await fetch('/api/game/finish-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          finalScore: score,
          gameData,
        }),
      });

      let discountCode: string | undefined;
      
      if (response.ok) {
        const data = await response.json();
        discountCode = data.discountCode;
      } else {
        // Generate a mock discount code for demo
        if (discountEarned > 0) {
          discountCode = `HUNTER${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        }
      }

      const result: GameResult = {
        score,
        discountEarned,
        discountCode,
        gameData
      };

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
      <div className="game-container">
        <div className="loading-spinner"></div>
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          Loading Bargain Hunter...
        </p>
      </div>
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
      />
    );
  }

  return (
    <div>
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '20px',
        padding: '15px',
        background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
        color: 'white',
        borderRadius: '8px'
      }}>
        <h2 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
          🎮 Bargain Hunter
        </h2>
        <p style={{ margin: '0', fontSize: '14px' }}>
          Collect discount tags and avoid obstacles to earn your discount!
        </p>
      </div>

      <SimpleGameEngine
        onGameEnd={handleGameEnd}
        onScoreUpdate={setCurrentScore}
        discountTiers={gameConfig.discountTiers}
        gameConfig={gameConfig}
      />

      <div style={{ 
        marginTop: '15px', 
        padding: '10px',
        background: '#f8f9fa',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#666'
      }}>
        <strong>Current Score:</strong> {currentScore} | 
        <strong> Next Reward:</strong> {
          gameConfig.discountTiers.find((tier: any) => currentScore < tier.minScore)?.discount || 'Max'
        }% OFF
      </div>
    </div>
  );
}
