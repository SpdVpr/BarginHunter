/** @jsxImportSource react */
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface GemCrusherGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface Gem {
  id: number;
  x: number;
  y: number;
  color: string;
  type: number;
  selected: boolean;
  matched: boolean;
  falling: boolean;
  fallSpeed: number;
}

const GEM_COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#fd79a8'];
const GRID_SIZE = 8;
const GEM_SIZE = 60;

export default function GemCrusherGame({ onGameEnd, onScoreUpdate }: GemCrusherGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(30);
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
  const [grid, setGrid] = useState<Gem[][]>([]);
  const [selectedGems, setSelectedGems] = useState<{row: number, col: number}[]>([]);
  const [animating, setAnimating] = useState(false);
  const [combo, setCombo] = useState(0);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const GRID_OFFSET_X = (CANVAS_WIDTH - GRID_SIZE * GEM_SIZE) / 2;
  const GRID_OFFSET_Y = 50;

  // Initialize grid
  const initializeGrid = useCallback(() => {
    const newGrid: Gem[][] = [];
    let id = 0;
    
    for (let row = 0; row < GRID_SIZE; row++) {
      newGrid[row] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        newGrid[row][col] = {
          id: id++,
          x: GRID_OFFSET_X + col * GEM_SIZE,
          y: GRID_OFFSET_Y + row * GEM_SIZE,
          color: GEM_COLORS[Math.floor(Math.random() * GEM_COLORS.length)],
          type: Math.floor(Math.random() * GEM_COLORS.length),
          selected: false,
          matched: false,
          falling: false,
          fallSpeed: 0
        };
      }
    }
    
    setGrid(newGrid);
  }, []);

  // Initialize game
  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  // Handle canvas click
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || animating) return;

    const handleClick = (e: MouseEvent) => {
      if (gameState !== 'playing' || animating) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
      const clickY = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);

      const col = Math.floor((clickX - GRID_OFFSET_X) / GEM_SIZE);
      const row = Math.floor((clickY - GRID_OFFSET_Y) / GEM_SIZE);

      if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
        const clickedGem = grid[row][col];
        
        if (selectedGems.length === 0) {
          // First gem selection
          setSelectedGems([{row, col}]);
          setGrid(prev => prev.map((gridRow, r) => 
            gridRow.map((gem, c) => ({
              ...gem,
              selected: r === row && c === col
            }))
          ));
        } else if (selectedGems.length === 1) {
          const firstGem = selectedGems[0];
          
          // Check if adjacent
          const isAdjacent = 
            (Math.abs(row - firstGem.row) === 1 && col === firstGem.col) ||
            (Math.abs(col - firstGem.col) === 1 && row === firstGem.row);
          
          if (isAdjacent) {
            // Swap gems
            swapGems(firstGem.row, firstGem.col, row, col);
          } else {
            // Select new gem
            setSelectedGems([{row, col}]);
            setGrid(prev => prev.map((gridRow, r) => 
              gridRow.map((gem, c) => ({
                ...gem,
                selected: r === row && c === col
              }))
            ));
          }
        }
      }
    };

    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [gameState, animating, grid, selectedGems]);

  // Swap gems
  const swapGems = useCallback((row1: number, col1: number, row2: number, col2: number) => {
    setAnimating(true);
    
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      const temp = newGrid[row1][col1];
      newGrid[row1][col1] = newGrid[row2][col2];
      newGrid[row2][col2] = temp;
      
      // Update positions
      newGrid[row1][col1].x = GRID_OFFSET_X + col1 * GEM_SIZE;
      newGrid[row1][col1].y = GRID_OFFSET_Y + row1 * GEM_SIZE;
      newGrid[row2][col2].x = GRID_OFFSET_X + col2 * GEM_SIZE;
      newGrid[row2][col2].y = GRID_OFFSET_Y + row2 * GEM_SIZE;
      
      return newGrid.map(row => row.map(gem => ({ ...gem, selected: false })));
    });
    
    setSelectedGems([]);
    setMoves(prev => prev - 1);
    
    // Check for matches after swap
    setTimeout(() => {
      checkMatches();
    }, 300);
  }, []);

  // Check for matches
  const checkMatches = useCallback(() => {
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      let hasMatches = false;
      let matchCount = 0;

      // Check horizontal matches
      for (let row = 0; row < GRID_SIZE; row++) {
        let count = 1;
        for (let col = 1; col < GRID_SIZE; col++) {
          if (newGrid[row][col].type === newGrid[row][col - 1].type) {
            count++;
          } else {
            if (count >= 3) {
              for (let i = col - count; i < col; i++) {
                newGrid[row][i].matched = true;
                hasMatches = true;
                matchCount++;
              }
            }
            count = 1;
          }
        }
        if (count >= 3) {
          for (let i = GRID_SIZE - count; i < GRID_SIZE; i++) {
            newGrid[row][i].matched = true;
            hasMatches = true;
            matchCount++;
          }
        }
      }

      // Check vertical matches
      for (let col = 0; col < GRID_SIZE; col++) {
        let count = 1;
        for (let row = 1; row < GRID_SIZE; row++) {
          if (newGrid[row][col].type === newGrid[row - 1][col].type) {
            count++;
          } else {
            if (count >= 3) {
              for (let i = row - count; i < row; i++) {
                newGrid[i][col].matched = true;
                hasMatches = true;
                matchCount++;
              }
            }
            count = 1;
          }
        }
        if (count >= 3) {
          for (let i = GRID_SIZE - count; i < GRID_SIZE; i++) {
            newGrid[i][col].matched = true;
            hasMatches = true;
            matchCount++;
          }
        }
      }

      if (hasMatches) {
        const newCombo = combo + 1;
        setCombo(newCombo);
        const points = matchCount * 100 * newCombo;
        setScore(prevScore => {
          const newScore = prevScore + points;
          onScoreUpdate(newScore);
          return newScore;
        });

        // Remove matched gems after animation
        setTimeout(() => {
          removeMatches();
        }, 500);
      } else {
        setCombo(0);
        setAnimating(false);
      }

      return newGrid;
    });
  }, [combo, onScoreUpdate]);

  // Remove matches and drop gems
  const removeMatches = useCallback(() => {
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      
      // Remove matched gems
      for (let col = 0; col < GRID_SIZE; col++) {
        const column = [];
        for (let row = GRID_SIZE - 1; row >= 0; row--) {
          if (!newGrid[row][col].matched) {
            column.push(newGrid[row][col]);
          }
        }
        
        // Add new gems at top
        while (column.length < GRID_SIZE) {
          column.push({
            id: Date.now() + Math.random(),
            x: GRID_OFFSET_X + col * GEM_SIZE,
            y: GRID_OFFSET_Y - (GRID_SIZE - column.length) * GEM_SIZE,
            color: GEM_COLORS[Math.floor(Math.random() * GEM_COLORS.length)],
            type: Math.floor(Math.random() * GEM_COLORS.length),
            selected: false,
            matched: false,
            falling: true,
            fallSpeed: 5
          });
        }
        
        // Update positions
        for (let i = 0; i < column.length; i++) {
          const row = GRID_SIZE - 1 - i;
          newGrid[row][col] = {
            ...column[i],
            x: GRID_OFFSET_X + col * GEM_SIZE,
            y: GRID_OFFSET_Y + row * GEM_SIZE,
            matched: false
          };
        }
      }
      
      return newGrid;
    });

    // Check for new matches
    setTimeout(() => {
      checkMatches();
    }, 600);
  }, [checkMatches]);

  // Check game over
  useEffect(() => {
    if (moves <= 0 && !animating) {
      setGameState('gameOver');
      onGameEnd(score);
    }
  }, [moves, animating, score, onGameEnd]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#2c1810');
    gradient.addColorStop(1, '#8b4513');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw gems
    grid.forEach((row, rowIndex) => {
      row.forEach((gem, colIndex) => {
        const centerX = gem.x + GEM_SIZE / 2;
        const centerY = gem.y + GEM_SIZE / 2;
        
        // Gem shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.arc(centerX + 3, centerY + 3, GEM_SIZE / 2 - 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Gem body
        const gemGradient = ctx.createRadialGradient(
          centerX - 10, centerY - 10, 0,
          centerX, centerY, GEM_SIZE / 2
        );
        gemGradient.addColorStop(0, 'rgba(255,255,255,0.8)');
        gemGradient.addColorStop(0.7, gem.color);
        gemGradient.addColorStop(1, gem.color);
        
        ctx.fillStyle = gemGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, GEM_SIZE / 2 - 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Selection highlight
        if (gem.selected) {
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(centerX, centerY, GEM_SIZE / 2 - 2, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // Match animation
        if (gem.matched) {
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.beginPath();
          ctx.arc(centerX, centerY, GEM_SIZE / 2 - 5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    });

    // UI
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 40);
    ctx.fillText(`Moves: ${moves}`, 200, 40);
    
    if (combo > 1) {
      ctx.fillStyle = '#FF6347';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`COMBO x${combo}!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
    }

    // Game over screen
    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.font = 'bold 32px Arial';
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }
  });

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #2c1810 0%, #8b4513 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      {/* Game Header */}
      <div style={{
        background: 'rgba(139,69,19,0.9)',
        border: '2px solid #FFD700',
        padding: '15px 30px',
        borderRadius: '15px',
        marginBottom: '20px',
        display: 'flex',
        gap: '30px',
        alignItems: 'center',
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#FFD700'
      }}>
        <div>💎 Gem Crusher</div>
        <div>Score: {score}</div>
        <div>Moves: {moves}</div>
        {combo > 1 && <div style={{ color: '#FF6347' }}>Combo: x{combo}</div>}
      </div>

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          border: '3px solid #FFD700',
          borderRadius: '15px',
          background: '#2c1810',
          maxWidth: '100%',
          maxHeight: '70vh',
          cursor: 'pointer'
        }}
      />

      {/* Instructions */}
      <div style={{
        background: 'rgba(139,69,19,0.9)',
        border: '2px solid #FFD700',
        padding: '15px 25px',
        borderRadius: '12px',
        marginTop: '20px',
        textAlign: 'center',
        color: '#FFD700',
        fontSize: '14px',
        maxWidth: '600px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
          🎯 How to Play
        </div>
        <div>
          Click gems to select, then click adjacent gem to swap. 
          Match 3+ gems in a row to crush them and score points!
        </div>
      </div>
    </div>
  );
}
