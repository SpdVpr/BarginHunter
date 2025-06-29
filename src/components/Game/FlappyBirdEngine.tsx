/** @jsxImportSource react */
import React, { useRef, useEffect, useState, useCallback } from 'react';

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
}

// Game constants - Flappy Bird style
const getCanvasSize = () => {
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    // Mobile: horizontal but compact
    const width = Math.min(window.innerWidth - 20, 400);
    return {
      width,
      height: 250,
    };
  } else {
    // Desktop: wide horizontal like Chrome Dino
    const width = Math.min(window.innerWidth - 40, 800);
    return {
      width,
      height: 300,
    };
  }
};

// Easy Flappy Bird physics - much more playable
const GRAVITY = 0.15; // Very light gravity for easy control
const FLAP_FORCE = -3.5; // Gentle flap force
const PIPE_SPEED = 1.5; // Moderate speed
const PIPE_GAP = 150; // Large gap for easy passage
const PIPE_WIDTH = 50; // Standard pipe width

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
  onShowIntro 
}: FlappyBirdEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gameStartTime = useRef<number>(0);
  
  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [lastPipeSpawn, setLastPipeSpawn] = useState(0);
  const [canvasSize, setCanvasSize] = useState(getCanvasSize());
  
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
      const newSize = getCanvasSize();
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

  // Spawn pipe - easy gameplay logic
  const spawnPipe = useCallback(() => {
    const minHeight = 40;
    const maxHeight = canvasSize.height - PIPE_GAP - 40;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;

    const newPipe: Pipe = {
      x: canvasSize.width,
      topHeight,
      bottomY: topHeight + PIPE_GAP,
      passed: false,
      id: Date.now()
    };

    setPipes(prev => [...prev, newPipe]);
  }, [canvasSize]);

  // Check collision - forgiving for easy gameplay
  const checkCollision = useCallback((bird: Bird, pipes: Pipe[]) => {
    const tolerance = 5; // 5px tolerance for easier gameplay

    // Ground and ceiling collision with tolerance
    if (bird.y + bird.size / 2 >= canvasSize.height - 20 || bird.y - bird.size / 2 <= 0) {
      return true;
    }

    // Pipe collision with tolerance
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
    
    // Spawn pipes
    const now = Date.now();
    if (now - lastPipeSpawn > 3000) { // Every 3 seconds for easy gameplay
      spawnPipe();
      setLastPipeSpawn(now);
    }
    
    // Update pipes and score
    setPipes(prev => {
      const updated = prev.map(pipe => ({
        ...pipe,
        x: pipe.x - PIPE_SPEED
      })).filter(pipe => pipe.x > -PIPE_WIDTH);
      
      // Check for score
      updated.forEach(pipe => {
        if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
          pipe.passed = true;
          const newScore = score + 1;
          setScore(newScore);
          onScoreUpdate(newScore);
        }
      });
      
      return updated;
    });
    
    // Check collisions
    if (checkCollision(bird, pipes)) {
      setIsRunning(false);
      onGameEnd(score, {
        duration: Date.now() - gameStartTime.current,
        pipesCleared: score,
        gameType: 'flappy_bird'
      });
      return;
    }
    
    // Draw pipes
    pipes.forEach(pipe => drawPipe(ctx, pipe));
    
    // Draw bird
    drawBird(ctx, bird);
    
    // Continue game loop
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [isRunning, bird, pipes, score, lastPipeSpawn, canvasSize, onScoreUpdate, onGameEnd, drawBackground, drawPipe, drawBird, spawnPipe, checkCollision]);

  // Start game
  const startGame = useCallback(() => {
    setIsRunning(true);
    setScore(0);
    setPipes([]);
    setLastPipeSpawn(0);
    setBird({
      x: BIRD_X,
      y: canvasSize.height * 0.5,
      velocityY: 0,
      size: BIRD_SIZE,
    });
    gameStartTime.current = Date.now();
  }, [canvasSize]);

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
    
    const handleClick = () => {
      handleFlap();
    };
    
    window.addEventListener('keydown', handleKeyPress);
    const canvas = canvasRef.current;
    canvas?.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      canvas?.removeEventListener('click', handleClick);
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
    <div style={{ 
      textAlign: 'center',
      padding: '10px',
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{
          border: '2px solid #228B22',
          borderRadius: '8px',
          cursor: 'pointer',
          background: '#87CEEB',
          maxWidth: '100%',
          height: 'auto',
          display: 'block',
          margin: '0 auto'
        }}
      />
      
      <div style={{ marginTop: '15px' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
          Score: {score}
        </div>
        <div style={{ fontSize: '14px', color: '#888', marginTop: '10px' }}>
          Click or SPACE to flap!
        </div>
      </div>
    </div>
  );
}
