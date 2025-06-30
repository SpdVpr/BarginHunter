/** @jsxImportSource react */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameScorer, getDifficultyName, formatScore } from '../../utils/gameScoring';

interface GameConfig {
  discountTiers: Array<{
    minScore: number;
    discount: number;
  }>;
  maxAttempts: number;
  minDiscount: number;
  maxDiscount: number;
}

interface TetrisEngineProps {
  onGameEnd: (score: number, gameData: any) => void;
  onScoreUpdate: (score: number) => void;
  gameConfig: GameConfig;
  onShowIntro: () => void;
}

// Game constants - horizontal Tetris
const getCanvasSize = () => {
  const isMobile = window.innerWidth <= 768;
  
  if (isMobile) {
    // Mobile: compact
    const width = Math.min(window.innerWidth - 20, 350);
    return {
      width,
      height: 400,
    };
  } else {
    // Desktop: wide but not too tall
    const width = Math.min(window.innerWidth - 40, 600);
    return {
      width,
      height: 450,
    };
  }
};

// Tetris constants
const BLOCK_SIZE = 25;
const BOARD_WIDTH = 12;
const BOARD_HEIGHT = 16;

// Tetris pieces (simplified - only 4 basic shapes)
const PIECES = [
  // I-piece (line)
  {
    shape: [[1, 1, 1, 1]],
    color: '#00FFFF'
  },
  // O-piece (square)
  {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#FFFF00'
  },
  // T-piece
  {
    shape: [
      [0, 1, 0],
      [1, 1, 1]
    ],
    color: '#800080'
  },
  // L-piece
  {
    shape: [
      [1, 0],
      [1, 0],
      [1, 1]
    ],
    color: '#FFA500'
  }
];

interface Piece {
  shape: number[][];
  color: string;
  x: number;
  y: number;
}

