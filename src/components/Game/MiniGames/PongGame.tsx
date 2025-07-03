/** @jsxImportSource react */
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface PongGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

export default function PongGame({ onGameEnd, onScoreUpdate }: PongGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
  const [ball, setBall] = useState<Ball>({
    x: 400,
    y: 300,
    dx: 5,
    dy: 3,
    size: 12
  });
  const [playerPaddle, setPlayerPaddle] = useState<Paddle>({
    x: 50,
    y: 250,
    width: 15,
    height: 100,
    speed: 8
  });
  const [aiPaddle, setAiPaddle] = useState<Paddle>({
    x: 735,
    y: 250,
    width: 15,
    height: 100,
    speed: 6
  });
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});
  const [gameTime, setGameTime] = useState(0);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const WINNING_SCORE = 11;

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
      const mouseY = e.clientY - rect.top;
      const scaledY = (mouseY / rect.height) * CANVAS_HEIGHT;
      
      setPlayerPaddle(prev => ({
        ...prev,
        y: Math.max(0, Math.min(CANVAS_HEIGHT - prev.height, scaledY - prev.height / 2))
      }));
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    return () => canvas.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Reset ball to center
  const resetBall = useCallback((direction: 'left' | 'right') => {
    setBall({
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      dx: direction === 'left' ? -5 : 5,
      dy: (Math.random() - 0.5) * 6,
      size: 12
    });
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      setGameTime(prev => prev + 1);

      // Move player paddle with keyboard
      setPlayerPaddle(prev => {
        let newY = prev.y;
        if (keys['ArrowUp'] || keys['w']) newY -= prev.speed;
        if (keys['ArrowDown'] || keys['s']) newY += prev.speed;
        return {
          ...prev,
          y: Math.max(0, Math.min(CANVAS_HEIGHT - prev.height, newY))
        };
      });

      // AI paddle movement (follows ball with some lag)
      setAiPaddle(prev => {
        const ballCenterY = ball.y;
        const paddleCenterY = prev.y + prev.height / 2;
        const diff = ballCenterY - paddleCenterY;
        
        let newY = prev.y;
        if (Math.abs(diff) > 10) {
          if (diff > 0) newY += prev.speed * 0.8; // AI is slightly slower
          else newY -= prev.speed * 0.8;
        }
        
        return {
          ...prev,
          y: Math.max(0, Math.min(CANVAS_HEIGHT - prev.height, newY))
        };
      });

      // Move ball
      setBall(prev => {
        let newX = prev.x + prev.dx;
        let newY = prev.y + prev.dy;
        let newDx = prev.dx;
        let newDy = prev.dy;

        // Top and bottom wall collisions
        if (newY <= prev.size / 2 || newY >= CANVAS_HEIGHT - prev.size / 2) {
          newDy = -newDy;
          newY = prev.y; // Reset position to prevent sticking
        }

        // Player paddle collision
        if (
          newX - prev.size / 2 <= playerPaddle.x + playerPaddle.width &&
          newX + prev.size / 2 >= playerPaddle.x &&
          newY >= playerPaddle.y &&
          newY <= playerPaddle.y + playerPaddle.height &&
          newDx < 0
        ) {
          newDx = -newDx;
          // Add angle based on where ball hits paddle
          const hitPos = (newY - playerPaddle.y) / playerPaddle.height;
          newDy = (hitPos - 0.5) * 8;
          newX = playerPaddle.x + playerPaddle.width + prev.size / 2;
        }

        // AI paddle collision
        if (
          newX + prev.size / 2 >= aiPaddle.x &&
          newX - prev.size / 2 <= aiPaddle.x + aiPaddle.width &&
          newY >= aiPaddle.y &&
          newY <= aiPaddle.y + aiPaddle.height &&
          newDx > 0
        ) {
          newDx = -newDx;
          // Add angle based on where ball hits paddle
          const hitPos = (newY - aiPaddle.y) / aiPaddle.height;
          newDy = (hitPos - 0.5) * 8;
          newX = aiPaddle.x - prev.size / 2;
        }

        // Score points
        if (newX < 0) {
          // AI scores
          setAiScore(prevScore => {
            const newScore = prevScore + 1;
            if (newScore >= WINNING_SCORE) {
              setGameState('gameOver');
              onGameEnd(playerScore * 100); // Player score as final score
            }
            return newScore;
          });
          resetBall('right');
          return prev;
        }

        if (newX > CANVAS_WIDTH) {
          // Player scores
          setPlayerScore(prevScore => {
            const newScore = prevScore + 1;
            onScoreUpdate(newScore * 100);
            if (newScore >= WINNING_SCORE) {
              setGameState('gameOver');
              onGameEnd(newScore * 100 + 500); // Bonus for winning
            }
            return newScore;
          });
          resetBall('left');
          return prev;
        }

        return { ...prev, x: newX, y: newY, dx: newDx, dy: newDy };
      });
    }, 16); // ~60 FPS

    return () => clearInterval(gameLoop);
  }, [gameState, keys, ball, playerPaddle, aiPaddle, playerScore, resetBall, onScoreUpdate, onGameEnd]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with retro black background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw center line
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 15]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = '#fff';
    ctx.fillRect(playerPaddle.x, playerPaddle.y, playerPaddle.width, playerPaddle.height);
    ctx.fillRect(aiPaddle.x, aiPaddle.y, aiPaddle.width, aiPaddle.height);

    // Draw ball
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw scores
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(playerScore.toString(), CANVAS_WIDTH / 4, 80);
    ctx.fillText(aiScore.toString(), (3 * CANVAS_WIDTH) / 4, 80);

    // Draw game time
    ctx.font = '16px monospace';
    ctx.fillText(`Time: ${Math.floor(gameTime / 60)}s`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);

    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      
      if (playerScore >= WINNING_SCORE) {
        ctx.fillText('YOU WIN!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.font = '24px monospace';
        ctx.fillText(`Final Score: ${playerScore * 100 + 500}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
      } else {
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.font = '24px monospace';
        ctx.fillText(`Final Score: ${playerScore * 100}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
      }
    }
  });

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #333 0%, #000 100%)',
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
        <div>🏓 Pong Classic</div>
        <div>You: {playerScore}</div>
        <div>AI: {aiScore}</div>
        <div>First to {WINNING_SCORE} wins!</div>
      </div>

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          border: '3px solid #fff',
          borderRadius: '10px',
          background: '#000',
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
          Move paddle: Mouse or Arrow Keys (W/S). First to {WINNING_SCORE} points wins!
        </div>
      </div>
    </div>
  );
}
