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

interface SnakeEngineProps {
  onGameEnd: (score: number, gameData: any) => void;
  onScoreUpdate: (score: number) => void;
  gameConfig: GameConfig;
  onShowIntro: () => void;
}

// Game constants - Snake style
const getCanvasSize = () => {
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    // Mobile: square format for better Snake gameplay
    const size = Math.min(window.innerWidth - 20, 350);
    return {
      width: size,
      height: size,
    };
  } else {
    // Desktop: wider but still square-ish for Snake
    const size = Math.min(window.innerWidth - 40, 500);
    return {
      width: size,
      height: size,
    };
  }
};

// Snake game constants
const GRID_SIZE = 20; // Size of each grid cell
const INITIAL_SNAKE_LENGTH = 3;
const INITIAL_SPEED = 150; // milliseconds between moves
const SPEED_INCREASE = 10; // speed increase per food eaten
const MIN_SPEED = 80; // minimum speed (maximum difficulty)

// Colors
const SNAKE_COLOR = '#4CAF50';
const SNAKE_HEAD_COLOR = '#2E7D32';
const FOOD_COLOR = '#FF5722';
const BACKGROUND_COLOR = '#F5F5F5';
const GRID_COLOR = '#E0E0E0';

interface Position {
  x: number;
  y: number;
}

interface SnakeSegment extends Position {}

