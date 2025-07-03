/** @jsxImportSource react */
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface ColorSwitchGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface Ball {
  x: number;
  y: number;
  velocityY: number;
  color: string;
  radius: number;
  trail: { x: number; y: number; alpha: number; color: string }[];
}

interface Obstacle {
  x: number;
  y: number;
  type: 'circle' | 'square' | 'cross' | 'line';
  rotation: number;
  rotationSpeed: number;
  colors: string[];
  size: number;
  passed: boolean;
}

interface ColorSwitcher {
  x: number;
  y: number;
  colors: string[];
  rotation: number;
  collected: boolean;
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

export default function ColorSwitchGame({ onGameEnd, onScoreUpdate }: ColorSwitchGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
  const [ball, setBall] = useState<Ball>({
    x: 200,
    y: 500,
    velocityY: 0,
    color: '#ff6b6b',
    radius: 12,
    trail: []
  });
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [colorSwitchers, setColorSwitchers] = useState<ColorSwitcher[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [cameraY, setCameraY] = useState(0);
  const [perfectPasses, setPerfectPasses] = useState(0);

  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 600;
  const GRAVITY = 0.6;
  const JUMP_FORCE = -12;
  const COLORS = ['#ff6b6b', '#4ecdc4', '#f9ca24', '#6c5ce7'];

  // Handle input
  useEffect(() => {
    const handleInput = (e: KeyboardEvent | TouchEvent | MouseEvent) => {
      if (gameState !== 'playing') return;
      
      e.preventDefault();
      setBall(prev => ({
        ...prev,
        velocityY: JUMP_FORCE
      }));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
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
  }, [gameState]);

  // Generate obstacles and color switchers
  const generateLevel = useCallback(() => {
    const newObstacles: Obstacle[] = [];
    const newColorSwitchers: ColorSwitcher[] = [];
    
    for (let i = 0; i < 20; i++) {
      const y = -200 - i * 300;
      const types: ('circle' | 'square' | 'cross' | 'line')[] = ['circle', 'square', 'cross', 'line'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      newObstacles.push({
        x: 200,
        y,
        type,
        rotation: 0,
        rotationSpeed: 0.02 + Math.random() * 0.03,
        colors: [...COLORS].sort(() => Math.random() - 0.5),
        size: type === 'line' ? 150 : 80 + Math.random() * 40,
        passed: false
      });
      
      // Add color switcher between obstacles
      if (i > 0) {
        newColorSwitchers.push({
          x: 200,
          y: y + 150,
          colors: [...COLORS],
          rotation: 0,
          collected: false
        });
      }
    }
    
    setObstacles(newObstacles);
    setColorSwitchers(newColorSwitchers);
  }, []);

  // Initialize level
  useEffect(() => {
    generateLevel();
  }, [generateLevel]);

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
        velocityY: Math.sin(angle) * speed,
        life: 25 + Math.random() * 15,
        maxLife: 40,
        color,
        size: 2 + Math.random() * 3
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      // Update ball
      setBall(prev => {
        let newVelocityY = prev.velocityY + GRAVITY;
        let newY = prev.y + newVelocityY;

        // Ground collision (game over)
        if (newY > 600) {
          setGameState('gameOver');
          onGameEnd(score);
          return prev;
        }

        // Update trail
        const newTrail = [
          { x: prev.x, y: newY, alpha: 1, color: prev.color },
          ...prev.trail.map(point => ({ ...point, alpha: point.alpha * 0.9 }))
        ].filter(point => point.alpha > 0.1).slice(0, 12);

        return {
          ...prev,
          y: newY,
          velocityY: newVelocityY,
          trail: newTrail
        };
      });

      // Update camera
      setCameraY(prev => {
        const targetY = ball.y - CANVAS_HEIGHT * 0.7;
        return prev + (targetY - prev) * 0.1;
      });

      // Update obstacles
      setObstacles(prev => prev.map(obstacle => ({
        ...obstacle,
        rotation: obstacle.rotation + obstacle.rotationSpeed
      })));

      // Update color switchers
      setColorSwitchers(prev => prev.map(switcher => ({
        ...switcher,
        rotation: switcher.rotation + 0.05
      })));

      // Check obstacle collisions
      obstacles.forEach((obstacle, index) => {
        if (obstacle.passed) return;

        const distance = Math.sqrt(
          Math.pow(ball.x - obstacle.x, 2) + Math.pow(ball.y - obstacle.y, 2)
        );

        // Check if ball passed obstacle
        if (ball.y < obstacle.y - obstacle.size && !obstacle.passed) {
          setObstacles(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], passed: true };
            return updated;
          });
          
          // Score for passing
          const newScore = score + 1;
          setScore(newScore);
          onScoreUpdate(newScore);
          
          // Perfect pass bonus (center)
          if (Math.abs(ball.x - obstacle.x) < 20) {
            setPerfectPasses(prev => prev + 1);
            createParticles(ball.x, ball.y, '#FFD700', 12);
            setScore(prevScore => {
              const bonusScore = prevScore + 5;
              onScoreUpdate(bonusScore);
              return bonusScore;
            });
          }
        }

        // Collision detection based on obstacle type
        if (distance < obstacle.size && ball.y > obstacle.y - obstacle.size && ball.y < obstacle.y + obstacle.size) {
          let collision = false;
          
          if (obstacle.type === 'circle') {
            // Check if ball hits wrong color segment
            const angle = Math.atan2(ball.y - obstacle.y, ball.x - obstacle.x) + obstacle.rotation;
            const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            const segmentIndex = Math.floor((normalizedAngle / (Math.PI * 2)) * 4);
            const segmentColor = obstacle.colors[segmentIndex];
            
            if (segmentColor !== ball.color && distance < obstacle.size - 10) {
              collision = true;
            }
          } else if (obstacle.type === 'square') {
            // Square collision logic
            const relativeX = ball.x - obstacle.x;
            const relativeY = ball.y - obstacle.y;
            
            if (Math.abs(relativeX) < obstacle.size / 2 && Math.abs(relativeY) < obstacle.size / 2) {
              // Determine which side of square
              let segmentIndex = 0;
              if (relativeX > 0 && Math.abs(relativeX) > Math.abs(relativeY)) segmentIndex = 1;
              else if (relativeY > 0 && Math.abs(relativeY) > Math.abs(relativeX)) segmentIndex = 2;
              else if (relativeX < 0 && Math.abs(relativeX) > Math.abs(relativeY)) segmentIndex = 3;
              
              const segmentColor = obstacle.colors[segmentIndex];
              if (segmentColor !== ball.color) {
                collision = true;
              }
            }
          }
          
          if (collision) {
            createParticles(ball.x, ball.y, '#ff6b6b', 15);
            setGameState('gameOver');
            onGameEnd(score);
          }
        }
      });

      // Check color switcher collection
      colorSwitchers.forEach((switcher, index) => {
        if (switcher.collected) return;

        const distance = Math.sqrt(
          Math.pow(ball.x - switcher.x, 2) + Math.pow(ball.y - switcher.y, 2)
        );

        if (distance < 25) {
          setColorSwitchers(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], collected: true };
            return updated;
          });

          // Change ball color
          const newColor = switcher.colors[Math.floor(Math.random() * switcher.colors.length)];
          setBall(prev => ({ ...prev, color: newColor }));
          
          createParticles(switcher.x, switcher.y, newColor, 10);
        }
      });

      // Update particles
      setParticles(prev => prev
        .map(particle => ({
          ...particle,
          x: particle.x + particle.velocityX,
          y: particle.y + particle.velocityY,
          velocityY: particle.velocityY + 0.1,
          life: particle.life - 1
        }))
        .filter(particle => particle.life > 0)
      );
    }, 16); // ~60 FPS

    return () => clearInterval(gameLoop);
  }, [gameState, ball, obstacles, colorSwitchers, score, cameraY, createParticles, onScoreUpdate, onGameEnd]);

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
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, cameraY, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw obstacles
    obstacles.forEach(obstacle => {
      if (obstacle.y > cameraY - 100 && obstacle.y < cameraY + CANVAS_HEIGHT + 100) {
        ctx.save();
        ctx.translate(obstacle.x, obstacle.y);
        ctx.rotate(obstacle.rotation);
        
        if (obstacle.type === 'circle') {
          // Draw colored circle segments
          for (let i = 0; i < 4; i++) {
            ctx.fillStyle = obstacle.colors[i];
            ctx.beginPath();
            ctx.arc(0, 0, obstacle.size, (i * Math.PI) / 2, ((i + 1) * Math.PI) / 2);
            ctx.lineTo(0, 0);
            ctx.fill();
          }
          
          // Inner circle
          ctx.fillStyle = '#1a1a2e';
          ctx.beginPath();
          ctx.arc(0, 0, obstacle.size - 15, 0, Math.PI * 2);
          ctx.fill();
        } else if (obstacle.type === 'square') {
          // Draw colored square segments
          const size = obstacle.size;
          const colors = obstacle.colors;
          
          // Top
          ctx.fillStyle = colors[0];
          ctx.fillRect(-size/2, -size/2, size, size/4);
          
          // Right
          ctx.fillStyle = colors[1];
          ctx.fillRect(size/4, -size/2, size/4, size);
          
          // Bottom
          ctx.fillStyle = colors[2];
          ctx.fillRect(-size/2, size/4, size, size/4);
          
          // Left
          ctx.fillStyle = colors[3];
          ctx.fillRect(-size/2, -size/2, size/4, size);
          
          // Inner square
          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(-size/4, -size/4, size/2, size/2);
        }
        
        ctx.restore();
      }
    });

    // Draw color switchers
    colorSwitchers.forEach(switcher => {
      if (switcher.collected || switcher.y > cameraY + CANVAS_HEIGHT + 50 || switcher.y < cameraY - 50) return;
      
      ctx.save();
      ctx.translate(switcher.x, switcher.y);
      ctx.rotate(switcher.rotation);
      
      // Draw color switcher as rotating segments
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = switcher.colors[i];
        ctx.beginPath();
        ctx.arc(0, 0, 20, (i * Math.PI) / 2, ((i + 1) * Math.PI) / 2);
        ctx.lineTo(0, 0);
        ctx.fill();
      }
      
      ctx.restore();
    });

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

    // Draw ball trail
    ball.trail.forEach((point, index) => {
      ctx.globalAlpha = point.alpha * 0.6;
      ctx.fillStyle = point.color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, ball.radius * point.alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Draw ball
    ctx.fillStyle = ball.color;
    ctx.shadowColor = ball.color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Restore context
    ctx.restore();

    // UI (fixed position)
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 3;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, 40);
    
    if (perfectPasses > 0) {
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`Perfect: ${perfectPasses}`, CANVAS_WIDTH / 2, 65);
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
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.fillText(`Perfect Passes: ${perfectPasses}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
      ctx.shadowBlur = 0;
    }
  });

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
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
        <div>🎨 Color Switch</div>
        <div>Score: {score}</div>
        {perfectPasses > 0 && <div style={{ color: '#FFD700' }}>Perfect: {perfectPasses}</div>}
      </div>

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          border: '3px solid rgba(255,255,255,0.3)',
          borderRadius: '15px',
          background: '#1a1a2e',
          maxWidth: '100%',
          maxHeight: '70vh',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
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
          Tap to jump! Only pass through obstacles when your ball color matches the segment. 
          Collect color switchers to change your ball color!
        </div>
      </div>
    </div>
  );
}
