import React, { useState, useEffect } from 'react';
import Game from '../Game/Game';
import { WidgetConfiguration } from '../../types';

interface EmbeddableWidgetProps {
  shopDomain: string;
  config: WidgetConfiguration;
  onClose?: () => void;
}

interface GameResult {
  score: number;
  discountEarned: number;
  discountCode?: string;
  gameData: any;
  isPlayLimitReached?: boolean;
  playLimitInfo?: {
    playsUsed: number;
    maxPlays: number;
    nextResetTime?: string;
    resetHours?: number;
  };
}

export default function EmbeddableWidget({ 
  shopDomain, 
  config, 
  onClose 
}: EmbeddableWidgetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  // Trigger logic based on configuration
  useEffect(() => {
    if (hasTriggered) return;

    const triggerWidget = () => {
      setIsVisible(true);
      setHasTriggered(true);
    };

    switch (config.triggerEvent) {
      case 'immediate':
        triggerWidget();
        break;
        
      case 'time_delay':
        const delay = (config.triggerDelay || 5) * 1000;
        const timer = setTimeout(triggerWidget, delay);
        return () => clearTimeout(timer);
        
      case 'scroll':
        const handleScroll = () => {
          const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
          if (scrollPercent > 50) { // Trigger at 50% scroll
            triggerWidget();
            window.removeEventListener('scroll', handleScroll);
          }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
        
      case 'exit_intent':
        const handleMouseLeave = (e: MouseEvent) => {
          if (e.clientY <= 0) {
            triggerWidget();
            document.removeEventListener('mouseleave', handleMouseLeave);
          }
        };
        document.addEventListener('mouseleave', handleMouseLeave);
        return () => document.removeEventListener('mouseleave', handleMouseLeave);
        
      default:
        triggerWidget();
    }
  }, [config.triggerEvent, config.triggerDelay, hasTriggered]);

  const handleStartGame = () => {
    setIsGameActive(true);
  };

  const handleGameComplete = (result: GameResult) => {
    console.log('Game completed:', result);
    // Game stays active to show results
  };

  const handleClose = () => {
    setIsVisible(false);
    setIsGameActive(false);
    if (onClose) {
      onClose();
    }
  };

  const renderPopupMode = () => (
    <>
      <div className="widget-overlay" onClick={handleClose} />
      <div className="widget-popup">
        <div style={{ 
          padding: '20px',
          position: 'relative'
        }}>
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#666',
              padding: '5px',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
          
          {isGameActive ? (
            <Game
              shopDomain={shopDomain}
              onGameComplete={handleGameComplete}
              onClose={handleClose}
            />
          ) : (
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ 
                margin: '0 0 15px 0',
                color: '#333',
                fontSize: '24px'
              }}>
                🎮 Play Bargain Hunter!
              </h3>
              <p style={{ 
                margin: '0 0 20px 0',
                color: '#666',
                fontSize: '16px'
              }}>
                Play our mini-game and earn discounts on your purchase!
              </p>
              <button
                onClick={handleStartGame}
                style={{
                  background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                  color: 'white',
                  border: 'none',
                  padding: '15px 30px',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                🚀 Start Game
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const renderTabMode = () => (
    <>
      {!isGameActive && (
        <div 
          className={`widget-tab ${config.position}`}
          onClick={handleStartGame}
        >
          🎮 Play for Discount!
        </div>
      )}
      
      {isGameActive && (
        <>
          <div className="widget-overlay" onClick={handleClose} />
          <div className="widget-popup">
            <div style={{ padding: '20px', position: 'relative' }}>
              <button
                onClick={handleClose}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
              
              <Game
                shopDomain={shopDomain}
                onGameComplete={handleGameComplete}
                onClose={handleClose}
              />
            </div>
          </div>
        </>
      )}
    </>
  );

  const renderInlineMode = () => (
    <div className="widget-inline">
      <div style={{ padding: '20px' }}>
        {isGameActive ? (
          <Game
            shopDomain={shopDomain}
            onGameComplete={handleGameComplete}
            onClose={handleClose}
          />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ 
              margin: '0 0 15px 0',
              color: '#333',
              fontSize: '22px'
            }}>
              🎮 Bargain Hunter Game
            </h3>
            <p style={{ 
              margin: '0 0 20px 0',
              color: '#666',
              fontSize: '14px'
            }}>
              Play our mini-game to earn exclusive discounts!
            </p>
            <button
              onClick={handleStartGame}
              style={{
                background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🚀 Start Playing
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderFloatingButtonMode = () => {
    const floatingConfig = config.floatingButton || {
      text: 'Play Game',
      icon: '🎮',
      backgroundColor: '#ff6b6b',
      textColor: '#ffffff',
      borderRadius: 25,
      size: 'medium',
      position: {
        desktop: 'bottom-right',
        mobile: 'bottom-right'
      },
      offset: {
        desktop: { x: 20, y: 20 },
        mobile: { x: 15, y: 15 }
      },
      animation: 'pulse',
      showOnHover: false
    };

    const isMobile = window.innerWidth < 768;
    const position = isMobile ? floatingConfig.position.mobile : floatingConfig.position.desktop;
    const offset = isMobile ? floatingConfig.offset.mobile : floatingConfig.offset.desktop;

    const getPositionStyles = () => {
      switch (position) {
        case 'top-left':
          return { top: `${offset.y}px`, left: `${offset.x}px` };
        case 'top-right':
          return { top: `${offset.y}px`, right: `${offset.x}px` };
        case 'bottom-left':
          return { bottom: `${offset.y}px`, left: `${offset.x}px` };
        default: // bottom-right
          return { bottom: `${offset.y}px`, right: `${offset.x}px` };
      }
    };

    const getSizeStyles = () => {
      switch (floatingConfig.size) {
        case 'small':
          return {
            padding: isMobile ? '10px 16px' : '8px 16px',
            fontSize: '14px'
          };
        case 'large':
          return {
            padding: isMobile ? '14px 20px' : '16px 24px',
            fontSize: isMobile ? '16px' : '18px'
          };
        default: // medium
          return {
            padding: isMobile ? '12px 18px' : '12px 20px',
            fontSize: isMobile ? '15px' : '16px'
          };
      }
    };

    return (
      <>
        {!isGameActive && (
          <button
            onClick={handleStartGame}
            className={`widget-floating-button size-${floatingConfig.size} position-${position} ${floatingConfig.animation !== 'none' ? `animation-${floatingConfig.animation}` : ''}`}
            style={{
              ...getPositionStyles(),
              ...getSizeStyles(),
              backgroundColor: floatingConfig.backgroundColor,
              color: floatingConfig.textColor,
              borderRadius: `${floatingConfig.borderRadius}px`,
            }}
          >
            <span style={{ fontSize: '1.2em' }}>{floatingConfig.icon}</span>
            <span>{floatingConfig.text}</span>
          </button>
        )}

        {isGameActive && (
          <>
            <div className="widget-overlay" onClick={handleClose} />
            <div className="widget-popup">
              <div style={{ padding: '20px', position: 'relative' }}>
                <button
                  onClick={handleClose}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                >
                  ×
                </button>

                <Game
                  shopDomain={shopDomain}
                  onGameComplete={handleGameComplete}
                  onClose={handleClose}
                />
              </div>
            </div>
          </>
        )}
      </>
    );
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bargain-hunter-widget">
      {config.displayMode === 'popup' && renderPopupMode()}
      {config.displayMode === 'tab' && renderTabMode()}
      {config.displayMode === 'floating_button' && renderFloatingButtonMode()}
      {config.displayMode === 'inline' && renderInlineMode()}
    </div>
  );
}
