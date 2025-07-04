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

interface FruitNinjaEngineProps {
  onGameEnd: (score: number, gameData: any) => void;
  onScoreUpdate: (score: number) => void;
  gameConfig: GameConfig;
  onShowIntro: () => void;
}

// Game constants
const GRAVITY = 0.5;
const FRUIT_SIZE = 60;
const BOMB_SIZE = 50;

interface Fruit {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'apple' | 'orange' | 'banana' | 'watermelon' | 'bomb';
  sliced: boolean;
  emoji: string;
  points: number;
  sliceTime?: number;
}

interface SliceTrail {
  x: number;
  y: number;
  time: number;
}

export default function FruitNinjaEngine({ 
  onGameEnd, 
  onScoreUpdate, 
  gameConfig, 
  onShowIntro 
}: FruitNinjaEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gameStartTime = useRef<number>(0);
  const gameScorer = useRef(new GameScorer());
  const lastSpawnTime = useRef<number>(0);
  const nextFruitId = useRef<number>(1);
  
  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [sliceTrail, setSliceTrail] = useState<SliceTrail[]>([]);
  const [isSlicing, setIsSlicing] = useState(false);

  // Fruit types with emojis and points
  const fruitTypes = [
    { type: 'apple' as const, emoji: '🍎', points: 10 },
    { type: 'orange' as const, emoji: '🍊', points: 15 },
    { type: 'banana' as const, emoji: '🍌', points: 20 },
    { type: 'watermelon' as const, emoji: '🍉', points: 25 }
  ];

  // Handle canvas resize
  useEffect(() => {
    const updateCanvasSize = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        const maxWidth = Math.min(rect.width - 40, 800);
        const maxHeight = Math.min(rect.height - 40, 600);
        
        setCanvasSize({
          width: maxWidth,
          height: maxHeight
        });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Spawn fruit
  const spawnFruit = useCallback(() => {
    const now = Date.now();
    if (now - lastSpawnTime.current < 1000 + Math.random() * 1500) return;
    
    lastSpawnTime.current = now;
    
    // 15% chance for bomb
    const isBomb = Math.random() < 0.15;
    
    let newFruit: Fruit;
    
    if (isBomb) {
      newFruit = {
        id: nextFruitId.current++,
        x: Math.random() * (canvasSize.width - BOMB_SIZE),
        y: canvasSize.height + BOMB_SIZE,
        vx: (Math.random() - 0.5) * 4,
        vy: -12 - Math.random() * 8,
        type: 'bomb',
        sliced: false,
        emoji: '💣',
        points: -50
      };
    } else {
      const fruitType = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
      newFruit = {
        id: nextFruitId.current++,
        x: Math.random() * (canvasSize.width - FRUIT_SIZE),
        y: canvasSize.height + FRUIT_SIZE,
        vx: (Math.random() - 0.5) * 6,
        vy: -15 - Math.random() * 10,
        type: fruitType.type,
        sliced: false,
        emoji: fruitType.emoji,
        points: fruitType.points
      };
    }
    
    setFruits(prev => [...prev, newFruit]);
  }, [canvasSize]);

  // Handle mouse/touch events
  const handlePointerStart = useCallback((x: number, y: number) => {
    setIsSlicing(true);
    setSliceTrail([{ x, y, time: Date.now() }]);
  }, []);

  const handlePointerMove = useCallback((x: number, y: number) => {
    if (!isSlicing) return;
    
    setSliceTrail(prev => {
      const newTrail = [...prev, { x, y, time: Date.now() }];
      // Keep only recent trail points
      return newTrail.filter(point => Date.now() - point.time < 200);
    });
    
    // Check for fruit slicing
    setFruits(prevFruits => {
      return prevFruits.map(fruit => {
        if (fruit.sliced) return fruit;
        
        const distance = Math.sqrt(
          Math.pow(x - (fruit.x + FRUIT_SIZE/2), 2) + 
          Math.pow(y - (fruit.y + FRUIT_SIZE/2), 2)
        );
        
        if (distance < FRUIT_SIZE/2) {
          if (fruit.type === 'bomb') {
            // Hit bomb - lose life
            setLives(prev => {
              const newLives = prev - 1;
              if (newLives <= 0) {
                setIsRunning(false);
                onGameEnd(score, {
                  duration: Date.now() - gameStartTime.current,
                  fruitsSliced: prevFruits.filter(f => f.sliced && f.type !== 'bomb').length,
                  bombsHit: prevFruits.filter(f => f.sliced && f.type === 'bomb').length + 1
                });
              }
              return newLives;
            });
            setCombo(0);
          } else {
            // Hit fruit - add score
            const newScore = score + fruit.points + (combo * 5);
            setScore(newScore);
            onScoreUpdate(newScore);
            gameScorer.current.addScore(fruit.points + (combo * 5));
            setCombo(prev => prev + 1);
          }
          
          return { ...fruit, sliced: true, sliceTime: Date.now() };
        }
        
        return fruit;
      });
    });
  }, [isSlicing, score, combo, onScoreUpdate, onGameEnd]);

  const handlePointerEnd = useCallback(() => {
    setIsSlicing(false);
    setSliceTrail([]);
  }, []);

  // Mouse events
  const handleMouseDown = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    handlePointerStart(x, y);
  }, [handlePointerStart]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    handlePointerMove(x, y);
  }, [handlePointerMove]);

  const handleMouseUp = useCallback(() => {
    handlePointerEnd();
  }, [handlePointerEnd]);

  // Touch events
  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    handlePointerStart(x, y);
  }, [handlePointerStart]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    handlePointerMove(x, y);
  }, [handlePointerMove]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault();
    handlePointerEnd();
  }, [handlePointerEnd]);

  // Setup event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Draw game
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasSize.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98FB98');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    
    // Draw fruits
    ctx.font = `${FRUIT_SIZE}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    fruits.forEach(fruit => {
      if (fruit.sliced && fruit.sliceTime && Date.now() - fruit.sliceTime > 500) {
        return; // Don't draw sliced fruits after 500ms
      }
      
      const centerX = fruit.x + FRUIT_SIZE/2;
      const centerY = fruit.y + FRUIT_SIZE/2;
      
      if (fruit.sliced) {
        // Draw sliced fruit with explosion effect
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillText(fruit.emoji, centerX - 10, centerY - 10);
        ctx.fillText(fruit.emoji, centerX + 10, centerY + 10);
        ctx.restore();
        
        // Draw score popup
        if (fruit.type !== 'bomb') {
          ctx.fillStyle = '#FFD700';
          ctx.font = '20px Arial';
          ctx.fillText(`+${fruit.points}`, centerX, centerY - 30);
        }
      } else {
        ctx.fillText(fruit.emoji, centerX, centerY);
      }
    });
    
    // Draw slice trail
    if (sliceTrail.length > 1) {
      ctx.strokeStyle = '#FF6B6B';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      
      for (let i = 0; i < sliceTrail.length - 1; i++) {
        const current = sliceTrail[i];
        const next = sliceTrail[i + 1];
        
        if (i === 0) {
          ctx.moveTo(current.x, current.y);
        }
        ctx.lineTo(next.x, next.y);
      }
      
      ctx.stroke();
    }
    
    // Draw UI
    ctx.fillStyle = '#333';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${formatScore(score)}`, 20, 40);
    ctx.fillText(`Lives: ${lives}`, 20, 70);
    ctx.fillText(`Combo: ${combo}`, 20, 100);
  }, [canvasSize, fruits, sliceTrail, score, lives, combo]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (!isRunning) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    // Update fruits
    setFruits(prevFruits => {
      return prevFruits
        .map(fruit => ({
          ...fruit,
          x: fruit.x + fruit.vx,
          y: fruit.y + fruit.vy,
          vy: fruit.vy + GRAVITY
        }))
        .filter(fruit => {
          // Remove fruits that fell off screen or were sliced long ago
          if (fruit.y > canvasSize.height + 100) {
            if (!fruit.sliced && fruit.type !== 'bomb') {
              // Missed fruit - lose life
              setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) {
                  setIsRunning(false);
                  onGameEnd(score, {
                    duration: Date.now() - gameStartTime.current,
                    fruitsSliced: prevFruits.filter(f => f.sliced && f.type !== 'bomb').length,
                    fruitsMissed: prevFruits.filter(f => !f.sliced && f.type !== 'bomb').length + 1
                  });
                }
                return newLives;
              });
              setCombo(0);
            }
            return false;
          }
          
          // Remove sliced fruits after animation
          if (fruit.sliced && fruit.sliceTime && Date.now() - fruit.sliceTime > 500) {
            return false;
          }
          
          return true;
        });
    });
    
    // Spawn new fruits
    spawnFruit();
    
    draw(ctx);
    
    if (isRunning) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [isRunning, canvasSize, spawnFruit, draw, score, onGameEnd]);

  // Start game
  const startGame = useCallback(() => {
    gameScorer.current.reset();
    setIsRunning(true);
    setScore(0);
    setLives(3);
    setCombo(0);
    setFruits([]);
    setSliceTrail([]);
    
    gameStartTime.current = Date.now();
    lastSpawnTime.current = Date.now();
  }, []);

  // Auto-start game
  useEffect(() => {
    if (canvasSize.width > 0 && canvasSize.height > 0) {
      startGame();
    }
  }, [canvasSize, startGame]);

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
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative'
    }}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{
          border: '2px solid #fff',
          borderRadius: '10px',
          cursor: 'crosshair'
        }}
      />
      
      <TouchControlsHint 
        controls={['Slice fruits with mouse or finger', 'Avoid bombs!']}
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      />
      
      <button
        onClick={onShowIntro}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(255,255,255,0.2)',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        ← Back
      </button>
    </div>
  );
}
