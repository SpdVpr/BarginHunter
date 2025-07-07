/** @jsxImportSource react */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import TouchControlsHint from './TouchControlsHint';
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
  adminTest?: boolean;
  onClose?: () => void;
}

// Game canvas that adapts to context (iframe or fullscreen)
const getCanvasSize = (adminTest = false) => {
  if (adminTest) {
    // Use iframe dimensions for admin testing
    const isMobile = window.innerWidth < 768;
    const width = isMobile ? 370 : 540;
    const height = isMobile ? 600 : 700;

    return {
      width: width,
      height: height,
      groundY: height * 0.85,
    };
  } else {
    // Use full viewport dimensions for normal widget
    const width = window.innerWidth;
    let height = window.innerHeight;

    // Reduce height by 20% on mobile devices for better usability
    const isMobile = width <= 768;
    if (isMobile) {
      height = height * 0.8; // 20% reduction
    }

    return {
      width: width,
      height: height,
      groundY: height * 0.85, // Ground at 85% of height - lower for better positioning
    };
  }
};

// Chrome Dino physics
const GRAVITY = 0.5; // Reduced gravity for better control
const JUMP_FORCE = -12; // Adjusted for new gravity

// Player constants - Chrome Dino style (larger size for better visibility)
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 40;
const PLAYER_X = 80;

// Use universal difficulty progression from gameScoring.ts

