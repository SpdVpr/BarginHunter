/** @jsxImportSource react */
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface SwipeRushGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface Player {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  lane: number;
  size: number;
  trail: { x: number; y: number; alpha: number }[];
}

interface Obstacle {
  x: number;
  y: number;
  lane: number;
  type: 'spike' | 'wall' | 'moving';
  width: number;
  height: number;
  color: string;
  moveDirection?: number;
}

interface Collectible {
  x: number;
  y: number;
  lane: number;
  type: 'coin' | 'gem' | 'star';
  size: number;
  color: string;
  points: number;
  collected: boolean;
  rotation: number;
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

export default function SwipeRushGame({ onGameEnd, onScoreUpdate }: SwipeRushGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(8);
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
  const [player, setPlayer] = useState<Player>({
    x: 200,
    y: 450,
    targetX: 200,
    targetY: 450,
    lane: 1,
    size: 25,
    trail: []
  });
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [combo, setCombo] = useState(0);

  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 600;
  const LANES = [100, 200, 300]; // 3 lanes
  const SWIPE_THRESHOLD = 50;

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      switch (e.key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
          if (player.lane > 0) {
            setPlayer(prev => ({
              ...prev,
              lane: prev.lane - 1,
              targetX: LANES[prev.lane - 1]
            }));
          }
          break;
        case 'arrowright':
        case 'd':
          if (player.lane < 2) {
            setPlayer(prev => ({
              ...prev,
              lane: prev.lane + 1,
              targetX: LANES[prev.lane + 1]
            }));
          }
          break;
        case 'arrowup':
        case 'w':
        case ' ':
          setPlayer(prev => ({
            ...prev,
            targetY: Math.max(prev.targetY - 100, 200)
          }));
          setTimeout(() => {
            setPlayer(prev => ({ ...prev, targetY: 450 }));
          }, 300);
          break;
        case 'arrowdown':
        case 's':
          setPlayer(prev => ({
            ...prev,
            targetY: Math.min(prev.targetY + 50, 500)
          }));
          setTimeout(() => {
            setPlayer(prev => ({ ...prev, targetY: 450 }));
          }, 200);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, player.lane]);

  // Handle touch/swipe input
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      setTouchStart({
        x: (touch.clientX - rect.left) * (CANVAS_WIDTH / rect.width),
        y: (touch.clientY - rect.top) * (CANVAS_HEIGHT / rect.height)
      });
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      setTouchStart({
        x: (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width),
        y: (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height)
      });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (!touchStart) return;

      const touch = e.changedTouches[0];
      const rect = canvas.getBoundingClientRect();
      const endX = (touch.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
      const endY = (touch.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);

      handleSwipe(endX, endY);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!touchStart) return;

