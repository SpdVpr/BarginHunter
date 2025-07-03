/** @jsxImportSource react */
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface AsteroidBlasterGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface Ship {
  x: number;
  y: number;
  angle: number;
  velocityX: number;
  velocityY: number;
  size: number;
}

interface Bullet {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  life: number;
}

interface Asteroid {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  type: 'large' | 'medium' | 'small';
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

export default function AsteroidBlasterGame({ onGameEnd, onScoreUpdate }: AsteroidBlasterGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
  const [ship, setShip] = useState<Ship>({
    x: 400,
    y: 300,
    angle: 0,
    velocityX: 0,
    velocityY: 0,
    size: 15
  });
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});
  const [lastShot, setLastShot] = useState(0);
  const [invulnerable, setInvulnerable] = useState(false);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const SHIP_THRUST = 0.3;
  const SHIP_FRICTION = 0.98;
  const BULLET_SPEED = 8;
  const SHOOT_COOLDOWN = 150;

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

  // Initialize asteroids for wave
  const spawnAsteroids = useCallback((waveNumber: number) => {
    const newAsteroids: Asteroid[] = [];
    const asteroidCount = Math.min(4 + waveNumber * 2, 12);
    
    for (let i = 0; i < asteroidCount; i++) {
      let x, y;
      // Spawn away from ship
      do {
        x = Math.random() * CANVAS_WIDTH;
        y = Math.random() * CANVAS_HEIGHT;
      } while (
        Math.sqrt(Math.pow(x - ship.x, 2) + Math.pow(y - ship.y, 2)) < 150
      );
      
      newAsteroids.push({
        x,
        y,
        velocityX: (Math.random() - 0.5) * 3,
        velocityY: (Math.random() - 0.5) * 3,
        size: 40 + Math.random() * 20,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        type: 'large',
        points: 20
      });
    }
    
    setAsteroids(newAsteroids);
  }, [ship.x, ship.y]);

  // Initialize first wave
  useEffect(() => {
    spawnAsteroids(1);
  }, [spawnAsteroids]);

  // Create explosion particles
  const createExplosion = useCallback((x: number, y: number, color: string, count: number = 8) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2 + Math.random() * 4;
      newParticles.push({
        x,
        y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        color
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Break asteroid into smaller pieces
  const breakAsteroid = useCallback((asteroid: Asteroid) => {
    if (asteroid.type === 'large') {
      const pieces: Asteroid[] = [];
      for (let i = 0; i < 2; i++) {
        pieces.push({
          x: asteroid.x + (Math.random() - 0.5) * 20,
          y: asteroid.y + (Math.random() - 0.5) * 20,
          velocityX: asteroid.velocityX + (Math.random() - 0.5) * 4,
          velocityY: asteroid.velocityY + (Math.random() - 0.5) * 4,
          size: asteroid.size * 0.6,
          rotation: 0,
          rotationSpeed: (Math.random() - 0.5) * 0.15,
          type: 'medium',
          points: 50
        });
      }
      return pieces;
    } else if (asteroid.type === 'medium') {
      const pieces: Asteroid[] = [];
      for (let i = 0; i < 2; i++) {
        pieces.push({
          x: asteroid.x + (Math.random() - 0.5) * 15,
          y: asteroid.y + (Math.random() - 0.5) * 15,
          velocityX: asteroid.velocityX + (Math.random() - 0.5) * 6,
          velocityY: asteroid.velocityY + (Math.random() - 0.5) * 6,
          size: asteroid.size * 0.6,
          rotation: 0,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
          type: 'small',
          points: 100
        });
      }
      return pieces;
    }
    return [];
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      // Update ship
      setShip(prev => {
        let newAngle = prev.angle;
        let newVelocityX = prev.velocityX;
        let newVelocityY = prev.velocityY;

        // Rotation
        if (keys['arrowleft'] || keys['a']) newAngle -= 0.15;
        if (keys['arrowright'] || keys['d']) newAngle += 0.15;

        // Thrust
        if (keys['arrowup'] || keys['w']) {
          newVelocityX += Math.cos(newAngle) * SHIP_THRUST;
          newVelocityY += Math.sin(newAngle) * SHIP_THRUST;
          
          // Thrust particles
          const thrustX = prev.x - Math.cos(newAngle) * 20;
          const thrustY = prev.y - Math.sin(newAngle) * 20;
          if (Math.random() < 0.3) {
            setParticles(prevParticles => [...prevParticles, {
              x: thrustX,
              y: thrustY,
              velocityX: -Math.cos(newAngle) * 3 + (Math.random() - 0.5) * 2,
              velocityY: -Math.sin(newAngle) * 3 + (Math.random() - 0.5) * 2,
              life: 15,
              maxLife: 15,
              color: '#ff6b6b'
            }]);
          }
        }

        // Apply friction
        newVelocityX *= SHIP_FRICTION;
        newVelocityY *= SHIP_FRICTION;

        // Update position with screen wrapping
        let newX = prev.x + newVelocityX;
        let newY = prev.y + newVelocityY;

        if (newX < 0) newX = CANVAS_WIDTH;
        if (newX > CANVAS_WIDTH) newX = 0;
        if (newY < 0) newY = CANVAS_HEIGHT;
        if (newY > CANVAS_HEIGHT) newY = 0;

        return {
          ...prev,
          x: newX,
          y: newY,
          angle: newAngle,
          velocityX: newVelocityX,
          velocityY: newVelocityY
        };
      });

      // Shooting
      if (keys[' '] || keys['arrowdown'] || keys['s']) {
        const now = Date.now();
        if (now - lastShot > SHOOT_COOLDOWN) {
          setBullets(prev => [...prev, {
            x: ship.x + Math.cos(ship.angle) * ship.size,
            y: ship.y + Math.sin(ship.angle) * ship.size,
            velocityX: Math.cos(ship.angle) * BULLET_SPEED + ship.velocityX,
            velocityY: Math.sin(ship.angle) * BULLET_SPEED + ship.velocityY,
            life: 60
          }]);
          setLastShot(now);
        }
      }

      // Update bullets
      setBullets(prev => prev
        .map(bullet => ({
          ...bullet,
          x: bullet.x + bullet.velocityX,
          y: bullet.y + bullet.velocityY,
          life: bullet.life - 1
        }))
        .filter(bullet => bullet.life > 0)
        .map(bullet => ({
          ...bullet,
          x: bullet.x < 0 ? CANVAS_WIDTH : bullet.x > CANVAS_WIDTH ? 0 : bullet.x,
          y: bullet.y < 0 ? CANVAS_HEIGHT : bullet.y > CANVAS_HEIGHT ? 0 : bullet.y
        }))
      );

      // Update asteroids
      setAsteroids(prev => prev.map(asteroid => ({
        ...asteroid,
        x: asteroid.x + asteroid.velocityX,
        y: asteroid.y + asteroid.velocityY,
        rotation: asteroid.rotation + asteroid.rotationSpeed,
        x: asteroid.x < 0 ? CANVAS_WIDTH : asteroid.x > CANVAS_WIDTH ? 0 : asteroid.x,
        y: asteroid.y < 0 ? CANVAS_HEIGHT : asteroid.y > CANVAS_HEIGHT ? 0 : asteroid.y
      })));

      // Update particles
      setParticles(prev => prev
        .map(particle => ({
          ...particle,
          x: particle.x + particle.velocityX,
          y: particle.y + particle.velocityY,
          life: particle.life - 1
        }))
        .filter(particle => particle.life > 0)
      );

      // Collision detection: bullets vs asteroids
      setBullets(prevBullets => {
        const remainingBullets = [...prevBullets];
        
        setAsteroids(prevAsteroids => {
          const remainingAsteroids = [...prevAsteroids];
          
          for (let i = remainingBullets.length - 1; i >= 0; i--) {
            const bullet = remainingBullets[i];
            
            for (let j = remainingAsteroids.length - 1; j >= 0; j--) {
              const asteroid = remainingAsteroids[j];
              const distance = Math.sqrt(
                Math.pow(bullet.x - asteroid.x, 2) + Math.pow(bullet.y - asteroid.y, 2)
              );
              
              if (distance < asteroid.size) {
                // Hit!
                remainingBullets.splice(i, 1);
                const hitAsteroid = remainingAsteroids.splice(j, 1)[0];
                
                // Add score
                setScore(prevScore => {
                  const newScore = prevScore + hitAsteroid.points;
                  onScoreUpdate(newScore);
                  return newScore;
                });
                
                // Create explosion
                createExplosion(hitAsteroid.x, hitAsteroid.y, '#4ecdc4', 12);
                
                // Break asteroid
                const pieces = breakAsteroid(hitAsteroid);
                remainingAsteroids.push(...pieces);
                
                break;
              }
            }
          }
          
          // Check if wave complete
          if (remainingAsteroids.length === 0) {
            setWave(prevWave => {
              const newWave = prevWave + 1;
              setTimeout(() => spawnAsteroids(newWave), 1000);
              return newWave;
            });
          }
          
          return remainingAsteroids;
        });
        
        return remainingBullets;
      });

      // Collision detection: ship vs asteroids
      if (!invulnerable) {
        asteroids.forEach(asteroid => {
          const distance = Math.sqrt(
            Math.pow(ship.x - asteroid.x, 2) + Math.pow(ship.y - asteroid.y, 2)
          );
          
          if (distance < asteroid.size + ship.size) {
            // Ship hit!
            createExplosion(ship.x, ship.y, '#ff6b6b', 16);
            setLives(prevLives => {
              const newLives = prevLives - 1;
              if (newLives <= 0) {
                setGameState('gameOver');
                onGameEnd(score);
              }
              return newLives;
            });
            
            // Reset ship position and make invulnerable
            setShip(prev => ({
              ...prev,
              x: CANVAS_WIDTH / 2,
              y: CANVAS_HEIGHT / 2,
              velocityX: 0,
              velocityY: 0,
              angle: 0
            }));
            
            setInvulnerable(true);
            setTimeout(() => setInvulnerable(false), 2000);
          }
        });
      }
    }, 16); // ~60 FPS

    return () => clearInterval(gameLoop);
  }, [gameState, keys, ship, lastShot, asteroids, score, invulnerable, wave, spawnAsteroids, createExplosion, breakAsteroid, onScoreUpdate, onGameEnd]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Space background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
      const x = (i * 137) % CANVAS_WIDTH;
      const y = (i * 197) % CANVAS_HEIGHT;
      const size = (i % 3) + 1;
      ctx.fillRect(x, y, size, size);
    }

    // Draw particles
    particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw asteroids
    asteroids.forEach(asteroid => {
      ctx.save();
      ctx.translate(asteroid.x, asteroid.y);
      ctx.rotate(asteroid.rotation);
      
      ctx.strokeStyle = '#8b4513';
      ctx.fillStyle = '#cd853f';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      const sides = 8;
      for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * Math.PI * 2;
        const radius = asteroid.size * (0.8 + Math.sin(i * 1.5) * 0.2);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      ctx.restore();
    });

    // Draw bullets
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 5;
    bullets.forEach(bullet => {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Draw ship
    if (!invulnerable || Math.floor(Date.now() / 100) % 2) {
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);
      
      ctx.strokeStyle = '#00ff00';
      ctx.fillStyle = '#004400';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.moveTo(ship.size, 0);
      ctx.lineTo(-ship.size, -ship.size / 2);
      ctx.lineTo(-ship.size / 2, 0);
      ctx.lineTo(-ship.size, ship.size / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      ctx.restore();
    }

    // UI
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`Lives: ${lives}`, 20, 55);
    ctx.fillText(`Wave: ${wave}`, 20, 80);

    // Game over screen
    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 32px Arial';
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.fillText(`Wave Reached: ${wave}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    }
  });

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #000011 0%, #001122 100%)',
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
        <div>🚀 Asteroid Blaster</div>
        <div>Score: {score}</div>
        <div>Lives: {lives}</div>
        <div>Wave: {wave}</div>
      </div>

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          border: '3px solid #00ffff',
          borderRadius: '15px',
          background: '#000011',
          maxWidth: '100%',
          maxHeight: '70vh',
          boxShadow: '0 0 30px rgba(0,255,255,0.5)'
        }}
      />

      {/* Instructions */}
      <div style={{
        background: 'rgba(0,0,0,0.8)',
        border: '2px solid #00ff00',
        padding: '15px 25px',
        borderRadius: '12px',
        marginTop: '20px',
        textAlign: 'center',
        color: '#00ff00',
        fontSize: '14px',
        maxWidth: '600px',
        boxShadow: '0 0 20px rgba(0,255,0,0.3)'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
          🎯 Controls
        </div>
        <div>
          Arrow Keys or WASD: Rotate & Thrust • Spacebar/Down: Shoot • Destroy all asteroids to advance waves!
        </div>
      </div>
    </div>
  );
}
