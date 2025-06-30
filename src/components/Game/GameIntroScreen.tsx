/** @jsxImportSource react */
import React from 'react';

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

interface GameIntroScreenProps {
  gameConfig: GameConfig;
  onStartGame: () => void;
  onClose: () => void;
  attemptsUsed: number;
}

export default function GameIntroScreen({
  gameConfig,
  onStartGame,
  onClose,
  attemptsUsed
}: GameIntroScreenProps) {
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

  return (
    <div className="game-intro-container" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      borderRadius: '12px',
      textAlign: 'center',
      boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
      position: 'relative',
      width: '100%',
      maxWidth: '100%',
      margin: '0',
      padding: '12px',
      minHeight: 'fit-content',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      maxHeight: '90vh',
      overflow: 'hidden'
    }}>
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '15px',
          right: '15px',
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: 'white',
          fontSize: '24px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ×
      </button>

      {/* Game title - MINIMIZED */}
      <div className="game-title" style={{ marginBottom: '8px' }}>
        <h1 className="game-title-text" style={{
          margin: '0 0 4px 0',
          textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
          fontSize: 'clamp(20px, 6vw, 32px)',
          lineHeight: '1.1'
        }}>
          {isFlappyBird ? '🐦 Flappy Hunter' : isTetris ? '🧩 Tetris Hunter' : isSnake ? '🐍 Snake Hunter' : isSpaceInvaders ? '🚀 Space Hunter' : '🦕 Bargain Hunter'}
        </h1>
        <p className="game-subtitle" style={{
          fontSize: 'clamp(12px, 3vw, 14px)',
          margin: '0',
          opacity: 0.9,
          lineHeight: '1.2'
        }}>
          {isFlappyBird ? 'Fly & earn discounts!' : isTetris ? 'Stack & earn discounts!' : isSnake ? 'Eat & earn discounts!' : isSpaceInvaders ? 'Destroy & earn discounts!' : 'Jump & earn discounts!'}
        </p>
      </div>




      {/* Discount information - MINIMIZED */}
      <div className="discount-section" style={{
        background: 'rgba(255,255,255,0.15)',
        borderRadius: '8px',
        padding: '8px',
        marginBottom: '8px',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <h2 className="discount-title" style={{
          fontSize: 'clamp(16px, 4vw, 20px)',
          margin: '0',
          color: '#FFD700',
          textAlign: 'center',
          lineHeight: '1.2'
        }}>
          💰 Win {minDiscount}% - {maxDiscount}% OFF!
        </h2>
      </div>


      {/* Action buttons - MINIMIZED */}
      <div className="action-buttons" style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '8px',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
      }}>
        <button
          onClick={onStartGame}
          className="start-button"
          style={{
            background: 'linear-gradient(45deg, #28a745, #20c997)',
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '8px',
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
          🚀 Start
        </button>

        <button
          onClick={onClose}
          className="close-button"
          style={{
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            padding: '10px 16px',
            borderRadius: '8px',
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
          ❌ Close
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