      const rect = canvas.getBoundingClientRect();
      const endX = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
      const endY = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);

      handleSwipe(endX, endY);
    };

    const handleSwipe = (endX: number, endY: number) => {
      const deltaX = endX - touchStart!.x;
      const deltaY = endY - touchStart!.y;

      // Determine swipe direction
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
        // Horizontal swipe
        if (deltaX > 0 && player.lane < 2) {
          // Swipe right
          setPlayer(prev => ({
            ...prev,
            lane: prev.lane + 1,
            targetX: LANES[prev.lane + 1]
          }));
        } else if (deltaX < 0 && player.lane > 0) {
          // Swipe left
          setPlayer(prev => ({
            ...prev,
            lane: prev.lane - 1,
            targetX: LANES[prev.lane - 1]
          }));
        }
      } else if (Math.abs(deltaY) > SWIPE_THRESHOLD) {
        // Vertical swipe
        if (deltaY < 0) {
          // Swipe up - jump
          setPlayer(prev => ({
            ...prev,
            targetY: Math.max(prev.targetY - 100, 200)
          }));
          setTimeout(() => {
            setPlayer(prev => ({ ...prev, targetY: 450 }));
          }, 300);
        } else {
          // Swipe down - slide
          setPlayer(prev => ({
            ...prev,
            targetY: Math.min(prev.targetY + 50, 500)
          }));
          setTimeout(() => {
            setPlayer(prev => ({ ...prev, targetY: 450 }));
          }, 200);
        }
      }

      setTouchStart(null);
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [touchStart, player.lane]);

  // Spawn obstacles
  const spawnObstacle = useCallback(() => {
    if (Math.random() < 0.02 * speed / 8) {
      const lane = Math.floor(Math.random() * 3);
      const types = ['spike', 'wall', 'moving'];
      const type = types[Math.floor(Math.random() * types.length)] as 'spike' | 'wall' | 'moving';
      
      const obstacle: Obstacle = {
        x: LANES[lane],
        y: -50,
        lane,
        type,
        width: type === 'wall' ? 60 : 40,
        height: type === 'spike' ? 30 : 50,
        color: type === 'spike' ? '#ff6b6b' : type === 'wall' ? '#6c5ce7' : '#f39c12',
        moveDirection: type === 'moving' ? (Math.random() > 0.5 ? 1 : -1) : undefined
      };
      
      setObstacles(prev => [...prev, obstacle]);
    }
  }, [speed]);

  // Spawn collectibles
  const spawnCollectible = useCallback(() => {
    if (Math.random() < 0.015 * speed / 8) {
      const lane = Math.floor(Math.random() * 3);
      const types = ['coin', 'gem', 'star'] as const;
      const type = types[Math.floor(Math.random() * types.length)];
      const points = type === 'coin' ? 10 : type === 'gem' ? 25 : 50;
      const colors = { coin: '#f9ca24', gem: '#4ecdc4', star: '#fd79a8' };
      
      const collectible: Collectible = {
        x: LANES[lane],
        y: -30,
        lane,
        type,
        size: type === 'star' ? 20 : 15,
        color: colors[type],
        points,
        collected: false,
        rotation: 0
      };
      
      setCollectibles(prev => [...prev, collectible]);
    }
  }, [speed]);

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
        velocityY: Math.sin(angle) * speed - 2,
        life: 25 + Math.random() * 15,
        maxLife: 40,
        color,
        size: 2 + Math.random() * 3
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      // Update distance and speed
      setDistance(prev => prev + speed);
      setSpeed(prev => Math.min(prev + 0.005, 15));

      // Spawn obstacles and collectibles
      spawnObstacle();
      spawnCollectible();

      // Update player position (smooth movement)
      setPlayer(prev => {
        const newX = prev.x + (prev.targetX - prev.x) * 0.2;
        const newY = prev.y + (prev.targetY - prev.y) * 0.15;
        
        // Update trail
        const newTrail = [
          { x: newX, y: newY, alpha: 1 },
          ...prev.trail.map(point => ({ ...point, alpha: point.alpha * 0.9 }))
        ].filter(point => point.alpha > 0.1).slice(0, 12);

        return { ...prev, x: newX, y: newY, trail: newTrail };
      });

      // Update obstacles
      setObstacles(prev => {
        const updated = prev.map(obstacle => {
          let newX = obstacle.x;
          
          if (obstacle.type === 'moving') {
            newX += (obstacle.moveDirection || 0) * 2;
            if (newX < 50 || newX > 350) {
              obstacle.moveDirection = -(obstacle.moveDirection || 0);
            }
          }
          
          return {
            ...obstacle,
            x: newX,
            y: obstacle.y + speed
          };
        });

        // Check collisions
        updated.forEach(obstacle => {
          const distance = Math.sqrt(
            Math.pow(player.x - obstacle.x, 2) + Math.pow(player.y - obstacle.y, 2)
          );
          
          if (distance < player.size + 20) {
            createParticles(player.x, player.y, '#ff6b6b', 15);
            setGameState('gameOver');
            onGameEnd(score);
          }
        });

        return updated.filter(obstacle => obstacle.y < CANVAS_HEIGHT + 100);
      });

      // Update collectibles
      setCollectibles(prev => {
        const updated = prev.map(collectible => {
          if (collectible.collected) return collectible;
          
          const distance = Math.sqrt(
            Math.pow(player.x - collectible.x, 2) + Math.pow(player.y - collectible.y, 2)
          );
          
          if (distance < player.size + collectible.size) {
            createParticles(collectible.x, collectible.y, collectible.color, 10);
            
            const newCombo = combo + 1;
            setCombo(newCombo);
            
            const points = collectible.points * (1 + Math.floor(newCombo / 5));
            setScore(prevScore => {
              const newScore = prevScore + points;
              onScoreUpdate(newScore);
              return newScore;
            });
            
            return { ...collectible, collected: true };
          }
          
          return {
            ...collectible,
            y: collectible.y + speed,
            rotation: collectible.rotation + 5
          };
        });

        return updated.filter(collectible => collectible.y < CANVAS_HEIGHT + 50 && !collectible.collected);
      });

      // Update particles
      setParticles(prev => prev
        .map(particle => ({
          ...particle,
          x: particle.x + particle.velocityX,
          y: particle.y + particle.velocityY,
          velocityY: particle.velocityY + 0.2,
          life: particle.life - 1
        }))
        .filter(particle => particle.life > 0)
      );

      // Distance score
      setScore(prevScore => {
        const newScore = prevScore + Math.floor(speed);
        onScoreUpdate(newScore);
        return newScore;
      });
    }, 16); // ~60 FPS

    return () => clearInterval(gameLoop);
  }, [gameState, player, speed, score, combo, spawnObstacle, spawnCollectible, createParticles, onScoreUpdate, onGameEnd]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0f3460');
    gradient.addColorStop(1, '#16537e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw lanes
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    for (let i = 0; i < LANES.length - 1; i++) {
      const x = (LANES[i] + LANES[i + 1]) / 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw speed lines
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * CANVAS_WIDTH;
      const y = (i * 30 + (Date.now() * speed * 0.1)) % CANVAS_HEIGHT;
      ctx.strokeStyle = `rgba(255,255,255,${0.1 + Math.random() * 0.2})`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 10 + speed);
      ctx.stroke();
    }

    // Draw obstacles
    obstacles.forEach(obstacle => {
      ctx.fillStyle = obstacle.color;
      ctx.shadowColor = obstacle.color;
      ctx.shadowBlur = 10;
      
      if (obstacle.type === 'spike') {
        // Draw spike
        ctx.beginPath();
        ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
        ctx.lineTo(obstacle.x - obstacle.width / 2, obstacle.y + obstacle.height);
        ctx.lineTo(obstacle.x, obstacle.y);
        ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height);
        ctx.closePath();
        ctx.fill();
      } else {
        // Draw rectangle
        ctx.fillRect(
          obstacle.x - obstacle.width / 2,
          obstacle.y,
          obstacle.width,
          obstacle.height
        );
      }
      ctx.shadowBlur = 0;
    });

    // Draw collectibles
    collectibles.forEach(collectible => {
      ctx.save();
      ctx.translate(collectible.x, collectible.y);
      ctx.rotate(collectible.rotation * Math.PI / 180);
      
      ctx.fillStyle = collectible.color;
      ctx.shadowColor = collectible.color;
      ctx.shadowBlur = 8;
      
      if (collectible.type === 'star') {
        // Draw star
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5;
          const x = Math.cos(angle) * collectible.size;
          const y = Math.sin(angle) * collectible.size;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        // Draw circle
        ctx.beginPath();
        ctx.arc(0, 0, collectible.size, 0, Math.PI * 2);
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
      ctx.arc(point.x, point.y, player.size * point.alpha * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Draw player
    const playerGradient = ctx.createRadialGradient(
      player.x - 8, player.y - 8, 0,
      player.x, player.y, player.size
    );
    playerGradient.addColorStop(0, '#ffffff');
    playerGradient.addColorStop(0.7, '#4ecdc4');
    playerGradient.addColorStop(1, '#45b7d1');
    
    ctx.fillStyle = playerGradient;
    ctx.shadowColor = '#4ecdc4';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 3;
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 35);
    ctx.fillText(`Distance: ${Math.floor(distance)}m`, 20, 60);
    ctx.fillText(`Speed: ${speed.toFixed(1)}`, 20, 85);
    
    if (combo > 0) {
      ctx.fillStyle = '#f9ca24';
      ctx.fillText(`Combo: x${combo}`, 20, 110);
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
      ctx.fillText(`Distance: ${Math.floor(distance)}m`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
      ctx.fillText(`Max Speed: ${speed.toFixed(1)}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
      ctx.shadowBlur = 0;
    }
  });

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #0f3460 0%, #16537e 100%)',
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
        <div>🏃 Swipe Rush</div>
        <div>Score: {score}</div>
        <div>Speed: {speed.toFixed(1)}</div>
        {combo > 0 && <div style={{ color: '#f9ca24' }}>x{combo}</div>}
      </div>

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          border: '3px solid rgba(255,255,255,0.3)',
          borderRadius: '15px',
          background: '#0f3460',
          maxWidth: '100%',
          maxHeight: '70vh',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          touchAction: 'none'
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
          Swipe left/right to change lanes, up to jump, down to slide. 
          Avoid obstacles and collect items!
        </div>
      </div>
    </div>
  );
}
