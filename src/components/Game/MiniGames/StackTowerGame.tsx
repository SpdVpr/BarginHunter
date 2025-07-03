/** @jsxImportSource react */
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface StackTowerGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface Ball {
  x: number;
  y: number;
  velocityY: number;
  radius: number;
  trail: { x: number; y: number; alpha: number }[];
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  broken: boolean;
  crackProgress: number;
  isBlack: boolean;
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

export default function StackTowerGame({ onGameEnd, onScoreUpdate }: StackTowerGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
  const [ball, setBall] = useState<Ball>({
    x: 200,
    y: 100,
    velocityY: 0,
    radius: 12,
    trail: []
  });
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [cameraY, setCameraY] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const [perfectHits, setPerfectHits] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(1);

  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 600;
  const PLATFORM_HEIGHT = 20;
  const PLATFORM_SPACING = 80;
  const BALL_BOUNCE = -15;
  const GRAVITY = 0.6;

  // Generate platforms
  const generatePlatforms = useCallback(() => {
    const newPlatforms: Platform[] = [];
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#fd79a8', '#00b894'];
    
    for (let i = 0; i < 50; i++) {
      const y = 500 - i * PLATFORM_SPACING;
      const isBlack = i > 0 && Math.random() < 0.15; // 15% chance for unbreakable platforms
      
      newPlatforms.push({
        x: 50 + Math.random() * 200,
        y,
        width: 100 + Math.random() * 100,
        height: PLATFORM_HEIGHT,
        color: isBlack ? '#2c2c2c' : colors[Math.floor(Math.random() * colors.length)],
        broken: false,
        crackProgress: 0,
        isBlack
      });
    }
    
    setPlatforms(newPlatforms);
  }, []);

  // Initialize game
  useEffect(() => {
    generatePlatforms();
  }, [generatePlatforms]);

  // Handle touch/mouse input
  useEffect(() => {
    const handleStart = (e: TouchEvent | MouseEvent) => {
      e.preventDefault();
      setIsPressed(true);
    };

    const handleEnd = (e: TouchEvent | MouseEvent) => {
      e.preventDefault();
      setIsPressed(false);
    };

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Touch events
    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchend', handleEnd, { passive: false });
    
    // Mouse events
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mouseup', handleEnd);

    return () => {
      canvas.removeEventListener('touchstart', handleStart);
      canvas.removeEventListener('touchend', handleEnd);
      canvas.removeEventListener('mousedown', handleStart);
      canvas.removeEventListener('mouseup', handleEnd);
    };
  }, []);

  // Create explosion particles
  const createExplosion = useCallback((x: number, y: number, color: string, count: number = 12) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 3 + Math.random() * 5;
      newParticles.push({
        x,
        y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed - 2,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        color,
        size: 3 + Math.random() * 4
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
        let newVelocityY = prev.velocityY + GRAVITY * gameSpeed;
        let newY = prev.y + newVelocityY * gameSpeed;
        let newX = prev.x;

        // Ball movement when pressed
        if (isPressed && newVelocityY > 0) {
          newVelocityY *= 0.3; // Slow down fall
        }

        // Platform collision
        platforms.forEach((platform, index) => {
          if (
            !platform.broken &&
            newY + prev.radius >= platform.y &&
            prev.y + prev.radius <= platform.y &&
            newX >= platform.x - prev.radius &&
            newX <= platform.x + platform.width + prev.radius &&
            newVelocityY > 0
          ) {
            if (!platform.isBlack) {
              // Break platform
              setPlatforms(prevPlatforms => {
                const updated = [...prevPlatforms];
                updated[index] = { ...updated[index], broken: true };
                return updated;
              });

              // Create explosion
              createExplosion(platform.x + platform.width / 2, platform.y, platform.color);

              // Score and combo
              const newCombo = combo + 1;
              setCombo(newCombo);
              
              // Perfect hit bonus (center of platform)
              const centerX = platform.x + platform.width / 2;
              const distance = Math.abs(newX - centerX);
              const isPerfect = distance < platform.width * 0.2;
              
              if (isPerfect) {
                setPerfectHits(prev => prev + 1);
                createExplosion(newX, newY, '#FFD700', 8);
              }

              const basePoints = 10;
              const comboBonus = newCombo * 5;
              const perfectBonus = isPerfect ? 50 : 0;
              const speedBonus = Math.floor(gameSpeed * 10);
              
              const points = basePoints + comboBonus + perfectBonus + speedBonus;
              setScore(prevScore => {
                const newScore = prevScore + points;
                onScoreUpdate(newScore);
                return newScore;
              });

              // Increase game speed gradually
              setGameSpeed(prev => Math.min(prev + 0.02, 2.5));
            }

            // Bounce
            newY = platform.y - prev.radius;
            newVelocityY = BALL_BOUNCE * gameSpeed;
          }
        });

        // Game over if ball falls too low
        if (newY > cameraY + CANVAS_HEIGHT + 200) {
          setGameState('gameOver');
          onGameEnd(score);
        }

        // Update trail
        const newTrail = [
          { x: newX, y: newY, alpha: 1 },
          ...prev.trail.map(point => ({ ...point, alpha: point.alpha * 0.9 }))
        ].filter(point => point.alpha > 0.1).slice(0, 15);

        return {
          x: newX,
          y: newY,
          velocityY: newVelocityY,
          radius: prev.radius,
          trail: newTrail
        };
      });

      // Update camera to follow ball
      setCameraY(prev => {
        const targetY = ball.y - CANVAS_HEIGHT * 0.7;
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

      // Reset combo if no hits for a while
      if (combo > 0 && Math.random() < 0.001) {
        setCombo(0);
      }
    }, 16); // ~60 FPS

    return () => clearInterval(gameLoop);
  }, [gameState, ball, platforms, combo, score, isPressed, cameraY, gameSpeed, createExplosion, onScoreUpdate, onGameEnd]);

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

    // Draw platforms
    platforms.forEach(platform => {
      if (platform.y > cameraY - 50 && platform.y < cameraY + CANVAS_HEIGHT + 50) {
        if (!platform.broken) {
          // Platform shadow
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.fillRect(platform.x + 3, platform.y + 3, platform.width, platform.height);
          
          // Platform body
          ctx.fillStyle = platform.color;
          ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
          
          // Platform highlight
          if (!platform.isBlack) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height / 2);
          } else {
            // Black platform indicator
            ctx.fillStyle = '#ff6b6b';
            ctx.fillRect(platform.x, platform.y - 2, platform.width, 2);
          }
        }
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
      ctx.fillStyle = '#ff6b6b';
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
    ballGradient.addColorStop(0.7, '#ff6b6b');
    ballGradient.addColorStop(1, '#e55555');
    
    ctx.fillStyle = ballGradient;
    ctx.shadowColor = '#ff6b6b';
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
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 40);
    
    if (combo > 1) {
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`Combo: x${combo}`, 20, 70);
    }
    
    if (perfectHits > 0) {
      ctx.fillStyle = '#4ecdc4';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`Perfect: ${perfectHits}`, 20, 95);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`Speed: ${gameSpeed.toFixed(1)}x`, 20, 120);
    ctx.shadowBlur = 0;

    // Hold instruction
    if (isPressed) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('HOLD TO SLOW DOWN', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Hold to slow fall', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
    }

    // Game over screen
    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 5;
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
      
      ctx.font = 'bold 24px Arial';
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.fillText(`Perfect Hits: ${perfectHits}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
      ctx.fillText(`Max Speed: ${gameSpeed.toFixed(1)}x`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
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
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <div>🏗️ Stack Tower</div>
        <div>Score: {score}</div>
        {combo > 1 && <div style={{ color: '#ff6b6b' }}>x{combo}</div>}
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
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
          🎯 How to Play
        </div>
        <div>
          Hold to slow down the ball's fall. Break colored platforms but avoid black ones! 
          Hit the center for perfect bonuses!
        </div>
      </div>
    </div>
  );
}
