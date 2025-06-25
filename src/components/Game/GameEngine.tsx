import React, { useRef, useEffect, useState, useCallback } from 'react';

interface GameEngineProps {
  onGameEnd: (score: number, gameData: any) => void;
  onScoreUpdate: (score: number) => void;
  discountTiers: any[];
  gameConfig: any;
}

interface GameState {
  isRunning: boolean;
  isPaused: boolean;
  score: number;
  distance: number;
  currentPhase: number;
  timeElapsed: number;
  powerUpsActive: any[];
}

interface PlayerEntity {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
  isJumping: boolean;
  isSliding: boolean;
  animationFrame: number;
}

interface GameObject {
  id: string;
  type: 'obstacle' | 'collectible';
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  value?: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const GROUND_Y = CANVAS_HEIGHT - 60;
const PLAYER_WIDTH = 32;
const PLAYER_HEIGHT = 48;
const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const GAME_SPEED = 5;

export default function GameEngine({ 
  onGameEnd, 
  onScoreUpdate, 
  discountTiers, 
  gameConfig 
}: GameEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [gameState, setGameState] = useState<GameState>({
    isRunning: false,
    isPaused: false,
    score: 0,
    distance: 0,
    currentPhase: 1,
    timeElapsed: 0,
    powerUpsActive: []
  });

  const [player, setPlayer] = useState<PlayerEntity>({
    x: 100,
    y: GROUND_Y - PLAYER_HEIGHT,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    velocityY: 0,
    isJumping: false,
    isSliding: false,
    animationFrame: 0
  });

  const [gameObjects, setGameObjects] = useState<GameObject[]>([]);
  const [lastSpawnTime, setLastSpawnTime] = useState(0);
  const [gameStartTime, setGameStartTime] = useState(0);

  // Game initialization
  const initGame = useCallback(() => {
    console.log('Initializing game...');
    setGameState({
      isRunning: true,
      isPaused: false,
      score: 0,
      distance: 0,
      currentPhase: 1,
      timeElapsed: 0,
      powerUpsActive: []
    });

    setPlayer({
      x: 100,
      y: GROUND_Y - PLAYER_HEIGHT,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      velocityY: 0,
      isJumping: false,
      isSliding: false,
      animationFrame: 0
    });

    setGameObjects([]);
    setLastSpawnTime(0);
    setGameStartTime(Date.now());
  }, []);

  // Input handling - simplified to just jump
  const handleJump = useCallback(() => {
    if (!gameState.isRunning || gameState.isPaused) return;

    setPlayer(prev => {
      if (!prev.isJumping) {
        console.log('Player jumping!');
        return {
          ...prev,
          velocityY: JUMP_FORCE,
          isJumping: true,
          isSliding: false
        };
      }
      return prev;
    });
  }, [gameState.isRunning, gameState.isPaused]);

  // Keyboard event listeners - simplified
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'ArrowUp') {
        event.preventDefault();
        handleJump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleJump]);

  // Mouse and touch event listeners - simplified to just jump
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleClick = (event: MouseEvent) => {
      event.preventDefault();
      handleJump();
    };

    const handleTouchStart = (event: TouchEvent) => {
      event.preventDefault();
      handleJump();
    };

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleTouchStart);

    return () => {
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchstart', handleTouchStart);
    };
  }, [handleJump]);

  // Spawn game objects
  const spawnObject = useCallback((currentTime: number) => {
    if (currentTime - lastSpawnTime < 2000) return; // Spawn every 2 seconds

    const isObstacle = Math.random() < 0.6; // 60% chance for obstacle
    const objectTypes = isObstacle 
      ? ['cart', 'queue', 'fallen_goods', 'wet_floor', 'terminal']
      : ['discount_tag', 'coin', 'vip_pass', 'mystery_box'];
    
    const type = objectTypes[Math.floor(Math.random() * objectTypes.length)];
    
    const newObject: GameObject = {
      id: `${type}-${currentTime}`,
      type: isObstacle ? 'obstacle' : 'collectible',
      x: CANVAS_WIDTH,
      y: isObstacle ? GROUND_Y - 40 : GROUND_Y - 60 - Math.random() * 100,
      width: 40,
      height: 40,
      speed: GAME_SPEED + gameState.currentPhase,
      ...(isObstacle ? {
        obstacleType: type
      } : {
        collectibleType: type,
        value: type === 'discount_tag' ? 25 : type === 'coin' ? 5 : type === 'mystery_box' ? 50 : 10,
        discountValue: type === 'discount_tag' ? Math.floor(Math.random() * 20) + 5 : undefined
      })
    };

    setGameObjects(prev => [...prev, newObject]);
    setLastSpawnTime(currentTime);
  }, [lastSpawnTime, gameState.currentPhase]);

  // Collision detection
  const checkCollisions = useCallback(() => {
    const playerRect = {
      x: player.x,
      y: player.y,
      width: player.width,
      height: player.height
    };

    gameObjects.forEach(obj => {
      const objRect = {
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: obj.height
      };

      // Simple AABB collision detection
      if (playerRect.x < objRect.x + objRect.width &&
          playerRect.x + playerRect.width > objRect.x &&
          playerRect.y < objRect.y + objRect.height &&
          playerRect.y + playerRect.height > objRect.y) {
        
        if (obj.type === 'obstacle') {
          // Game over
          endGame();
        } else if (obj.type === 'collectible') {
          // Collect item
          const collectible = obj as Collectible;
          setGameState(prev => ({
            ...prev,
            score: prev.score + (collectible.value || 0)
          }));
          
          // Remove collected item
          setGameObjects(prev => prev.filter(o => o.id !== obj.id));
        }
      }
    });
  }, [player, gameObjects]);

  // End game
  const endGame = useCallback(() => {
    setGameState(prev => ({ ...prev, isRunning: false }));
    
    const gameData = {
      duration: Date.now() - gameStartTime,
      objectsCollected: 0, // TODO: Track this
      obstaclesHit: 1,
      maxCombo: 0, // TODO: Track this
      distanceTraveled: gameState.distance
    };

    onGameEnd(gameState.score, gameData);
  }, [gameState.score, gameState.distance, gameStartTime, onGameEnd]);

  // Game loop
  const gameLoop = useCallback((currentTime: number) => {
    if (!gameState.isRunning || gameState.isPaused) {
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      console.log('Canvas not ready in game loop');
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

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
        isJumping: newIsJumping,
        animationFrame: (prev.animationFrame + 1) % 60
      };
    });

    // Update game objects
    setGameObjects(prev => 
      prev.map(obj => ({
        ...obj,
        x: obj.x - obj.speed
      })).filter(obj => obj.x + obj.width > 0) // Remove off-screen objects
    );

    // Update game state
    setGameState(prev => {
      const newScore = prev.score + 1; // Base score increment
      const newDistance = prev.distance + GAME_SPEED;
      const newPhase = Math.floor(newScore / 200) + 1;
      
      onScoreUpdate(newScore);
      
      return {
        ...prev,
        score: newScore,
        distance: newDistance,
        currentPhase: Math.min(newPhase, 5),
        timeElapsed: currentTime - gameStartTime
      };
    });

    // Spawn new objects
    spawnObject(currentTime);

    // Check collisions
    checkCollisions();

    // Draw background
    drawBackground(ctx);
    
    // Draw game objects
    gameObjects.forEach(obj => drawGameObject(ctx, obj));
    
    // Draw player
    drawPlayer(ctx, player);

    // Continue game loop
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, player, gameObjects, gameStartTime, spawnObject, checkCollisions, onScoreUpdate]);

  // Drawing functions
  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98FB98');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Ground
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, playerEntity: PlayerEntity) => {
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(playerEntity.x, playerEntity.y, playerEntity.width, playerEntity.height);
    
    // Simple animation effect
    if (playerEntity.animationFrame % 20 < 10) {
      ctx.fillStyle = '#FF5252';
      ctx.fillRect(playerEntity.x + 5, playerEntity.y + 5, playerEntity.width - 10, playerEntity.height - 10);
    }
  };

  const drawGameObject = (ctx: CanvasRenderingContext2D, obj: GameObject) => {
    if (obj.type === 'obstacle') {
      ctx.fillStyle = '#8B0000';
    } else {
      ctx.fillStyle = '#FFD700';
    }
    ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
  };

  // Start game
  useEffect(() => {
    console.log('Starting game engine...');
    initGame();

    // Wait for canvas to be ready
    const startGameLoop = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        console.log('Canvas ready, starting game loop...');
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        animationRef.current = requestAnimationFrame(gameLoop);
      } else {
        console.log('Canvas not ready, retrying...');
        setTimeout(startGameLoop, 100);
      }
    };

    startGameLoop();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="game-container">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="game-canvas"
        tabIndex={0}
      />

      <div className="game-ui-overlay">
        <div className="score-display">
          Score: {gameState.score}
        </div>

        <div className="discount-indicator">
          {discountTiers.find(tier => gameState.score >= tier.minScore)?.discount || 0}% OFF
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${Math.min((gameState.score % 200) / 200 * 100, 100)}%`
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <p><strong>Controls:</strong> Click mouse or press SPACE to Jump</p>
        <p><strong>Mobile:</strong> Tap anywhere to Jump</p>
      </div>
    </div>
  );
}
