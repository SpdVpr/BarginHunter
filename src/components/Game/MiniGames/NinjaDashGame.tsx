/** @jsxImportSource react */
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface NinjaDashGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface Ninja {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  onGround: boolean;
  onWall: boolean;
  wallSide: 'left' | 'right' | null;
  facing: 'left' | 'right';
  trail: { x: number; y: number; alpha: number }[];
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'normal' | 'moving' | 'disappearing';
  moveSpeed?: number;
  moveDirection?: number;
  disappearTime?: number;
}

interface Collectible {
  x: number;
  y: number;
  size: number;
  type: 'coin' | 'gem' | 'star';
  collected: boolean;
  rotation: number;
  points: number;
}

interface Particle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  life: number;
  maxLife: number;
  color: string;
}

export default function NinjaDashGame({ onGameEnd, onScoreUpdate }: NinjaDashGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
  const [ninja, setNinja] = useState<Ninja>({
    x: 100,
    y: 400,
    velocityX: 0,
    velocityY: 0,
    onGround: false,
    onWall: false,
    wallSide: null,
    facing: 'right',
    trail: []
  });
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});
  const [cameraX, setCameraX] = useState(0);
  const [gameTime, setGameTime] = useState(0);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const GRAVITY = 0.8;
  const JUMP_FORCE = -16;
  const WALL_JUMP_FORCE_X = 12;
  const WALL_JUMP_FORCE_Y = -14;
  const MOVE_SPEED = 6;
  const WALL_SLIDE_SPEED = 2;

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Generate platforms
  const generatePlatforms = useCallback(() => {
    const newPlatforms: Platform[] = [];
    
    // Ground platforms
    for (let x = 0; x < 5000; x += 200) {
      if (Math.random() > 0.3) {
        newPlatforms.push({
          x,
          y: 500,
          width: 150,
          height: 20,
          type: 'normal'
        });
      }
    }
    
    // Floating platforms
    for (let x = 200; x < 5000; x += 150) {
      if (Math.random() > 0.4) {
        const type = Math.random() > 0.8 ? 'moving' : Math.random() > 0.9 ? 'disappearing' : 'normal';
        newPlatforms.push({
          x: x + Math.random() * 100,
          y: 200 + Math.random() * 200,
          width: 80 + Math.random() * 40,
          height: 15,
          type,
          moveSpeed: type === 'moving' ? 1 + Math.random() * 2 : undefined,
          moveDirection: type === 'moving' ? (Math.random() > 0.5 ? 1 : -1) : undefined,
          disappearTime: type === 'disappearing' ? 180 : undefined
        });
      }
    }
    
    // Wall platforms for wall jumping
    for (let x = 300; x < 5000; x += 300) {
      if (Math.random() > 0.6) {
        newPlatforms.push({
          x,
          y: 100,
          width: 20,
          height: 400,
          type: 'normal'
        });
      }
    }
    
    setPlatforms(newPlatforms);
  }, []);

  // Generate collectibles
  const generateCollectibles = useCallback(() => {
    const newCollectibles: Collectible[] = [];
    
    for (let x = 150; x < 5000; x += 100) {
      if (Math.random() > 0.7) {
        const types = ['coin', 'gem', 'star'] as const;
        const type = types[Math.floor(Math.random() * types.length)];
        const points = type === 'coin' ? 10 : type === 'gem' ? 25 : 50;
        
        newCollectibles.push({
          x: x + Math.random() * 50,
          y: 150 + Math.random() * 250,
          size: type === 'star' ? 20 : 15,
          type,
          collected: false,
          rotation: 0,
          points
        });
      }
    }
    
    setCollectibles(newCollectibles);
  }, []);

  // Initialize level
  useEffect(() => {
    generatePlatforms();
    generateCollectibles();
  }, [generatePlatforms, generateCollectibles]);

  // Create particles
  const createParticles = useCallback((x: number, y: number, color: string, count: number = 5) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x,
        y,
        velocityX: (Math.random() - 0.5) * 8,
        velocityY: (Math.random() - 0.5) * 8,
        life: 20 + Math.random() * 20,
        maxLife: 40,
        color
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      setGameTime(prev => prev + 1);

      // Update ninja
      setNinja(prev => {
        let newVelocityX = prev.velocityX;
        let newVelocityY = prev.velocityY;
        let newFacing = prev.facing;
        let newOnGround = false;
        let newOnWall = false;
        let newWallSide = prev.wallSide;

        // Horizontal movement
        if (keys['arrowleft'] || keys['a']) {
          newVelocityX = -MOVE_SPEED;
          newFacing = 'left';
        } else if (keys['arrowright'] || keys['d']) {
          newVelocityX = MOVE_SPEED;
          newFacing = 'right';
        } else {
          newVelocityX *= 0.8; // Friction
        }

        // Jumping and wall jumping
        if (keys['arrowup'] || keys['w'] || keys[' ']) {
          if (prev.onGround) {
            newVelocityY = JUMP_FORCE;
            createParticles(prev.x, prev.y + 20, '#4ecdc4', 8);
          } else if (prev.onWall) {
            // Wall jump
            newVelocityY = WALL_JUMP_FORCE_Y;
            newVelocityX = prev.wallSide === 'left' ? WALL_JUMP_FORCE_X : -WALL_JUMP_FORCE_X;
            newFacing = prev.wallSide === 'left' ? 'right' : 'left';
            createParticles(prev.x, prev.y, '#ff6b6b', 12);
            
            // Combo for wall jump
            setCombo(prevCombo => prevCombo + 1);
            setScore(prevScore => {
              const newScore = prevScore + 25 * (combo + 1);
              onScoreUpdate(newScore);
              return newScore;
            });
          }
        }

        // Apply gravity
        newVelocityY += GRAVITY;

        // Wall sliding
        if (prev.onWall && newVelocityY > 0) {
          newVelocityY = Math.min(newVelocityY, WALL_SLIDE_SPEED);
        }

        // Update position
        let newX = prev.x + newVelocityX;
        let newY = prev.y + newVelocityY;

        // Platform collision detection
        platforms.forEach(platform => {
          // Top collision (landing)
          if (
            newVelocityY > 0 &&
            prev.y <= platform.y &&
            newY + 20 >= platform.y &&
            newX + 15 > platform.x &&
            newX - 15 < platform.x + platform.width
          ) {
            newY = platform.y - 20;
            newVelocityY = 0;
            newOnGround = true;
            
            if (!prev.onGround) {
              createParticles(newX, newY + 20, '#f39c12', 6);
            }
          }

          // Wall collision (wall jumping)
          if (
            platform.height > 100 && // Only tall platforms
            newY + 20 > platform.y &&
            newY < platform.y + platform.height
          ) {
            // Left wall
            if (
              newVelocityX > 0 &&
              prev.x + 15 <= platform.x &&
              newX + 15 >= platform.x
            ) {
              newX = platform.x - 15;
              newVelocityX = 0;
              newOnWall = true;
              newWallSide = 'left';
            }
            // Right wall
            else if (
              newVelocityX < 0 &&
              prev.x - 15 >= platform.x + platform.width &&
              newX - 15 <= platform.x + platform.width
            ) {
              newX = platform.x + platform.width + 15;
              newVelocityX = 0;
              newOnWall = true;
              newWallSide = 'right';
            }
          }
        });

        // Ground collision
        if (newY > 480) {
          newY = 480;
          newVelocityY = 0;
          newOnGround = true;
        }

        // Death condition
        if (newY > CANVAS_HEIGHT) {
          setGameState('gameOver');
          onGameEnd(score);
        }

        // Update trail
        const newTrail = [
          { x: newX, y: newY, alpha: 1 },
          ...prev.trail.map(point => ({ ...point, alpha: point.alpha * 0.9 }))
        ].filter(point => point.alpha > 0.1).slice(0, 8);

        return {
          x: newX,
          y: newY,
          velocityX: newVelocityX,
          velocityY: newVelocityY,
          onGround: newOnGround,
          onWall: newOnWall,
          wallSide: newWallSide,
          facing: newFacing,
          trail: newTrail
        };
      });

      // Update camera
      setCameraX(prev => {
        const targetX = ninja.x - CANVAS_WIDTH / 3;
        return prev + (targetX - prev) * 0.1;
      });

      // Update moving platforms
      setPlatforms(prev => prev.map(platform => {
        if (platform.type === 'moving' && platform.moveSpeed && platform.moveDirection) {
          let newX = platform.x + platform.moveSpeed * platform.moveDirection;
          let newDirection = platform.moveDirection;
          
          // Bounce off boundaries
          if (newX < 0 || newX > 4800) {
            newDirection = -newDirection;
            newX = platform.x;
          }
          
          return { ...platform, x: newX, moveDirection: newDirection };
        }
        return platform;
      }));

      // Update collectibles
      setCollectibles(prev => prev.map(collectible => {
        if (collectible.collected) return collectible;
        
        // Check collection
        const distance = Math.sqrt(
          Math.pow(ninja.x - collectible.x, 2) + Math.pow(ninja.y - collectible.y, 2)
        );
        
        if (distance < 25) {
          createParticles(collectible.x, collectible.y, '#FFD700', 10);
          setScore(prevScore => {
            const newScore = prevScore + collectible.points;
            onScoreUpdate(newScore);
            return newScore;
          });
          
          return { ...collectible, collected: true };
        }
        
        return { ...collectible, rotation: collectible.rotation + 3 };
      }));

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

      // Reset combo if on ground for too long
      if (ninja.onGround && gameTime % 60 === 0) {
        setCombo(0);
      }

      // Distance score
      setScore(prevScore => {
        const newScore = prevScore + 1;
        onScoreUpdate(newScore);
        return newScore;
      });
    }, 16); // ~60 FPS

    return () => clearInterval(gameLoop);
  }, [gameState, keys, ninja, platforms, score, combo, gameTime, createParticles, onScoreUpdate, onGameEnd]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save context for camera
    ctx.save();
    ctx.translate(-cameraX, 0);

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#2c1810');
    gradient.addColorStop(1, '#8b4513');
    ctx.fillStyle = gradient;
    ctx.fillRect(cameraX, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw platforms
    platforms.forEach(platform => {
      if (platform.x + platform.width > cameraX && platform.x < cameraX + CANVAS_WIDTH) {
        ctx.fillStyle = platform.type === 'moving' ? '#4ecdc4' : 
                       platform.type === 'disappearing' ? '#ff6b6b' : '#654321';
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Platform glow
        if (platform.type !== 'normal') {
          ctx.shadowColor = platform.type === 'moving' ? '#4ecdc4' : '#ff6b6b';
          ctx.shadowBlur = 10;
          ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
          ctx.shadowBlur = 0;
        }
      }
    });

    // Draw collectibles
    collectibles.forEach(collectible => {
      if (collectible.collected || 
          collectible.x + collectible.size < cameraX || 
          collectible.x - collectible.size > cameraX + CANVAS_WIDTH) return;
      
      ctx.save();
      ctx.translate(collectible.x, collectible.y);
      ctx.rotate(collectible.rotation * Math.PI / 180);
      
      const colors = { coin: '#FFD700', gem: '#4ecdc4', star: '#ff6b6b' };
      ctx.fillStyle = colors[collectible.type];
      ctx.shadowColor = colors[collectible.type];
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
      ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw ninja trail
    ninja.trail.forEach((point, index) => {
      ctx.fillStyle = `rgba(255, 0, 110, ${point.alpha * 0.3})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8 * point.alpha, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw ninja
    ctx.fillStyle = '#2c2c2c';
    ctx.shadowColor = '#ff006e';
    ctx.shadowBlur = 10;
    ctx.fillRect(ninja.x - 15, ninja.y, 30, 20);
    
    // Ninja details
    ctx.fillStyle = '#ff006e';
    ctx.fillRect(ninja.x - 10, ninja.y + 5, 20, 10);
    
    // Eyes
    ctx.fillStyle = '#fff';
    const eyeOffset = ninja.facing === 'right' ? 5 : -5;
    ctx.fillRect(ninja.x + eyeOffset, ninja.y + 7, 3, 3);
    ctx.shadowBlur = 0;

    // Restore context
    ctx.restore();

    // UI (fixed position)
    ctx.fillStyle = '#ff006e';
    ctx.shadowColor = '#ff006e';
    ctx.shadowBlur = 5;
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`Distance: ${Math.floor(ninja.x)}m`, 20, 55);
    
    if (combo > 0) {
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(`Combo: x${combo}`, 20, 85);
    }
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
      
      ctx.fillStyle = '#4ecdc4';
      ctx.shadowColor = '#4ecdc4';
      ctx.font = 'bold 32px Arial';
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.fillText(`Distance: ${Math.floor(ninja.x)}m`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
      ctx.shadowBlur = 0;
    }
  });

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #2c1810 0%, #8b4513 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      {/* Game Header */}
      <div style={{
        background: 'rgba(44,24,16,0.9)',
        border: '2px solid #ff006e',
        padding: '15px 30px',
        borderRadius: '15px',
        marginBottom: '20px',
        display: 'flex',
        gap: '30px',
        alignItems: 'center',
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#ff006e',
        boxShadow: '0 0 20px rgba(255,0,110,0.3)'
      }}>
        <div>🥷 Ninja Dash</div>
        <div>Score: {score}</div>
        <div>Distance: {Math.floor(ninja.x)}m</div>
        {combo > 0 && <div style={{ color: '#FFD700' }}>Combo: x{combo}</div>}
      </div>

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          border: '3px solid #ff006e',
          borderRadius: '15px',
          background: '#2c1810',
          maxWidth: '100%',
          maxHeight: '70vh',
          boxShadow: '0 0 30px rgba(255,0,110,0.5)'
        }}
      />

      {/* Instructions */}
      <div style={{
        background: 'rgba(44,24,16,0.9)',
        border: '2px solid #4ecdc4',
        padding: '15px 25px',
        borderRadius: '12px',
        marginTop: '20px',
        textAlign: 'center',
        color: '#4ecdc4',
        fontSize: '14px',
        maxWidth: '600px',
        boxShadow: '0 0 20px rgba(78,205,196,0.3)'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
          🎯 Controls
        </div>
        <div>
          Arrow Keys or WASD: Move & Jump • Wall Jump off tall platforms for combos! 
          Collect coins and gems while running as far as possible!
        </div>
      </div>
    </div>
  );
}
