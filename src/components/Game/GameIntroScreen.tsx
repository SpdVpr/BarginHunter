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
  gameType?: 'dino' | 'flappy_bird' | 'tetris' | 'snake' | 'space_invaders' | 'library';
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
  onShowLibrary?: () => void;
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
  onShowLibrary,
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

  // Get background from gameConfig appearance settings
  const getBackgroundFromAppearance = () => {
    if (!gameConfig?.appearance) {
      return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }

    const { primaryColor = '#667eea', secondaryColor = '#764ba2', backgroundTheme = 'default' } = gameConfig.appearance;

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

  // Show loading screen until settings are loaded to prevent flashing
  if (!settingsLoaded) {
    return (
      <div className="game-intro-container" style={{
        background: getBackgroundFromAppearance(),
        color: '#ffffff',
        borderRadius: 0,
        textAlign: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: '40px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
      }}>
        <div style={{
          fontSize: '18px',
          opacity: 0.8,
          animation: 'pulse 1.5s ease-in-out infinite alternate'
        }}>
          Loading...
        </div>
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes pulse {
              from { opacity: 0.4; }
              to { opacity: 1; }
            }
          `
        }} />
      </div>
    );
  }

  return (
    <div className="game-intro-container" style={{
      background: getBackgroundFromAppearance(),
      color: introSettings.textColor,
      borderRadius: 0, // Remove border radius to fill entire space
      textAlign: 'center',
      position: 'fixed', // Fill entire iframe
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      margin: 0,
      padding: '40px 20px', // Add padding for content spacing
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center', // Center vertically
      alignItems: 'center', // Center horizontally
      overflow: 'hidden'
    }}>
      {/* Custom CSS */}
      {introSettings.customCSS && (
        <style dangerouslySetInnerHTML={{ __html: introSettings.customCSS }} />
      )}



      {/* Game title - CUSTOMIZABLE */}
      <div className="game-title" style={{
        marginBottom: '30px',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 className="game-title-text" style={{
          margin: '0 0 15px 0',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          fontSize: 'clamp(28px, 6vw, 42px)',
          lineHeight: '1.1',
          color: introSettings.textColor,
          fontWeight: 'bold'
        }}>
          {getGameTitle()}
        </h1>
        <p className="game-subtitle" style={{
          fontSize: 'clamp(16px, 4vw, 20px)',
          margin: '0',
          opacity: 0.9,
          lineHeight: '1.3',
          color: introSettings.textColor
        }}>
          {getGameSubtitle()}
        </p>
      </div>




      {/* Discount information - CUSTOMIZABLE */}
      <div className="discount-section" style={{
        background: 'rgba(255,255,255,0.15)',
        borderRadius: '15px',
        padding: '20px',
        marginBottom: '40px',
        border: '2px solid rgba(255,255,255,0.2)',
        maxWidth: '350px',
        width: '100%',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
      }}>
        <h2 className="discount-title" style={{
          fontSize: 'clamp(18px, 5vw, 24px)',
          margin: '0',
          color: '#FFD700',
          textAlign: 'center',
          lineHeight: '1.3',
          fontWeight: 'bold',
          textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
        }}>
          {introSettings.showEmojis ? '💰 ' : ''}{getDiscountText()}
        </h2>
      </div>


      {/* Action buttons - CUSTOMIZABLE */}
      <div className="action-buttons" style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '20px',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        maxWidth: '350px'
      }}>
        <button
          onClick={onStartGame}
          className="start-button"
          style={{
            background: `linear-gradient(45deg, ${introSettings.buttonColor}, ${introSettings.buttonColor}dd)`,
            color: introSettings.buttonTextColor,
            border: 'none',
            padding: '15px 30px',
            borderRadius: '12px',
            fontSize: 'clamp(16px, 4vw, 20px)',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            flex: '1',
            maxWidth: '150px',
            textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.2)';
          }}
        >
          {introSettings.showEmojis ? '🚀 ' : ''}Start
        </button>

        {/* Game Library Button */}
        {onShowLibrary && (
          <button
            onClick={onShowLibrary}
            className="library-button"
            style={{
              background: 'linear-gradient(45deg, #4ecdc4, #44b3a8)',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '12px',
              fontSize: 'clamp(16px, 4vw, 20px)',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              flex: '1',
              maxWidth: '150px',
              textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
              marginTop: '10px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.2)';
            }}
          >
            {introSettings.showEmojis ? '🎮 ' : ''}More Games
          </button>
        )}

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎮 Intro Close button clicked!');

            try {
              // Try multiple close methods
              console.log('🎮 Method 1: Calling onClose...');
              if (typeof onClose === 'function') {
                onClose();
                console.log('🎮 onClose called successfully');
              }

              // Method 2: Direct parent message
              console.log('🎮 Method 2: Sending direct parent message...');
              if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                  type: 'BARGAIN_HUNTER_CLOSE'
                }, '*');
                console.log('🎮 Direct parent message sent');
              }

            } catch (error) {
              console.error('❌ Error in close methods:', error);
            }
          }}
          style={{
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '2px solid rgba(255,255,255,0.3)',
            padding: '15px 30px',
            borderRadius: '12px',
            fontSize: 'clamp(16px, 4vw, 20px)',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background 0.2s ease, transform 0.2s ease',
            flex: '1',
            maxWidth: '150px',
            textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
            pointerEvents: 'auto'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
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

        /* Responsive design for mobile devices */
        @media (max-width: 480px) {
          .game-intro-container {
            padding: 20px 15px !important;
          }

          .game-title {
            margin-bottom: 20px !important;
          }

          .discount-section {
            padding: 15px !important;
            margin-bottom: 30px !important;
            max-width: 300px !important;
          }

          .action-buttons {
            gap: 15px !important;
            max-width: 300px !important;
          }
        }

        /* Extra small screens */
        @media (max-width: 320px) {
          .game-intro-container {
            padding: 15px 10px !important;
          }

          .discount-section {
            padding: 12px !important;
            margin-bottom: 25px !important;
            max-width: 280px !important;
          }

          .action-buttons {
            gap: 12px !important;
            max-width: 280px !important;
          }
        }

        /* Ensure fullscreen layout */
        .game-intro-container {
          height: 100vh !important;
          min-height: 100vh !important;
          max-height: 100vh !important;
        }
      `}</style>
    </div>
  );
}
