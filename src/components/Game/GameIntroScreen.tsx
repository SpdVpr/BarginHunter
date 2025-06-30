/** @jsxImportSource react */
import React, { useState, useEffect } from 'react';

interface GameConfig {
  discountTiers: Array<{
    minScore: number;
    discount: number;
  }>;
  maxAttempts: number;
  minDiscount: number;
  maxDiscount: number;
  shopName?: string;
  gameType?: 'dino' | 'flappy_bird' | 'tetris' | 'snake' | 'space_invaders';
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
  customCSS: string;
}

interface GameIntroScreenProps {
  gameConfig: GameConfig;
  onStartGame: () => void;
  onClose: () => void;
  attemptsUsed: number;
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

export default function GameIntroScreen({
  gameConfig,
  onStartGame,
  onClose,
  attemptsUsed
}: GameIntroScreenProps) {
  const [introSettings, setIntroSettings] = useState<IntroSettings>(DEFAULT_INTRO_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const remainingAttempts = gameConfig.maxAttempts - attemptsUsed;
  const minDiscount = gameConfig.minDiscount || 5;
  const maxDiscount = gameConfig.maxDiscount || 20;
  const isFlappyBird = gameConfig.gameType === 'flappy_bird';
  const isTetris = gameConfig.gameType === 'tetris';
  const isSnake = gameConfig.gameType === 'snake';
  const isSpaceInvaders = gameConfig.gameType === 'space_invaders';

  // Get the lowest score requirement for any discount
  const lowestScoreForDiscount = gameConfig.discountTiers.length > 0
    ? Math.min(...gameConfig.discountTiers.map(tier => tier.minScore))
    : 100;

  // Load intro settings
  useEffect(() => {
    const loadIntroSettings = async () => {
      try {
        const shopDomain = gameConfig.shopName || window.location.hostname;
        const response = await fetch(`/api/intro-settings?shop=${shopDomain}`);
        if (response.ok) {
          const settings = await response.json();
          setIntroSettings({ ...DEFAULT_INTRO_SETTINGS, ...settings });
        }
      } catch (error) {
        console.error('Failed to load intro settings:', error);
      } finally {
        setSettingsLoaded(true);
      }
    };

    loadIntroSettings();
  }, [gameConfig.shopName]);

  // Get dynamic title based on game type and settings
  const getGameTitle = () => {
    if (!introSettings.showEmojis) {
      return introSettings.title;
    }

    if (isFlappyBird) return `🐦 ${introSettings.title.replace('Bargain Hunter', 'Flappy Hunter')}`;
    if (isTetris) return `🧩 ${introSettings.title.replace('Bargain Hunter', 'Tetris Hunter')}`;
    if (isSnake) return `🐍 ${introSettings.title.replace('Bargain Hunter', 'Snake Hunter')}`;
    if (isSpaceInvaders) return `🚀 ${introSettings.title.replace('Bargain Hunter', 'Space Hunter')}`;
    return `🦕 ${introSettings.title}`;
  };

  const getGameSubtitle = () => {
    if (isFlappyBird) return 'Fly & earn discounts!';
    if (isTetris) return 'Stack & earn discounts!';
    if (isSnake) return 'Eat & earn discounts!';
    if (isSpaceInvaders) return 'Destroy & earn discounts!';
    return introSettings.subtitle;
  };

  const getDiscountText = () => {
    return introSettings.discountText
      .replace('{minDiscount}', minDiscount.toString())
      .replace('{maxDiscount}', maxDiscount.toString());
  };

  return (
    <div className="game-intro-container" style={{
      background: `linear-gradient(135deg, ${introSettings.backgroundColor} 0%, ${introSettings.backgroundColor}dd 100%)`,
      color: introSettings.textColor,
      borderRadius: `${introSettings.borderRadius}px`,
      textAlign: 'center',
      boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
      position: 'relative',
      width: '100%',
      maxWidth: '100%',
      margin: '0',
      padding: `${Math.max(4, introSettings.padding)}px`,
      minHeight: 'fit-content',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      maxHeight: '95vh',
      overflow: 'hidden'
    }}>
      {/* Custom CSS */}
      {introSettings.customCSS && (
        <style dangerouslySetInnerHTML={{ __html: introSettings.customCSS }} />
      )}

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: `${Math.max(8, introSettings.padding - 4)}px`,
          right: `${Math.max(8, introSettings.padding - 4)}px`,
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: introSettings.textColor,
          fontSize: '20px',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
        }}
      >
        ×
      </button>

      {/* Game title - CUSTOMIZABLE */}
      <div className="game-title" style={{ marginBottom: `${Math.max(4, introSettings.padding / 2)}px` }}>
        <h1 className="game-title-text" style={{
          margin: '0 0 4px 0',
          textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
          fontSize: 'clamp(18px, 5vw, 28px)',
          lineHeight: '1.1',
          color: introSettings.textColor
        }}>
          {getGameTitle()}
        </h1>
        <p className="game-subtitle" style={{
          fontSize: 'clamp(12px, 3vw, 14px)',
          margin: '0',
          opacity: 0.9,
          lineHeight: '1.2',
          color: introSettings.textColor
        }}>
          {getGameSubtitle()}
        </p>
      </div>




      {/* Discount information - CUSTOMIZABLE */}
      <div className="discount-section" style={{
        background: 'rgba(255,255,255,0.15)',
        borderRadius: `${Math.max(4, introSettings.borderRadius / 2)}px`,
        padding: `${Math.max(4, introSettings.padding / 2)}px`,
        marginBottom: `${Math.max(4, introSettings.padding / 2)}px`,
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <h2 className="discount-title" style={{
          fontSize: 'clamp(14px, 4vw, 18px)',
          margin: '0',
          color: '#FFD700',
          textAlign: 'center',
          lineHeight: '1.2'
        }}>
          {introSettings.showEmojis ? '💰 ' : ''}{getDiscountText()}
        </h2>
      </div>


      {/* Action buttons - CUSTOMIZABLE */}
      <div className="action-buttons" style={{
        display: 'flex',
        flexDirection: 'row',
        gap: `${Math.max(4, introSettings.padding / 2)}px`,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
      }}>
        <button
          onClick={onStartGame}
          className="start-button"
          style={{
            background: `linear-gradient(45deg, ${introSettings.buttonColor}, ${introSettings.buttonColor}dd)`,
            color: introSettings.buttonTextColor,
            border: 'none',
            padding: `${Math.max(8, introSettings.padding / 2)}px ${Math.max(12, introSettings.padding)}px`,
            borderRadius: `${Math.max(4, introSettings.borderRadius / 2)}px`,
            fontSize: 'clamp(14px, 3.5vw, 16px)',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            transition: 'transform 0.2s ease',
            flex: '1',
            maxWidth: '120px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {introSettings.showEmojis ? '🚀 ' : ''}Start
        </button>

        <button
          onClick={onClose}
          className="close-button"
          style={{
            background: 'rgba(255,255,255,0.2)',
            color: introSettings.textColor,
            border: '1px solid rgba(255,255,255,0.3)',
            padding: `${Math.max(8, introSettings.padding / 2)}px ${Math.max(12, introSettings.padding)}px`,
            borderRadius: `${Math.max(4, introSettings.borderRadius / 2)}px`,
            fontSize: 'clamp(14px, 3.5vw, 16px)',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background 0.2s ease',
            flex: '1',
            maxWidth: '120px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
          }}
        >
          {introSettings.showEmojis ? '❌ ' : ''}Close
        </button>
      </div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }

        @keyframes flap {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(-10deg);
          }
        }

        @keyframes slideLeft {
          0% {
            transform: translateX(100px);
          }
          100% {
            transform: translateX(-100px);
          }
        }

        @keyframes wiggle {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-2px);
          }
          75% {
            transform: translateX(2px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        @keyframes hover {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        @keyframes invaderMove {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(10px);
          }
        }

        @keyframes laser {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          50% {
            opacity: 1;
            transform: translateY(-10px);
          }
          100% {
            opacity: 0;
            transform: translateY(-40px);
          }
        }

        /* Responsive design for mobile devices - ULTRA COMPACT */
        @media (max-width: 480px) {
          .game-intro-container {
            padding: 8px !important;
            border-radius: 8px !important;
            max-height: 85vh !important;
          }

          .game-title {
            margin-bottom: 6px !important;
          }

          .discount-section {
            padding: 6px !important;
            margin-bottom: 6px !important;
          }

          .action-buttons {
            gap: 6px !important;
          }
        }

        /* Extra small screens - MINIMAL */
        @media (max-width: 320px) {
          .game-intro-container {
            padding: 6px !important;
            max-height: 80vh !important;
          }

          .discount-section {
            padding: 4px !important;
            margin-bottom: 4px !important;
          }

          .action-buttons {
            gap: 4px !important;
          }
        }

        /* Ensure no scrolling on any device */
        @media (max-height: 600px) {
          .game-intro-container {
            max-height: 95vh !important;
            padding: 6px !important;
          }

          .game-title {
            margin-bottom: 4px !important;
          }

          .discount-section {
            margin-bottom: 4px !important;
            padding: 4px !important;
          }
        }
      `}</style>
    </div>
  );
}