export default function TetrisEngine({ 
  onGameEnd, 
  onScoreUpdate, 
  gameConfig,
  onShowIntro 
}: TetrisEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gameStartTime = useRef<number>(0);
  const lastDrop = useRef<number>(0);
  
  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [canvasSize, setCanvasSize] = useState(getCanvasSize());
  const [gameScorer] = useState(() => new GameScorer());
  const [difficultyLevel, setDifficultyLevel] = useState(0);
  const [linesCleared, setLinesCleared] = useState(0);
  
  // Game board (0 = empty, 1 = filled)
  const [board, setBoard] = useState<string[][]>(() => 
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(''))
  );
  
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setCanvasSize(getCanvasSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Create new piece
  const createNewPiece = useCallback((): Piece => {
    const pieceTemplate = PIECES[Math.floor(Math.random() * PIECES.length)];
    return {
      shape: pieceTemplate.shape,
      color: pieceTemplate.color,
      x: Math.floor(BOARD_WIDTH / 2) - 1,
      y: 0
    };
  }, []);

  // Check if piece can be placed at position
  const canPlacePiece = useCallback((piece: Piece, offsetX = 0, offsetY = 0): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x + offsetX;
          const newY = piece.y + y + offsetY;
          
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return false;
          }
          
          if (newY >= 0 && board[newY][newX]) {
            return false;
          }
        }
      }
    }
    return true;
  }, [board]);

  // Rotate piece
  const rotatePiece = useCallback((piece: Piece): number[][] => {
    const rotated = piece.shape[0].map((_, index) =>
      piece.shape.map(row => row[index]).reverse()
    );
    return rotated;
  }, []);

  // Place piece on board
  const placePiece = useCallback((piece: Piece) => {
    setBoard(prevBoard => {
      const newBoard = prevBoard.map(row => [...row]);
      
      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x]) {
            const boardY = piece.y + y;
            const boardX = piece.x + x;
            if (boardY >= 0) {
              newBoard[boardY][boardX] = piece.color;
            }
          }
        }
      }
      
      return newBoard;
    });
  }, []);

  // Clear completed lines
  const clearLines = useCallback(() => {
    setBoard(prevBoard => {
      const newBoard = [...prevBoard];
      let linesCleared = 0;
      
      for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (newBoard[y].every(cell => cell !== '')) {
          newBoard.splice(y, 1);
          newBoard.unshift(Array(BOARD_WIDTH).fill(''));
          linesCleared++;
          y++; // Check the same line again
        }
      }
      
      if (linesCleared > 0) {
        // Add bonus points for clearing lines
        const lineBonus = linesCleared * 100;
        const bonusScore = gameScorer.addObstaclePoints();
        setScore(bonusScore + lineBonus);
        onScoreUpdate(bonusScore + lineBonus);
        setLinesCleared(prev => prev + linesCleared);
      }
      
      return newBoard;
    });
  }, [gameScorer, onScoreUpdate]);

  // Handle rotation (main control)
  const handleRotate = useCallback(() => {
    if (!isRunning || !currentPiece) return;
    
    const rotatedShape = rotatePiece(currentPiece);
    const rotatedPiece = { ...currentPiece, shape: rotatedShape };
    
    if (canPlacePiece(rotatedPiece)) {
      setCurrentPiece(rotatedPiece);
    }
  }, [isRunning, currentPiece, rotatePiece, canPlacePiece]);

  // Draw game
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = canvasSize;
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    
    // Calculate board position (centered)
    const boardPixelWidth = BOARD_WIDTH * BLOCK_SIZE;
    const boardPixelHeight = BOARD_HEIGHT * BLOCK_SIZE;
    const offsetX = (width - boardPixelWidth) / 2;
    const offsetY = (height - boardPixelHeight) / 2;
    
    // Draw board border
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(offsetX - 2, offsetY - 2, boardPixelWidth + 4, boardPixelHeight + 4);
    
    // Draw placed pieces
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (board[y][x]) {
          ctx.fillStyle = board[y][x];
          ctx.fillRect(
            offsetX + x * BLOCK_SIZE,
            offsetY + y * BLOCK_SIZE,
            BLOCK_SIZE - 1,
            BLOCK_SIZE - 1
          );
        }
      }
    }
    
    // Draw current piece
    if (currentPiece) {
      ctx.fillStyle = currentPiece.color;
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            ctx.fillRect(
              offsetX + (currentPiece.x + x) * BLOCK_SIZE,
              offsetY + (currentPiece.y + y) * BLOCK_SIZE,
              BLOCK_SIZE - 1,
              BLOCK_SIZE - 1
            );
          }
        }
      }
    }

    // Draw score overlay
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${formatScore(score)}`, 10, 30);
    ctx.fillText(`Lines: ${linesCleared}`, 10, 55);

    if (difficultyLevel > 0) {
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`Level: ${difficultyLevel + 1}`, 10, 80);
    }
  }, [canvasSize, board, currentPiece, score, linesCleared, difficultyLevel]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (!isRunning) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    // Update score
    const newScore = gameScorer.updateTimeScore();
    setScore(newScore);
    onScoreUpdate(newScore);
    
    // Update difficulty
    const currentDifficulty = gameScorer.getCurrentDifficultyLevel();
    if (currentDifficulty.level - 1 !== difficultyLevel) {
      setDifficultyLevel(currentDifficulty.level - 1);
    }
    
    // Drop piece based on difficulty
    const now = Date.now();
    const dropInterval = Math.max(200, 1000 - (currentDifficulty.level * 100));
    
    if (now - lastDrop.current > dropInterval) {
      if (currentPiece) {
        if (canPlacePiece(currentPiece, 0, 1)) {
          setCurrentPiece(prev => prev ? { ...prev, y: prev.y + 1 } : null);
        } else {
          // Piece can't move down, place it
          placePiece(currentPiece);
          clearLines();
          
          // Create new piece
          const newPiece = createNewPiece();
          if (canPlacePiece(newPiece)) {
            setCurrentPiece(newPiece);
          } else {
            // Game over
            setIsRunning(false);
            onGameEnd(gameScorer.getScore(), {
              ...gameScorer.getGameStats(),
              linesCleared,
              gameType: 'tetris'
            });
            return;
          }
        }
      } else {
        // Create first piece
        setCurrentPiece(createNewPiece());
      }
      lastDrop.current = now;
    }
    
    // Draw game
    draw(ctx);
    
    // Continue game loop
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [isRunning, gameScorer, onScoreUpdate, difficultyLevel, currentPiece, canPlacePiece, placePiece, clearLines, createNewPiece, draw, onGameEnd, linesCleared]);

  // Start game
  const startGame = useCallback(() => {
    gameScorer.reset();
    setIsRunning(true);
    setScore(0);
    setDifficultyLevel(0);
    setLinesCleared(0);
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill('')));
    setCurrentPiece(createNewPiece());
    lastDrop.current = Date.now();
    gameStartTime.current = Date.now();
  }, [gameScorer, createNewPiece]);

  // Auto-start game when component mounts
  useEffect(() => {
    startGame();
  }, [startGame]);

  // Event listeners
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleRotate();
      }
    };
    
    const handleClick = () => {
      handleRotate();
    };
    
    window.addEventListener('keydown', handleKeyPress);
    const canvas = canvasRef.current;
    canvas?.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      canvas?.removeEventListener('click', handleClick);
    };
  }, [handleRotate]);

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
        background: '#000'
      }}
    />
  );
}
