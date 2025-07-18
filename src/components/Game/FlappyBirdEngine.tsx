/** @jsxImportSource react */
import React, { useRef, useEffect, useState, useCallback } from 'react';

import { GameScorer, DIFFICULTY_PROGRESSION, getDifficultyName, formatScore } from '../../utils/gameScoring';

interface GameConfig {
  discountTiers: Array<{
    minScore: number;
    discount: number;
  }>;
  maxAttempts: number;
  minDiscount: number;
  maxDiscount: number;
}

interface FlappyBirdEngineProps {
  onGameEnd: (score: number, gameData: any) => void;
  onScoreUpdate: (score: number) => void;
  gameConfig: GameConfig;
  onShowIntro: () => void;
  adminTest?: boolean;
  onClose?: () => void;
}

// Game canvas that adapts to context (iframe or fullscreen)
const getCanvasSize = (adminTest = false) => {
  if (adminTest) {
    // Use iframe dimensions for admin testing
    const isMobile = window.innerWidth < 768;
    return {
      width: isMobile ? 370 : 540,
      height: isMobile ? 600 : 700,
    };
  } else {
    // Use full viewport dimensions for normal widget
    const width = window.innerWidth;
    let height = window.innerHeight;

    // Reduce height by 20% on mobile devices for better usability
    const isMobile = width <= 768;
    if (isMobile) {
      height = height * 0.8; // 20% reduction
    }

    return {
      width: width,
      height: height,
    };
  }
};

// Balanced Flappy Bird physics with progressive difficulty
const GRAVITY = 0.2; // Reduced gravity for easier control
const FLAP_FORCE = -4.5; // Adjusted flap force for new gravity
const BASE_PIPE_GAP = 120; // Base gap size (will adjust with difficulty)
const PIPE_WIDTH = 50; // Standard pipe width
const GRACE_PERIOD = 3000; // 3 seconds without pipes at start

// Bird constants - easy horizontal layout
const BIRD_SIZE = 28;
const BIRD_X = 100;

interface Bird {
  x: number;
  y: number;
  velocityY: number;
  size: number;
}

interface Pipe {
  x: number;
  topHeight: number;
  bottomY: number;
  passed: boolean;
  id: number;
}

