/** @jsxImportSource react */
import React, { useRef, useEffect, useState, useCallback } from 'react';
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

interface SpaceInvadersEngineProps {
  onGameEnd: (score: number, gameData: any) => void;
  onScoreUpdate: (score: number) => void;
  gameConfig: GameConfig;
  onShowIntro: () => void;
}

// Game constants - fullscreen 600x600 default
const getCanvasSize = () => {
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    // Mobile: use full available space, minimum 300x300
    const availableWidth = window.innerWidth - 10;
    const availableHeight = window.innerHeight - 10;
    const size = Math.min(availableWidth, availableHeight, 600);
    return {
      width: Math.max(size, 300),
      height: Math.max(size, 300),
    };
  } else {
    // Desktop: 600x600 default, scale down if needed
    const availableWidth = window.innerWidth - 20;
    const availableHeight = window.innerHeight - 20;
    const maxSize = Math.min(availableWidth, availableHeight, 600);
    return {
      width: Math.max(maxSize, 400),
      height: Math.max(maxSize, 400),
    };
  }
};

// Game objects interfaces
interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

interface Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

interface Invader {
  x: number;
  y: number;
  width: number;
  height: number;
  alive: boolean;
  type: 'small' | 'medium' | 'large';
  points: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export default function SpaceInvadersEngine({ 
  onGameEnd, 
  onScoreUpdate, 
  gameConfig,
  onShowIntro 
}: SpaceInvadersEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gameStartTime = useRef<number>(0);
  
  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [canvasSize, setCanvasSize] = useState(getCanvasSize());
  const [gameScorer] = useState(() => new GameScorer());
  const [difficultyLevel, setDifficultyLevel] = useState(0);

  // Game state
  const [player, setPlayer] = useState<Player>({
    x: 0,
    y: 0,
    width: 40,
    height: 20,
    speed: 5
  });
  
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [invaders, setInvaders] = useState<Invader[]>([]);
  const [invaderBullets, setInvaderBullets] = useState<Bullet[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  
  const fireCounterRef = useRef(0);
  const invaderDirectionRef = useRef(1);
  const keysRef = useRef<{[key: string]: boolean}>({});

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newSize = getCanvasSize();
      setCanvasSize(newSize);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize player position when canvas size changes
  useEffect(() => {
    setPlayer(prev => ({
      ...prev,
      x: canvasSize.width / 2 - prev.width / 2,
      y: canvasSize.height - 40
    }));
  }, [canvasSize]);

  // Create invaders
  const createInvaders = useCallback(() => {
    const newInvaders: Invader[] = [];
    const rows = 5;
    const cols = Math.min(10, Math.floor(canvasSize.width / 50));
    const invaderWidth = 30;
    const invaderHeight = 20;
    const spacing = Math.floor(canvasSize.width / (cols + 1));
    const startX = (canvasSize.width - (cols * spacing)) / 2;
    const startY = 60;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const type = row < 2 ? 'small' : row < 4 ? 'medium' : 'large';
        newInvaders.push({
          x: startX + col * spacing,
          y: startY + row * 40,
          width: invaderWidth,
          height: invaderHeight,
          alive: true,
          type,
          points: type === 'small' ? 30 : type === 'medium' ? 20 : 10
        });
      }
    }
    
    setInvaders(newInvaders);
  }, [canvasSize]);

