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

// Flappy Bird physics - exact copy from flappybird.io
const GRAVITY = 0.25; // Much lighter gravity like original
const FLAP_FORCE = -4.6; // Precise flap force from original
const PIPE_SPEED = 1; // Slow and steady like original
const PIPE_GAP = 100; // Original gap size
const PIPE_WIDTH = 52; // Original pipe width

// Bird constants - original Flappy Bird
const BIRD_SIZE = 24;
const BIRD_X = 57;

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

  // Draw bird - original Flappy Bird style
  const drawBird = useCallback((ctx: CanvasRenderingContext2D, bird: Bird) => {
    const { x, y, size, velocityY } = bird;

    // Bird rotation based on velocity (like original)
    const rotation = Math.min(Math.max(velocityY * 0.1, -0.5), 0.5);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Bird body (yellow like original)
    ctx.fillStyle = '#FFDC00';
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Bird outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Bird wing
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.ellipse(-3, 0, size / 3, size / 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Bird eye (white background)
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(3, -3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Bird pupil
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(4, -3, 2, 0, Math.PI * 2);
    ctx.fill();

    // Bird beak
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.moveTo(size / 2 - 2, 0);
    ctx.lineTo(size / 2 + 6, -1);
    ctx.lineTo(size / 2 + 6, 1);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }, []);

  // Draw pipe - original Flappy Bird style
  const drawPipe = useCallback((ctx: CanvasRenderingContext2D, pipe: Pipe) => {
    const { x, topHeight, bottomY } = pipe;
    const capHeight = 24;
    const capWidth = PIPE_WIDTH + 6;

    // Top pipe body
    ctx.fillStyle = '#5CBF3B';
    ctx.fillRect(x, 0, PIPE_WIDTH, topHeight - capHeight);

    // Top pipe cap
    ctx.fillStyle = '#5CBF3B';
    ctx.fillRect(x - 3, topHeight - capHeight, capWidth, capHeight);

    // Top pipe outline
    ctx.strokeStyle = '#2F5F2F';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 0, PIPE_WIDTH, topHeight - capHeight);
    ctx.strokeRect(x - 3, topHeight - capHeight, capWidth, capHeight);

    // Bottom pipe body
    ctx.fillStyle = '#5CBF3B';
    ctx.fillRect(x, bottomY + capHeight, PIPE_WIDTH, canvasSize.height - bottomY - capHeight);

    // Bottom pipe cap
    ctx.fillStyle = '#5CBF3B';
    ctx.fillRect(x - 3, bottomY, capWidth, capHeight);

    // Bottom pipe outline
    ctx.strokeStyle = '#2F5F2F';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, bottomY + capHeight, PIPE_WIDTH, canvasSize.height - bottomY - capHeight);
    ctx.strokeRect(x - 3, bottomY, capWidth, capHeight);
  }, [canvasSize.height]);

  // Draw background - original Flappy Bird style
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = canvasSize;

    // Sky gradient (day time like original)
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#4EC0CA');
    gradient.addColorStop(1, '#4EC0CA');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Ground
    const groundHeight = 20;
    ctx.fillStyle = '#DED895';
    ctx.fillRect(0, height - groundHeight, width, groundHeight);

    // Ground outline
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height - groundHeight);
    ctx.lineTo(width, height - groundHeight);
    ctx.stroke();

    // Simple moving clouds
    ctx.fillStyle = '#FFFFFF';
    const cloudOffset = (Date.now() * 0.005) % (width + 60);
    for (let i = 0; i < 2; i++) {
      const cloudX = (i * 200 - cloudOffset) % (width + 60);
      const cloudY = 60 + i * 50;
      // Simple cloud shape
      ctx.beginPath();
      ctx.arc(cloudX, cloudY, 15, 0, Math.PI * 2);
      ctx.arc(cloudX + 15, cloudY, 20, 0, Math.PI * 2);
      ctx.arc(cloudX + 30, cloudY, 15, 0, Math.PI * 2);
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

  // Spawn pipe - original Flappy Bird logic
  const spawnPipe = useCallback(() => {
    const minHeight = 60;
    const maxHeight = canvasSize.height - PIPE_GAP - 60;
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

  // Check collision - original Flappy Bird precision
  const checkCollision = useCallback((bird: Bird, pipes: Pipe[]) => {
    // Ground and ceiling collision
    if (bird.y + bird.size / 2 >= canvasSize.height - 20 || bird.y - bird.size / 2 <= 0) {
      return true;
    }

    // Pipe collision - exact like original
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
    if (now - lastPipeSpawn > 1800) { // Every 1.8 seconds like original
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
