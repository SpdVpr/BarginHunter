/** @jsxImportSource react */
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface NeonRunnerGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
  isJumping: boolean;
  trail: { x: number; y: number; alpha: number }[];
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'spike' | 'block' | 'laser';
  color: string;
}

interface Collectible {
  x: number;
  y: number;
  size: number;
  type: 'coin' | 'gem' | 'star';
  color: string;
  collected: boolean;
  rotation: number;
}

export default function NeonRunnerGame({ onGameEnd, onScoreUpdate }: NeonRunnerGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(5);
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
  const [player, setPlayer] = useState<Player>({
    x: 100,
    y: 400,
    width: 30,
    height: 30,
    velocityY: 0,
    isJumping: false,
    trail: []
  });
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [gameTime, setGameTime] = useState(0);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const GROUND_Y = 450;
  const GRAVITY = 0.8;
  const JUMP_FORCE = -15;

  // Handle input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.code === 'ArrowUp') && gameState === 'playing') {
        e.preventDefault();
        if (!player.isJumping) {
          setPlayer(prev => ({
            ...prev,
            velocityY: JUMP_FORCE,
            isJumping: true
          }));
        }
      }
    };

    const handleClick = () => {
      if (gameState === 'playing' && !player.isJumping) {
        setPlayer(prev => ({
          ...prev,
          velocityY: JUMP_FORCE,
          isJumping: true
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClick);
    };
  }, [gameState, player.isJumping]);

  // Spawn obstacles
  const spawnObstacle = useCallback(() => {
    const types: ('spike' | 'block' | 'laser')[] = ['spike', 'block', 'laser'];
    const type = types[Math.floor(Math.random() * types.length)];
    const colors = ['#ff006e', '#8338ec', '#3a86ff', '#06ffa5', '#ffbe0b'];
    
    let obstacle: Obstacle;
    
    switch (type) {
      case 'spike':
        obstacle = {
          x: CANVAS_WIDTH,
          y: GROUND_Y - 30,
          width: 20,
          height: 30,
          type,
          color: colors[Math.floor(Math.random() * colors.length)]
        };
        break;
      case 'block':
        obstacle = {
          x: CANVAS_WIDTH,
          y: GROUND_Y - 50,
          width: 40,
          height: 50,
          type,
          color: colors[Math.floor(Math.random() * colors.length)]
        };
        break;
      case 'laser':
        obstacle = {
          x: CANVAS_WIDTH,
          y: GROUND_Y - 100,
          width: 10,
          height: 100,
          type,
          color: '#ff006e'
        };
        break;
    }
    
    setObstacles(prev => [...prev, obstacle]);
  }, []);

  // Spawn collectibles
  const spawnCollectible = useCallback(() => {
    const types: ('coin' | 'gem' | 'star')[] = ['coin', 'gem', 'star'];
    const type = types[Math.floor(Math.random() * types.length)];
    const colors = { coin: '#ffbe0b', gem: '#06ffa5', star: '#8338ec' };
    
    const collectible: Collectible = {
      x: CANVAS_WIDTH,
      y: GROUND_Y - 80 - Math.random() * 100,
      size: type === 'star' ? 25 : 20,
      type,
      color: colors[type],
      collected: false,
      rotation: 0
    };
    
    setCollectibles(prev => [...prev, collectible]);
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      setGameTime(prev => prev + 1);
      setDistance(prev => prev + speed);
      
      // Increase speed over time
      setSpeed(prev => Math.min(prev + 0.002, 8));

      // Spawn obstacles
      if (gameTime % Math.max(60 - Math.floor(distance / 1000), 30) === 0) {
        spawnObstacle();
      }

      // Spawn collectibles
      if (gameTime % 80 === 0) {
        spawnCollectible();
      }

      // Update player
      setPlayer(prev => {
        let newY = prev.y + prev.velocityY;
        let newVelocityY = prev.velocityY + GRAVITY;
        let newIsJumping = prev.isJumping;

        // Ground collision
        if (newY >= GROUND_Y - prev.height) {
          newY = GROUND_Y - prev.height;
          newVelocityY = 0;
          newIsJumping = false;
        }

        // Update trail
        const newTrail = [
          { x: prev.x + prev.width / 2, y: prev.y + prev.height / 2, alpha: 1 },
          ...prev.trail.map(point => ({ ...point, alpha: point.alpha * 0.9 }))
        ].filter(point => point.alpha > 0.1).slice(0, 10);

        return {
          ...prev,
          y: newY,
          velocityY: newVelocityY,
          isJumping: newIsJumping,
          trail: newTrail
        };
      });

      // Update obstacles
      setObstacles(prev => {
        const updatedObstacles = prev.map(obstacle => ({
          ...obstacle,
          x: obstacle.x - speed
        }));

        // Check collisions
        updatedObstacles.forEach(obstacle => {
          if (
            player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y
          ) {
            setGameState('gameOver');
            onGameEnd(score);
          }
        });

        return updatedObstacles.filter(obstacle => obstacle.x > -obstacle.width);
      });

      // Update collectibles
      setCollectibles(prev => {
        const updatedCollectibles = prev.map(collectible => ({
          ...collectible,
          x: collectible.x - speed,
          rotation: collectible.rotation + 5
        }));

        // Check collection
        updatedCollectibles.forEach(collectible => {
          if (
            !collectible.collected &&
            player.x < collectible.x + collectible.size &&
            player.x + player.width > collectible.x &&
            player.y < collectible.y + collectible.size &&
            player.y + player.height > collectible.y
          ) {
            collectible.collected = true;
            const points = collectible.type === 'star' ? 100 : collectible.type === 'gem' ? 50 : 25;
            setScore(prevScore => {
              const newScore = prevScore + points;
              onScoreUpdate(newScore);
              return newScore;
            });
          }
        });

        return updatedCollectibles.filter(collectible => collectible.x > -collectible.size);
      });

      // Add distance score
      setScore(prevScore => {
        const newScore = prevScore + 1;
        onScoreUpdate(newScore);
        return newScore;
      });
    }, 16); // ~60 FPS

    return () => clearInterval(gameLoop);
  }, [gameState, gameTime, speed, distance, player, score, spawnObstacle, spawnCollectible, onGameEnd, onScoreUpdate]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dark neon background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(1, '#1a0033');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Grid effect
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < CANVAS_WIDTH; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i - (gameTime * speed) % 50, 0);
      ctx.lineTo(i - (gameTime * speed) % 50, CANVAS_HEIGHT);
      ctx.stroke();
    }

    // Ground
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 5);
    ctx.shadowBlur = 0;

    // Player trail
    player.trail.forEach((point, index) => {
      ctx.fillStyle = `rgba(255, 0, 110, ${point.alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8 * point.alpha, 0, Math.PI * 2);
      ctx.fill();
    });

    // Player
    ctx.fillStyle = '#ff006e';
    ctx.shadowColor = '#ff006e';
    ctx.shadowBlur = 15;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Player glow effect
    ctx.fillStyle = 'rgba(255, 0, 110, 0.3)';
    ctx.fillRect(player.x - 5, player.y - 5, player.width + 10, player.height + 10);
    ctx.shadowBlur = 0;

    // Obstacles
    obstacles.forEach(obstacle => {
      ctx.fillStyle = obstacle.color;
      ctx.shadowColor = obstacle.color;
      ctx.shadowBlur = 10;
      
      if (obstacle.type === 'spike') {
        // Draw spike
        ctx.beginPath();
        ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
        ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y);
        ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
        ctx.closePath();
        ctx.fill();
      } else if (obstacle.type === 'laser') {
        // Draw laser beam
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        // Laser flicker effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(obstacle.x + 2, obstacle.y, obstacle.width - 4, obstacle.height);
      } else {
        // Draw block
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      }
      ctx.shadowBlur = 0;
    });

    // Collectibles
    collectibles.forEach(collectible => {
      if (collectible.collected) return;
      
      ctx.save();
      ctx.translate(collectible.x + collectible.size / 2, collectible.y + collectible.size / 2);
      ctx.rotate(collectible.rotation * Math.PI / 180);
      
      ctx.fillStyle = collectible.color;
      ctx.shadowColor = collectible.color;
      ctx.shadowBlur = 8;
      
      if (collectible.type === 'star') {
        // Draw star
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5;
          const x = Math.cos(angle) * collectible.size / 2;
          const y = Math.sin(angle) * collectible.size / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        // Draw circle (coin/gem)
        ctx.beginPath();
        ctx.arc(0, 0, collectible.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.shadowBlur = 0;
      ctx.restore();
    });

    // UI
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 5;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 40);
    ctx.fillText(`Distance: ${Math.floor(distance)}m`, 20, 70);
    ctx.fillText(`Speed: ${speed.toFixed(1)}`, 20, 100);
    ctx.shadowBlur = 0;

    // Game over screen
    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#ff006e';
      ctx.shadowColor = '#ff006e';
      ctx.shadowBlur = 10;
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.fillStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.font = 'bold 32px Arial';
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.fillText(`Distance: ${Math.floor(distance)}m`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
      ctx.shadowBlur = 0;
    }
  });

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0033 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      {/* Game Header */}
      <div style={{
        background: 'rgba(0,0,0,0.8)',
        border: '2px solid #00ffff',
        padding: '15px 30px',
        borderRadius: '15px',
        marginBottom: '20px',
        display: 'flex',
        gap: '30px',
        alignItems: 'center',
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#00ffff',
        boxShadow: '0 0 20px rgba(0,255,255,0.3)'
      }}>
        <div>🏃 Neon Runner</div>
        <div>Score: {score}</div>
        <div>Distance: {Math.floor(distance)}m</div>
        <div>Speed: {speed.toFixed(1)}</div>
      </div>

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          border: '3px solid #00ffff',
          borderRadius: '15px',
          background: '#0a0a0a',
          maxWidth: '100%',
          maxHeight: '70vh',
          cursor: 'pointer',
          boxShadow: '0 0 30px rgba(0,255,255,0.5)'
        }}
      />

      {/* Instructions */}
      <div style={{
        background: 'rgba(0,0,0,0.8)',
        border: '2px solid #ff006e',
        padding: '15px 25px',
        borderRadius: '12px',
        marginTop: '20px',
        textAlign: 'center',
        color: '#ff006e',
        fontSize: '14px',
        maxWidth: '600px',
        boxShadow: '0 0 20px rgba(255,0,110,0.3)'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
          🎯 How to Play
        </div>
        <div>
          Click or press SPACE/UP to jump! Avoid neon obstacles and collect glowing items. 
          The game gets faster as you progress!
        </div>
      </div>
    </div>
  );
}
