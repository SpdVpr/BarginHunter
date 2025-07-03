import React, { useState, useEffect } from 'react';

interface GameOverScreenProps {
  finalScore: number;
  discountEarned: number;
  discountCode?: string;
  discountTiers: any[];
  onPlayAgain: () => void;
  onClose: () => void;
  onCopyCode: (code: string) => void;
  isPlayLimitReached?: boolean; // Special flag for play limit
  playLimitInfo?: {
    playsUsed: number;
    maxPlays: number;
    nextResetTime?: string;
    resetHours?: number;
  };
}

export default function GameOverScreen({
  finalScore,
  discountEarned,
  discountCode,
  discountTiers,
  onPlayAgain,
  onClose,
  onCopyCode,
  isPlayLimitReached,
  playLimitInfo
}: GameOverScreenProps) {
  const [codeCopied, setCodeCopied] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');

  // Countdown timer for play limit reset
  useEffect(() => {
    if (isPlayLimitReached && playLimitInfo?.nextResetTime) {
      console.log('🕒 Setting up countdown for reset time:', playLimitInfo.nextResetTime);

      const updateCountdown = () => {
        const now = new Date().getTime();
        const resetTime = new Date(playLimitInfo.nextResetTime!).getTime();
        const timeDiff = resetTime - now;

        console.log('🕒 Countdown update - now:', now, 'resetTime:', resetTime, 'diff:', timeDiff);

        if (timeDiff > 0) {
          const hours = Math.floor(timeDiff / (1000 * 60 * 60));
          const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

          const countdownText = `${hours}h ${minutes}m ${seconds}s`;
          console.log('🕒 Countdown text:', countdownText);
          setTimeUntilReset(countdownText);
        } else {
          console.log('🕒 Reset time reached!');
          setTimeUntilReset('You can play again now!');
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    } else {
      console.log('🕒 No countdown setup - isPlayLimitReached:', isPlayLimitReached, 'nextResetTime:', playLimitInfo?.nextResetTime);
    }
  }, [isPlayLimitReached, playLimitInfo?.nextResetTime]);

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

  // Special UI for play limit reached
  if (isPlayLimitReached) {
    return (
      <div className="game-over-screen fade-in">
        <div className="game-over-content">
          <h2 style={{
            fontSize: '32px',
            marginBottom: '10px',
            color: '#ff6b6b',
            textAlign: 'center'
          }}>
            Discount Limit Reached! 🚫
          </h2>

          {playLimitInfo && (
            <div style={{
              fontSize: '16px',
              marginBottom: '20px',
              color: '#fff',
              textAlign: 'center',
              lineHeight: '1.6',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ marginBottom: '10px' }}>
                <strong>Discount codes generated:</strong> {playLimitInfo.playsUsed} / {playLimitInfo.maxPlays}
              </div>

              {playLimitInfo.nextResetTime && timeUntilReset && (
                <div>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>Next reset in:</strong>
                  </div>
                  <div style={{
                    fontSize: '18px',
                    color: '#feca57',
                    fontWeight: 'bold'
                  }}>
                    {timeUntilReset}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#ddd',
                    marginTop: '5px'
                  }}>
                    (Resets every {playLimitInfo.resetHours || 24} hours)
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{
            fontSize: '16px',
            marginBottom: '20px',
            color: '#ddd',
            textAlign: 'center',
            lineHeight: '1.5'
          }}>
            You've reached the maximum number of discount codes for this period. Come back after the reset for more chances to win discounts!
          </div>

          <div className="game-actions">
            <button
              className="close-button"
              onClick={onClose}
              style={{
                background: '#ff6b6b',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
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


      </div>
    </div>
  );
}