  // Create explosion particles
  const createParticles = useCallback((x: number, y: number, color = '#00ff00') => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 8; i++) {
      newParticles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 30,
        maxLife: 30,
        color: color
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isRunning) {
          setIsRunning(false);
          onShowIntro();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRunning, onShowIntro]);

  // Touch controls
  const [touchX, setTouchX] = useState(0);
  const [isTouching, setIsTouching] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isRunning) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * (canvasSize.width / rect.width);
    setTouchX(x);
    setIsTouching(true);
  }, [isRunning, canvasSize]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isTouching) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * (canvasSize.width / rect.width);
    setTouchX(x);
  }, [isTouching, canvasSize]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsTouching(false);
  }, []);

  // Game logic functions
  const updateGame = useCallback(() => {
    if (!isRunning) return;

    // Update player movement
    setPlayer(prev => {
      let newX = prev.x;

      // Keyboard controls
      if (keysRef.current['ArrowLeft'] && newX > 0) {
        newX -= prev.speed;
      }
      if (keysRef.current['ArrowRight'] && newX < canvasSize.width - prev.width) {
        newX += prev.speed;
      }

      // Touch controls
      if (isTouching) {
        const targetX = touchX - prev.width / 2;
        const diff = targetX - newX;
        newX += Math.sign(diff) * Math.min(Math.abs(diff), prev.speed);
        newX = Math.max(0, Math.min(canvasSize.width - prev.width, newX));
      }

      return { ...prev, x: newX };
    });

    // Auto-fire (slower for better control)
    fireCounterRef.current++;
    if (fireCounterRef.current >= 25) {
      setBullets(prev => [...prev, {
        x: player.x + player.width / 2 - 2,
        y: player.y,
        width: 4,
        height: 10,
        speed: 7
      }]);
      fireCounterRef.current = 0;
    }

    // Update bullets
    setBullets(prev => prev.filter(bullet => {
      bullet.y -= bullet.speed;
      return bullet.y > -10;
    }));

    setInvaderBullets(prev => prev.filter(bullet => {
      bullet.y += bullet.speed;
      return bullet.y < canvasSize.height + 10;
    }));

    // Update invaders
    setInvaders(prev => {
      let hitEdge = false;
      const aliveInvaders = prev.filter(inv => inv.alive);

      // Check edge collision
      aliveInvaders.forEach(invader => {
        if ((invader.x <= 0 && invaderDirectionRef.current < 0) ||
            (invader.x >= canvasSize.width - invader.width && invaderDirectionRef.current > 0)) {
          hitEdge = true;
        }
      });

      // Move invaders
      return prev.map(invader => {
        if (!invader.alive) return invader;

        if (hitEdge) {
          invaderDirectionRef.current *= -1;
          return { ...invader, y: invader.y + 15 };
        } else {
          return { ...invader, x: invader.x + invaderDirectionRef.current * (0.3 + difficultyLevel * 0.2) };
        }
      });
    });

    // Random invader shooting (much less frequent)
    if (Math.random() < 0.001 + difficultyLevel * 0.0005) {
      const aliveInvaders = invaders.filter(inv => inv.alive);
      if (aliveInvaders.length > 0) {
        const shooter = aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
        setInvaderBullets(prev => [...prev, {
          x: shooter.x + shooter.width / 2 - 3,
          y: shooter.y + shooter.height,
          width: 6,
          height: 8,
          speed: 2 + difficultyLevel * 0.3
        }]);
      }
    }

    // Update particles
    setParticles(prev => prev.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
      return particle.life > 0;
    }));
  }, [isRunning, player, invaders, difficultyLevel, canvasSize, isTouching, touchX]);

  // Collision detection and scoring
  useEffect(() => {
    if (!isRunning) return;

    // Player bullets vs invaders
    setBullets(prevBullets => {
      const remainingBullets = [...prevBullets];

      setInvaders(prevInvaders => {
        return prevInvaders.map(invader => {
          if (!invader.alive) return invader;

          const bulletIndex = remainingBullets.findIndex(bullet =>
            bullet.x < invader.x + invader.width &&
            bullet.x + bullet.width > invader.x &&
            bullet.y < invader.y + invader.height &&
            bullet.y + bullet.height > invader.y
          );

          if (bulletIndex !== -1) {
            // Hit!
            remainingBullets.splice(bulletIndex, 1);
            gameScorer.addObstaclePoints();

            const newScore = gameScorer.getScore();
            setScore(newScore);
            onScoreUpdate(newScore);

            createParticles(invader.x + invader.width/2, invader.y + invader.height/2,
              invader.type === 'small' ? '#ff4444' : invader.type === 'medium' ? '#ffaa00' : '#44aaff');

            return { ...invader, alive: false };
          }

          return invader;
        });
      });

      return remainingBullets;
    });

    // Invader bullets vs player
    setInvaderBullets(prevBullets => {
      const hit = prevBullets.find(bullet =>
        bullet.x < player.x + player.width &&
        bullet.x + bullet.width > player.x &&
        bullet.y < player.y + player.height &&
        bullet.y + bullet.height > player.y
      );

      if (hit) {
        createParticles(player.x + player.width/2, player.y + player.height/2, '#00ff00');
        setLives(prev => prev - 1);
        return prevBullets.filter(b => b !== hit);
      }

      return prevBullets;
    });

    // Check game over conditions
    const aliveInvaders = invaders.filter(inv => inv.alive);
    const invaderReachedBottom = aliveInvaders.some(inv => inv.y + inv.height >= player.y);

    if (lives <= 0 || invaderReachedBottom) {
      setIsRunning(false);
      onGameEnd(gameScorer.getScore(), {
        ...gameScorer.getGameStats(),
        finalLevel: difficultyLevel + 1,
        livesRemaining: Math.max(0, lives),
        gameType: 'space_invaders'
      });
    }

    // Check level completion
    if (aliveInvaders.length === 0) {
      setDifficultyLevel(prev => Math.min(prev + 1, DIFFICULTY_PROGRESSION.length - 1));
      gameScorer.addObstaclePoints(); // Level completion bonus
      createInvaders();

      const newScore = gameScorer.getScore();
      setScore(newScore);
      onScoreUpdate(newScore);
    }
  }, [isRunning, player, invaders, lives, difficultyLevel, gameScorer, onScoreUpdate, onGameEnd, createInvaders, createParticles]);

  // Draw function
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasSize.height);
    gradient.addColorStop(0, '#000011');
    gradient.addColorStop(1, '#000033');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
      const x = (i * 123) % canvasSize.width;
      const y = (i * 456 + Date.now() * 0.01) % canvasSize.height;
      ctx.fillRect(x, y, 1, 1);
    }

    // Draw player
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Player details
    ctx.fillStyle = '#44ff44';
    ctx.fillRect(player.x + 8, player.y - 3, player.width - 16, 6);
    ctx.fillRect(player.x + 16, player.y - 6, 8, 6);

    // Draw invaders
    invaders.forEach(invader => {
      if (!invader.alive) return;

      let color;
      switch(invader.type) {
        case 'small': color = '#ff4444'; break;
        case 'medium': color = '#ffaa00'; break;
        case 'large': color = '#44aaff'; break;
      }

      ctx.fillStyle = color;
      ctx.fillRect(invader.x, invader.y, invader.width, invader.height);

      // Invader details
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(invader.x + 3, invader.y + 3, 6, 6);
      ctx.fillRect(invader.x + invader.width - 9, invader.y + 3, 6, 6);

      ctx.fillStyle = color;
      ctx.fillRect(invader.x + 10, invader.y + 12, invader.width - 20, 6);
    });

    // Draw bullets
    ctx.fillStyle = '#00ff00';
    bullets.forEach(bullet => {
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    ctx.fillStyle = '#ff4444';
    invaderBullets.forEach(bullet => {
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Draw particles
    particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(particle.x, particle.y, 3, 3);
      ctx.globalAlpha = 1;
    });

    // Draw UI
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${formatScore(score)}`, 10, 25);
    ctx.fillText(`Lives: ${lives}`, 10, 45);

    if (difficultyLevel > 0) {
      ctx.fillText(`Level: ${difficultyLevel + 1}`, canvasSize.width - 100, 25);
    }


  }, [canvasSize, player, invaders, bullets, invaderBullets, particles, score, lives, difficultyLevel]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (!isRunning) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    updateGame();
    draw(ctx);

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [isRunning, updateGame, draw]);

  // Start game
  const startGame = useCallback(() => {
    gameScorer.reset();
    setIsRunning(true);
    setScore(0);
    setLives(3);
    setDifficultyLevel(0);
    setBullets([]);
    setInvaderBullets([]);
    setParticles([]);
    fireCounterRef.current = 0;
    invaderDirectionRef.current = 1;

    // Initialize player position
    setPlayer(prev => ({
      ...prev,
      x: canvasSize.width / 2 - prev.width / 2,
      y: canvasSize.height - 40
    }));

    createInvaders();
    gameStartTime.current = Date.now();
  }, [gameScorer, canvasSize, createInvaders]);

  // Auto-start game when component mounts
  useEffect(() => {
    startGame();
  }, [startGame]);

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
    <canvas
      ref={canvasRef}
      width={canvasSize.width}
      height={canvasSize.height}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        display: 'block',
        backgroundColor: '#000',
        cursor: 'pointer',
        touchAction: 'none',
        width: '100%',
        height: '100%',
        maxWidth: '600px',
        maxHeight: '600px',
        objectFit: 'contain'
      }}
    />
  );
}
