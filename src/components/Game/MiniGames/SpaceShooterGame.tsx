/** @jsxImportSource react */
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface SpaceShooterGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  health: number;
  type: 'basic' | 'fast' | 'tank';
  color: string;
  points: number;
}

export default function SpaceShooterGame({ onGameEnd, onScoreUpdate }: SpaceShooterGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
  const [player, setPlayer] = useState<Player>({
    x: 375,
    y: 500,
    width: 50,
    height: 40
  });
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});
  const [lastShot, setLastShot] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const SHOOT_COOLDOWN = 200; // ms

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

  // Handle mouse movement and clicking
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const scaledX = (mouseX / rect.width) * CANVAS_WIDTH;
      
      setPlayer(prev => ({
        ...prev,
        x: Math.max(0, Math.min(CANVAS_WIDTH - prev.width, scaledX - prev.width / 2))
      }));
    };

    const handleMouseClick = () => {
      const now = Date.now();
      if (now - lastShot > SHOOT_COOLDOWN) {
        setBullets(prev => [...prev, {
          x: player.x + player.width / 2 - 2,
          y: player.y,
          width: 4,
          height: 10,
          speed: 8
        }]);
        setLastShot(now);
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleMouseClick);
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleMouseClick);
    };
  }, [player, lastShot]);

  // Spawn enemies
  const spawnEnemy = useCallback(() => {
    const enemyTypes = [
      { type: 'basic' as const, health: 1, speed: 2, color: '#ff6b6b', points: 100 },
      { type: 'fast' as const, health: 1, speed: 4, color: '#f39c12', points: 150 },
      { type: 'tank' as const, health: 3, speed: 1, color: '#6c5ce7', points: 300 }
    ];
    
    const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    
    setEnemies(prev => [...prev, {
      x: Math.random() * (CANVAS_WIDTH - 40),
      y: -40,
      width: 40,
      height: 30,
      ...enemyType
    }]);
  }, []);

  // Game timer and enemy spawning
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
      
      // Spawn enemies based on wave
      if (Math.random() < 0.02 + wave * 0.005) {
        spawnEnemy();
      }
    }, 100);

    return () => clearInterval(timer);
  }, [gameState, wave, spawnEnemy]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      // Move player with keyboard
      setPlayer(prev => {
        let newX = prev.x;
        if (keys['ArrowLeft'] || keys['a']) newX -= 6;
        if (keys['ArrowRight'] || keys['d']) newX += 6;
        return {
          ...prev,
          x: Math.max(0, Math.min(CANVAS_WIDTH - prev.width, newX))
        };
      });

      // Shoot with spacebar
      if (keys[' ']) {
        const now = Date.now();
        if (now - lastShot > SHOOT_COOLDOWN) {
          setBullets(prev => [...prev, {
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 4,
            height: 10,
            speed: 8
          }]);
          setLastShot(now);
        }
      }

      // Move bullets
      setBullets(prev => prev
        .map(bullet => ({ ...bullet, y: bullet.y - bullet.speed }))
        .filter(bullet => bullet.y > -bullet.height)
      );

      // Move enemies
      setEnemies(prev => {
        const movedEnemies = prev.map(enemy => ({ ...enemy, y: enemy.y + enemy.speed }));
        
        // Check if any enemy reached bottom (lose life)
        const reachedBottom = movedEnemies.some(enemy => enemy.y > CANVAS_HEIGHT);
        if (reachedBottom) {
          setLives(prevLives => {
            const newLives = prevLives - 1;
            if (newLives <= 0) {
              setGameState('gameOver');
              onGameEnd(score);
            }
            return newLives;
          });
        }
        
        return movedEnemies.filter(enemy => enemy.y < CANVAS_HEIGHT + enemy.height);
      });

      // Check bullet-enemy collisions
      setBullets(prevBullets => {
        const remainingBullets = [...prevBullets];
        
        setEnemies(prevEnemies => {
          const remainingEnemies = [...prevEnemies];
          
          for (let i = remainingBullets.length - 1; i >= 0; i--) {
            const bullet = remainingBullets[i];
            
            for (let j = remainingEnemies.length - 1; j >= 0; j--) {
              const enemy = remainingEnemies[j];
              
              if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
              ) {
                // Hit!
                remainingBullets.splice(i, 1);
                enemy.health--;
                
                if (enemy.health <= 0) {
                  remainingEnemies.splice(j, 1);
                  setScore(prevScore => {
                    const newScore = prevScore + enemy.points;
                    onScoreUpdate(newScore);
                    return newScore;
                  });
                }
                break;
              }
            }
          }
          
          return remainingEnemies;
        });
        
        return remainingBullets;
      });

      // Check wave progression
      if (timeElapsed > 0 && timeElapsed % 300 === 0) { // Every 30 seconds
        setWave(prev => prev + 1);
      }
    }, 16); // ~60 FPS

    return () => clearInterval(gameLoop);
  }, [gameState, keys, player, lastShot, score, timeElapsed, onScoreUpdate, onGameEnd]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with space background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0f0f23');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw stars
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 50; i++) {
      const x = (i * 137) % CANVAS_WIDTH;
      const y = (i * 197 + timeElapsed * 2) % CANVAS_HEIGHT;
      ctx.fillRect(x, y, 1, 1);
    }

    // Draw player
    ctx.fillStyle = '#4ecdc4';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    // Player details
    ctx.fillStyle = '#45b7d1';
    ctx.fillRect(player.x + 10, player.y - 5, 30, 10);
    ctx.fillRect(player.x + 20, player.y + 10, 10, 20);

    // Draw bullets
    ctx.fillStyle = '#f39c12';
    bullets.forEach(bullet => {
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Draw enemies
    enemies.forEach(enemy => {
      ctx.fillStyle = enemy.color;
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      
      // Health indicator for tanks
      if (enemy.type === 'tank' && enemy.health > 1) {
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(enemy.health.toString(), enemy.x + enemy.width / 2, enemy.y - 5);
      }
    });

    // Draw UI
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Lives: ${lives}`, 150, 30);
    ctx.fillText(`Wave: ${wave}`, 280, 30);

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
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
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
        <div>🚀 Space Shooter</div>
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
          border: '3px solid rgba(255,255,255,0.3)',
          borderRadius: '10px',
          background: '#0f0f23',
          maxWidth: '100%',
          maxHeight: '70vh',
          cursor: 'crosshair'
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
          Move: Mouse or Arrow Keys (A/D) • Shoot: Click or Spacebar • Destroy enemies before they reach the bottom!
        </div>
      </div>
    </div>
  );
}
