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

interface EnhancedGameEngineProps {
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
      groundY: Math.max(size, 300) * 0.8, // Ground at 80% of height
    };
  } else {
    // Desktop: 600x600 default, scale down if needed
    const availableWidth = window.innerWidth - 20;
    const availableHeight = window.innerHeight - 20;
    const maxSize = Math.min(availableWidth, availableHeight, 600);
    const size = Math.max(maxSize, 400);
    return {
      width: size,
      height: size,
      groundY: size * 0.8, // Ground at 80% of height
    };
  }
};

// Chrome Dino physics
const GRAVITY = 0.5; // Reduced gravity for better control
const JUMP_FORCE = -12; // Adjusted for new gravity

// Player constants - Chrome Dino style
const PLAYER_WIDTH = 32;
const PLAYER_HEIGHT = 32;
const PLAYER_X = 80;

// Use universal difficulty progression from gameScoring.ts

// Obstacle types - Chrome Dino style (simpler, consistent)
const OBSTACLE_TYPES = [
  { name: 'cactus', width: 20, height: 40, color: '#228B22' },
  { name: 'rock', width: 24, height: 20, color: '#696969' },
  { name: 'cactus2', width: 16, height: 35, color: '#228B22' }, // Smaller cactus
];

interface Player {
  x: number;
  y: number;
  velocityY: number;
  isJumping: boolean;
  width: number;
  height: number;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  speed: number;
  id: number;
}

