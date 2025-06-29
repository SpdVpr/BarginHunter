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
  gameType?: 'dino' | 'flappy_bird';
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

  // Get the lowest score requirement for any discount
  const lowestScoreForDiscount = gameConfig.discountTiers.length > 0
    ? Math.min(...gameConfig.discountTiers.map(tier => tier.minScore))
    : 100;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: window.innerWidth <= 768 ? '20px' : '40px',
      borderRadius: '20px',
      maxWidth: window.innerWidth <= 768 ? '95%' : '600px',
      margin: '0 auto',
      textAlign: 'center',
      boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
      position: 'relative'
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

      {/* Game title */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{
          fontSize: '48px',
          margin: '0 0 10px 0',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          {isFlappyBird ? '🐦 Flappy Hunter' : '🦕 Bargain Hunter'}
        </h1>
        <p style={{
          fontSize: '18px',
          margin: '0',
          opacity: 0.9
        }}>
          {isFlappyBird
            ? 'Fly through pipes and earn amazing discounts!'
            : 'Jump, dodge, and earn amazing discounts!'
          }
        </p>
      </div>

      {/* Game preview/animation */}
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '15px',
        padding: '20px',
        marginBottom: '30px',
        border: '2px solid rgba(255,255,255,0.2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '80px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {isFlappyBird ? (
            // Flappy Bird preview
            <>
              {/* Flying bird */}
              <div style={{
                width: '30px',
                height: '30px',
                background: '#FFD700',
                borderRadius: '50%',
                position: 'relative',
                animation: 'flap 0.8s infinite',
                marginRight: '40px'
              }}>
                <div style={{
                  width: '8px',
                  height: '6px',
                  background: '#FF4500',
                  position: 'absolute',
                  right: '-8px',
                  top: '12px'
                }} />
              </div>

              {/* Pipes */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '30px',
                animation: 'slideLeft 2s infinite linear'
              }}>
                <div style={{
                  width: '20px',
                  height: '25px',
                  background: '#228B22',
                  borderRadius: '0 0 4px 4px'
                }} />
                <div style={{
                  width: '20px',
                  height: '25px',
                  background: '#228B22',
                  borderRadius: '4px 4px 0 0'
                }} />
              </div>
            </>
          ) : (
            // Dino preview
            <>
              {/* Running dino */}
              <div style={{
                width: '40px',
                height: '40px',
                background: '#535353',
                borderRadius: '8px',
                position: 'relative',
                animation: 'bounce 1s infinite',
                marginRight: '60px'
              }}>
                <div style={{
                  width: '6px',
                  height: '4px',
                  background: '#fff',
                  borderRadius: '2px',
                  position: 'absolute',
                  top: '8px',
                  right: '8px'
                }} />
              </div>

              {/* Cactus */}
              <div style={{
                width: '20px',
                height: '40px',
                background: '#228B22',
                borderRadius: '4px',
                position: 'relative',
                animation: 'slideLeft 2s infinite linear'
              }}>
                <div style={{
                  width: '6px',
                  height: '15px',
                  background: '#228B22',
                  position: 'absolute',
                  left: '-6px',
                  top: '12px'
                }} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Discount information */}
      <div style={{
        background: 'rgba(255,255,255,0.15)',
        borderRadius: '15px',
        padding: '20px',
        marginBottom: '25px',
        border: '2px solid rgba(255,255,255,0.2)'
      }}>
        <h2 style={{
          fontSize: '22px',
          margin: '0 0 10px 0',
          color: '#FFD700'
        }}>
          💰 Win {minDiscount}% - {maxDiscount}% OFF!
        </h2>
        <p style={{
          fontSize: '15px',
          margin: '0',
          lineHeight: '1.4'
        }}>
          Score <strong>{lowestScoreForDiscount}+ points</strong> to earn your discount!
        </p>

        {gameConfig.discountTiers.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: '8px',
            marginTop: '15px'
          }}>
            {gameConfig.discountTiers.map((tier, index) => (
              <div key={index} style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.2)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                  {tier.minScore}+ pts
                </div>
                <div style={{ fontSize: '14px', color: '#FFD700' }}>
                  {tier.discount}% OFF
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How to play */}
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '15px',
        padding: '15px',
        marginBottom: '25px',
        border: '2px solid rgba(255,255,255,0.2)'
      }}>
        <h3 style={{ fontSize: '18px', margin: '0 0 10px 0' }}>
          🎯 How to Play:
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '10px',
          textAlign: 'center',
          fontSize: '14px'
        }}>
          <div>
            <strong>🖱️ Click/Space</strong><br />
            {isFlappyBird ? 'to flap' : 'to jump'}
          </div>
          <div>
            <strong>{isFlappyBird ? '🟢 Fly through' : '🚧 Avoid'}</strong><br />
            {isFlappyBird ? 'pipe gaps' : 'obstacles'}
          </div>
          <div>
            <strong>🏆 Score</strong><br />
            for points
          </div>
        </div>
      </div>

      {/* Attempts remaining */}
      <div style={{
        background: remainingAttempts > 0 ? 'rgba(40, 167, 69, 0.2)' : 'rgba(220, 53, 69, 0.2)',
        borderRadius: '10px',
        padding: '15px',
        marginBottom: '30px',
        border: `2px solid ${remainingAttempts > 0 ? 'rgba(40, 167, 69, 0.5)' : 'rgba(220, 53, 69, 0.5)'}`
      }}>
        <h3 style={{ fontSize: '18px', margin: '0 0 5px 0' }}>
          🎲 Attempts Remaining:
        </h3>
        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
          {remainingAttempts} / {gameConfig.maxAttempts}
        </div>
        {remainingAttempts === 0 && (
          <p style={{ fontSize: '14px', margin: '10px 0 0 0', opacity: 0.9 }}>
            You've used all your attempts. Come back later for more chances!
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
        {remainingAttempts > 0 ? (
          <button
            onClick={onStartGame}
            style={{
              background: 'linear-gradient(45deg, #28a745, #20c997)',
              color: 'white',
              border: 'none',
              padding: '18px 40px',
              borderRadius: '12px',
              fontSize: '20px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s ease',
              minWidth: '160px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            🚀 Start Game
          </button>
        ) : (
          <button
            disabled
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '18px 40px',
              borderRadius: '12px',
              fontSize: '20px',
              fontWeight: 'bold',
              cursor: 'not-allowed',
              opacity: 0.6,
              minWidth: '160px'
            }}
          >
            No Attempts Left
          </button>
        )}
        
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '2px solid rgba(255,255,255,0.3)',
            padding: '18px 40px',
            borderRadius: '12px',
            fontSize: '20px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background 0.2s ease',
            minWidth: '160px'
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
      `}</style>
    </div>
  );
}
