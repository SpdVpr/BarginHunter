/** @jsxImportSource react */
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface HelixJumpGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface Ball {
  x: number;
  y: number;
  velocityY: number;
  radius: number;
  bouncing: boolean;
  trail: { x: number; y: number; alpha: number }[];
}

interface Platform {
  y: number;
  rotation: number;
  gaps: { start: number; end: number }[];
  color: string;
  dangerous: boolean;
  passed: boolean;
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

export default function HelixJumpGame({ onGameEnd, onScoreUpdate }: HelixJumpGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
  const [ball, setBall] = useState<Ball>({
    x: 200,
    y: 100,
    velocityY: 0,
    radius: 12,
    bouncing: false,
    trail: []
  });
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [towerRotation, setTowerRotation] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [rotationDirection, setRotationDirection] = useState(0);
  const [combo, setCombo] = useState(0);
  const [cameraY, setCameraY] = useState(0);

  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 600;
  const GRAVITY = 0.4;
  const BOUNCE_FORCE = -8;
  const PLATFORM_SPACING = 120;
  const TOWER_RADIUS = 120;

  // Handle input
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (gameState !== 'playing') return;
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const centerX = rect.width / 2;
      
      if (Math.abs(mouseX - centerX) > 10) {
        setIsRotating(true);
        setRotationDirection(mouseX > centerX ? 1 : -1);
      } else {
        setIsRotating(false);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (gameState !== 'playing') return;
      e.preventDefault();
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const touchX = touch.clientX - rect.left;
      const centerX = rect.width / 2;
      
      if (Math.abs(touchX - centerX) > 10) {
        setIsRotating(true);
        setRotationDirection(touchX > centerX ? 1 : -1);
      } else {
        setIsRotating(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setIsRotating(true);
        setRotationDirection(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        setIsRotating(true);
        setRotationDirection(1);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'ArrowRight' || e.key === 'd') {
        setIsRotating(false);
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    }
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('touchmove', handleTouchMove);
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Generate platforms
  const generatePlatforms = useCallback(() => {
    const newPlatforms: Platform[] = [];
    const colors = ['#ff6b6b', '#4ecdc4', '#f9ca24', '#6c5ce7', '#fd79a8'];
    
    for (let i = 0; i < 50; i++) {
      const y = 200 + i * PLATFORM_SPACING;
      const dangerous = i > 0 && Math.random() < 0.2; // 20% chance for dangerous platforms
      
      // Create gaps in platform
      const numGaps = dangerous ? 1 : 1 + Math.floor(Math.random() * 2);
      const gaps: { start: number; end: number }[] = [];
      
      for (let j = 0; j < numGaps; j++) {
        const gapSize = dangerous ? 60 : 80 + Math.random() * 40;
        const gapStart = Math.random() * (360 - gapSize);
        gaps.push({
          start: gapStart,
          end: gapStart + gapSize
        });
      }
      
      newPlatforms.push({
        y,
        rotation: Math.random() * 360,
        gaps,
        color: colors[Math.floor(Math.random() * colors.length)],
        dangerous,
        passed: false
      });
    }
    
    setPlatforms(newPlatforms);
  }, []);

  // Initialize platforms
  useEffect(() => {
    generatePlatforms();
  }, [generatePlatforms]);

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

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      // Update tower rotation
      if (isRotating) {
        setTowerRotation(prev => prev + rotationDirection * 3);
      }

      // Update ball
      setBall(prev => {
        let newVelocityY = prev.velocityY + GRAVITY;
        let newY = prev.y + newVelocityY;
        let newBouncing = prev.bouncing;

        // Check platform collisions
        platforms.forEach((platform, index) => {
          if (platform.passed) return;

          const platformTop = platform.y - 10;
          const platformBottom = platform.y + 10;

          if (
            prev.y + prev.radius <= platformTop &&
            newY + prev.radius >= platformTop &&
            newVelocityY > 0
          ) {
            // Check if ball is in a gap
            const ballAngle = ((Math.atan2(prev.y - platform.y, prev.x - 200) * 180 / Math.PI + 360 + towerRotation) % 360);
            
            let inGap = false;
            platform.gaps.forEach(gap => {
              if (ballAngle >= gap.start && ballAngle <= gap.end) {
                inGap = true;
              }
            });

            if (inGap) {
              // Ball passes through gap
              if (!platform.passed) {
                setPlatforms(prevPlatforms => {
                  const updated = [...prevPlatforms];
                  updated[index] = { ...updated[index], passed: true };
                  return updated;
                });

                // Score for passing through
                const newCombo = combo + 1;
                setCombo(newCombo);
                
                const points = 1 + Math.floor(newCombo / 3);
                setScore(prevScore => {
                  const newScore = prevScore + points;
                  onScoreUpdate(newScore);
                  return newScore;
                });

                createParticles(prev.x, prev.y, platform.color, 6);
              }
            } else {
              // Ball hits platform
              if (platform.dangerous) {
                // Game over on dangerous platform
                createParticles(prev.x, newY, '#ff6b6b', 15);
                setGameState('gameOver');
                onGameEnd(score);
                return prev;
              } else {
                // Bounce off normal platform
                newY = platformTop - prev.radius;
                newVelocityY = BOUNCE_FORCE;
                newBouncing = true;
                setCombo(0); // Reset combo on bounce
                createParticles(prev.x, newY, platform.color, 8);
              }
            }
          }
        });

        // Game over if ball falls too low
        if (newY > cameraY + CANVAS_HEIGHT + 200) {
          setGameState('gameOver');
          onGameEnd(score);
        }

        // Update trail
        const newTrail = [
          { x: prev.x, y: newY, alpha: 1 },
          ...prev.trail.map(point => ({ ...point, alpha: point.alpha * 0.9 }))
        ].filter(point => point.alpha > 0.1).slice(0, 10);

        return {
          ...prev,
          y: newY,
          velocityY: newVelocityY,
          bouncing: newBouncing,
          trail: newTrail
        };
      });

      // Update camera to follow ball
      setCameraY(prev => {
        const targetY = ball.y - CANVAS_HEIGHT * 0.3;
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
  }, [gameState, ball, platforms, towerRotation, isRotating, rotationDirection, combo, score, cameraY, createParticles, onScoreUpdate, onGameEnd]);

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

    // Draw tower center
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.arc(200, ball.y, 30, 0, Math.PI * 2);
    ctx.fill();

    // Draw platforms
    platforms.forEach(platform => {
      if (platform.y > cameraY - 50 && platform.y < cameraY + CANVAS_HEIGHT + 50) {
        ctx.save();
        ctx.translate(200, platform.y);
        ctx.rotate((platform.rotation + towerRotation) * Math.PI / 180);

        // Draw platform segments
        const segmentAngle = 360 / 20; // 20 segments
        for (let i = 0; i < 20; i++) {
          const angle = i * segmentAngle;
          let inGap = false;
          
          platform.gaps.forEach(gap => {
            if (angle >= gap.start && angle <= gap.end) {
              inGap = true;
            }
          });

          if (!inGap) {
            ctx.fillStyle = platform.dangerous ? '#ff6b6b' : platform.color;
            ctx.beginPath();
            ctx.arc(0, 0, TOWER_RADIUS, (angle * Math.PI) / 180, ((angle + segmentAngle) * Math.PI) / 180);
            ctx.lineTo(0, 0);
            ctx.fill();

            // Platform highlight
            if (!platform.dangerous) {
              ctx.fillStyle = 'rgba(255,255,255,0.3)';
              ctx.beginPath();
              ctx.arc(0, 0, TOWER_RADIUS, (angle * Math.PI) / 180, ((angle + segmentAngle) * Math.PI) / 180);
              ctx.lineTo(0, 0);
              ctx.fill();
            }
          }
        }

        ctx.restore();
      }
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
      ctx.fillStyle = '#4ecdc4';
      ctx.beginPath();
      ctx.arc(point.x, point.y, ball.radius * point.alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Draw ball
    const ballGradient = ctx.createRadialGradient(
      ball.x - 4, ball.y - 4, 0,
      ball.x, ball.y, ball.radius
    );
    ballGradient.addColorStop(0, '#ffffff');
    ballGradient.addColorStop(0.7, '#4ecdc4');
    ballGradient.addColorStop(1, '#45b7d1');
    
    ctx.fillStyle = ballGradient;
    ctx.shadowColor = '#4ecdc4';
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
    
    if (combo > 0) {
      ctx.fillStyle = '#f9ca24';
      ctx.font = 'bold 18px Arial';
      ctx.fillText(`Combo: x${combo}`, CANVAS_WIDTH / 2, 65);
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
      ctx.fillText(`Max Combo: ${combo}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
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
        <div>🌀 Helix Jump</div>
        <div>Score: {score}</div>
        {combo > 0 && <div style={{ color: '#f9ca24' }}>Combo: x{combo}</div>}
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
          Move mouse left/right or use arrow keys to rotate the tower. 
          Guide the ball through gaps and avoid red platforms!
        </div>
      </div>
    </div>
  );
}
