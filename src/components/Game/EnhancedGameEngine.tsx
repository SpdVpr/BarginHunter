/** @jsxImportSource react */
import React, { useRef, useEffect, useState, useCallback } from 'react';

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

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const GROUND_Y = 320;
const GRAVITY = 0.8;
const JUMP_FORCE = -15;

// Player constants
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 40;
const PLAYER_X = 80;

// Difficulty progression
const DIFFICULTY_LEVELS = [
  { speed: 3, spawnRate: 2000, obstacleSize: 0.8 }, // Easy
  { speed: 4, spawnRate: 1800, obstacleSize: 0.9 }, // Medium
  { speed: 5, spawnRate: 1600, obstacleSize: 1.0 }, // Hard
  { speed: 6, spawnRate: 1400, obstacleSize: 1.1 }, // Very Hard
  { speed: 7, spawnRate: 1200, obstacleSize: 1.2 }, // Expert
];

// Obstacle types with pixel art designs
const OBSTACLE_TYPES = [
  { name: 'cactus', width: 30, height: 60, color: '#228B22' },
  { name: 'rock', width: 40, height: 30, color: '#696969' },
  { name: 'tree', width: 35, height: 70, color: '#8B4513' },
  { name: 'spike', width: 25, height: 45, color: '#FF4500' },
  { name: 'barrel', width: 35, height: 50, color: '#8B4513' },
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
  const [gameSpeed, setGameSpeed] = useState(3);
  const [difficultyLevel, setDifficultyLevel] = useState(0);
  const [lastObstacleSpawn, setLastObstacleSpawn] = useState(0);
  
  const [player, setPlayer] = useState<Player>({
    x: PLAYER_X,
    y: GROUND_Y - PLAYER_HEIGHT,
    velocityY: 0,
    isJumping: false,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
  });
  
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);

  // Draw pixel art character
  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D, player: Player) => {
    const { x, y, width, height } = player;
    
    // Character body (simple pixel art style)
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(x + 8, y + 8, width - 16, height - 16);
    
    // Character head
    ctx.fillStyle = '#FFE4B5';
    ctx.fillRect(x + 12, y + 4, width - 24, 16);
    
    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 16, y + 8, 3, 3);
    ctx.fillRect(x + 25, y + 8, 3, 3);
    
    // Legs (simple animation)
    ctx.fillStyle = '#4169E1';
    const legOffset = Math.sin(Date.now() * 0.01) * 2;
    ctx.fillRect(x + 12, y + height - 8, 6, 8);
    ctx.fillRect(x + 22, y + height - 8 + legOffset, 6, 8);
    
    // Add a simple cape effect when jumping
    if (player.isJumping) {
      ctx.fillStyle = '#FF4500';
      ctx.fillRect(x + width - 8, y + 12, 4, 16);
    }
  }, []);

  // Draw pixel art obstacles
  const drawObstacle = useCallback((ctx: CanvasRenderingContext2D, obstacle: Obstacle) => {
    const { x, y, width, height, type } = obstacle;
    
    switch (type) {
      case 'cactus':
        // Cactus body
        ctx.fillStyle = '#228B22';
        ctx.fillRect(x + 8, y, width - 16, height);
        // Cactus arms
        ctx.fillRect(x, y + height * 0.3, 8, height * 0.4);
        ctx.fillRect(x + width - 8, y + height * 0.5, 8, height * 0.3);
        // Spikes
        ctx.fillStyle = '#32CD32';
        for (let i = 0; i < 3; i++) {
          ctx.fillRect(x + 4, y + i * (height / 3) + 5, 4, 4);
          ctx.fillRect(x + width - 8, y + i * (height / 3) + 5, 4, 4);
        }
        break;
        
      case 'rock':
        // Rock body
        ctx.fillStyle = '#696969';
        ctx.fillRect(x, y, width, height);
        // Rock highlights
        ctx.fillStyle = '#A9A9A9';
        ctx.fillRect(x + 4, y + 4, width - 12, 8);
        ctx.fillRect(x + 8, y + height - 12, width - 16, 8);
        break;
        
      case 'tree':
        // Tree trunk
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x + width/3, y + height * 0.6, width/3, height * 0.4);
        // Tree leaves
        ctx.fillStyle = '#228B22';
        ctx.fillRect(x, y, width, height * 0.7);
        // Tree details
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(x + 4, y + 8, width - 8, 8);
        break;
        
      case 'spike':
        // Spike base
        ctx.fillStyle = '#FF4500';
        ctx.fillRect(x, y + height - 8, width, 8);
        // Spike points
        for (let i = 0; i < 3; i++) {
          const spikeX = x + (i * width / 3) + 4;
          ctx.beginPath();
          ctx.moveTo(spikeX, y + height - 8);
          ctx.lineTo(spikeX + 4, y);
          ctx.lineTo(spikeX + 8, y + height - 8);
          ctx.fill();
        }
        break;
        
      case 'barrel':
        // Barrel body
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x, y, width, height);
        // Barrel bands
        ctx.fillStyle = '#654321';
        ctx.fillRect(x, y + height * 0.2, width, 4);
        ctx.fillRect(x, y + height * 0.5, width, 4);
        ctx.fillRect(x, y + height * 0.8, width, 4);
        break;
    }
  }, []);

  // Draw background with parallax effect
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Clouds (simple pixel art)
    ctx.fillStyle = '#FFFFFF';
    const cloudOffset = (Date.now() * 0.02) % (CANVAS_WIDTH + 100);
    for (let i = 0; i < 3; i++) {
      const cloudX = (i * 300 - cloudOffset) % (CANVAS_WIDTH + 100);
      const cloudY = 50 + i * 30;
      // Cloud pixels
      ctx.fillRect(cloudX, cloudY, 60, 20);
      ctx.fillRect(cloudX + 10, cloudY - 8, 40, 16);
      ctx.fillRect(cloudX + 20, cloudY - 12, 20, 12);
    }
    
    // Ground
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
    
    // Ground texture
    ctx.fillStyle = '#A0522D';
    for (let x = 0; x < CANVAS_WIDTH; x += 20) {
      ctx.fillRect(x, GROUND_Y + 4, 16, 4);
      ctx.fillRect(x + 8, GROUND_Y + 12, 8, 4);
    }
  }, []);

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

  // Spawn obstacles with progressive difficulty
  const spawnObstacle = useCallback(() => {
    const currentDifficulty = DIFFICULTY_LEVELS[Math.min(difficultyLevel, DIFFICULTY_LEVELS.length - 1)];
    const obstacleType = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
    
    const newObstacle: Obstacle = {
      x: CANVAS_WIDTH,
      y: GROUND_Y - (obstacleType.height * currentDifficulty.obstacleSize),
      width: obstacleType.width * currentDifficulty.obstacleSize,
      height: obstacleType.height * currentDifficulty.obstacleSize,
      type: obstacleType.name,
      speed: currentDifficulty.speed,
      id: Date.now()
    };
    
    setObstacles(prev => [...prev, newObstacle]);
  }, [difficultyLevel]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (!isRunning) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw background
    drawBackground(ctx);
    
    // Update player physics
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
      
      return {
        ...prev,
        y: newY,
        velocityY: newVelocityY,
        isJumping: newIsJumping
      };
    });
    
    // Update score and difficulty
    const newScore = score + 1;
    setScore(newScore);
    onScoreUpdate(newScore);
    
    // Update difficulty every 500 points
    const newDifficultyLevel = Math.floor(newScore / 500);
    if (newDifficultyLevel !== difficultyLevel) {
      setDifficultyLevel(newDifficultyLevel);
    }
    
    // Spawn obstacles
    const currentDifficulty = DIFFICULTY_LEVELS[Math.min(difficultyLevel, DIFFICULTY_LEVELS.length - 1)];
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
      })).filter(obstacle => obstacle.x > -100);
      
      // Check collisions
      updated.forEach(obstacle => {
        if (player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y) {
          setIsRunning(false);
          onGameEnd(newScore, {
            duration: Date.now() - gameStartTime.current,
            difficultyReached: difficultyLevel,
            obstaclesAvoided: Math.floor(newScore / 100)
          });
        }
      });
      
      return updated;
    });
    
    // Draw game objects
    obstacles.forEach(obstacle => drawObstacle(ctx, obstacle));
    drawPlayer(ctx, player);
    
    // Continue game loop
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [isRunning, score, difficultyLevel, lastObstacleSpawn, player, obstacles, onScoreUpdate, onGameEnd, drawBackground, drawObstacle, drawPlayer, spawnObstacle]);

  // Start game
  const startGame = useCallback(() => {
    setIsRunning(true);
    setScore(0);
    setDifficultyLevel(0);
    setObstacles([]);
    setLastObstacleSpawn(0);
    setPlayer({
      x: PLAYER_X,
      y: GROUND_Y - PLAYER_HEIGHT,
      velocityY: 0,
      isJumping: false,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
    });
    gameStartTime.current = Date.now();
  }, []);

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
    <div style={{ textAlign: 'center' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          border: '3px solid #4ECDC4',
          borderRadius: '12px',
          cursor: 'pointer',
          background: '#87CEEB'
        }}
      />
      
      <div style={{ marginTop: '15px' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
          Score: {score}
        </div>
        <div style={{ fontSize: '16px', color: '#666', marginTop: '5px' }}>
          Difficulty Level: {difficultyLevel + 1} | Speed: {DIFFICULTY_LEVELS[Math.min(difficultyLevel, DIFFICULTY_LEVELS.length - 1)]?.speed || 3}
        </div>
        <div style={{ fontSize: '14px', color: '#888', marginTop: '10px' }}>
          Click or press SPACE to jump! Avoid obstacles to earn your discount!
        </div>
      </div>
      

    </div>
  );
}