export default function EnhancedGameEngine({
  onGameEnd,
  onScoreUpdate,
  gameConfig,
  onShowIntro
}: EnhancedGameEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gameStartTime = useRef<number>(0);

  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [difficultyLevel, setDifficultyLevel] = useState(0);
  const [lastObstacleSpawn, setLastObstacleSpawn] = useState(0);
  const [canvasSize, setCanvasSize] = useState(getCanvasSize());
  const [gameScorer] = useState(() => new GameScorer());
  
  const [player, setPlayer] = useState<Player>({
    x: canvasSize.width * 0.1, // 10% from left
    y: canvasSize.groundY - PLAYER_HEIGHT,
    velocityY: 0,
    isJumping: false,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newSize = getCanvasSize();
      setCanvasSize(newSize);

      // Update player position proportionally
      setPlayer(prev => ({
        ...prev,
        x: newSize.width * 0.1,
        y: newSize.groundY - prev.height,
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);

  // Draw simple character - Chrome Dino style
  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D, player: Player) => {
    const { x, y, width, height } = player;

    // Simple character body
    ctx.fillStyle = '#535353';
    ctx.fillRect(x + 2, y + 4, width - 4, height - 8);

    // Character head
    ctx.fillStyle = '#535353';
    ctx.fillRect(x + 4, y, width - 8, 12);

    // Eye
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + width - 12, y + 2, 6, 4);
    ctx.fillStyle = '#000';
    ctx.fillRect(x + width - 10, y + 3, 2, 2);

    // Simple legs animation
    if (!player.isJumping) {
      ctx.fillStyle = '#535353';
      const legOffset = Math.floor(Date.now() / 100) % 2;
      ctx.fillRect(x + 6, y + height - 4, 4, 4);
      ctx.fillRect(x + width - 10, y + height - 4 + legOffset, 4, 4);
    }
  }, []);

  // Draw simple obstacles - Chrome Dino style
  const drawObstacle = useCallback((ctx: CanvasRenderingContext2D, obstacle: Obstacle) => {
    const { x, y, width, height, type } = obstacle;

    switch (type) {
      case 'cactus':
        // Simple cactus
        ctx.fillStyle = '#228B22';
        ctx.fillRect(x + 4, y, width - 8, height);
        // Cactus arms
        ctx.fillRect(x, y + height * 0.3, 6, height * 0.4);
        ctx.fillRect(x + width - 6, y + height * 0.5, 6, height * 0.3);
        break;

      case 'cactus2':
        // Smaller simple cactus
        ctx.fillStyle = '#228B22';
        ctx.fillRect(x + 2, y, width - 4, height);
        ctx.fillRect(x + width - 4, y + height * 0.4, 4, height * 0.3);
        break;

      case 'rock':
        // Simple rock
        ctx.fillStyle = '#696969';
        ctx.fillRect(x, y, width, height);
        ctx.fillStyle = '#A9A9A9';
        ctx.fillRect(x + 2, y + 2, width - 6, 4);
        break;
    }
  }, []);

  // Draw simple background - Chrome Dino style
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height, groundY } = canvasSize;

    // Simple sky
    ctx.fillStyle = '#f7f7f7';
    ctx.fillRect(0, 0, width, height);

    // Simple ground line
    ctx.fillStyle = '#535353';
    ctx.fillRect(0, groundY, width, 2);

    // Moving ground dots for speed effect
    ctx.fillStyle = '#535353';
    const dotOffset = (Date.now() * 0.1) % 40;
    for (let x = -dotOffset; x < width; x += 40) {
      ctx.fillRect(x, groundY + 8, 2, 2);
    }
  }, [canvasSize]);

  // Handle input
  const handleJump = useCallback(() => {
    if (!isRunning) return;
    
    setPlayer(prev => {
      if (!prev.isJumping) {
        return {
          ...prev,
          velocityY: JUMP_FORCE,
          isJumping: true
        };
      }
      return prev;
    });
  }, [isRunning]);

  // Spawn obstacles with universal difficulty
  const spawnObstacle = useCallback(() => {
    const currentDifficulty = gameScorer.getCurrentDifficultyLevel();
    const obstacleType = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];

    const newObstacle: Obstacle = {
      x: canvasSize.width,
      y: canvasSize.groundY - (obstacleType.height * currentDifficulty.obstacleSize),
      width: obstacleType.width * currentDifficulty.obstacleSize,
      height: obstacleType.height * currentDifficulty.obstacleSize,
      type: obstacleType.name,
      speed: currentDifficulty.speed,
      id: Date.now()
    };

    setObstacles(prev => [...prev, newObstacle]);
  }, [gameScorer, canvasSize]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (!isRunning) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    
    // Draw background
    drawBackground(ctx);
    
    // Update player physics
    setPlayer(prev => {
      let newY = prev.y + prev.velocityY;
      let newVelocityY = prev.velocityY + GRAVITY;
      let newIsJumping = prev.isJumping;
      
      // Ground collision
      if (newY >= canvasSize.groundY - prev.height) {
        newY = canvasSize.groundY - prev.height;
        newVelocityY = 0;
        newIsJumping = false;
      }
      
      return {
        ...prev,
        y: newY,
        velocityY: newVelocityY,
        isJumping: newIsJumping
      };
    });
    
    // Update score using universal scoring system
    const newScore = gameScorer.updateTimeScore();
    setScore(newScore);
    onScoreUpdate(newScore);

    // Update difficulty based on score
    const currentDifficulty = gameScorer.getCurrentDifficultyLevel();
    if (currentDifficulty.level - 1 !== difficultyLevel) {
      setDifficultyLevel(currentDifficulty.level - 1);
    }

    // Spawn obstacles based on current difficulty
    const now = Date.now();
    if (now - lastObstacleSpawn > currentDifficulty.spawnRate) {
      spawnObstacle();
      setLastObstacleSpawn(now);
    }
    
    // Update obstacles
    setObstacles(prev => {
      const updated = prev.map(obstacle => ({
        ...obstacle,
        x: obstacle.x - obstacle.speed
      }));

      // Check for obstacles that have been passed (add bonus points)
      updated.forEach(obstacle => {
        if (obstacle.x + obstacle.width < player.x && obstacle.x + obstacle.width >= player.x - obstacle.speed) {
          const bonusScore = gameScorer.addObstaclePoints();
          setScore(bonusScore);
          onScoreUpdate(bonusScore);
        }
      });

      // Filter out off-screen obstacles
      const filtered = updated.filter(obstacle => obstacle.x > -100);

      // Check collisions
      filtered.forEach(obstacle => {
        if (player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y) {
          setIsRunning(false);
          onGameEnd(gameScorer.getScore(), gameScorer.getGameStats());
        }
      });

      return filtered;
    });
    
    // Draw game objects
    obstacles.forEach(obstacle => drawObstacle(ctx, obstacle));
    drawPlayer(ctx, player);

    // Draw score overlay
    ctx.fillStyle = '#333';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${formatScore(score)}`, 10, 30);

    if (difficultyLevel > 0) {
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`Level: ${difficultyLevel + 1}`, 10, 55);
    }

    // Continue game loop
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [isRunning, score, difficultyLevel, lastObstacleSpawn, player, obstacles, onScoreUpdate, onGameEnd, drawBackground, drawObstacle, drawPlayer, spawnObstacle]);

  // Start game
  const startGame = useCallback(() => {
    gameScorer.reset();
    setIsRunning(true);
    setScore(0);
    setDifficultyLevel(0);
    setObstacles([]);
    setLastObstacleSpawn(0);
    setPlayer({
      x: canvasSize.width * 0.1,
      y: canvasSize.groundY - PLAYER_HEIGHT,
      velocityY: 0,
      isJumping: false,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
    });
    gameStartTime.current = Date.now();
  }, [canvasSize, gameScorer]);

  // Auto-start game when component mounts
  useEffect(() => {
    startGame();
  }, [startGame]);

  // Event listeners
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleJump();
      }
    };
    
    const handleClick = () => {
      handleJump();
    };
    
    window.addEventListener('keydown', handleKeyPress);
    const canvas = canvasRef.current;
    canvas?.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      canvas?.removeEventListener('click', handleClick);
    };
  }, [handleJump]);

  // Game loop effect
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
      style={{
        display: 'block',
        cursor: 'pointer',
        background: '#f7f7f7',
        width: '100%',
        height: '100%',
        maxWidth: '600px',
        maxHeight: '600px',
        objectFit: 'contain'
      }}
    />
  );
}
