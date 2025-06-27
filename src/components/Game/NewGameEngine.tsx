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

  // Draw pixel art obstacle (Chrome Dino style cactus)
  const drawObstacle = (ctx: CanvasRenderingContext2D, obj: GameObject) => {
    ctx.imageSmoothingEnabled = false;

    const colors = {
      cactus: '#228B22',
      cactusDark: '#006400',
      cactusLight: '#32CD32'
    };

    const centerX = obj.x + obj.width / 2;
    const baseWidth = Math.min(obj.width, 16);
    const baseX = centerX - baseWidth / 2;

    // Main cactus trunk
    ctx.fillStyle = colors.cactus;
    ctx.fillRect(baseX, obj.y, baseWidth, obj.height);

    // Shading on right side
    ctx.fillStyle = colors.cactusDark;
    ctx.fillRect(baseX + baseWidth - 3, obj.y, 3, obj.height);

    // Highlight on left side
    ctx.fillStyle = colors.cactusLight;
    ctx.fillRect(baseX, obj.y, 2, obj.height);

    // Add arms based on cactus size
    if (obj.width >= 32) {
      // Wide cactus - add side arms
      ctx.fillStyle = colors.cactus;
      // Left arm
      ctx.fillRect(obj.x + 2, obj.y + obj.height * 0.3, 8, obj.height * 0.4);
      // Right arm
      ctx.fillRect(obj.x + obj.width - 10, obj.y + obj.height * 0.2, 8, obj.height * 0.5);

      // Arm shading
      ctx.fillStyle = colors.cactusDark;
      ctx.fillRect(obj.x + 8, obj.y + obj.height * 0.3, 2, obj.height * 0.4);
      ctx.fillRect(obj.x + obj.width - 4, obj.y + obj.height * 0.2, 2, obj.height * 0.5);
    }

    // Add spikes/texture
    ctx.fillStyle = colors.cactusDark;
    for (let i = 4; i < obj.height - 4; i += 8) {
      // Small spikes on main trunk
      ctx.fillRect(baseX - 1, obj.y + i, 1, 2);
      ctx.fillRect(baseX + baseWidth, obj.y + i + 3, 1, 2);
    }
  };

  // Draw collectible (discount tag)
  const drawCollectible = (ctx: CanvasRenderingContext2D, obj: GameObject) => {
    ctx.imageSmoothingEnabled = false;

    const colors = {
      tag: '#FF6B6B',
      tagDark: '#E55555',
      tagLight: '#FF8888',
      text: '#FFFFFF'
    };

    const centerX = obj.x + obj.width / 2;
    const centerY = obj.y + obj.height / 2;

    // Discount tag shape (like a price tag)
    ctx.fillStyle = colors.tag;
    ctx.fillRect(centerX - 10, centerY - 8, 20, 16);

    // Tag point (right side)
    ctx.fillRect(centerX + 10, centerY - 4, 4, 8);

    // Shading
    ctx.fillStyle = colors.tagDark;
    ctx.fillRect(centerX + 8, centerY - 8, 2, 16);
    ctx.fillRect(centerX - 10, centerY + 6, 20, 2);

    // Highlight
    ctx.fillStyle = colors.tagLight;
    ctx.fillRect(centerX - 10, centerY - 8, 20, 2);

    // Hole for string
    ctx.fillStyle = colors.tagDark;
    ctx.fillRect(centerX - 6, centerY - 4, 2, 2);

    // Percentage symbol
    ctx.fillStyle = colors.text;
    ctx.fillRect(centerX - 2, centerY - 3, 1, 1);
    ctx.fillRect(centerX + 1, centerY + 2, 1, 1);
    ctx.fillRect(centerX - 1, centerY - 1, 3, 1);
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

  // Spawn logic moved to game loop to avoid callback dependencies

  // Main game loop with refs to avoid infinite re-renders
  const playerRef = useRef(player);
  const gameObjectsRef = useRef(gameObjects);
  const scoreRef = useRef(score);
  const lastSpawnTimeRef = useRef(lastSpawnTime);

  // Update refs when state changes
  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { gameObjectsRef.current = gameObjects; }, [gameObjects]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { lastSpawnTimeRef.current = lastSpawnTime; }, [lastSpawnTime]);

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
      const currentPlayer = playerRef.current;
      let newY = currentPlayer.y + currentPlayer.velocityY;
      let newVelocityY = currentPlayer.velocityY + GRAVITY;
      let newIsGrounded = currentPlayer.isGrounded;
      let newIsJumping = currentPlayer.isJumping;

      // Ground collision
      if (newY >= GROUND_Y - CHAR_HEIGHT) {
        newY = GROUND_Y - CHAR_HEIGHT;
        newVelocityY = 0;
        newIsGrounded = true;
        newIsJumping = false;
      } else {
        newIsGrounded = false;
      }

      const updatedPlayer = {
        ...currentPlayer,
        y: newY,
        velocityY: newVelocityY,
        isGrounded: newIsGrounded,
        isJumping: newIsJumping
      };

      setPlayer(updatedPlayer);
      playerRef.current = updatedPlayer;

      // Draw character
      drawCharacter(ctx, updatedPlayer.x, updatedPlayer.y + CHAR_HEIGHT / 2);

      // Spawn objects (Chrome Dino style - mostly obstacles)
      const now = Date.now();
      const spawnInterval = 1200 + Math.random() * 800; // Random interval 1.2-2.0 seconds

      if (now - lastSpawnTimeRef.current > spawnInterval) {
        // 85% obstacles (like Chrome Dino), 15% collectibles
        const isObstacle = Math.random() < 0.85;

        if (isObstacle) {
          // Spawn cactus obstacle (like Chrome Dino)
          const obstacleTypes = [
            { width: 24, height: 48 }, // Tall cactus
            { width: 32, height: 32 }, // Wide cactus
            { width: 20, height: 56 }  // Very tall cactus
          ];

          const obstacleType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];

          const newObstacle = {
            x: CANVAS_WIDTH + 50, // Start off-screen
            y: GROUND_Y - obstacleType.height,
            width: obstacleType.width,
            height: obstacleType.height,
            type: 'obstacle' as const,
            hitboxWidth: obstacleType.width - 8, // Slightly smaller hitbox
            hitboxHeight: obstacleType.height - 4,
            hitboxOffsetX: 4,
            hitboxOffsetY: 2
          };

          setGameObjects(prev => [...prev, newObstacle]);
          console.log('🌵 Spawned obstacle:', newObstacle);
        } else {
          // Spawn collectible (discount coin)
          const newCollectible = {
            x: CANVAS_WIDTH + 50,
            y: GROUND_Y - 80 - Math.random() * 60, // Higher in air
            width: 24,
            height: 24,
            type: 'collectible' as const,
            value: 25, // Higher value for fewer collectibles
            hitboxWidth: 20,
            hitboxHeight: 20,
            hitboxOffsetX: 2,
            hitboxOffsetY: 2
          };

          setGameObjects(prev => [...prev, newCollectible]);
          console.log('💰 Spawned collectible:', newCollectible);
        }

        setLastSpawnTime(now);
        lastSpawnTimeRef.current = now;
      }

      // Update and draw game objects
      const currentObjects = gameObjectsRef.current;
      const updatedObjects = currentObjects.map(obj => ({
        ...obj,
        x: obj.x - GAME_SPEED
      })).filter(obj => obj.x > -100);

      // Check collisions
      let gameEnded = false;
      updatedObjects.forEach((obj, index) => {
        if (checkCollision(updatedPlayer.x, updatedPlayer.y + CHAR_HEIGHT / 2, obj)) {
          if (obj.type === 'obstacle') {
            // Game over
            gameEnded = true;
            setIsRunning(false);
            onGameEnd(scoreRef.current, {
              duration: Date.now() - gameStartTime.current,
              objectsCollected: Math.floor(scoreRef.current / 10),
              obstaclesHit: 1
            });
          } else if (obj.type === 'collectible') {
            // Collect item
            const newScore = scoreRef.current + (obj.value || 10);
            setScore(newScore);
            scoreRef.current = newScore;
            onScoreUpdate(newScore);
            updatedObjects.splice(index, 1);
          }
        }
      });

      // Draw objects
      updatedObjects.forEach(obj => {
        if (obj.type === 'obstacle') {
          drawObstacle(ctx, obj);
        } else {
          drawCollectible(ctx, obj);
        }
      });

      setGameObjects(updatedObjects);
      gameObjectsRef.current = updatedObjects;

      // Update score based on distance (like Chrome Dino)
      if (!gameEnded) {
        const newScore = scoreRef.current + 0.5; // Faster score increase
        setScore(newScore);
        scoreRef.current = newScore;
        onScoreUpdate(Math.floor(newScore));
      }

      if (isRunning && !gameEnded) {
        animationRef.current = requestAnimationFrame(gameLoop);
      }
    };

    gameStartTime.current = Date.now();
    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning]);

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