interface Food extends Position {}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export default function SnakeEngine({ 
  onGameEnd, 
  onScoreUpdate, 
  gameConfig,
  onShowIntro 
}: SnakeEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gameStartTime = useRef<number>(0);
  const lastMoveTime = useRef<number>(0);
  const nextDirection = useRef<Direction>('RIGHT');
  
  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [canvasSize, setCanvasSize] = useState(getCanvasSize());
  const [gameScorer] = useState(() => new GameScorer());
  const [difficultyLevel, setDifficultyLevel] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(INITIAL_SPEED);
  
  const [snake, setSnake] = useState<SnakeSegment[]>([]);
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [food, setFood] = useState<Food>({ x: 0, y: 0 });
  const [gridWidth, setGridWidth] = useState(0);
  const [gridHeight, setGridHeight] = useState(0);

  // Calculate grid dimensions
  useEffect(() => {
    const newGridWidth = Math.floor(canvasSize.width / GRID_SIZE);
    const newGridHeight = Math.floor(canvasSize.height / GRID_SIZE);
    setGridWidth(newGridWidth);
    setGridHeight(newGridHeight);
  }, [canvasSize]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newSize = getCanvasSize();
      setCanvasSize(newSize);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize snake and food
  const initializeGame = useCallback(() => {
    const centerX = Math.floor(gridWidth / 2);
    const centerY = Math.floor(gridHeight / 2);
    
    const initialSnake: SnakeSegment[] = [];
    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
      initialSnake.push({ x: centerX - i, y: centerY });
    }
    
    setSnake(initialSnake);
    setDirection('RIGHT');
    nextDirection.current = 'RIGHT';
    
    // Generate initial food
    generateFood(initialSnake);
  }, [gridWidth, gridHeight]);

  // Generate food at random position (not on snake)
  const generateFood = useCallback((currentSnake: SnakeSegment[]) => {
    let newFood: Food;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
      newFood = {
        x: Math.floor(Math.random() * gridWidth),
        y: Math.floor(Math.random() * gridHeight)
      };
      attempts++;
    } while (
      attempts < maxAttempts &&
      currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)
    );
    
    setFood(newFood);
  }, [gridWidth, gridHeight]);

  // Check if position is valid (within bounds and not on snake)
  const isValidPosition = useCallback((pos: Position, currentSnake: SnakeSegment[]) => {
    // Check bounds
    if (pos.x < 0 || pos.x >= gridWidth || pos.y < 0 || pos.y >= gridHeight) {
      return false;
    }
    
    // Check collision with snake body
    return !currentSnake.some(segment => segment.x === pos.x && segment.y === pos.y);
  }, [gridWidth, gridHeight]);

  // Move snake in current direction
  const moveSnake = useCallback(() => {
    setSnake(currentSnake => {
      if (currentSnake.length === 0) return currentSnake;
      
      const head = currentSnake[0];
      const currentDirection = nextDirection.current;
      
      let newHead: Position;
      switch (currentDirection) {
        case 'UP':
          newHead = { x: head.x, y: head.y - 1 };
          break;
        case 'DOWN':
          newHead = { x: head.x, y: head.y + 1 };
          break;
        case 'LEFT':
          newHead = { x: head.x - 1, y: head.y };
          break;
        case 'RIGHT':
          newHead = { x: head.x + 1, y: head.y };
          break;
      }
      
      // Check collision
      if (!isValidPosition(newHead, currentSnake)) {
        // Game over
        setIsRunning(false);
        onGameEnd(gameScorer.getScore(), {
          ...gameScorer.getGameStats(),
          snakeLength: currentSnake.length,
          gameType: 'snake'
        });
        return currentSnake;
      }
      
      const newSnake = [newHead, ...currentSnake];
      
      // Check if food eaten
      if (newHead.x === food.x && newHead.y === food.y) {
        // Food eaten - don't remove tail, add score
        const points = 100 + (difficultyLevel * 20);
        gameScorer.addObstacleCleared(points);
        const newScore = gameScorer.getScore();
        setScore(newScore);
        onScoreUpdate(newScore);
        
        // Increase speed
        setCurrentSpeed(prev => Math.max(MIN_SPEED, prev - SPEED_INCREASE));
        
        // Generate new food
        generateFood(newSnake);
        
        // Update difficulty
        const newDifficulty = Math.floor(newSnake.length / 5);
        setDifficultyLevel(newDifficulty);
        
        return newSnake;
      } else {
        // Normal move - remove tail
        return newSnake.slice(0, -1);
      }
    });
  }, [food, isValidPosition, gameScorer, onScoreUpdate, onGameEnd, generateFood, difficultyLevel]);

  // Handle direction change
  const changeDirection = useCallback((newDirection: Direction) => {
    if (!isRunning) return;
    
    const currentDir = nextDirection.current;
    
    // Prevent reverse direction
    const opposites: Record<Direction, Direction> = {
      'UP': 'DOWN',
      'DOWN': 'UP',
      'LEFT': 'RIGHT',
      'RIGHT': 'LEFT'
    };
    
    if (opposites[currentDir] !== newDirection) {
      nextDirection.current = newDirection;
      setDirection(newDirection);
    }
  }, [isRunning]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          changeDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          changeDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          changeDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          changeDirection('RIGHT');
          break;
        case ' ':
        case 'Escape':
          e.preventDefault();
          if (isRunning) {
            setIsRunning(false);
            onShowIntro();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [changeDirection, isRunning, onShowIntro]);

  // Mouse/Touch controls for mobile
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isRunning || snake.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const head = snake[0];
    const headPixelX = head.x * GRID_SIZE + GRID_SIZE / 2;
    const headPixelY = head.y * GRID_SIZE + GRID_SIZE / 2;

    const deltaX = clickX - headPixelX;
    const deltaY = clickY - headPixelY;

    // Determine direction based on which delta is larger
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal movement
      changeDirection(deltaX > 0 ? 'RIGHT' : 'LEFT');
    } else {
      // Vertical movement
      changeDirection(deltaY > 0 ? 'DOWN' : 'UP');
    }
  }, [isRunning, snake, changeDirection]);

  // Touch controls
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isRunning || snake.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    const head = snake[0];
    const headPixelX = head.x * GRID_SIZE + GRID_SIZE / 2;
    const headPixelY = head.y * GRID_SIZE + GRID_SIZE / 2;

    const deltaX = touchX - headPixelX;
    const deltaY = touchY - headPixelY;

    // Determine direction based on which delta is larger
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal movement
      changeDirection(deltaX > 0 ? 'RIGHT' : 'LEFT');
    } else {
      // Vertical movement
      changeDirection(deltaY > 0 ? 'DOWN' : 'UP');
    }
  }, [isRunning, snake, changeDirection]);

  // Draw game
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw grid (subtle)
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvasSize.width; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasSize.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvasSize.height; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasSize.width, y);
      ctx.stroke();
    }

    // Draw snake
    snake.forEach((segment, index) => {
      const x = segment.x * GRID_SIZE;
      const y = segment.y * GRID_SIZE;

      if (index === 0) {
        // Head
        ctx.fillStyle = SNAKE_HEAD_COLOR;
        ctx.fillRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2);

        // Eyes
        ctx.fillStyle = '#FFFFFF';
        const eyeSize = 3;
        const eyeOffset = 5;
        ctx.fillRect(x + eyeOffset, y + eyeOffset, eyeSize, eyeSize);
        ctx.fillRect(x + GRID_SIZE - eyeOffset - eyeSize, y + eyeOffset, eyeSize, eyeSize);
      } else {
        // Body
        ctx.fillStyle = SNAKE_COLOR;
        ctx.fillRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2);
      }
    });

    // Draw food
    const foodX = food.x * GRID_SIZE;
    const foodY = food.y * GRID_SIZE;
    ctx.fillStyle = FOOD_COLOR;
    ctx.beginPath();
    ctx.arc(
      foodX + GRID_SIZE / 2,
      foodY + GRID_SIZE / 2,
      GRID_SIZE / 2 - 2,
      0,
      2 * Math.PI
    );
    ctx.fill();

    // Draw score and info
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${formatScore(score)}`, 10, 25);
    ctx.fillText(`Length: ${snake.length}`, 10, 45);

    if (difficultyLevel > 0) {
      ctx.fillText(`Level: ${difficultyLevel + 1}`, 10, 65);
    }

    // Instructions
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'right';
    ctx.fillText('Arrow keys, WASD, or click/tap to move', canvasSize.width - 10, canvasSize.height - 10);
  }, [canvasSize, snake, food, score, difficultyLevel]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (!isRunning) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const now = Date.now();

    // Move snake based on speed
    if (now - lastMoveTime.current >= currentSpeed) {
      moveSnake();
      lastMoveTime.current = now;

      // Update time-based score
      gameScorer.updateTimeScore();
      const newScore = gameScorer.getScore();
      setScore(newScore);
      onScoreUpdate(newScore);
    }

    // Draw game
    draw(ctx);

    // Continue game loop
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [isRunning, currentSpeed, moveSnake, gameScorer, onScoreUpdate, draw]);

  // Start game
  const startGame = useCallback(() => {
    if (gridWidth === 0 || gridHeight === 0) return;

    gameScorer.reset();
    setIsRunning(true);
    setScore(0);
    setDifficultyLevel(0);
    setCurrentSpeed(INITIAL_SPEED);

    initializeGame();

    gameStartTime.current = Date.now();
    lastMoveTime.current = Date.now();
  }, [gridWidth, gridHeight, gameScorer, initializeGame]);

  // Auto-start game when component mounts and grid is ready
  useEffect(() => {
    if (gridWidth > 0 && gridHeight > 0) {
      startGame();
    }
  }, [gridWidth, gridHeight, startGame]);

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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      <div style={{ marginBottom: '10px', textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>🐍 Snake Game</h2>
        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
          Eat food to grow and earn points! Avoid walls and yourself.
        </p>
      </div>

      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onClick={handleCanvasClick}
        onTouchStart={handleTouchStart}
        style={{
          border: '2px solid #333',
          borderRadius: '8px',
          backgroundColor: BACKGROUND_COLOR,
          cursor: 'pointer',
          touchAction: 'none'
        }}
      />

      <div style={{
        marginTop: '15px',
        textAlign: 'center',
        maxWidth: canvasSize.width,
        fontSize: '12px',
        color: '#666'
      }}>
        <p style={{ margin: '5px 0' }}>
          <strong>Controls:</strong> Arrow keys, WASD, or click/tap to change direction
        </p>
        <p style={{ margin: '5px 0' }}>
          Press ESC or Space to pause
        </p>
      </div>
    </div>
  );
}
