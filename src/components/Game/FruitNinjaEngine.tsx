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

interface FruitNinjaEngineProps {
  onGameEnd: (score: number, gameData: any) => void;
  onScoreUpdate: (score: number) => void;
  gameConfig: GameConfig;
  onShowIntro: () => void;
}

// Game constants
const GRAVITY = 0.2; // Further reduced for better fruit targeting
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
  // Enhanced physics for sliced fruits
  leftHalf?: { x: number; y: number; vx: number; vy: number; rotation: number };
  rightHalf?: { x: number; y: number; vx: number; vy: number; rotation: number };
}

interface ParticleEffect {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
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
  onShowIntro,
  adminTest = false,
  onClose
}: FruitNinjaEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gameStartTime = useRef<number>(0);
  const [gameScorer] = useState(() => new GameScorer());
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
  const [particles, setParticles] = useState<ParticleEffect[]>([]);
  const nextParticleId = useRef<number>(1);
  const [timeLeft, setTimeLeft] = useState(20); // 20 second timer
  const gameTimer = useRef<NodeJS.Timeout | null>(null);

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

  // Create particle effects
  const createParticles = useCallback((x: number, y: number, color: string) => {
    const newParticles: ParticleEffect[] = [];
    for (let i = 0; i < 8; i++) {
      newParticles.push({
        id: nextParticleId.current++,
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 2,
        color,
        life: 60,
        maxLife: 60
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Spawn fruits (multiple at once for more action)
  const spawnFruit = useCallback(() => {
    const now = Date.now();
    if (now - lastSpawnTime.current < 800 + Math.random() * 600) return; // Faster spawn for more action

    lastSpawnTime.current = now;

    // Spawn 1-3 fruits at once for more dynamic gameplay
    const spawnCount = Math.random() < 0.3 ? (Math.random() < 0.5 ? 2 : 3) : 1;
    const newFruits: Fruit[] = [];

    for (let i = 0; i < spawnCount; i++) {
      // 12% chance for bomb (reduced since we spawn more items)
      const isBomb = Math.random() < 0.12;

      let newFruit: Fruit;

      if (isBomb) {
        newFruit = {
          id: nextFruitId.current++,
          x: Math.random() * (canvasSize.width - BOMB_SIZE),
          y: canvasSize.height + BOMB_SIZE + (i * 50), // Offset multiple spawns
          vx: (Math.random() - 0.5) * 3,
          vy: -10 - Math.random() * 5,
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
          y: canvasSize.height + FRUIT_SIZE + (i * 50), // Offset multiple spawns
          vx: (Math.random() - 0.5) * 4,
          vy: -12 - Math.random() * 6,
          type: fruitType.type,
          sliced: false,
          emoji: fruitType.emoji,
          points: fruitType.points
        };
      }

      newFruits.push(newFruit);
    }

    setFruits(prev => [...prev, ...newFruits]);
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

        // Increased hit area for easier slicing (was FRUIT_SIZE/2)
        if (distance < FRUIT_SIZE * 0.8) {
          if (fruit.type === 'bomb') {
            // Hit bomb - lose life and create explosion particles
            createParticles(fruit.x + FRUIT_SIZE/2, fruit.y + FRUIT_SIZE/2, '#FF4444');
            setLives(prev => {
              const newLives = prev - 1;
              if (newLives <= 0) {
                setIsRunning(false);
                // Clear timer when game ends
                if (gameTimer.current) {
                  clearInterval(gameTimer.current);
                  gameTimer.current = null;
                }
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
            // Hit fruit - add score and create juice particles
            const fruitColors = {
              apple: '#FF6B6B',
              orange: '#FFA500',
              banana: '#FFFF00',
              watermelon: '#FF69B4'
            };
            createParticles(fruit.x + FRUIT_SIZE/2, fruit.y + FRUIT_SIZE/2, fruitColors[fruit.type] || '#FF6B6B');

            const newScore = score + fruit.points + (combo * 5);
            setScore(newScore);
            onScoreUpdate(newScore);
            gameScorer.addScore(fruit.points + (combo * 5));
            setCombo(prev => prev + 1);
          }

          // Create enhanced sliced fruit with physics
          const centerX = fruit.x + FRUIT_SIZE/2;
          const centerY = fruit.y + FRUIT_SIZE/2;

          return {
            ...fruit,
            sliced: true,
            sliceTime: Date.now(),
            leftHalf: {
              x: centerX - FRUIT_SIZE/4,
              y: centerY,
              vx: fruit.vx - 3 - Math.random() * 2,
              vy: fruit.vy - 2,
              rotation: 0
            },
            rightHalf: {
              x: centerX + FRUIT_SIZE/4,
              y: centerY,
              vx: fruit.vx + 3 + Math.random() * 2,
              vy: fruit.vy - 2,
              rotation: 0
            }
          };
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
      if (fruit.sliced && fruit.sliceTime && Date.now() - fruit.sliceTime > 800) {
        return; // Don't draw sliced fruits after 800ms (longer for better effect)
      }

      const centerX = fruit.x + FRUIT_SIZE/2;
      const centerY = fruit.y + FRUIT_SIZE/2;

      if (fruit.sliced && fruit.leftHalf && fruit.rightHalf) {
        // Draw enhanced sliced fruit halves with physics
        ctx.save();
        const timeElapsed = Date.now() - (fruit.sliceTime || 0);
        const alpha = Math.max(0, 1 - timeElapsed / 800);
        ctx.globalAlpha = alpha;

        // Draw left half
        ctx.save();
        ctx.translate(fruit.leftHalf.x, fruit.leftHalf.y);
        ctx.rotate(fruit.leftHalf.rotation);
        ctx.font = `${FRUIT_SIZE * 0.8}px Arial`;
        ctx.fillText(fruit.emoji, 0, 0);
        ctx.restore();

        // Draw right half
        ctx.save();
        ctx.translate(fruit.rightHalf.x, fruit.rightHalf.y);
        ctx.rotate(fruit.rightHalf.rotation);
        ctx.font = `${FRUIT_SIZE * 0.8}px Arial`;
        ctx.fillText(fruit.emoji, 0, 0);
        ctx.restore();

        ctx.restore();

        // Draw score popup with fade effect
        if (fruit.type !== 'bomb') {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = '#FFD700';
          ctx.font = 'bold 24px Arial';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.strokeText(`+${fruit.points}`, centerX, centerY - 40);
          ctx.fillText(`+${fruit.points}`, centerX, centerY - 40);
          ctx.restore();
        }
      } else if (!fruit.sliced) {
        // Draw whole fruit with slight bounce effect
        ctx.save();
        const bounce = Math.sin(Date.now() * 0.01) * 2;
        ctx.translate(0, bounce);
        ctx.fillText(fruit.emoji, centerX, centerY);
        ctx.restore();
      }
    });

    // Draw particle effects
    particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 3 * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
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

    // Draw timer
    ctx.fillStyle = timeLeft <= 5 ? '#FF0000' : '#333';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`Time: ${timeLeft}s`, 20, 140);

    // Show current discount based on score (find highest applicable tier)
    const sortedTiers = [...gameConfig.discountTiers].sort((a: any, b: any) => b.minScore - a.minScore);
    const currentDiscount = sortedTiers.find((tier: any) => score >= tier.minScore)?.discount || 0;
    if (currentDiscount > 0) {
      ctx.font = '20px Arial';
      ctx.fillStyle = '#000000'; // Black color
      ctx.fillText(`${currentDiscount}% OFF`, 20, 170);
    }
  }, [canvasSize, fruits, sliceTrail, score, lives, combo]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (!isRunning) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    // Update fruits with enhanced physics
    setFruits(prevFruits => {
      return prevFruits
        .map(fruit => {
          const updatedFruit = {
            ...fruit,
            x: fruit.x + fruit.vx,
            y: fruit.y + fruit.vy,
            vy: fruit.vy + GRAVITY
          };

          // Update sliced fruit halves physics
          if (fruit.sliced && fruit.leftHalf && fruit.rightHalf) {
            updatedFruit.leftHalf = {
              ...fruit.leftHalf,
              x: fruit.leftHalf.x + fruit.leftHalf.vx,
              y: fruit.leftHalf.y + fruit.leftHalf.vy,
              vy: fruit.leftHalf.vy + GRAVITY,
              rotation: fruit.leftHalf.rotation + 0.1
            };
            updatedFruit.rightHalf = {
              ...fruit.rightHalf,
              x: fruit.rightHalf.x + fruit.rightHalf.vx,
              y: fruit.rightHalf.y + fruit.rightHalf.vy,
              vy: fruit.rightHalf.vy + GRAVITY,
              rotation: fruit.rightHalf.rotation - 0.1
            };
          }

          return updatedFruit;
        })
        .filter(fruit => {
          // Remove fruits that fell off screen or were sliced long ago
          if (fruit.y > canvasSize.height + 100) {
            if (!fruit.sliced && fruit.type !== 'bomb') {
              // Missed fruit - just reset combo, no life lost
              setCombo(0);
            }
            return false;
          }

          // Remove sliced fruits after longer animation
          if (fruit.sliced && fruit.sliceTime && Date.now() - fruit.sliceTime > 800) {
            return false;
          }

          return true;
        });
    });

    // Update particles
    setParticles(prevParticles => {
      return prevParticles
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + GRAVITY * 0.5,
          vx: particle.vx * 0.98, // Air resistance
          life: particle.life - 1
        }))
        .filter(particle => particle.life > 0);
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
    gameScorer.reset();
    setScore(0);
    setLives(3);
    setCombo(0);
    setFruits([]);
    setSliceTrail([]);
    setParticles([]);
    setTimeLeft(20);

    gameStartTime.current = Date.now();
    lastSpawnTime.current = Date.now();

    // Clear any existing timer
    if (gameTimer.current) {
      clearInterval(gameTimer.current);
    }

    // Start the game first
    setIsRunning(true);
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

  // Start timer when game starts running
  useEffect(() => {
    if (isRunning && timeLeft === 20 && !gameTimer.current) {
      // Start countdown timer only when game actually starts and timer isn't already running
      gameTimer.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            // Clear timer when time is up
            if (gameTimer.current) {
              clearInterval(gameTimer.current);
              gameTimer.current = null;
            }
            // End game when time is up
            setTimeout(() => {
              onGameEnd(score, {
                duration: 20000, // 20 seconds
                fruitsSliced: fruits.filter(f => f.sliced && f.type !== 'bomb').length,
                timeUp: true
              });
            }, 100);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // Cleanup when game stops
    if (!isRunning && gameTimer.current) {
      clearInterval(gameTimer.current);
      gameTimer.current = null;
    }
  }, [isRunning, timeLeft]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (gameTimer.current) {
        clearInterval(gameTimer.current);
      }
    };
  }, []);

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
