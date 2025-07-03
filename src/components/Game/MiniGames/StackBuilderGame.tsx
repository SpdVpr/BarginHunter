/** @jsxImportSource react */
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface StackBuilderGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  moving: boolean;
  direction: number;
  speed: number;
}

interface Particle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export default function StackBuilderGame({ onGameEnd, onScoreUpdate }: StackBuilderGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [currentBlock, setCurrentBlock] = useState<Block | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [cameraY, setCameraY] = useState(0);
  const [perfectStacks, setPerfectStacks] = useState(0);
  const [combo, setCombo] = useState(0);

  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 600;
  const BLOCK_HEIGHT = 40;
  const INITIAL_BLOCK_WIDTH = 120;
  const BASE_SPEED = 2;

  // Colors for blocks
  const COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#fd79a8', '#00b894', '#fdcb6e'];

  // Initialize first block (base)
  useEffect(() => {
    const baseBlock: Block = {
      x: (CANVAS_WIDTH - INITIAL_BLOCK_WIDTH) / 2,
      y: 500,
      width: INITIAL_BLOCK_WIDTH,
      height: BLOCK_HEIGHT,
      color: COLORS[0],
      moving: false,
      direction: 0,
      speed: 0
    };
    
    setBlocks([baseBlock]);
    spawnNewBlock();
  }, []);

  // Spawn new moving block
  const spawnNewBlock = useCallback(() => {
    const level = blocks.length;
    const speed = BASE_SPEED + level * 0.1;
    const direction = Math.random() > 0.5 ? 1 : -1;
    
    const newBlock: Block = {
      x: direction > 0 ? -INITIAL_BLOCK_WIDTH : CANVAS_WIDTH,
      y: 500 - level * BLOCK_HEIGHT,
      width: INITIAL_BLOCK_WIDTH,
      height: BLOCK_HEIGHT,
      color: COLORS[level % COLORS.length],
      moving: true,
      direction,
      speed
    };
    
    setCurrentBlock(newBlock);
  }, [blocks.length]);

  // Handle input
  useEffect(() => {
    const handleInput = (e: KeyboardEvent | TouchEvent | MouseEvent) => {
      if (gameState !== 'playing' || !currentBlock || !currentBlock.moving) return;
      
      e.preventDefault();
      dropBlock();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowDown') {
        handleInput(e);
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('touchstart', handleInput, { passive: false });
      canvas.addEventListener('click', handleInput);
    }
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (canvas) {
        canvas.removeEventListener('touchstart', handleInput);
        canvas.removeEventListener('click', handleInput);
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, currentBlock]);

  // Create particles
  const createParticles = useCallback((x: number, y: number, color: string, count: number = 8) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 3 + Math.random() * 5;
      newParticles.push({
        x,
        y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed - 2,
        life: 25 + Math.random() * 15,
        maxLife: 40,
        color,
        size: 2 + Math.random() * 3
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Drop current block
  const dropBlock = useCallback(() => {
    if (!currentBlock || !currentBlock.moving) return;

    const lastBlock = blocks[blocks.length - 1];
    const droppedBlock = { ...currentBlock, moving: false };

    // Calculate overlap
    const leftEdge = Math.max(droppedBlock.x, lastBlock.x);
    const rightEdge = Math.min(droppedBlock.x + droppedBlock.width, lastBlock.x + lastBlock.width);
    const overlap = rightEdge - leftEdge;

    if (overlap <= 0) {
      // No overlap - game over
      createParticles(droppedBlock.x + droppedBlock.width / 2, droppedBlock.y, droppedBlock.color, 15);
      setGameState('gameOver');
      onGameEnd(score);
      return;
    }

    // Perfect stack bonus
    const isPerfect = Math.abs(droppedBlock.x - lastBlock.x) < 5;
    if (isPerfect) {
      setPerfectStacks(prev => prev + 1);
      setCombo(prev => prev + 1);
      createParticles(droppedBlock.x + droppedBlock.width / 2, droppedBlock.y, '#FFD700', 12);
    } else {
      setCombo(0);
      // Cut off the non-overlapping part
      droppedBlock.x = leftEdge;
      droppedBlock.width = overlap;
      
      // Create particles for cut-off parts
      if (currentBlock.x < leftEdge) {
        createParticles(currentBlock.x + (leftEdge - currentBlock.x) / 2, droppedBlock.y, droppedBlock.color, 6);
      }
      if (currentBlock.x + currentBlock.width > rightEdge) {
        createParticles(rightEdge + (currentBlock.x + currentBlock.width - rightEdge) / 2, droppedBlock.y, droppedBlock.color, 6);
      }
    }

    // Add block to stack
    setBlocks(prev => [...prev, droppedBlock]);
    
    // Score calculation
    let points = 1;
    if (isPerfect) points += 5;
    if (combo > 0) points += combo;
    
    setScore(prevScore => {
      const newScore = prevScore + points;
      onScoreUpdate(newScore);
      return newScore;
    });

    // Spawn next block
    setCurrentBlock(null);
    setTimeout(() => {
      spawnNewBlock();
    }, 200);

  }, [currentBlock, blocks, score, combo, createParticles, spawnNewBlock, onScoreUpdate, onGameEnd]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      // Update current moving block
      if (currentBlock && currentBlock.moving) {
        setCurrentBlock(prev => {
          if (!prev) return null;
          
          let newX = prev.x + prev.direction * prev.speed;
          let newDirection = prev.direction;
          
          // Bounce off walls
          if (newX <= 0 || newX + prev.width >= CANVAS_WIDTH) {
            newDirection = -newDirection;
            newX = Math.max(0, Math.min(CANVAS_WIDTH - prev.width, newX));
          }
          
          return { ...prev, x: newX, direction: newDirection };
        });
      }

      // Update camera to follow stack
      setCameraY(prev => {
        const targetY = Math.max(0, blocks.length * BLOCK_HEIGHT - CANVAS_HEIGHT / 2);
        return prev + (targetY - prev) * 0.1;
      });

      // Update particles
      setParticles(prev => prev
        .map(particle => ({
          ...particle,
          x: particle.x + particle.velocityX,
          y: particle.y + particle.velocityY,
          velocityY: particle.velocityY + 0.2,
          life: particle.life - 1
        }))
        .filter(particle => particle.life > 0)
      );
    }, 16); // ~60 FPS

    return () => clearInterval(gameLoop);
  }, [gameState, currentBlock, blocks.length]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save context for camera
    ctx.save();
    ctx.translate(0, -cameraY);

    // Background gradient
    const gradient = ctx.createLinearGradient(0, cameraY, 0, cameraY + CANVAS_HEIGHT);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, cameraY, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      const y = 500 - i * BLOCK_HEIGHT;
      if (y > cameraY - 50 && y < cameraY + CANVAS_HEIGHT + 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }
    }

    // Draw blocks
    blocks.forEach((block, index) => {
      if (block.y > cameraY - 100 && block.y < cameraY + CANVAS_HEIGHT + 100) {
        // Block shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(block.x + 3, block.y + 3, block.width, block.height);
        
        // Block body
        const blockGradient = ctx.createLinearGradient(block.x, block.y, block.x, block.y + block.height);
        blockGradient.addColorStop(0, block.color);
        blockGradient.addColorStop(1, block.color + '80');
        ctx.fillStyle = blockGradient;
        ctx.fillRect(block.x, block.y, block.width, block.height);
        
        // Block highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(block.x, block.y, block.width, block.height / 3);
        
        // Block border
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(block.x, block.y, block.width, block.height);
      }
    });

    // Draw current moving block
    if (currentBlock) {
      // Moving block shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(currentBlock.x + 3, currentBlock.y + 3, currentBlock.width, currentBlock.height);
      
      // Moving block body with glow
      ctx.shadowColor = currentBlock.color;
      ctx.shadowBlur = 15;
      const movingGradient = ctx.createLinearGradient(currentBlock.x, currentBlock.y, currentBlock.x, currentBlock.y + currentBlock.height);
      movingGradient.addColorStop(0, currentBlock.color);
      movingGradient.addColorStop(1, currentBlock.color + '80');
      ctx.fillStyle = movingGradient;
      ctx.fillRect(currentBlock.x, currentBlock.y, currentBlock.width, currentBlock.height);
      
      // Moving block highlight
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(currentBlock.x, currentBlock.y, currentBlock.width, currentBlock.height / 3);
      ctx.shadowBlur = 0;
    }

    // Draw particles
    particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Restore context
    ctx.restore();

    // UI (fixed position)
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 3;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Height: ${blocks.length}`, CANVAS_WIDTH / 2, 40);
    
    if (combo > 0) {
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 18px Arial';
      ctx.fillText(`Perfect Combo: x${combo}`, CANVAS_WIDTH / 2, 65);
    }
    
    if (perfectStacks > 0) {
      ctx.fillStyle = '#4ecdc4';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`Perfect Stacks: ${perfectStacks}`, CANVAS_WIDTH / 2, 90);
    }
    ctx.shadowBlur = 0;

    // Game over screen
    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 5;
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('TOWER FELL!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
      
      ctx.font = 'bold 24px Arial';
      ctx.fillText(`Final Height: ${blocks.length}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
      ctx.fillText(`Perfect Stacks: ${perfectStacks}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
      ctx.shadowBlur = 0;
    }
  });

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10px',
      boxSizing: 'border-box',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none'
    }}>
      {/* Game Header */}
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        padding: '10px 20px',
        borderRadius: '15px',
        marginBottom: '10px',
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#333',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <div>🏗️ Stack Builder</div>
        <div>Height: {blocks.length}</div>
        <div>Score: {score}</div>
        {combo > 0 && <div style={{ color: '#FFD700' }}>x{combo}</div>}
      </div>

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          border: '3px solid rgba(255,255,255,0.5)',
          borderRadius: '15px',
          background: '#667eea',
          maxWidth: '100%',
          maxHeight: '70vh',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          touchAction: 'none'
        }}
      />

      {/* Instructions */}
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        padding: '10px 20px',
        borderRadius: '12px',
        marginTop: '10px',
        textAlign: 'center',
        color: '#333',
        fontSize: '12px',
        maxWidth: '350px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
          🎯 How to Play
        </div>
        <div>
          Tap or press space to drop the moving block! Stack them perfectly to build the highest tower. 
          Perfect alignment gives bonus points!
        </div>
      </div>
    </div>
  );
}