export default function FlappyBirdEngine({
  onGameEnd,
  onScoreUpdate,
  gameConfig,
  onShowIntro,
  adminTest = false,
  onClose
}: FlappyBirdEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gameStartTime = useRef<number>(0);
  
  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [lastPipeSpawn, setLastPipeSpawn] = useState(0);
  const [canvasSize, setCanvasSize] = useState(getCanvasSize(adminTest));
  const [gameScorer] = useState(() => new GameScorer());
  const [difficultyLevel, setDifficultyLevel] = useState(0);
  
  const [bird, setBird] = useState<Bird>({
    x: BIRD_X,
    y: canvasSize.height * 0.5, // Start in middle like original
    velocityY: 0,
    size: BIRD_SIZE,
  });
  
  const [pipes, setPipes] = useState<Pipe[]>([]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newSize = getCanvasSize(adminTest);
      setCanvasSize(newSize);
      
      // Update bird position proportionally
      setBird(prev => ({
        ...prev,
        y: newSize.height * 0.5,
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Draw simple bird - clean and easy to see
  const drawBird = useCallback((ctx: CanvasRenderingContext2D, bird: Bird) => {
    const { x, y, size } = bird;

    // Simple bird body
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Bird outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Simple eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x + 5, y - 3, 3, 0, Math.PI * 2);
    ctx.fill();

    // Simple beak
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.moveTo(x + size / 2, y);
    ctx.lineTo(x + size / 2 + 8, y - 2);
    ctx.lineTo(x + size / 2 + 8, y + 2);
    ctx.fill();
  }, []);

  // Draw simple pipes - clean and visible
  const drawPipe = useCallback((ctx: CanvasRenderingContext2D, pipe: Pipe) => {
    const { x, topHeight, bottomY } = pipe;

    // Top pipe
    ctx.fillStyle = '#228B22';
    ctx.fillRect(x, 0, PIPE_WIDTH, topHeight);

    // Top pipe cap
    ctx.fillStyle = '#32CD32';
    ctx.fillRect(x - 5, topHeight - 20, PIPE_WIDTH + 10, 20);

    // Bottom pipe
    ctx.fillStyle = '#228B22';
    ctx.fillRect(x, bottomY, PIPE_WIDTH, canvasSize.height - bottomY);

    // Bottom pipe cap
    ctx.fillStyle = '#32CD32';
    ctx.fillRect(x - 5, bottomY, PIPE_WIDTH + 10, 20);

    // Simple outlines
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 0, PIPE_WIDTH, topHeight);
    ctx.strokeRect(x, bottomY, PIPE_WIDTH, canvasSize.height - bottomY);
  }, [canvasSize.height]);

  // Draw simple background - clean and minimal
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = canvasSize;

    // Simple sky
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, width, height);

    // Ground
    const groundHeight = 30;
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, height - groundHeight, width, groundHeight);

    // Ground line
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height - groundHeight);
    ctx.lineTo(width, height - groundHeight);
    ctx.stroke();
  }, [canvasSize]);

  // Handle flap
  const handleFlap = useCallback(() => {
    if (!isRunning) return;
    
    setBird(prev => ({
      ...prev,
      velocityY: FLAP_FORCE
    }));
  }, [isRunning]);

  // Spawn pipe with progressive difficulty
  const spawnPipe = useCallback(() => {
    const currentDifficulty = gameScorer.getCurrentDifficultyLevel();
    // Adjust gap size based on difficulty (easier at start, harder later)
    const gapSize = Math.max(80, BASE_PIPE_GAP - (currentDifficulty.level * 5));

    const minHeight = 50;
    const maxHeight = canvasSize.height - gapSize - 50;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;

    const newPipe: Pipe = {
      x: canvasSize.width,
      topHeight,
      bottomY: topHeight + gapSize,
      passed: false,
      id: Date.now()
    };

    setPipes(prev => [...prev, newPipe]);
  }, [canvasSize, gameScorer]);

  // Check collision - balanced precision
  const checkCollision = useCallback((bird: Bird, pipes: Pipe[]) => {
    const tolerance = 2; // Small tolerance for fair gameplay

    // Ground and ceiling collision
    if (bird.y + bird.size / 2 >= canvasSize.height - 30 || bird.y - bird.size / 2 <= 0) {
      return true;
    }

    // Pipe collision with small tolerance
    for (const pipe of pipes) {
      if (bird.x + bird.size / 2 - tolerance > pipe.x &&
          bird.x - bird.size / 2 + tolerance < pipe.x + PIPE_WIDTH) {
        if (bird.y - bird.size / 2 + tolerance < pipe.topHeight ||
            bird.y + bird.size / 2 - tolerance > pipe.bottomY) {
          return true;
        }
      }
    }

    return false;
  }, [canvasSize.height]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (!isRunning) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    
    // Draw background
    drawBackground(ctx);
    
    // Update bird physics
    setBird(prev => {
      let newY = prev.y + prev.velocityY;
      let newVelocityY = prev.velocityY + GRAVITY;
      
      return {
        ...prev,
        y: newY,
        velocityY: newVelocityY
      };
    });
    
    // Update score using universal scoring system
    const newScore = gameScorer.updateTimeScore();
    setScore(newScore);
    onScoreUpdate(newScore);

    // Update difficulty based on score
    const currentDifficulty = gameScorer.getCurrentDifficultyLevel();
    if (currentDifficulty.level - 1 !== difficultyLevel) {
      setDifficultyLevel(currentDifficulty.level - 1);
    }

    // Spawn pipes based on current difficulty (with grace period)
    const now = Date.now();
    const gameTime = now - gameStartTime.current;

    // Only spawn pipes after grace period
    if (gameTime > GRACE_PERIOD && now - lastPipeSpawn > currentDifficulty.spawnRate) {
      spawnPipe();
      setLastPipeSpawn(now);
    }

    // Update pipes and check for bonus points
    setPipes(prev => {
      const updated = prev.map(pipe => ({
        ...pipe,
        x: pipe.x - currentDifficulty.speed
      }));

      // Check for pipes passed (add bonus points)
      updated.forEach(pipe => {
        if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
          pipe.passed = true;
          const bonusScore = gameScorer.addObstaclePoints();
          setScore(bonusScore);
          onScoreUpdate(bonusScore);
        }
      });

      return updated.filter(pipe => pipe.x > -PIPE_WIDTH);
    });
    
    // Check collisions
    if (checkCollision(bird, pipes)) {
      setIsRunning(false);
      onGameEnd(gameScorer.getScore(), {
        ...gameScorer.getGameStats(),
        gameType: 'flappy_bird'
      });
      return;
    }
    
    // Draw pipes
    pipes.forEach(pipe => drawPipe(ctx, pipe));
    
    // Draw bird
    drawBird(ctx, bird);

    // Draw score overlay
    ctx.fillStyle = '#333';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${formatScore(score)}`, 10, 30);

    // Show current discount based on score (find highest applicable tier)
    const sortedTiers = [...discountTiers].sort((a, b) => b.minScore - a.minScore);
    const currentDiscount = sortedTiers.find(tier => score >= tier.minScore)?.discount || 0;
    if (currentDiscount > 0) {
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#000000'; // Black color
      ctx.fillText(`${currentDiscount}% OFF`, 10, 55);
    }

    // Continue game loop
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [isRunning, bird, pipes, score, lastPipeSpawn, canvasSize, onScoreUpdate, onGameEnd, drawBackground, drawPipe, drawBird, spawnPipe, checkCollision]);

  // Start game
  const startGame = useCallback(() => {
    gameScorer.reset();
    setIsRunning(true);
    setScore(0);
    setDifficultyLevel(0);
    setPipes([]);
    setLastPipeSpawn(0);
    setBird({
      x: BIRD_X,
      y: canvasSize.height * 0.5,
      velocityY: 0,
      size: BIRD_SIZE,
    });
    gameStartTime.current = Date.now();
  }, [canvasSize, gameScorer]);

  // Auto-start game when component mounts
  useEffect(() => {
    startGame();
  }, [startGame]);

  // Event listeners
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlap();
      }
    };

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      handleFlap();
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      handleFlap();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyPress);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('click', handleClick);
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
      canvas.style.touchAction = 'none'; // Prevent scrolling on touch
    }

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (canvas) {
        canvas.removeEventListener('click', handleClick);
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [handleFlap]);

  // Game loop effect
  useEffect(() => {
    if (isRunning) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, gameLoop]);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={adminTest ? {
          display: 'block',
          cursor: 'pointer',
          background: '#000',
          margin: 0,
          padding: 0,
          border: 'none',
          borderRadius: 0,
          boxShadow: 'none',
          width: `${canvasSize.width}px`,
          height: `${canvasSize.height}px`,
          position: 'relative',
          zIndex: 1
        } : {
          display: 'block',
          cursor: 'pointer',
          background: '#000',
          margin: 0,
          padding: 0,
          border: 'none',
          borderRadius: 0,
          boxShadow: 'none',
          width: '100vw',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 1
        }}
      />

      {/* Close button for admin testing */}
      {adminTest && onClose && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎮 Flappy Bird close button clicked!');
            onClose();
          }}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            fontSize: '24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            zIndex: 1000
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
      )}
    </>
  );
}
