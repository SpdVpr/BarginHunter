/** @jsxImportSource react */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import TouchControlsHint from './TouchControlsHint';
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

interface ArkanoidEngineProps {
  onGameEnd: (score: number, gameData: any) => void;
  onScoreUpdate: (score: number) => void;
  gameConfig: GameConfig;
  onShowIntro: () => void;
}

// Game constants
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 15;
const BALL_SIZE = 12;
const BRICK_WIDTH = 60;
const BRICK_HEIGHT = 20;
const BRICK_ROWS = 8;
const BRICK_COLS = 10;
const BALL_SPEED = 4; // Reduced from 6 for better playability

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

interface Paddle {
  x: number;
  y: number;
}

interface Brick {
  x: number;
  y: number;
  visible: boolean;
  color: string;
  points: number;
}

export default function ArkanoidEngine({
  onGameEnd,
  onScoreUpdate,
  gameConfig,
  onShowIntro,
  adminTest = false,
  onClose
}: ArkanoidEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gameStartTime = useRef<number>(0);
  const [gameScorer] = useState(() => new GameScorer());
  
  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });
  
  const [ball, setBall] = useState<Ball>({
    x: 300,
    y: 300,
    dx: BALL_SPEED * 0.7,
    dy: -BALL_SPEED
  });
  
  const [paddle, setPaddle] = useState<Paddle>({
    x: 250,
    y: 370
  });
  
  const [bricks, setBricks] = useState<Brick[]>([]);
  const [mouseX, setMouseX] = useState(0);

  // Initialize bricks
  const initializeBricks = useCallback(() => {
    const newBricks: Brick[] = [];
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        newBricks.push({
          x: col * (BRICK_WIDTH + 5) + 50,
          y: row * (BRICK_HEIGHT + 5) + 50,
          visible: true,
          color: colors[row % colors.length],
          points: (BRICK_ROWS - row) * 10
        });
      }
    }
    setBricks(newBricks);
  }, []);

  // Handle canvas resize
  useEffect(() => {
    const updateCanvasSize = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        const maxWidth = Math.min(rect.width - 40, 800);
        const maxHeight = Math.min(rect.height - 40, 600);
        
        setCanvasSize({
          width: maxWidth,
          height: maxHeight
        });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Mouse movement handler
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isRunning) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setMouseX(x);
    
    setPaddle(prev => ({
      ...prev,
      x: Math.max(0, Math.min(canvasSize.width - PADDLE_WIDTH, x - PADDLE_WIDTH / 2))
    }));
  }, [isRunning, canvasSize.width]);

  // Touch movement handler
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isRunning) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    setMouseX(x);
    
    setPaddle(prev => ({
      ...prev,
      x: Math.max(0, Math.min(canvasSize.width - PADDLE_WIDTH, x - PADDLE_WIDTH / 2))
    }));
  }, [isRunning, canvasSize.width]);

  // Setup event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleMouseMove, handleTouchMove]);

  // Collision detection
  const checkCollision = useCallback((ball: Ball, brick: Brick) => {
    return ball.x < brick.x + BRICK_WIDTH &&
           ball.x + BALL_SIZE > brick.x &&
           ball.y < brick.y + BRICK_HEIGHT &&
           ball.y + BALL_SIZE > brick.y;
  }, []);

  // Ball-paddle collision
  const checkPaddleCollision = useCallback((ball: Ball, paddle: Paddle) => {
    return ball.x < paddle.x + PADDLE_WIDTH &&
           ball.x + BALL_SIZE > paddle.x &&
           ball.y + BALL_SIZE > paddle.y &&
           ball.y < paddle.y + PADDLE_HEIGHT;
  }, []);

  // Draw game
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    
    // Draw background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    
    // Draw bricks
    bricks.forEach(brick => {
      if (brick.visible) {
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);
        
        // Brick border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);
      }
    });
    
    // Draw paddle
    ctx.fillStyle = '#4ECDC4';
    ctx.fillRect(paddle.x, paddle.y, PADDLE_WIDTH, PADDLE_HEIGHT);
    
    // Draw ball
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.arc(ball.x + BALL_SIZE/2, ball.y + BALL_SIZE/2, BALL_SIZE/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw UI
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${formatScore(score)}`, 20, 30);
    ctx.fillText(`Lives: ${lives}`, canvasSize.width - 100, 30);
    ctx.fillText(`Level: ${level}`, canvasSize.width / 2 - 30, 30);
  }, [canvasSize, bricks, paddle, ball, score, lives, level]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (!isRunning) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    // Update ball position
    setBall(prevBall => {
      let newBall = {
        ...prevBall,
        x: prevBall.x + prevBall.dx,
        y: prevBall.y + prevBall.dy
      };
      
      // Wall collisions
      if (newBall.x <= 0 || newBall.x + BALL_SIZE >= canvasSize.width) {
        newBall.dx = -newBall.dx;
      }
      if (newBall.y <= 0) {
        newBall.dy = -newBall.dy;
      }
      
      // Paddle collision
      if (checkPaddleCollision(newBall, paddle)) {
        newBall.dy = -Math.abs(newBall.dy);
        // Add angle based on where ball hits paddle
        const hitPos = (newBall.x + BALL_SIZE/2 - paddle.x) / PADDLE_WIDTH;
        newBall.dx = BALL_SPEED * (hitPos - 0.5) * 2;
      }
      
      // Brick collisions
      setBricks(prevBricks => {
        const newBricks = [...prevBricks];
        let hitBrick = false;
        
        newBricks.forEach(brick => {
          if (brick.visible && checkCollision(newBall, brick)) {
            brick.visible = false;
            hitBrick = true;
            
            // Update score
            const newScore = score + brick.points;
            setScore(newScore);
            onScoreUpdate(newScore);
            gameScorer.addScore(brick.points);
          }
        });
        
        if (hitBrick) {
          newBall.dy = -newBall.dy;
        }
        
        return newBricks;
      });
      
      // Ball fell off bottom
      if (newBall.y > canvasSize.height) {
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            // Game over
            setIsRunning(false);
            onGameEnd(score, {
              duration: Date.now() - gameStartTime.current,
              level: level,
              bricksDestroyed: bricks.filter(b => !b.visible).length
            });
          } else {
            // Reset ball
            newBall = {
              x: canvasSize.width / 2,
              y: canvasSize.height - 100,
              dx: BALL_SPEED * 0.7,
              dy: -BALL_SPEED
            };
          }
          return newLives;
        });
      }
      
      return newBall;
    });
    
    // Check if all bricks destroyed
    const visibleBricks = bricks.filter(b => b.visible).length;
    if (visibleBricks === 0) {
      // Level complete
      setLevel(prev => prev + 1);
      initializeBricks();
      setBall({
        x: canvasSize.width / 2,
        y: canvasSize.height - 100,
        dx: BALL_SPEED * 0.7,
        dy: -BALL_SPEED
      });
    }
    
    draw(ctx);
    
    if (isRunning) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [isRunning, canvasSize, paddle, ball, bricks, score, lives, level, checkPaddleCollision, checkCollision, draw, onGameEnd, onScoreUpdate, initializeBricks]);

  // Start game
  const startGame = useCallback(() => {
    gameScorer.reset();
    setIsRunning(true);
    setScore(0);
    setLives(3);
    setLevel(1);
    
    setBall({
      x: canvasSize.width / 2,
      y: canvasSize.height - 100,
      dx: BALL_SPEED * 0.7,
      dy: -BALL_SPEED
    });
    
    setPaddle({
      x: canvasSize.width / 2 - PADDLE_WIDTH / 2,
      y: canvasSize.height - 30
    });
    
    initializeBricks();
    gameStartTime.current = Date.now();
  }, [canvasSize, initializeBricks]);

  // Auto-start game
  useEffect(() => {
    if (canvasSize.width > 0 && canvasSize.height > 0) {
      startGame();
    }
  }, [canvasSize, startGame]);

  // Start game loop
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
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative'
    }}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{
          border: '2px solid #fff',
          borderRadius: '10px',
          backgroundColor: '#1a1a2e',
          cursor: 'none'
        }}
      />
      
      <TouchControlsHint 
        controls={['Move mouse or drag to control paddle']}
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      />
      {/* Close button for admin testing */}
      {adminTest && onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          ×
        </button>
      )}
      
      <button
        onClick={onShowIntro}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(255,255,255,0.2)',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        ← Back
      </button>
    </div>
  );
}
