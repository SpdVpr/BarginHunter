/** @jsxImportSource react */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import TouchControlsHint from './TouchControlsHint';
import { ExternalGame } from '../../lib/gameLibrary';
import { ExternalGameScorer } from '../../utils/gameScoring';
import TapDashGame from './MiniGames/TapDashGame';
import SwipeRushGame from './MiniGames/SwipeRushGame';
import ColorSwitchGame from './MiniGames/ColorSwitchGame';
import HelixJumpGame from './MiniGames/HelixJumpGame';
import KnifeHitGame from './MiniGames/KnifeHitGame';

interface ExternalGameEngineProps {
  game: ExternalGame;
  onGameEnd: (score: number, gameData: any) => void;
  onScoreUpdate: (score: number) => void;
  gameConfig: any;
  onShowIntro: () => void;
}

export default function ExternalGameEngine({
  game,
  onGameEnd,
  onScoreUpdate,
  gameConfig,
  onShowIntro
}: ExternalGameEngineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [gameStartTime] = useState(Date.now());
  const [gameScorer] = useState(() => new ExternalGameScorer());

  // Game state management
  const [gameState, setGameState] = useState<'loading' | 'playing' | 'ended'>('loading');

  // Load game
  useEffect(() => {
    // For our built-in games, just set as ready
    setIsLoading(false);
    setGameState('playing');
    gameScorer.reset();
  }, [game, gameScorer]);



  const handleGameEnd = (finalScore: number) => {
    if (gameState === 'ended') return; // Prevent multiple calls
    
    setGameState('ended');
    
    const gameData = {
      duration: Date.now() - gameStartTime,
      gameType: game.id,
      gameName: game.name,
      category: game.category,
      difficulty: game.difficulty,
      finalScore
    };

    onGameEnd(finalScore, gameData);
  };

  // Auto-end game after estimated play time + buffer
  useEffect(() => {
    const maxGameTime = (game.estimatedPlayTime + 2) * 60 * 1000; // Add 2 minute buffer
    const timeout = setTimeout(() => {
      if (gameState === 'playing') {
        handleGameEnd(score);
      }
    }, maxGameTime);

    return () => clearTimeout(timeout);
  }, [game.estimatedPlayTime, gameState, score, handleGameEnd]);

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#ff6b6b', marginBottom: '20px' }}>
          ⚠️ Game Loading Error
        </h2>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          {error}
        </p>
        <button
          onClick={onShowIntro}
          style={{
            background: '#4ecdc4',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          ← Back to Game Selection
        </button>
      </div>
    );
  }

  // Render appropriate game component
  const renderGame = () => {
    const gameProps = {
      onGameEnd: handleGameEnd,
      onScoreUpdate: (newScore: number) => {
        setScore(newScore);
        onScoreUpdate(newScore);
      }
    };

    switch (game.id) {
      // Mobile-optimized games
      case 'tap-dash':
        return <TapDashGame {...gameProps} />;
      case 'swipe-rush':
        return <SwipeRushGame {...gameProps} />;
      case 'color-switch':
        return <ColorSwitchGame {...gameProps} />;
      case 'helix-jump':
        return <HelixJumpGame {...gameProps} />;
      case 'knife-hit':
        return <KnifeHitGame {...gameProps} />;

      default:
        return (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '18px'
          }}>
            Game "{game.name}" not yet implemented
          </div>
        );
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 1000
    }}>
      {/* Back Button */}
      <button
        onClick={onShowIntro}
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(255,255,255,0.9)',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '14px',
          cursor: 'pointer',
          zIndex: 1001
        }}
      >
        ← Back
      </button>

      {/* Game Component */}
      {renderGame()}
    </div>
  );
}
