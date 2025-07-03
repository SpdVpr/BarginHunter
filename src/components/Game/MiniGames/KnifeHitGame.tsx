/** @jsxImportSource react */
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface KnifeHitGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface Knife {
  x: number;
  y: number;
  angle: number;
  stuck: boolean;
  stuckAngle: number;
}

interface Target {
  x: number;
  y: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  knivesNeeded: number;
  knivesHit: number;
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

export default function KnifeHitGame({ onGameEnd, onScoreUpdate }: KnifeHitGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
  const [knives, setKnives] = useState<Knife[]>([]);
  const [target, setTarget] = useState<Target>({
    x: 200,
    y: 200,
    radius: 80,
    rotation: 0,
    rotationSpeed: 0.02,
    color: '#8b4513',
    knivesNeeded: 5,
    knivesHit: 0
  });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [throwingKnife, setThrowingKnife] = useState<Knife | null>(null);
  const [perfectHits, setPerfectHits] = useState(0);
  const [streak, setStreak] = useState(0);

  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 600;
  const KNIFE_SPEED = 8;
  const KNIFE_LENGTH = 40;

  // Handle input
  useEffect(() => {
    const handleInput = (e: KeyboardEvent | TouchEvent | MouseEvent) => {
      if (gameState !== 'playing' || throwingKnife) return;
      
      e.preventDefault();
      
      // Throw knife
      const newKnife: Knife = {
        x: 200,
        y: 550,
        angle: 0,
        stuck: false,
        stuckAngle: 0
      };
      
      setThrowingKnife(newKnife);
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
  }, [gameState, throwingKnife]);

  // Generate new target
  const generateTarget = useCallback((levelNum: number) => {
    const colors = ['#8b4513', '#654321', '#d2691e', '#a0522d'];
    const baseSpeed = 0.02;
    const speedIncrease = levelNum * 0.005;
    const knivesNeeded = Math.min(5 + Math.floor(levelNum / 2), 12);
    
    setTarget({
      x: 200,
      y: 200,
      radius: Math.max(60, 90 - levelNum * 2),
      rotation: 0,
      rotationSpeed: baseSpeed + speedIncrease * (Math.random() > 0.5 ? 1 : -1),
      color: colors[Math.floor(Math.random() * colors.length)],
      knivesNeeded,
      knivesHit: 0
    });
    
    setKnives([]);
  }, []);

  // Initialize first target
  useEffect(() => {
    generateTarget(1);
  }, [generateTarget]);

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
      // Update target rotation
      setTarget(prev => ({
        ...prev,
        rotation: prev.rotation + prev.rotationSpeed
      }));

      // Update throwing knife
      if (throwingKnife) {
        setThrowingKnife(prev => {
          if (!prev) return null;
          
          const newY = prev.y - KNIFE_SPEED;
          
          // Check collision with target
          const distance = Math.sqrt(
            Math.pow(prev.x - target.x, 2) + Math.pow(newY - target.y, 2)
          );
          
          if (distance <= target.radius + KNIFE_LENGTH / 2) {
            // Check collision with existing knives
            let collision = false;
            knives.forEach(knife => {
              if (knife.stuck) {
                const knifeAngle = knife.stuckAngle + target.rotation;
                const knifeX = target.x + Math.cos(knifeAngle) * target.radius;
                const knifeY = target.y + Math.sin(knifeAngle) * target.radius;
                
                const knifeDistance = Math.sqrt(
                  Math.pow(prev.x - knifeX, 2) + Math.pow(newY - knifeY, 2)
                );
                
                if (knifeDistance < KNIFE_LENGTH) {
                  collision = true;
                }
              }
            });
            
            if (collision) {
              // Game over - knife hit another knife
              createParticles(prev.x, newY, '#ff6b6b', 15);
              setGameState('gameOver');
              onGameEnd(score);
              return null;
            } else {
              // Knife sticks to target
              const stuckAngle = Math.atan2(newY - target.y, prev.x - target.x) - target.rotation;
              const stuckKnife: Knife = {
                ...prev,
                y: newY,
                stuck: true,
                stuckAngle
              };
              
              setKnives(prevKnives => [...prevKnives, stuckKnife]);
              
              // Update target
              setTarget(prevTarget => ({
                ...prevTarget,
                knivesHit: prevTarget.knivesHit + 1
              }));
              
              // Score and effects
              const newStreak = streak + 1;
              setStreak(newStreak);
              
              // Perfect hit bonus (center of target)
              const centerDistance = distance / target.radius;
              let points = 1;
              if (centerDistance < 0.3) {
                points = 3;
                setPerfectHits(prev => prev + 1);
                createParticles(prev.x, newY, '#FFD700', 12);
              } else {
                createParticles(prev.x, newY, target.color, 8);
              }
              
              // Streak bonus
              if (newStreak >= 5) points *= 2;
              
              setScore(prevScore => {
                const newScore = prevScore + points;
                onScoreUpdate(newScore);
                return newScore;
              });
              
              // Check if target is complete
              if (target.knivesHit + 1 >= target.knivesNeeded) {
                // Level complete
                const newLevel = level + 1;
                setLevel(newLevel);
                generateTarget(newLevel);
                
                // Level completion bonus
                setScore(prevScore => {
                  const bonusScore = prevScore + target.knivesNeeded;
                  onScoreUpdate(bonusScore);
                  return bonusScore;
                });
                
                createParticles(target.x, target.y, '#4ecdc4', 20);
              }
              
              return null;
            }
          }
          
          // Check if knife went off screen
          if (newY < -50) {
            setStreak(0);
            return null;
          }
          
          return { ...prev, y: newY };
        });
      }

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
  }, [gameState, throwingKnife, target, knives, level, score, streak, generateTarget, createParticles, onScoreUpdate, onGameEnd]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#2c3e50');
    gradient.addColorStop(1, '#34495e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw target
    ctx.save();
    ctx.translate(target.x, target.y);
    ctx.rotate(target.rotation);
    
    // Target body
    ctx.fillStyle = target.color;
    ctx.shadowColor = target.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, target.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Target rings
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, (target.radius / 4) * i, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.shadowBlur = 0;
    ctx.restore();

    // Draw stuck knives
    knives.forEach(knife => {
      if (knife.stuck) {
        const knifeAngle = knife.stuckAngle + target.rotation;
        const knifeX = target.x + Math.cos(knifeAngle) * target.radius;
        const knifeY = target.y + Math.sin(knifeAngle) * target.radius;
        
        ctx.save();
        ctx.translate(knifeX, knifeY);
        ctx.rotate(knifeAngle);
        
        // Knife handle
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-KNIFE_LENGTH / 2, -3, KNIFE_LENGTH / 3, 6);
        
        // Knife blade
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(KNIFE_LENGTH / 6, -2, KNIFE_LENGTH / 3, 4);
        
        // Knife tip
        ctx.beginPath();
        ctx.moveTo(KNIFE_LENGTH / 2, 0);
        ctx.lineTo(KNIFE_LENGTH / 2 - 8, -2);
        ctx.lineTo(KNIFE_LENGTH / 2 - 8, 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
      }
    });

    // Draw throwing knife
    if (throwingKnife) {
      ctx.save();
      ctx.translate(throwingKnife.x, throwingKnife.y);
      
      // Knife handle
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(-3, -KNIFE_LENGTH / 2, 6, KNIFE_LENGTH / 3);
      
      // Knife blade
      ctx.fillStyle = '#c0c0c0';
      ctx.shadowColor = '#c0c0c0';
      ctx.shadowBlur = 5;
      ctx.fillRect(-2, -KNIFE_LENGTH / 6, 4, KNIFE_LENGTH / 3);
      
      // Knife tip
      ctx.beginPath();
      ctx.moveTo(0, -KNIFE_LENGTH / 2);
      ctx.lineTo(-2, -KNIFE_LENGTH / 2 + 8);
      ctx.lineTo(2, -KNIFE_LENGTH / 2 + 8);
      ctx.closePath();
      ctx.fill();
      
      ctx.shadowBlur = 0;
      ctx.restore();
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

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 3;
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 35);
    ctx.fillText(`Level: ${level}`, 20, 60);
    
    // Progress bar
    const progress = target.knivesHit / target.knivesNeeded;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(20, 70, 200, 10);
    ctx.fillStyle = '#4ecdc4';
    ctx.fillRect(20, 70, 200 * progress, 10);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`${target.knivesHit}/${target.knivesNeeded}`, 230, 80);
    
    if (streak > 0) {
      ctx.fillStyle = '#f9ca24';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`Streak: ${streak}`, 20, 105);
    }
    
    if (perfectHits > 0) {
      ctx.fillStyle = '#FFD700';
      ctx.fillText(`Perfect: ${perfectHits}`, 20, 125);
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
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
      
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.fillText(`Level Reached: ${level}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
      ctx.fillText(`Perfect Hits: ${perfectHits}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
      ctx.shadowBlur = 0;
    }
  });

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
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
        <div>🔪 Knife Hit</div>
        <div>Score: {score}</div>
        <div>Level: {level}</div>
        <div>{target.knivesHit}/{target.knivesNeeded}</div>
      </div>

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          border: '3px solid rgba(255,255,255,0.3)',
          borderRadius: '15px',
          background: '#2c3e50',
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
          Tap or press space to throw knives at the rotating target. 
          Don't hit other knives! Hit the center for perfect bonuses!
        </div>
      </div>
    </div>
  );
}
