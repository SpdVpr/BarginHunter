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
    // Mobile: portrait orientation
    const width = Math.min(window.innerWidth - 20, 350);
    return {
      width,
      height: 500,
    };
  } else {
    // Desktop: wider but still vertical-ish
    const width = Math.min(window.innerWidth - 40, 400);
    return {
      width,
      height: 600,
    };
  }
};

// Flappy Bird physics
const GRAVITY = 0.6;
const FLAP_FORCE = -12;
const PIPE_SPEED = 2;
const PIPE_GAP = 120;
const PIPE_WIDTH = 60;

// Bird constants
const BIRD_SIZE = 30;
const BIRD_X = 80;

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
    y: canvasSize.height / 2,
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
        y: newSize.height / 2,
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Draw bird
  const drawBird = useCallback((ctx: CanvasRenderingContext2D, bird: Bird) => {
    const { x, y, size } = bird;
    
    // Bird body
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Bird wing
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.ellipse(x - 5, y, size / 3, size / 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Bird eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x + 5, y - 5, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Bird beak
    ctx.fillStyle = '#FF4500';
    ctx.beginPath();
    ctx.moveTo(x + size / 2, y);
    ctx.lineTo(x + size / 2 + 8, y - 2);
    ctx.lineTo(x + size / 2 + 8, y + 2);
    ctx.fill();
  }, []);

  // Draw pipe
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
  }, [canvasSize.height]);

  // Draw background
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = canvasSize;
    
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Simple clouds
    ctx.fillStyle = '#FFFFFF';
    const cloudOffset = (Date.now() * 0.01) % (width + 100);
    for (let i = 0; i < 3; i++) {
      const cloudX = (i * 150 - cloudOffset) % (width + 100);
      const cloudY = 50 + i * 40;
      ctx.beginPath();
      ctx.arc(cloudX, cloudY, 20, 0, Math.PI * 2);
      ctx.arc(cloudX + 20, cloudY, 25, 0, Math.PI * 2);
      ctx.arc(cloudX + 40, cloudY, 20, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [canvasSize]);

  // Handle flap
  const handleFlap = useCallback(() => {
    if (!isRunning) return;
    
    setBird(prev => ({
      ...prev,
      velocityY: FLAP_FORCE
    }));
  }, [isRunning]);

  // Spawn pipe
  const spawnPipe = useCallback(() => {
    const minHeight = 50;
    const maxHeight = canvasSize.height - PIPE_GAP - 50;
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

  // Check collision
  const checkCollision = useCallback((bird: Bird, pipes: Pipe[]) => {
    // Ground collision
    if (bird.y + bird.size / 2 >= canvasSize.height || bird.y - bird.size / 2 <= 0) {
      return true;
    }
    
    // Pipe collision
    for (const pipe of pipes) {
      if (bird.x + bird.size / 2 > pipe.x && 
          bird.x - bird.size / 2 < pipe.x + PIPE_WIDTH) {
        if (bird.y - bird.size / 2 < pipe.topHeight || 
            bird.y + bird.size / 2 > pipe.bottomY) {
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
    if (now - lastPipeSpawn > 2000) { // Every 2 seconds
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
      y: canvasSize.height / 2,
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
