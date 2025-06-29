import React, { useState } from 'react';

interface GameOverScreenProps {
  finalScore: number;
  discountEarned: number;
  discountCode?: string;
  discountTiers: any[];
  onPlayAgain: () => void;
  onClose: () => void;
  onCopyCode: (code: string) => void;
}

export default function GameOverScreen({
  finalScore,
  discountEarned,
  discountCode,
  discountTiers,
  onPlayAgain,
  onClose,
  onCopyCode
}: GameOverScreenProps) {
  const [codeCopied, setCodeCopied] = useState(false);

  const currentTier = discountTiers
    .slice()
    .reverse()
    .find(tier => finalScore >= tier.minScore);

  const nextTier = discountTiers.find(tier => finalScore < tier.minScore);

  const handleCopyCode = () => {
    if (discountCode) {
      onCopyCode(discountCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const getScoreMessage = () => {
    if (finalScore >= 1000) return "LEGENDARY HUNTER! 🏆";
    if (finalScore >= 750) return "Sale Master! 👑";
    if (finalScore >= 500) return "Bargain Expert! 💡";
    if (finalScore >= 300) return "Getting Warmer! 🔥";
    if (finalScore >= 150) return "Nice Start! 🎯";
    return "Keep Hunting! 🔍";
  };

  return (
    <div className="game-over-screen fade-in">
      <div className="game-over-content">
        <h2 style={{ 
          fontSize: '32px', 
          marginBottom: '10px', 
          color: '#fff',
          textAlign: 'center'
        }}>
          Game Over!
        </h2>
        
        <div className="final-score bounce">
          {finalScore}
        </div>
        
        <p style={{ 
          fontSize: '18px', 
          marginBottom: '20px',
          color: '#feca57'
        }}>
          {getScoreMessage()}
        </p>

        {discountEarned > 0 ? (
          <div className="discount-section">
            <div className="discount-earned">
              🎉 You earned {discountEarned}% OFF!
            </div>
            
            {discountCode && (
              <div className="discount-code-section">
                <p style={{ marginBottom: '10px', color: '#fff' }}>
                  Your discount code:
                </p>
                <div 
                  className="discount-code"
                  onClick={handleCopyCode}
                  style={{ cursor: 'pointer' }}
                  title="Click to copy"
                >
                  {discountCode}
                </div>
                <button
                  onClick={handleCopyCode}
                  style={{
                    background: codeCopied ? '#4ecdc4' : '#ff6b6b',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    marginTop: '10px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {codeCopied ? '✓ Copied!' : '📋 Copy Code'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="no-discount-section">
            <p style={{ color: '#fff', marginBottom: '10px' }}>
              No discount earned this time.
            </p>
            {nextTier && (
              <p style={{ color: '#feca57', fontSize: '14px' }}>
                Score {nextTier.minScore} points to earn {nextTier.discount}% OFF!
              </p>
            )}
          </div>
        )}

        {/* Progress to next tier */}
        {nextTier && (
          <div className="next-tier-progress" style={{ marginTop: '20px' }}>
            <p style={{ color: '#fff', fontSize: '14px', marginBottom: '8px' }}>
              Next reward: {nextTier.discount}% OFF at {nextTier.minScore} points
            </p>
            <div style={{
              width: '200px',
              height: '8px',
              background: 'rgba(255,255,255,0.3)',
              borderRadius: '4px',
              overflow: 'hidden',
              margin: '0 auto'
            }}>
              <div style={{
                width: `${Math.min((finalScore / nextTier.minScore) * 100, 100)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #4ecdc4, #45b7d1)',
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="action-buttons" style={{ 
          marginTop: '30px',
          display: 'flex',
          gap: '15px',
          justifyContent: 'center'
        }}>
          <button
            onClick={onPlayAgain}
            style={{
              background: '#4ecdc4',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#45b7d1';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#4ecdc4';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            🎮 Play Again
          </button>
          
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              color: 'white',
              border: '2px solid white',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = '#333';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'white';
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Tips for better score */}
        <div className="tips-section" style={{ 
          marginTop: '20px',
          padding: '15px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '8px',
          maxWidth: '300px'
        }}>
          <p style={{ 
            color: '#fff', 
            fontSize: '12px', 
            margin: '0 0 8px 0',
            fontWeight: 'bold'
          }}>
            💡 Pro Tips:
          </p>
          <ul style={{ 
            color: '#fff', 
            fontSize: '11px', 
            margin: 0,
            paddingLeft: '15px'
          }}>
            <li>Collect golden discount tags for bonus points</li>
            <li>Time your jumps and slides perfectly</li>
            <li>Look for mystery boxes for mega bonuses</li>
            <li>The game gets faster as you progress</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
