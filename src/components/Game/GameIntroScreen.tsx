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
          {isFlappyBird ? '🐦 Flappy Hunter' : isTetris ? '🧩 Tetris Hunter' : isSnake ? '🐍 Snake Hunter' : isSpaceInvaders ? '🚀 Space Hunter' : '🦕 Bargain Hunter'}
        </h1>
        <p style={{
          fontSize: '18px',
          margin: '0',
          opacity: 0.9
        }}>
          {isFlappyBird
            ? 'Fly through pipes and earn amazing discounts!'
            : isTetris
            ? 'Stack blocks, clear lines, and earn amazing discounts!'
            : isSnake
            ? 'Eat food, grow longer, and earn amazing discounts!'
            : isSpaceInvaders
            ? 'Destroy alien invaders and earn amazing discounts!'
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
          minHeight: '100px',
          height: 'auto',
          position: 'relative',
          overflow: 'visible',
          padding: '10px'
        }}>
          {isFlappyBird ? (
            // Flappy Bird preview - larger and better visible
            <>
              {/* Flying bird */}
              <div style={{
                width: '35px',
                height: '35px',
                background: '#FFD700',
                borderRadius: '50%',
                position: 'relative',
                animation: 'flap 0.8s infinite',
                marginRight: '50px'
              }}>
                <div style={{
                  width: '10px',
                  height: '8px',
                  background: '#FF4500',
                  position: 'absolute',
                  right: '-10px',
                  top: '14px',
                  borderRadius: '2px'
                }} />
              </div>

              {/* Pipes */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '35px',
                animation: 'slideLeft 2s infinite linear'
              }}>
                <div style={{
                  width: '25px',
                  height: '30px',
                  background: '#228B22',
                  borderRadius: '0 0 4px 4px'
                }} />
                <div style={{
                  width: '25px',
                  height: '30px',
                  background: '#228B22',
                  borderRadius: '4px 4px 0 0'
                }} />
              </div>
            </>
          ) : isTetris ? (
            // Tetris preview - larger and better visible
            <>
              {/* Tetris grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 16px)',
                gridTemplateRows: 'repeat(6, 16px)',
                gap: '2px',
                animation: 'pulse 1.5s infinite'
              }}>
                {/* Bottom row - filled */}
                <div style={{ background: '#FF0000' }} />
                <div style={{ background: '#FF0000' }} />
                <div style={{ background: '#00FF00' }} />
                <div style={{ background: '#00FF00' }} />
                <div style={{ background: '#0000FF' }} />
                <div style={{ background: '#0000FF' }} />

                {/* Second row - partially filled */}
                <div style={{ background: '#FFFF00' }} />
                <div style={{ background: '#FFFF00' }} />
                <div />
                <div />
                <div style={{ background: '#FF00FF' }} />
                <div style={{ background: '#FF00FF' }} />

                {/* Falling piece */}
                <div />
                <div style={{ background: '#00FFFF' }} />
                <div style={{ background: '#00FFFF' }} />
                <div style={{ background: '#00FFFF' }} />
                <div style={{ background: '#00FFFF' }} />
                <div />

                {/* Empty rows */}
                <div /><div /><div /><div /><div /><div />
                <div /><div /><div /><div /><div /><div />
                <div /><div /><div /><div /><div /><div />
              </div>
            </>
          ) : isSnake ? (
            // Snake preview - larger and better visible
            <>
              {/* Snake body */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                animation: 'wiggle 1.5s infinite',
                marginRight: '30px'
              }}>
                {/* Snake head */}
                <div style={{
                  width: '25px',
                  height: '25px',
                  background: '#2E7D32',
                  borderRadius: '4px',
                  position: 'relative',
                  marginRight: '3px'
                }}>
                  <div style={{
                    width: '4px',
                    height: '4px',
                    background: '#fff',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: '6px',
                    left: '6px'
                  }} />
                  <div style={{
                    width: '4px',
                    height: '4px',
                    background: '#fff',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: '6px',
                    right: '6px'
                  }} />
                </div>

                {/* Snake body segments */}
                <div style={{
                  width: '22px',
                  height: '22px',
                  background: '#4CAF50',
                  borderRadius: '3px',
                  marginRight: '3px'
                }} />
                <div style={{
                  width: '22px',
                  height: '22px',
                  background: '#4CAF50',
                  borderRadius: '3px',
                  marginRight: '3px'
                }} />
                <div style={{
                  width: '22px',
                  height: '22px',
                  background: '#4CAF50',
                  borderRadius: '3px'
                }} />
              </div>

              {/* Food */}
              <div style={{
                width: '20px',
                height: '20px',
                background: '#FF5722',
                borderRadius: '50%',
                animation: 'pulse 1s infinite'
              }} />
            </>
          ) : isSpaceInvaders ? (
            // Space Invaders preview - larger and better visible
            <>
              {/* Player ship */}
              <div style={{
                width: '40px',
                height: '20px',
                background: '#00ff00',
                position: 'relative',
                animation: 'hover 2s infinite',
                marginRight: '50px',
                borderRadius: '2px'
              }}>
                <div style={{
                  width: '8px',
                  height: '6px',
                  background: '#44ff44',
                  position: 'absolute',
                  top: '-6px',
                  left: '16px',
                  borderRadius: '1px'
                }} />
              </div>

              {/* Invaders formation */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 20px)',
                gridTemplateRows: 'repeat(2, 16px)',
                gap: '6px',
                animation: 'invaderMove 3s infinite linear'
              }}>
                <div style={{ background: '#ff4444', width: '20px', height: '16px', borderRadius: '2px' }} />
                <div style={{ background: '#ff4444', width: '20px', height: '16px', borderRadius: '2px' }} />
                <div style={{ background: '#ff4444', width: '20px', height: '16px', borderRadius: '2px' }} />
                <div style={{ background: '#ffaa00', width: '20px', height: '16px', borderRadius: '2px' }} />
                <div style={{ background: '#ffaa00', width: '20px', height: '16px', borderRadius: '2px' }} />
                <div style={{ background: '#ffaa00', width: '20px', height: '16px', borderRadius: '2px' }} />
              </div>

              {/* Laser beam */}
              <div style={{
                width: '3px',
                height: '30px',
                background: '#00ff00',
                position: 'absolute',
                left: '35%',
                animation: 'laser 1.5s infinite',
                borderRadius: '1px'
              }} />
            </>
          ) : (
            // Dino preview - larger and better visible
            <>
              {/* Running dino */}
              <div style={{
                width: '45px',
                height: '45px',
                background: '#535353',
                borderRadius: '8px',
                position: 'relative',
                animation: 'bounce 1s infinite',
                marginRight: '70px'
              }}>
                <div style={{
                  width: '8px',
                  height: '6px',
                  background: '#fff',
                  borderRadius: '2px',
                  position: 'absolute',
                  top: '10px',
                  right: '10px'
                }} />
              </div>

              {/* Cactus */}
              <div style={{
                width: '25px',
                height: '45px',
                background: '#228B22',
                borderRadius: '4px',
                position: 'relative',
                animation: 'slideLeft 2s infinite linear'
              }}>
                <div style={{
                  width: '8px',
                  height: '18px',
                  background: '#228B22',
                  position: 'absolute',
                  left: '-8px',
                  top: '14px',
                  borderRadius: '2px'
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
          fontSize: '24px',
          margin: '0 0 15px 0',
          color: '#FFD700',
          textAlign: 'center'
        }}>
          💰 Win {minDiscount}% - {maxDiscount}% OFF!
        </h2>
        <p style={{
          fontSize: '16px',
          margin: '0',
          lineHeight: '1.4',
          textAlign: 'center',
          color: '#fff'
        }}>
          Play the game and earn amazing discounts!
        </p>
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
            <strong>{isSnake ? '⌨️ Arrow keys' : isSpaceInvaders ? '⌨️ Arrow keys' : '🖱️ Click/Space'}</strong><br />
            {isFlappyBird ? 'to flap' : isTetris ? 'to rotate' : isSnake ? 'to move' : isSpaceInvaders ? 'to move' : 'to jump'}
          </div>
          <div>
            <strong>{isFlappyBird ? '🟢 Fly through' : isTetris ? '🧩 Stack blocks' : isSnake ? '🍎 Eat food' : isSpaceInvaders ? '👾 Destroy' : '🚧 Avoid'}</strong><br />
            {isFlappyBird ? 'pipe gaps' : isTetris ? 'clear lines' : isSnake ? 'to grow' : isSpaceInvaders ? 'invaders' : 'obstacles'}
          </div>
          <div>
            <strong>🏆 Score</strong><br />
            for points
          </div>
        </div>
      </div>



      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
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
      `}</style>
    </div>
  );
}