// Enhanced obstacle types with progressive difficulty
const OBSTACLE_TYPES = [
  // Basic obstacles (early game)
  { name: 'cactus', width: 20, height: 40, color: '#228B22', difficulty: 1 },
  { name: 'rock', width: 24, height: 20, color: '#696969', difficulty: 1 },
  { name: 'cactus2', width: 16, height: 35, color: '#228B22', difficulty: 1 },

  // Medium obstacles (mid game)
  { name: 'tall_cactus', width: 22, height: 55, color: '#1F5F1F', difficulty: 2 },
  { name: 'wide_rock', width: 35, height: 25, color: '#555555', difficulty: 2 },
  { name: 'spiky_cactus', width: 28, height: 45, color: '#2F7D32', difficulty: 2 },

  // Hard obstacles (late game)
  { name: 'giant_cactus', width: 30, height: 70, color: '#1B5E20', difficulty: 3 },
  { name: 'boulder', width: 40, height: 35, color: '#424242', difficulty: 3 },
  { name: 'cactus_cluster', width: 45, height: 50, color: '#2E7D32', difficulty: 3 },
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
  onShowIntro,
  adminTest = false,
  onClose
}: EnhancedGameEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gameStartTime = useRef<number>(0);

  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [difficultyLevel, setDifficultyLevel] = useState(0);
  const [lastObstacleSpawn, setLastObstacleSpawn] = useState(0);
  const [canvasSize, setCanvasSize] = useState(getCanvasSize(adminTest));
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
      const newSize = getCanvasSize(adminTest);
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

  // Enhanced pixel art character with walking animation
  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D, player: Player) => {
    const { x, y, width, height } = player;

    // Enhanced color palette
    const colors = {
      skin: '#FFDBAC',
      skinShade: '#E6C4A0',
      hair: '#8B4513',
      hoodie: '#4ECDC4',
      hoodieShade: '#3BA99C',
      hoodieHighlight: '#5FE5D8',
      pants: '#2F4F4F',
      pantsShade: '#1C3A3A',
      shoes: '#FFFFFF',
      shoesShade: '#CCCCCC',
      eyes: '#000000',
      accent: '#FF6B6B'
    };

    // Animation frame for walking
    const animFrame = Math.floor(Date.now() / 150) % 4;
    const walkCycle = [0, 1, 0, -1]; // Walking animation cycle
    const legOffset = player.isJumping ? 0 : walkCycle[animFrame];
    const armSwing = player.isJumping ? 0 : walkCycle[animFrame] * 0.5;

    // Scale factor for smaller character
    const scale = 0.8;
    const pixelSize = 1;

    // Helper function to draw scaled pixel
    const drawPixel = (px: number, py: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(x + px * pixelSize * scale, y + py * pixelSize * scale, pixelSize * scale, pixelSize * scale);
    };

    // Helper function to draw scaled rectangle
    const drawRect = (px: number, py: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(x + px * pixelSize * scale, y + py * pixelSize * scale, w * pixelSize * scale, h * pixelSize * scale);
    };

    // Head (more detailed)
    drawRect(6, 2, 8, 8, colors.skin);
    drawRect(6, 2, 8, 2, colors.hair); // Hair
    drawRect(6, 4, 8, 1, colors.skinShade); // Hair shadow

    // Eyes with animation
    drawPixel(8, 5, colors.eyes);
    drawPixel(11, 5, colors.eyes);
    if (animFrame === 0) { // Blink occasionally
      drawPixel(8, 6, colors.skinShade);
      drawPixel(11, 6, colors.skinShade);
    }

    // Nose and mouth
    drawPixel(9, 7, colors.skinShade);
    drawPixel(9, 8, colors.eyes);

    // Body - Enhanced Hoodie
    drawRect(5, 10, 10, 12, colors.hoodie);
    drawRect(5, 10, 10, 1, colors.hoodieShade); // Hood shadow
    drawRect(6, 11, 8, 1, colors.hoodieHighlight); // Highlight

    // Hoodie details
    drawRect(9, 12, 2, 8, colors.hoodieShade); // Zipper
    drawPixel(10, 13, colors.accent); // Zipper pull

    // Arms with swing animation
    const leftArmY = 12 + armSwing;
    const rightArmY = 12 - armSwing;
    drawRect(2, leftArmY, 3, 8, colors.hoodie);
    drawRect(15, rightArmY, 3, 8, colors.hoodie);

    // Hands
    drawRect(2, leftArmY + 8, 2, 2, colors.skin);
    drawRect(16, rightArmY + 8, 2, 2, colors.skin);

    // Pants
    drawRect(6, 22, 8, 8, colors.pants);
    drawRect(6, 22, 8, 1, colors.pantsShade); // Top shade
    drawRect(9, 24, 2, 6, colors.pantsShade); // Center seam

    // Legs with walking animation
    if (player.isJumping) {
      // Legs together when jumping
      drawRect(7, 30, 2, 6, colors.pants);
      drawRect(11, 30, 2, 6, colors.pants);
    } else {
      // Walking animation
      const leftLegY = 30 + legOffset;
      const rightLegY = 30 - legOffset;
      drawRect(7, leftLegY, 2, 6, colors.pants);
      drawRect(11, rightLegY, 2, 6, colors.pants);
    }

    // Shoes with walking animation
    if (player.isJumping) {
      drawRect(6, 36, 4, 3, colors.shoes);
      drawRect(10, 36, 4, 3, colors.shoes);
    } else {
      const leftShoeY = 36 + legOffset;
      const rightShoeY = 36 - legOffset;
      drawRect(6, leftShoeY, 4, 3, colors.shoes);
      drawRect(10, rightShoeY, 4, 3, colors.shoes);
      drawRect(6, leftShoeY + 2, 4, 1, colors.shoesShade);
      drawRect(10, rightShoeY + 2, 4, 1, colors.shoesShade);
    }

    // Add motion blur effect when running fast
    if (!player.isJumping && score > 200) {
      ctx.globalAlpha = 0.3;
      drawRect(0, 10, 2, 20, colors.hoodie); // Motion trail
      ctx.globalAlpha = 1.0;
    }
  }, [score]);

  // Draw simple obstacles - Chrome Dino style
  const drawObstacle = useCallback((ctx: CanvasRenderingContext2D, obstacle: Obstacle) => {
    const { x, y, width, height, type } = obstacle;

    switch (type) {
      case 'cactus':
        // Enhanced cactus with gradient
        const cactusGradient = ctx.createLinearGradient(x, y, x + width, y);
        cactusGradient.addColorStop(0, '#2E7D32');
        cactusGradient.addColorStop(1, '#1B5E20');
        ctx.fillStyle = cactusGradient;
        ctx.fillRect(x + 4, y, width - 8, height);
        // Enhanced cactus arms with shadows
        ctx.fillStyle = '#1F5F1F';
        ctx.fillRect(x, y + height * 0.3, 6, height * 0.4);
        ctx.fillRect(x + width - 6, y + height * 0.5, 6, height * 0.3);
        // Add spikes
        ctx.fillStyle = '#0F2F0F';
        for (let i = 0; i < 3; i++) {
          const spikeX = x + 4 + ((width - 8) / 4) * (i + 1);
          ctx.fillRect(spikeX - 1, y + height * 0.2, 2, 6);
        }
        break;

      case 'cactus2':
        // Enhanced smaller cactus
        const cactus2Gradient = ctx.createLinearGradient(x, y, x, y + height);
        cactus2Gradient.addColorStop(0, '#2E7D32');
        cactus2Gradient.addColorStop(1, '#1B5E20');
        ctx.fillStyle = cactus2Gradient;
        ctx.fillRect(x + 2, y, width - 4, height);
        ctx.fillRect(x + width - 4, y + height * 0.4, 4, height * 0.3);
        // Add texture
        ctx.fillStyle = '#1F5F1F';
        ctx.fillRect(x + width/2 - 1, y + height * 0.3, 2, height * 0.4);
        break;

      case 'rock':
        // Enhanced rock with texture
        const rockGradient = ctx.createRadialGradient(x + width/2, y + height/2, 0, x + width/2, y + height/2, width/2);
        rockGradient.addColorStop(0, '#808080');
        rockGradient.addColorStop(1, '#404040');
        ctx.fillStyle = rockGradient;
        ctx.fillRect(x, y, width, height);
        // Rock highlights
        ctx.fillStyle = '#A9A9A9';
        ctx.fillRect(x + 2, y + 2, width - 6, 4);
        ctx.fillRect(x + 3, y + height - 6, width - 8, 3);
        break;

      // New enhanced obstacles
      case 'tall_cactus':
        const tallGradient = ctx.createLinearGradient(x, y, x, y + height);
        tallGradient.addColorStop(0, '#2E7D32');
        tallGradient.addColorStop(1, '#1B5E20');
        ctx.fillStyle = tallGradient;
        ctx.fillRect(x + 3, y, width - 6, height);
        // Segments
        ctx.fillStyle = '#1F5F1F';
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(x + 1, y + (height/4) * i, width - 2, 2);
        }
        // Arms
        ctx.fillRect(x - 2, y + height * 0.3, 5, height * 0.2);
        ctx.fillRect(x + width - 3, y + height * 0.5, 5, height * 0.2);
        break;

      case 'wide_rock':
        const wideGradient = ctx.createLinearGradient(x, y, x + width, y + height);
        wideGradient.addColorStop(0, '#696969');
        wideGradient.addColorStop(1, '#2F2F2F');
        ctx.fillStyle = wideGradient;
        ctx.fillRect(x, y, width, height);
        // Multiple rock pieces
        ctx.fillStyle = '#555555';
        ctx.fillRect(x + 3, y + 2, width/3, height - 4);
        ctx.fillRect(x + width/2, y + 1, width/3, height - 2);
        break;

      case 'spiky_cactus':
        ctx.fillStyle = '#2F7D32';
        ctx.fillRect(x + 4, y, width - 8, height);
        // Many spikes
        ctx.fillStyle = '#1F5F1F';
        for (let i = 0; i < 6; i++) {
          const spikeX = x + 4 + ((width - 8) / 7) * (i + 1);
          const spikeHeight = 4 + (i % 2) * 3;
          ctx.fillRect(spikeX - 1, y + height * 0.1 + i * 2, 2, spikeHeight);
        }
        break;

      case 'giant_cactus':
        const giantGradient = ctx.createRadialGradient(x + width/2, y + height/2, 0, x + width/2, y + height/2, width);
        giantGradient.addColorStop(0, '#388E3C');
        giantGradient.addColorStop(1, '#1B5E20');
        ctx.fillStyle = giantGradient;
        ctx.fillRect(x + 5, y, width - 10, height);
        // Giant arms
        ctx.fillRect(x - 3, y + height * 0.3, 8, height * 0.3);
        ctx.fillRect(x + width - 5, y + height * 0.4, 8, height * 0.3);
        // Multiple spike rows
        ctx.fillStyle = '#0D4F0D';
        for (let row = 0; row < 3; row++) {
          for (let i = 0; i < 4; i++) {
            const spikeX = x + 5 + ((width - 10) / 5) * (i + 1);
            ctx.fillRect(spikeX - 1, y + height * (0.1 + row * 0.2), 2, 6);
          }
        }
        break;

      case 'boulder':
        const boulderGradient = ctx.createRadialGradient(x + width/2, y + height/2, 0, x + width/2, y + height/2, width/2);
        boulderGradient.addColorStop(0, '#757575');
        boulderGradient.addColorStop(1, '#212121');
        ctx.fillStyle = boulderGradient;
        ctx.fillRect(x, y, width, height);
        // Cracks
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + width * 0.2, y + height * 0.1);
        ctx.lineTo(x + width * 0.8, y + height * 0.9);
        ctx.moveTo(x + width * 0.7, y + height * 0.2);
        ctx.lineTo(x + width * 0.3, y + height * 0.8);
        ctx.stroke();
        break;

      case 'cactus_cluster':
        // Cluster of small cacti
        const positions = [
          { x: x, w: width * 0.3, h: height * 0.8, y: y + height * 0.2 },
          { x: x + width * 0.35, w: width * 0.3, h: height, y: y },
          { x: x + width * 0.7, w: width * 0.3, h: height * 0.7, y: y + height * 0.3 }
        ];

        positions.forEach(pos => {
          ctx.fillStyle = '#2E7D32';
          ctx.fillRect(pos.x, pos.y, pos.w, pos.h);
          // Small spikes
          ctx.fillStyle = '#1F5F1F';
          ctx.fillRect(pos.x + pos.w/2 - 1, pos.y + pos.h * 0.2, 2, 4);
        });
        break;

      default:
        // Fallback with gradient
        const fallbackGradient = ctx.createLinearGradient(x, y, x + width, y + height);
        fallbackGradient.addColorStop(0, '#8B4513');
        fallbackGradient.addColorStop(1, '#5D2F0A');
        ctx.fillStyle = fallbackGradient;
        ctx.fillRect(x, y, width, height);
    }
  }, []);

  // Enhanced background with clouds and better environment
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height, groundY } = canvasSize;

    // Beautiful gradient sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGradient.addColorStop(0, '#87CEEB'); // Sky blue
    skyGradient.addColorStop(0.7, '#B0E0E6'); // Powder blue
    skyGradient.addColorStop(1, '#F0F8FF'); // Alice blue
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, groundY);

    // Draw moving clouds
    const cloudOffset = (Date.now() * 0.02) % (width + 200);
    drawCloud(ctx, width - cloudOffset, 50, 80, 40);
    drawCloud(ctx, width - cloudOffset + 300, 80, 60, 30);
    drawCloud(ctx, width - cloudOffset + 600, 40, 100, 50);
    drawCloud(ctx, width - cloudOffset + 900, 70, 70, 35);

    // Enhanced ground with texture
    const groundGradient = ctx.createLinearGradient(0, groundY, 0, height);
    groundGradient.addColorStop(0, '#8B7355'); // Sandy brown
    groundGradient.addColorStop(0.3, '#A0522D'); // Sienna
    groundGradient.addColorStop(1, '#654321'); // Dark brown
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, groundY, width, height - groundY);

    // Ground surface line
    ctx.fillStyle = '#5D4E37';
    ctx.fillRect(0, groundY, width, 4);

    // Moving ground texture for speed effect
    ctx.fillStyle = '#6B5B47';
    const dotOffset = (Date.now() * 0.15) % 60;
    for (let x = -dotOffset; x < width; x += 60) {
      // Small rocks and debris
      ctx.fillRect(x, groundY + 8, 3, 2);
      ctx.fillRect(x + 20, groundY + 12, 2, 3);
      ctx.fillRect(x + 40, groundY + 6, 4, 2);
    }

    // Distant mountains/hills
    ctx.fillStyle = '#9370DB';
    ctx.globalAlpha = 0.3;
    drawMountain(ctx, -100, groundY - 80, 200, 80);
    drawMountain(ctx, 150, groundY - 60, 180, 60);
    drawMountain(ctx, 400, groundY - 100, 250, 100);
    drawMountain(ctx, 700, groundY - 70, 200, 70);
    ctx.globalAlpha = 1.0;
  }, [canvasSize]);

  // Helper function to draw fluffy clouds
  const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 0.8;

    // Main cloud body
    ctx.beginPath();
    ctx.arc(x, y + height/2, height/2, 0, Math.PI * 2);
    ctx.arc(x + width/4, y + height/3, height/3, 0, Math.PI * 2);
    ctx.arc(x + width/2, y + height/2, height/2.5, 0, Math.PI * 2);
    ctx.arc(x + 3*width/4, y + height/3, height/3, 0, Math.PI * 2);
    ctx.arc(x + width, y + height/2, height/2, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1.0;
  };

  // Helper function to draw mountains
  const drawMountain = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + width/3, y);
    ctx.lineTo(x + 2*width/3, y + height/3);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width, y + height);
    ctx.closePath();
    ctx.fill();
  };

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
    const currentDifficulty = gameScorer.getCurrentDifficultyLevel();
    const difficultyLevel = currentDifficulty.level;

    // Filter obstacles by difficulty level
    const availableObstacles = OBSTACLE_TYPES.filter(obstacle => {
      if (difficultyLevel <= 2) return obstacle.difficulty === 1; // Easy obstacles
      if (difficultyLevel <= 4) return obstacle.difficulty <= 2; // Easy + Medium
      return true; // All obstacles for high difficulty
    });

    const obstacleType = availableObstacles[Math.floor(Math.random() * availableObstacles.length)];

    // Progressive size scaling
    const sizeMultiplier = Math.min(1 + (difficultyLevel - 1) * 0.1, 1.5);

    const newObstacle: Obstacle = {
      x: canvasSize.width,
      y: canvasSize.groundY - (obstacleType.height * sizeMultiplier),
      width: obstacleType.width * sizeMultiplier,
      height: obstacleType.height * sizeMultiplier,
      type: obstacleType.name,
      speed: currentDifficulty.speed,
      id: Date.now()
    };

    setObstacles(prev => [...prev, newObstacle]);

    // Chance for double obstacles at higher difficulty
    if (difficultyLevel >= 3 && Math.random() < 0.3) {
      setTimeout(() => {
        const secondObstacleType = availableObstacles[Math.floor(Math.random() * availableObstacles.length)];
        const secondObstacle: Obstacle = {
          x: canvasSize.width + 80 + Math.random() * 40, // 80-120px gap
          y: canvasSize.groundY - (secondObstacleType.height * sizeMultiplier),
          width: secondObstacleType.width * sizeMultiplier,
          height: secondObstacleType.height * sizeMultiplier,
          type: secondObstacleType.name,
          speed: currentDifficulty.speed,
          id: Date.now() + 1
        };
        setObstacles(prev => [...prev, secondObstacle]);
      }, 100);
    }
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

    // Show current discount instead of level
    const currentDiscount = discountTiers.find(tier => score >= tier.minScore)?.discount || 0;
    if (currentDiscount > 0) {
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#4ecdc4';
      ctx.fillText(`${currentDiscount}% OFF`, 10, 55);
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

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      handleJump();
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      handleJump();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyPress);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('click', handleClick);
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
      canvas.style.touchAction = 'none'; // Prevent scrolling on touch
    }

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (canvas) {
        canvas.removeEventListener('click', handleClick);
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchend', handleTouchEnd);
      }
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
    <>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={adminTest ? {
          display: 'block',
          cursor: 'pointer',
          background: '#f7f7f7',
          margin: 0,
          padding: 0,
          border: 'none',
          borderRadius: 0,
          boxShadow: 'none',
          width: `${canvasSize.width}px`,
          height: `${canvasSize.height}px`,
          position: 'relative',
          zIndex: 1
        } : {
          display: 'block',
          cursor: 'pointer',
          background: '#f7f7f7',
          margin: 0,
          padding: 0,
          border: 'none',
          borderRadius: 0,
          boxShadow: 'none',
          width: '100vw',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 1
        }}
      />
      <TouchControlsHint gameType="dino" />

      {/* Close button for admin testing */}
      {adminTest && onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          ×
        </button>
      )}
    </>
  );
}
