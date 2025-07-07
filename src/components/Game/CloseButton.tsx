import React from 'react';

interface CloseButtonProps {
  onClose: () => void;
  gameType?: string;
  style?: React.CSSProperties;
}

export default function CloseButton({ onClose, gameType = 'game', style = {} }: CloseButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log(`🎮 ${gameType} close button clicked!`);
        onClose();
      }}
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
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
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        zIndex: 1000,
        ...style
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
        e.currentTarget.style.transform = 'scale(1.1)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      ×
    </button>
  );
}
