/** @jsxImportSource react */
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface BreakoutGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  destroyed: boolean;
  color: string;
  points: number;
}

export default function BreakoutGame({ onGameEnd, onScoreUpdate }: BreakoutGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('playing');
  const [ball, setBall] = useState<Ball>({
    x: 400,
    y: 300,
    dx: 4,
    dy: -4,
    radius: 8
  });
  const [paddle, setPaddle] = useState<Paddle>({
    x: 350,
    y: 550,
    width: 100,
    height: 15
  });
  const [bricks, setBricks] = useState<Brick[]>([]);
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const BRICK_ROWS = 5;
  const BRICK_COLS = 10;
  const BRICK_WIDTH = 75;
  const BRICK_HEIGHT = 20;
  const BRICK_PADDING = 5;

  // Initialize bricks
  const initializeBricks = useCallback(() => {
    const newBricks: Brick[] = [];
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'];
    
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        newBricks.push({
          x: col * (BRICK_WIDTH + BRICK_PADDING) + BRICK_PADDING,
          y: row * (BRICK_HEIGHT + BRICK_PADDING) + 50,
          width: BRICK_WIDTH,
          height: BRICK_HEIGHT,
          destroyed: false,
          color: colors[row],
          points: (BRICK_ROWS - row) * 10 // Higher rows = more points
        });
      }
    }
    setBricks(newBricks);
  }, []);

  // Initialize game
  useEffect(() => {
    initializeBricks();
  }, [initializeBricks]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key]: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle mouse movement
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const scaledX = (mouseX / rect.width) * CANVAS_WIDTH;
      
      setPaddle(prev => ({
        ...prev,
        x: Math.max(0, Math.min(CANVAS_WIDTH - prev.width, scaledX - prev.width / 2))
      }));
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    return () => canvas.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      // Move paddle with keyboard
      setPaddle(prev => {
        let newX = prev.x;
        if (keys['ArrowLeft'] || keys['a']) newX -= 8;
        if (keys['ArrowRight'] || keys['d']) newX += 8;
        return {
          ...prev,
          x: Math.max(0, Math.min(CANVAS_WIDTH - prev.width, newX))
        };
      });

      // Move ball
      setBall(prev => {
        let newX = prev.x + prev.dx;
        let newY = prev.y + prev.dy;
        let newDx = prev.dx;
        let newDy = prev.dy;

        // Wall collisions
        if (newX <= prev.radius || newX >= CANVAS_WIDTH - prev.radius) {
          newDx = -newDx;
          newX = prev.x; // Reset position to prevent sticking
        }
        if (newY <= prev.radius) {
          newDy = -newDy;
          newY = prev.radius;
        }

        // Paddle collision
        if (
          newY + prev.radius >= paddle.y &&
          newY - prev.radius <= paddle.y + paddle.height &&
          newX >= paddle.x &&
          newX <= paddle.x + paddle.width
        ) {
          newDy = -Math.abs(newDy); // Always bounce up
          // Add angle based on where ball hits paddle
          const hitPos = (newX - paddle.x) / paddle.width;
          newDx = (hitPos - 0.5) * 8; // -4 to 4 range
        }

        // Bottom wall (lose life)
        if (newY >= CANVAS_HEIGHT) {
          setLives(prevLives => {
            const newLives = prevLives - 1;
            if (newLives <= 0) {
              setGameState('gameOver');
              onGameEnd(score);
            }
            return newLives;
          });
          
          // Reset ball
          return {
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT / 2,
            dx: 4 * (Math.random() > 0.5 ? 1 : -1),
            dy: -4,
            radius: prev.radius
          };
        }

        // Brick collisions
        setBricks(prevBricks => {
          const newBricks = [...prevBricks];
          let hitBrick = false;

          for (let i = 0; i < newBricks.length; i++) {
            const brick = newBricks[i];
            if (brick.destroyed) continue;

            if (
              newX + prev.radius >= brick.x &&
              newX - prev.radius <= brick.x + brick.width &&
              newY + prev.radius >= brick.y &&
              newY - prev.radius <= brick.y + brick.height
            ) {
              newBricks[i] = { ...brick, destroyed: true };
              hitBrick = true;
              
              // Update score
              setScore(prevScore => {
                const newScore = prevScore + brick.points;
                onScoreUpdate(newScore);
                return newScore;
              });

              // Determine bounce direction
              const ballCenterX = newX;
              const ballCenterY = newY;
              const brickCenterX = brick.x + brick.width / 2;
              const brickCenterY = brick.y + brick.height / 2;

              if (Math.abs(ballCenterX - brickCenterX) > Math.abs(ballCenterY - brickCenterY)) {
                newDx = -newDx;
              } else {
                newDy = -newDy;
              }
              break;
            }
          }

          // Check if all bricks destroyed
          if (newBricks.every(brick => brick.destroyed)) {
            setLevel(prevLevel => prevLevel + 1);
            initializeBricks();
            // Increase ball speed slightly
            newDx *= 1.1;
            newDy *= 1.1;
          }

          return newBricks;
        });

        return { x: newX, y: newY, dx: newDx, dy: newDy, radius: prev.radius };
      });
    }, 16); // ~60 FPS

    return () => clearInterval(gameLoop);
  }, [gameState, keys, paddle, score, onScoreUpdate, onGameEnd, initializeBricks]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw bricks
    bricks.forEach(brick => {
      if (!brick.destroyed) {
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
      }
    });

    // Draw paddle
    ctx.fillStyle = '#4ecdc4';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Draw ball
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw UI
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Lives: ${lives}`, 150, 30);
    ctx.fillText(`Level: ${level}`, 280, 30);

    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.font = '24px Arial';
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    }
  });

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      {/* Game Header */}
      <div style={{
        background: 'rgba(255,255,255,0.9)',
        padding: '15px 30px',
        borderRadius: '15px',
        marginBottom: '20px',
        display: 'flex',
        gap: '30px',
        alignItems: 'center',
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#333'
      }}>
        <div>🧱 Breakout Classic</div>
        <div>Score: {score}</div>
        <div>Lives: {lives}</div>
        <div>Level: {level}</div>
      </div>

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          border: '3px solid rgba(255,255,255,0.3)',
          borderRadius: '10px',
          background: '#1a1a2e',
          maxWidth: '100%',
          maxHeight: '70vh'
        }}
      />

      {/* Instructions */}
      <div style={{
        background: 'rgba(255,255,255,0.9)',
        padding: '15px 25px',
        borderRadius: '12px',
        marginTop: '20px',
        textAlign: 'center',
        color: '#333',
        fontSize: '14px',
        maxWidth: '600px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
          🎯 Controls
        </div>
        <div>
          Move paddle: Mouse or Arrow Keys (A/D). Break all bricks to advance levels!
        </div>
      </div>
    </div>
  );
}
