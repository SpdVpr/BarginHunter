/** @jsxImportSource react */
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface JumpyBirdGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface Bird {
  x: number;
  y: number;
  velocity: number;
  size: number;
}

interface Pipe {
  x: number;
  topHeight: number;
  bottomY: number;
  width: number;
  passed: boolean;
  color: string;
}

export default function JumpyBirdGame({ onGameEnd, onScoreUpdate }: JumpyBirdGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
  const [bird, setBird] = useState<Bird>({
    x: 100,
    y: 250,
    velocity: 0,
    size: 30
  });
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [gameTime, setGameTime] = useState(0);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const GRAVITY = 0.6;
  const JUMP_FORCE = -12;
  const PIPE_WIDTH = 80;
  const PIPE_GAP = 180;
  const PIPE_SPEED = 3;

  // Handle input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && gameState === 'playing') {
        e.preventDefault();
        setBird(prev => ({ ...prev, velocity: JUMP_FORCE }));
      }
    };

    const handleClick = () => {
      if (gameState === 'playing') {
        setBird(prev => ({ ...prev, velocity: JUMP_FORCE }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClick);
    };
  }, [gameState]);

  // Spawn pipes
  const spawnPipe = useCallback(() => {
    const minHeight = 100;
    const maxHeight = CANVAS_HEIGHT - PIPE_GAP - 100;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
    const colors = ['#4ecdc4', '#45b7d1', '#f39c12', '#e74c3c', '#9b59b6'];
    
    setPipes(prev => [...prev, {
      x: CANVAS_WIDTH,
      topHeight,
      bottomY: topHeight + PIPE_GAP,
      width: PIPE_WIDTH,
      passed: false,
      color: colors[Math.floor(Math.random() * colors.length)]
    }]);
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      setGameTime(prev => prev + 1);

      // Spawn pipes
      if (gameTime % 120 === 0) { // Every 2 seconds
        spawnPipe();
      }

      // Update bird
      setBird(prev => {
        const newVelocity = prev.velocity + GRAVITY;
        const newY = prev.y + newVelocity;

        // Check ground/ceiling collision
        if (newY <= 0 || newY >= CANVAS_HEIGHT - prev.size) {
          setGameState('gameOver');
          onGameEnd(score);
          return prev;
        }

        return { ...prev, y: newY, velocity: newVelocity };
      });

      // Update pipes
      setPipes(prev => {
        const updatedPipes = prev.map(pipe => ({ ...pipe, x: pipe.x - PIPE_SPEED }));
        
        // Check collisions and scoring
        updatedPipes.forEach(pipe => {
          // Check if bird passed pipe
          if (!pipe.passed && pipe.x + pipe.width < bird.x) {
            pipe.passed = true;
            setScore(prevScore => {
              const newScore = prevScore + 1;
              onScoreUpdate(newScore * 100);
              return newScore;
            });
          }

          // Check collision
          if (
            bird.x + bird.size > pipe.x &&
            bird.x < pipe.x + pipe.width &&
            (bird.y < pipe.topHeight || bird.y + bird.size > pipe.bottomY)
          ) {
            setGameState('gameOver');
            onGameEnd(score * 100);
          }
        });

        return updatedPipes.filter(pipe => pipe.x > -pipe.width);
      });
    }, 16); // ~60 FPS

    return () => clearInterval(gameLoop);
  }, [gameState, gameTime, bird, score, spawnPipe, onGameEnd, onScoreUpdate]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sky gradient background
    const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw clouds
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 5; i++) {
      const x = (i * 200 + gameTime * 0.5) % (CANVAS_WIDTH + 100);
      const y = 50 + i * 30;
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.arc(x + 25, y, 35, 0, Math.PI * 2);
      ctx.arc(x + 50, y, 30, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw pipes
    pipes.forEach(pipe => {
      // Top pipe
      ctx.fillStyle = pipe.color;
      ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(pipe.x, pipe.topHeight - 30, pipe.width, 30);
      
      // Bottom pipe
      ctx.fillStyle = pipe.color;
      ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, CANVAS_HEIGHT - pipe.bottomY);
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, 30);
      
      // Pipe highlights
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(pipe.x + 5, 0, 10, pipe.topHeight);
      ctx.fillRect(pipe.x + 5, pipe.bottomY, 10, CANVAS_HEIGHT - pipe.bottomY);
    });

    // Draw bird with animation
    const wingFlap = Math.sin(gameTime * 0.3) * 5;
    
    // Bird body
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(bird.x + bird.size/2, bird.y + bird.size/2, bird.size/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Bird wing
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.ellipse(bird.x + bird.size/2 - 5, bird.y + bird.size/2 + wingFlap, 8, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Bird beak
    ctx.fillStyle = '#FF6347';
    ctx.beginPath();
    ctx.moveTo(bird.x + bird.size, bird.y + bird.size/2);
    ctx.lineTo(bird.x + bird.size + 10, bird.y + bird.size/2 - 3);
    ctx.lineTo(bird.x + bird.size + 10, bird.y + bird.size/2 + 3);
    ctx.closePath();
    ctx.fill();
    
    // Bird eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(bird.x + bird.size/2 + 5, bird.y + bird.size/2 - 5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(bird.x + bird.size/2 + 6, bird.y + bird.size/2 - 6, 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.strokeText(score.toString(), CANVAS_WIDTH / 2, 80);
    ctx.fillText(score.toString(), CANVAS_WIDTH / 2, 80);

    // Game over screen
    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.font = 'bold 32px Arial';
      ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.fillText(`Points: ${score * 100}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
      
      ctx.font = '24px Arial';
      ctx.fillText('Click or Press Space to Jump!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
    }
  });

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #87CEEB 0%, #E0F6FF 100%)',
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
        <div>🐦 Jumpy Bird</div>
        <div>Score: {score}</div>
        <div>Points: {score * 100}</div>
      </div>

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          border: '3px solid rgba(255,255,255,0.5)',
          borderRadius: '15px',
          background: '#87CEEB',
          maxWidth: '100%',
          maxHeight: '70vh',
          cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
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
          🎯 How to Play
        </div>
        <div>
          Click anywhere or press SPACE to make the bird jump! 
          Avoid the colorful pipes and try to get the highest score possible!
        </div>
      </div>
    </div>
  );
}
