/** @jsxImportSource react */
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface DodgeMasterGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface Player {
  x: number;
  y: number;
  radius: number;
  trail: { x: number; y: number; alpha: number }[];
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  type: 'rect' | 'circle' | 'triangle';
  color: string;
  rotation: number;
  rotationSpeed: number;
}

interface Particle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export default function DodgeMasterGame({ onGameEnd, onScoreUpdate }: DodgeMasterGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
  const [player, setPlayer] = useState<Player>({
    x: 200,
    y: 300,
    radius: 15,
    trail: []
  });
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [survivalTime, setSurvivalTime] = useState(0);
  const [closeCallCount, setCloseCallCount] = useState(0);

  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 600;
  const OBSTACLE_COLORS = ['#ff6b6b', '#4ecdc4', '#f9ca24', '#6c5ce7', '#fd79a8'];

  // Handle mouse/touch movement
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (gameState !== 'playing') return;
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
      const mouseY = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
      
      setPlayer(prev => ({ ...prev, x: mouseX, y: mouseY }));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (gameState !== 'playing') return;
      e.preventDefault();
      
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const touchX = (touch.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
      const touchY = (touch.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
      
      setPlayer(prev => ({ ...prev, x: touchX, y: touchY }));
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [gameState]);

  // Spawn obstacles
  const spawnObstacle = useCallback(() => {
    const types: ('rect' | 'circle' | 'triangle')[] = ['rect', 'circle', 'triangle'];
    const type = types[Math.floor(Math.random() * types.length)];
    const color = OBSTACLE_COLORS[Math.floor(Math.random() * OBSTACLE_COLORS.length)];
    
    // Random spawn from edges
    const side = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
    let x, y, velocityX, velocityY;
    
    const speed = 2 + gameSpeed * 0.5;
    const size = 20 + Math.random() * 30;
    
    switch (side) {
      case 0: // Top
        x = Math.random() * CANVAS_WIDTH;
        y = -size;
        velocityX = (Math.random() - 0.5) * speed;
        velocityY = speed;
        break;
      case 1: // Right
        x = CANVAS_WIDTH + size;
        y = Math.random() * CANVAS_HEIGHT;
        velocityX = -speed;
        velocityY = (Math.random() - 0.5) * speed;
        break;
      case 2: // Bottom
        x = Math.random() * CANVAS_WIDTH;
        y = CANVAS_HEIGHT + size;
        velocityX = (Math.random() - 0.5) * speed;
        velocityY = -speed;
        break;
      case 3: // Left
        x = -size;
        y = Math.random() * CANVAS_HEIGHT;
        velocityX = speed;
        velocityY = (Math.random() - 0.5) * speed;
        break;
      default:
        x = y = velocityX = velocityY = 0;
    }
    
    const obstacle: Obstacle = {
      x,
      y,
      width: size,
      height: size,
      velocityX,
      velocityY,
      type,
      color,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.1
    };
    
    setObstacles(prev => [...prev, obstacle]);
  }, [gameSpeed]);

  // Create particles
  const createParticles = useCallback((x: number, y: number, color: string, count: number = 8) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 3 + Math.random() * 5;
      newParticles.push({
        x,
        y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        life: 25 + Math.random() * 15,
        maxLife: 40,
        color,
        size: 2 + Math.random() * 3
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Check collision
  const checkCollision = useCallback((obstacle: Obstacle) => {
    const dx = player.x - obstacle.x;
    const dy = player.y - obstacle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    let collisionRadius;
    if (obstacle.type === 'circle') {
      collisionRadius = obstacle.width / 2 + player.radius;
    } else {
      // For rect and triangle, use approximate collision
      collisionRadius = Math.max(obstacle.width, obstacle.height) / 2 + player.radius;
    }
    
    if (distance < collisionRadius) {
      return true;
    }
    
    // Close call detection
    if (distance < collisionRadius + 20) {
      setCloseCallCount(prev => prev + 1);
    }
    
    return false;
  }, [player]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      // Update survival time and score
      setSurvivalTime(prev => prev + 1);
      setScore(prevScore => {
        const newScore = prevScore + Math.floor(gameSpeed);
        onScoreUpdate(newScore);
        return newScore;
      });

      // Increase game speed over time
      setGameSpeed(prev => Math.min(prev + 0.002, 3));

      // Spawn obstacles
      if (Math.random() < 0.02 + gameSpeed * 0.005) {
        spawnObstacle();
      }

      // Update player trail
      setPlayer(prev => {
        const newTrail = [
          { x: prev.x, y: prev.y, alpha: 1 },
          ...prev.trail.map(point => ({ ...point, alpha: point.alpha * 0.9 }))
        ].filter(point => point.alpha > 0.1).slice(0, 15);

        return { ...prev, trail: newTrail };
      });

      // Update obstacles
      setObstacles(prev => {
        const updated = prev.map(obstacle => ({
          ...obstacle,
          x: obstacle.x + obstacle.velocityX,
          y: obstacle.y + obstacle.velocityY,
          rotation: obstacle.rotation + obstacle.rotationSpeed
        }));

        // Check collisions
        updated.forEach(obstacle => {
          if (checkCollision(obstacle)) {
            createParticles(player.x, player.y, '#ff6b6b', 15);
            setGameState('gameOver');
            onGameEnd(score);
          }
        });

        // Remove off-screen obstacles
        return updated.filter(obstacle => 
          obstacle.x > -100 && obstacle.x < CANVAS_WIDTH + 100 &&
          obstacle.y > -100 && obstacle.y < CANVAS_HEIGHT + 100
        );
      });

      // Update particles
      setParticles(prev => prev
        .map(particle => ({
          ...particle,
          x: particle.x + particle.velocityX,
          y: particle.y + particle.velocityY,
          velocityY: particle.velocityY + 0.1,
          life: particle.life - 1
        }))
        .filter(particle => particle.life > 0)
      );
    }, 16); // ~60 FPS

    return () => clearInterval(gameLoop);
  }, [gameState, player, gameSpeed, score, spawnObstacle, checkCollision, createParticles, onScoreUpdate, onGameEnd]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0f0f23');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw speed lines
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * CANVAS_WIDTH;
      const y = (i * 20 + (Date.now() * gameSpeed * 0.1)) % CANVAS_HEIGHT;
      const alpha = 0.1 + Math.random() * 0.2;
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 5 + gameSpeed * 3);
      ctx.stroke();
    }

    // Draw obstacles
    obstacles.forEach(obstacle => {
      ctx.save();
      ctx.translate(obstacle.x, obstacle.y);
      ctx.rotate(obstacle.rotation);
      
      ctx.fillStyle = obstacle.color;
      ctx.shadowColor = obstacle.color;
      ctx.shadowBlur = 10;
      
      if (obstacle.type === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, obstacle.width / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (obstacle.type === 'rect') {
        ctx.fillRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
      } else if (obstacle.type === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(0, -obstacle.height / 2);
        ctx.lineTo(-obstacle.width / 2, obstacle.height / 2);
        ctx.lineTo(obstacle.width / 2, obstacle.height / 2);
        ctx.closePath();
        ctx.fill();
      }
      
      ctx.shadowBlur = 0;
      ctx.restore();
    });

    // Draw particles
    particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Draw player trail
    player.trail.forEach((point, index) => {
      ctx.globalAlpha = point.alpha * 0.6;
      ctx.fillStyle = '#4ecdc4';
      ctx.beginPath();
      ctx.arc(point.x, point.y, player.radius * point.alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Draw player
    const playerGradient = ctx.createRadialGradient(
      player.x - 5, player.y - 5, 0,
      player.x, player.y, player.radius
    );
    playerGradient.addColorStop(0, '#ffffff');
    playerGradient.addColorStop(0.7, '#4ecdc4');
    playerGradient.addColorStop(1, '#45b7d1');
    
    ctx.fillStyle = playerGradient;
    ctx.shadowColor = '#4ecdc4';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 3;
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 35);
    ctx.fillText(`Speed: ${gameSpeed.toFixed(1)}x`, 20, 60);
    
    const timeSeconds = Math.floor(survivalTime / 60);
    ctx.fillText(`Time: ${timeSeconds}s`, 20, 85);
    
    if (closeCallCount > 0) {
      ctx.fillStyle = '#f9ca24';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`Close Calls: ${closeCallCount}`, 20, 110);
    }
    ctx.shadowBlur = 0;

    // Game over screen
    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 5;
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
      
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.fillText(`Survived: ${Math.floor(survivalTime / 60)}s`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
      ctx.fillText(`Max Speed: ${gameSpeed.toFixed(1)}x`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
      ctx.shadowBlur = 0;
    }
  });

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10px',
      boxSizing: 'border-box',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none'
    }}>
      {/* Game Header */}
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        padding: '10px 20px',
        borderRadius: '15px',
        marginBottom: '10px',
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#333',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <div>🎯 Dodge Master</div>
        <div>Score: {score}</div>
        <div>Speed: {gameSpeed.toFixed(1)}x</div>
        <div>Time: {Math.floor(survivalTime / 60)}s</div>
      </div>

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          border: '3px solid rgba(255,255,255,0.3)',
          borderRadius: '15px',
          background: '#0f0f23',
          maxWidth: '100%',
          maxHeight: '70vh',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          touchAction: 'none',
          cursor: 'none'
        }}
      />

      {/* Instructions */}
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        padding: '10px 20px',
        borderRadius: '12px',
        marginTop: '10px',
        textAlign: 'center',
        color: '#333',
        fontSize: '12px',
        maxWidth: '350px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
          🎯 How to Play
        </div>
        <div>
          Move your mouse or finger to control the glowing orb. 
          Dodge all obstacles as the game gets faster and faster!
        </div>
      </div>
    </div>
  );
}
