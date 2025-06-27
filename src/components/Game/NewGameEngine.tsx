import React, { useRef, useEffect, useState, useCallback } from 'react';

interface NewGameEngineProps {
  onGameEnd: (score: number, gameData: any) => void;
  onScoreUpdate: (score: number) => void;
  discountTiers: any[];
  gameConfig: any;
}

// Game constants
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const GROUND_Y = 350;
const GRAVITY = 0.6;
const JUMP_FORCE = -14;
const GAME_SPEED = 4;

// Character constants
const CHAR_WIDTH = 32;
const CHAR_HEIGHT = 48;
const CHAR_HITBOX_WIDTH = 20;
const CHAR_HITBOX_HEIGHT = 36;

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'obstacle' | 'collectible';
  hitboxWidth?: number;
  hitboxHeight?: number;
  hitboxOffsetX?: number;
  hitboxOffsetY?: number;
  value?: number;
  color?: string;
}

interface Player {
  x: number;
  y: number;
  velocityY: number;
  isJumping: boolean;
  isGrounded: boolean;
}

export default function NewGameEngine({ onGameEnd, onScoreUpdate, discountTiers, gameConfig }: NewGameEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gameStartTime = useRef<number>(0);
  
  const [isRunning, setIsRunning] = useState(true);
  const [score, setScore] = useState(0);
  const [gameObjects, setGameObjects] = useState<GameObject[]>([]);
  const [lastSpawnTime, setLastSpawnTime] = useState(0);
  
  const [player, setPlayer] = useState<Player>({
    x: 100,
    y: GROUND_Y - CHAR_HEIGHT,
    velocityY: 0,
    isJumping: false,
    isGrounded: true
  });

  // Jump function
  const jump = useCallback(() => {
    if (player.isGrounded && isRunning) {
      setPlayer(prev => ({
        ...prev,
        velocityY: JUMP_FORCE,
        isJumping: true,
        isGrounded: false
      }));
    }
  }, [player.isGrounded, isRunning]);

  // Input handling
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    };

    const handleClick = () => {
      jump();
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('click', handleClick);
    };
  }, [jump]);

  // Draw pixel art character
  const drawCharacter = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.imageSmoothingEnabled = false;
    
    // Character colors
    const colors = {
      skin: '#FFDBAC',
      hair: '#8B4513',
      hoodie: '#4ECDC4',
      hoodieShade: '#3BA99C',
      pants: '#2F4F4F',
      shoes: '#FFFFFF',
      outline: '#000000'
    };

    const scale = 2;
    const drawX = x - (CHAR_WIDTH * scale) / 2;
    const drawY = y - (CHAR_HEIGHT * scale) / 2;

    // Head
    ctx.fillStyle = colors.skin;
    ctx.fillRect(drawX + 12*scale, drawY + 4*scale, 8*scale, 8*scale);
    
    // Hair
    ctx.fillStyle = colors.hair;
    ctx.fillRect(drawX + 12*scale, drawY + 4*scale, 8*scale, 3*scale);
    
    // Eyes
    ctx.fillStyle = colors.outline;
    ctx.fillRect(drawX + 14*scale, drawY + 7*scale, 1*scale, 1*scale);
    ctx.fillRect(drawX + 17*scale, drawY + 7*scale, 1*scale, 1*scale);
    
    // Body - Hoodie
    ctx.fillStyle = colors.hoodie;
    ctx.fillRect(drawX + 10*scale, drawY + 12*scale, 12*scale, 16*scale);
    
    // Arms
    ctx.fillRect(drawX + 6*scale, drawY + 14*scale, 4*scale, 12*scale);
    ctx.fillRect(drawX + 22*scale, drawY + 14*scale, 4*scale, 12*scale);
    
    // Hands
    ctx.fillStyle = colors.skin;
    ctx.fillRect(drawX + 7*scale, drawY + 24*scale, 2*scale, 3*scale);
    ctx.fillRect(drawX + 23*scale, drawY + 24*scale, 2*scale, 3*scale);
    
    // Pants
    ctx.fillStyle = colors.pants;
    ctx.fillRect(drawX + 11*scale, drawY + 28*scale, 10*scale, 12*scale);
    
    // Legs
    ctx.fillRect(drawX + 12*scale, drawY + 32*scale, 3*scale, 8*scale);
    ctx.fillRect(drawX + 17*scale, drawY + 32*scale, 3*scale, 8*scale);
    
    // Shoes
    ctx.fillStyle = colors.shoes;
    ctx.fillRect(drawX + 11*scale, drawY + 40*scale, 5*scale, 4*scale);
    ctx.fillRect(drawX + 16*scale, drawY + 40*scale, 5*scale, 4*scale);
  };

  // Draw pixel art obstacle
  const drawObstacle = (ctx: CanvasRenderingContext2D, obj: GameObject) => {
    ctx.imageSmoothingEnabled = false;
    
    // Cactus obstacle
    const colors = {
      cactus: '#228B22',
      cactusDark: '#006400',
      spikes: '#8B4513'
    };

    // Main cactus body
    ctx.fillStyle = colors.cactus;
    ctx.fillRect(obj.x + 8, obj.y, 16, obj.height);
    
    // Cactus arms
    ctx.fillRect(obj.x + 4, obj.y + 12, 8, 12);
    ctx.fillRect(obj.x + 20, obj.y + 8, 8, 16);
    
    // Shading
    ctx.fillStyle = colors.cactusDark;
    ctx.fillRect(obj.x + 22, obj.y, 2, obj.height);
    ctx.fillRect(obj.x + 26, obj.y + 8, 2, 16);
    ctx.fillRect(obj.x + 10, obj.y + 12, 2, 12);
    
    // Spikes
    ctx.fillStyle = colors.spikes;
    for (let i = 0; i < obj.height; i += 8) {
      ctx.fillRect(obj.x + 6, obj.y + i + 2, 2, 2);
      ctx.fillRect(obj.x + 24, obj.y + i + 4, 2, 2);
    }
  };

  // Draw collectible
  const drawCollectible = (ctx: CanvasRenderingContext2D, obj: GameObject) => {
    ctx.imageSmoothingEnabled = false;
    
    // Coin/gem collectible
    const colors = {
      gold: '#FFD700',
      goldDark: '#FFA500',
      shine: '#FFFF99'
    };

    const centerX = obj.x + obj.width / 2;
    const centerY = obj.y + obj.height / 2;
    
    // Main coin body
    ctx.fillStyle = colors.gold;
    ctx.fillRect(centerX - 8, centerY - 8, 16, 16);
    
    // Shading
    ctx.fillStyle = colors.goldDark;
    ctx.fillRect(centerX + 6, centerY - 8, 2, 16);
    ctx.fillRect(centerX - 8, centerY + 6, 16, 2);
    
    // Shine effect
    ctx.fillStyle = colors.shine;
    ctx.fillRect(centerX - 6, centerY - 6, 4, 4);
    ctx.fillRect(centerX + 2, centerY + 2, 2, 2);
  };

  // Precise collision detection
  const checkCollision = (playerX: number, playerY: number, obj: GameObject): boolean => {
    // Player hitbox (centered and smaller than visual)
    const playerHitbox = {
      x: playerX - CHAR_HITBOX_WIDTH / 2,
      y: playerY - CHAR_HITBOX_HEIGHT / 2,
      width: CHAR_HITBOX_WIDTH,
      height: CHAR_HITBOX_HEIGHT
    };

    // Object hitbox (use custom hitbox if defined, otherwise use full size)
    const objHitbox = {
      x: obj.x + (obj.hitboxOffsetX || 0),
      y: obj.y + (obj.hitboxOffsetY || 0),
      width: obj.hitboxWidth || obj.width,
      height: obj.hitboxHeight || obj.height
    };

    // AABB collision detection
    return (
      playerHitbox.x < objHitbox.x + objHitbox.width &&
      playerHitbox.x + playerHitbox.width > objHitbox.x &&
      playerHitbox.y < objHitbox.y + objHitbox.height &&
      playerHitbox.y + playerHitbox.height > objHitbox.y
    );
  };

  // Spawn game objects
  const spawnObject = useCallback(() => {
    const now = Date.now();
    if (now - lastSpawnTime < 1500) return; // Spawn every 1.5 seconds

    const isObstacle = Math.random() < 0.7; // 70% obstacles, 30% collectibles
    
    if (isObstacle) {
      // Spawn cactus obstacle
      const height = 40 + Math.random() * 20;
      setGameObjects(prev => [...prev, {
        x: CANVAS_WIDTH,
        y: GROUND_Y - height,
        width: 32,
        height: height,
        type: 'obstacle',
        hitboxWidth: 20,
        hitboxHeight: height - 4,
        hitboxOffsetX: 6,
        hitboxOffsetY: 2
      }]);
    } else {
      // Spawn collectible
      setGameObjects(prev => [...prev, {
        x: CANVAS_WIDTH,
        y: GROUND_Y - 60 - Math.random() * 40,
        width: 20,
        height: 20,
        type: 'collectible',
        value: 10,
        hitboxWidth: 16,
        hitboxHeight: 16,
        hitboxOffsetX: 2,
        hitboxOffsetY: 2
      }]);
    }
    
    setLastSpawnTime(now);
  }, [lastSpawnTime]);

  // Main game loop
  useEffect(() => {
    if (!isRunning) return;

    const gameLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d')!;
      
      // Clear canvas
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Draw sky gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#E0F6FF');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Draw ground
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
      
      // Update player physics
      setPlayer(prev => {
        let newY = prev.y + prev.velocityY;
        let newVelocityY = prev.velocityY + GRAVITY;
        let newIsGrounded = prev.isGrounded;
        let newIsJumping = prev.isJumping;

        // Ground collision
        if (newY >= GROUND_Y - CHAR_HEIGHT) {
          newY = GROUND_Y - CHAR_HEIGHT;
          newVelocityY = 0;
          newIsGrounded = true;
          newIsJumping = false;
        } else {
          newIsGrounded = false;
        }

        return {
          ...prev,
          y: newY,
          velocityY: newVelocityY,
          isGrounded: newIsGrounded,
          isJumping: newIsJumping
        };
      });

      // Draw character
      drawCharacter(ctx, player.x, player.y + CHAR_HEIGHT / 2);

      // Spawn objects
      spawnObject();

      // Update and draw game objects
      setGameObjects(prev => {
        const updated = prev.map(obj => ({
          ...obj,
          x: obj.x - GAME_SPEED
        })).filter(obj => obj.x > -100);

        // Check collisions
        updated.forEach((obj, index) => {
          if (checkCollision(player.x, player.y + CHAR_HEIGHT / 2, obj)) {
            if (obj.type === 'obstacle') {
              // Game over
              setIsRunning(false);
              onGameEnd(score, {
                duration: Date.now() - gameStartTime.current,
                objectsCollected: Math.floor(score / 10),
                obstaclesHit: 1
              });
            } else if (obj.type === 'collectible') {
              // Collect item
              setScore(prev => {
                const newScore = prev + (obj.value || 10);
                onScoreUpdate(newScore);
                return newScore;
              });
              updated.splice(index, 1);
            }
          }
        });

        // Draw objects
        updated.forEach(obj => {
          if (obj.type === 'obstacle') {
            drawObstacle(ctx, obj);
          } else {
            drawCollectible(ctx, obj);
          }
        });

        return updated;
      });

      // Update score based on distance
      setScore(prev => {
        const newScore = prev + 0.1;
        onScoreUpdate(Math.floor(newScore));
        return newScore;
      });

      if (isRunning) {
        animationRef.current = requestAnimationFrame(gameLoop);
      }
    };

    gameStartTime.current = Date.now();
    gameLoop();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, player.y, player.velocityY, spawnObject, score, onGameEnd, onScoreUpdate]);

  return (
    <div style={{ textAlign: 'center' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          border: '2px solid #333',
          borderRadius: '8px',
          background: '#87CEEB'
        }}
      />
      <div style={{ marginTop: '10px', fontSize: '18px', fontWeight: 'bold' }}>
        Score: {Math.floor(score)}
      </div>
      <div style={{ marginTop: '5px', fontSize: '14px', color: '#666' }}>
        Click or press SPACE to jump!
      </div>
    </div>
  );
}
