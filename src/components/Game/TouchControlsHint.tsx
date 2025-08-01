import React, { useState, useEffect } from 'react';

interface TouchControlsHintProps {
  gameType: 'dino' | 'flappy_bird' | 'tetris' | 'snake' | 'space_invaders';
  isVisible?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
}

const TouchControlsHint: React.FC<TouchControlsHintProps> = ({
  gameType,
  isVisible = true,
  autoHide = true,
  autoHideDelay = 3000
}) => {
  const [visible, setVisible] = useState(isVisible);

  useEffect(() => {
    if (autoHide && isVisible) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, isVisible]);

  const getControlsText = () => {
    switch (gameType) {
      case 'dino':
      case 'flappy_bird':
        return '📱 Tap anywhere to jump';
      case 'tetris':
        return '📱 Hold and drag to move/rotate continuously';
      case 'snake':
        return '📱 Hold and drag to control snake direction';
      case 'space_invaders':
        return '📱 Touch and drag to move ship';
      default:
        return '📱 Touch to play';
    }
  };

  const getDetailedControls = () => {
    switch (gameType) {
      case 'tetris':
        return [
          'Hold and drag left/right: Move piece',
          'Hold and drag up: Rotate piece',
          'Hold and drag down: Drop faster',
          'Quick tap: Rotate piece'
        ];
      case 'snake':
        return [
          'Hold finger and move: Control direction',
          'Continuous movement for smooth control',
          'No need to lift finger between moves'
        ];
      case 'space_invaders':
        return [
          'Touch and drag: Move ship',
          'Auto-firing enabled',
          'Avoid enemy bullets'
        ];
      default:
        return [];
    }
  };

  if (!visible) return null;

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  
  if (!isMobile) return null;

  return (
    <div className="touch-controls-hint" style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '25px',
      fontSize: '14px',
      zIndex: 1000,
      pointerEvents: 'none',
      textAlign: 'center',
      maxWidth: '90vw',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      animation: 'fadeInUp 0.5s ease-out'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        {getControlsText()}
      </div>
      
      {getDetailedControls().length > 0 && (
        <div style={{ 
          fontSize: '12px', 
          opacity: 0.9,
          marginTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          paddingTop: '8px'
        }}>
          {getDetailedControls().map((control, index) => (
            <div key={index} style={{ margin: '2px 0' }}>
              {control}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TouchControlsHint;
