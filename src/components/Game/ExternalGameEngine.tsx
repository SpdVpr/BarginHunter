/** @jsxImportSource react */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import TouchControlsHint from './TouchControlsHint';
import { ExternalGame } from '../../lib/gameLibrary';
import { GameScorer } from '../../utils/gameScoring';

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
  const [gameScorer] = useState(() => new GameScorer());

  // Game state management
  const [gameState, setGameState] = useState<'loading' | 'playing' | 'ended'>('loading');

  // Load external game
  useEffect(() => {
    loadExternalGame();
  }, [game]);

  const loadExternalGame = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Different loading strategies based on game type
      switch (game.gameType) {
        case 'iframe':
          await loadIframeGame();
          break;
        case 'html5':
          await loadHTML5Game();
          break;
        case 'canvas':
          await loadCanvasGame();
          break;
        case 'js':
          await loadJSGame();
          break;
        default:
          throw new Error(`Unsupported game type: ${game.gameType}`);
      }

      setGameState('playing');
      gameScorer.reset();
    } catch (err) {
      console.error('Failed to load external game:', err);
      setError(err instanceof Error ? err.message : 'Failed to load game');
    } finally {
      setIsLoading(false);
    }
  };

  const loadIframeGame = async () => {
    // For iframe games, we'll embed them directly
    if (!containerRef.current) return;

    const iframe = document.createElement('iframe');
    iframe.src = game.sourceUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    iframe.allow = 'fullscreen';
    iframe.sandbox = 'allow-scripts allow-same-origin allow-forms';

    // Add message listener for score updates
    window.addEventListener('message', handleGameMessage);

    containerRef.current.appendChild(iframe);
    iframeRef.current = iframe;
  };

  const loadHTML5Game = async () => {
    // For HTML5 games, we'll fetch and embed the content
    if (!containerRef.current) return;

    try {
      const response = await fetch(game.sourceUrl);
      if (!response.ok) throw new Error('Failed to fetch game');
      
      const gameHTML = await response.text();
      
      // Create a sandboxed container
      const gameContainer = document.createElement('div');
      gameContainer.style.width = '100%';
      gameContainer.style.height = '100%';
      gameContainer.innerHTML = gameHTML;
      
      containerRef.current.appendChild(gameContainer);
      
      // Setup score monitoring
      setupScoreMonitoring();
    } catch (err) {
      throw new Error(`Failed to load HTML5 game: ${err}`);
    }
  };

  const loadCanvasGame = async () => {
    // For canvas games, we'll create a canvas and load the game script
    if (!containerRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.maxWidth = '800px';
    canvas.style.maxHeight = '600px';
    canvas.style.border = '2px solid #333';
    canvas.style.borderRadius = '8px';
    canvas.style.background = '#000';

    containerRef.current.appendChild(canvas);

    // Load game script
    await loadGameScript(game.sourceUrl, canvas);
    setupScoreMonitoring();
  };

  const loadJSGame = async () => {
    // For pure JS games, we'll load the script and initialize
    if (!containerRef.current) return;

    await loadGameScript(game.sourceUrl);
    setupScoreMonitoring();
  };

  const loadGameScript = async (url: string, canvas?: HTMLCanvasElement) => {
    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => {
        // Initialize game if there's an init function
        if (typeof (window as any).initGame === 'function') {
          (window as any).initGame(canvas);
        }
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load game script'));
      document.head.appendChild(script);
    });
  };

  const handleGameMessage = useCallback((event: MessageEvent) => {
    // Handle messages from iframe games
    if (event.data && typeof event.data === 'object') {
      if (event.data.type === 'score') {
        const newScore = event.data.score;
        setScore(newScore);
        onScoreUpdate(newScore);
      } else if (event.data.type === 'gameEnd') {
        handleGameEnd(event.data.score || score);
      }
    }
  }, [score, onScoreUpdate]);

  const setupScoreMonitoring = () => {
    // Monitor for common score variables in global scope
    const checkScore = () => {
      const globalScope = window as any;
      let detectedScore = 0;

      // Common score variable names
      const scoreVars = ['score', 'points', 'gameScore', 'playerScore', 'currentScore'];
      
      for (const varName of scoreVars) {
        if (typeof globalScope[varName] === 'number') {
          detectedScore = Math.max(detectedScore, globalScope[varName]);
        }
      }

      if (detectedScore !== score) {
        setScore(detectedScore);
        onScoreUpdate(detectedScore);
      }

      // Check for game end conditions
      if (globalScope.gameOver || globalScope.gameEnded || globalScope.isGameOver) {
        handleGameEnd(detectedScore);
      }
    };

    // Check score every 100ms
    const interval = setInterval(checkScore, 100);

    // Cleanup after 10 minutes max
    setTimeout(() => clearInterval(interval), 600000);

    return () => clearInterval(interval);
  };

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
  }, [game.estimatedPlayTime, gameState, score]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('message', handleGameMessage);
      
      // Cleanup any global game variables
      const globalScope = window as any;
      if (globalScope.cleanupGame && typeof globalScope.cleanupGame === 'function') {
        globalScope.cleanupGame();
      }
    };
  }, [handleGameMessage]);

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

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      {/* Game Info Header */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(255,255,255,0.9)',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#333',
        zIndex: 1001
      }}>
        🎮 {game.name} | Score: {score}
      </div>

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

      {/* Loading State */}
      {isLoading && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: 'white'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }} />
          <p>Loading {game.name}...</p>
        </div>
      )}

      {/* Game Container */}
      <div
        ref={containerRef}
        style={{
          width: '90%',
          height: '80%',
          maxWidth: '800px',
          maxHeight: '600px',
          background: '#000',
          borderRadius: '8px',
          overflow: 'hidden',
          display: isLoading ? 'none' : 'block'
        }}
      />

      {/* Touch Controls Hint */}
      {game.touchControls && (
        <TouchControlsHint 
          gameType="external" 
          isVisible={!isLoading}
          autoHide={true}
        />
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
