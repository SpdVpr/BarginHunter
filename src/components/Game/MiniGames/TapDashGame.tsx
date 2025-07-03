/** @jsxImportSource react */
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface TapDashGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface Target {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  type: 'normal' | 'bonus' | 'danger' | 'speed';
  life: number;
  maxLife: number;
  points: number;
  shrinking: boolean;
  pulsePhase: number;
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

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  velocityY: number;
}

export default function TapDashGame({ onGameEnd, onScoreUpdate }: TapDashGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
  const [targets, setTargets] = useState<Target[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [streak, setStreak] = useState(0);
  const [perfectHits, setPerfectHits] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [lastSpawn, setLastSpawn] = useState(0);

  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 600;
  const TARGET_TYPES = {
    normal: { color: '#4ecdc4', points: 10, life: 120 },
    bonus: { color: '#f9ca24', points: 25, life: 100 },
    danger: { color: '#ff6b6b', points: -20, life: 150 },
    speed: { color: '#6c5ce7', points: 15, life: 80 }
  };

  // Game timer
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('gameOver');
          onGameEnd(score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, score, onGameEnd]);

  // Handle touch/click
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouch = (e: TouchEvent | MouseEvent) => {
      e.preventDefault();
      
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      const x = (clientX - rect.left) * (CANVAS_WIDTH / rect.width);
      const y = (clientY - rect.top) * (CANVAS_HEIGHT / rect.height);

      // Check target hits
      setTargets(prev => {
        let hitTarget = false;
        const newTargets = prev.map(target => {
          const distance = Math.sqrt(Math.pow(x - target.x, 2) + Math.pow(y - target.y, 2));
          
          if (distance <= target.size && !hitTarget) {
            hitTarget = true;
            
            // Create explosion
            createExplosion(target.x, target.y, target.color, target.type === 'bonus' ? 15 : 10);
            
            // Handle different target types
            let points = target.points * multiplier;
            let newStreak = streak;
            
            if (target.type === 'danger') {
              setStreak(0);
              setMultiplier(1);
              addFloatingText(target.x, target.y, `${points}`, '#ff6b6b');
            } else {
              newStreak = streak + 1;
              setStreak(newStreak);
              
              // Perfect hit bonus (center of target)
              const centerDistance = distance / target.size;
              if (centerDistance < 0.3) {
                points *= 2;
                setPerfectHits(prev => prev + 1);
                addFloatingText(target.x, target.y, 'PERFECT!', '#FFD700');
                createExplosion(target.x, target.y, '#FFD700', 8);
              }
              
              // Streak multiplier
              if (newStreak >= 10) setMultiplier(3);
              else if (newStreak >= 5) setMultiplier(2);
              
              // Speed bonus
              if (target.type === 'speed') {
                setGameSpeed(prev => Math.min(prev + 0.1, 2));
                addFloatingText(target.x, target.y, 'SPEED UP!', '#6c5ce7');
              }
              
              addFloatingText(target.x, target.y, `+${points}`, target.color);
            }
            
            setScore(prevScore => {
              const newScore = Math.max(0, prevScore + points);
              onScoreUpdate(newScore);
              return newScore;
            });
            
            return { ...target, life: 0 }; // Mark for removal
          }
          return target;
        });
        
        return newTargets.filter(target => target.life > 0);
      });
    };

    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.addEventListener('click', handleTouch);

    return () => {
      canvas.removeEventListener('touchstart', handleTouch);
      canvas.removeEventListener('click', handleTouch);
    };
  }, [streak, multiplier, score, onScoreUpdate]);

  // Spawn targets
  const spawnTarget = useCallback(() => {
    const now = Date.now();
    const spawnDelay = Math.max(300 / gameSpeed, 150);
    
    if (now - lastSpawn < spawnDelay) return;
    
    setLastSpawn(now);
    
    const types = Object.keys(TARGET_TYPES) as (keyof typeof TARGET_TYPES)[];
    let type: keyof typeof TARGET_TYPES;
    
    // Weighted spawn chances
    const rand = Math.random();
    if (rand < 0.6) type = 'normal';
    else if (rand < 0.8) type = 'bonus';
    else if (rand < 0.95) type = 'speed';
    else type = 'danger';
    
    const config = TARGET_TYPES[type];
    const size = type === 'bonus' ? 35 : type === 'danger' ? 45 : 40;
    
    const newTarget: Target = {
      id: Date.now() + Math.random(),
      x: size + Math.random() * (CANVAS_WIDTH - size * 2),
      y: size + Math.random() * (CANVAS_HEIGHT - size * 2),
      size,
      color: config.color,
      type,
      life: config.life / gameSpeed,
      maxLife: config.life / gameSpeed,
      points: config.points,
      shrinking: false,
      pulsePhase: 0
    };
    
    setTargets(prev => [...prev, newTarget]);
  }, [gameSpeed, lastSpawn]);

  // Create explosion particles
  const createExplosion = useCallback((x: number, y: number, color: string, count: number = 10) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 3 + Math.random() * 6;
      newParticles.push({
        x,
        y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        life: 20 + Math.random() * 15,
        maxLife: 35,
        color,
        size: 2 + Math.random() * 4
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Add floating text
  const addFloatingText = useCallback((x: number, y: number, text: string, color: string) => {
    setFloatingTexts(prev => [...prev, {
      x,
      y,
      text,
      color,
      life: 60,
      velocityY: -2
    }]);
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      // Spawn targets
      spawnTarget();

      // Update targets
      setTargets(prev => prev.map(target => {
        const newLife = target.life - 1;
        const lifeRatio = newLife / target.maxLife;
        
        return {
          ...target,
          life: newLife,
          shrinking: lifeRatio < 0.3,
          pulsePhase: target.pulsePhase + 0.2,
          size: target.size * (target.shrinking ? 0.7 + 0.3 * lifeRatio : 1)
        };
      }).filter(target => target.life > 0));

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

      // Update floating texts
      setFloatingTexts(prev => prev
        .map(text => ({
          ...text,
          y: text.y + text.velocityY,
          life: text.life - 1
        }))
        .filter(text => text.life > 0)
      );

      // Increase game speed over time
      setGameSpeed(prev => Math.min(prev + 0.001, 2.5));
    }, 16); // ~60 FPS

    return () => clearInterval(gameLoop);
  }, [gameState, spawnTarget]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Grid pattern
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < CANVAS_WIDTH; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i < CANVAS_HEIGHT; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_WIDTH, i);
      ctx.stroke();
    }

    // Draw targets
    targets.forEach(target => {
      const pulseSize = target.shrinking ? 
        target.size * (1 + Math.sin(target.pulsePhase) * 0.1) : 
        target.size;
      
      // Target shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(target.x + 3, target.y + 3, pulseSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Target glow
      ctx.shadowColor = target.color;
      ctx.shadowBlur = 15;
      
      // Target body
      const targetGradient = ctx.createRadialGradient(
        target.x - pulseSize * 0.3, target.y - pulseSize * 0.3, 0,
        target.x, target.y, pulseSize
      );
      targetGradient.addColorStop(0, 'rgba(255,255,255,0.8)');
      targetGradient.addColorStop(0.7, target.color);
      targetGradient.addColorStop(1, target.color);
      
      ctx.fillStyle = targetGradient;
      ctx.beginPath();
      ctx.arc(target.x, target.y, pulseSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Target type indicator
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      
      const icon = target.type === 'bonus' ? '★' : 
                  target.type === 'danger' ? '✕' : 
                  target.type === 'speed' ? '⚡' : '●';
      ctx.fillText(icon, target.x, target.y + 6);
      
      // Life indicator
      if (target.shrinking) {
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(target.x, target.y, pulseSize + 5, 0, Math.PI * 2);
        ctx.stroke();
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

    // Draw floating texts
    floatingTexts.forEach(text => {
      const alpha = text.life / 60;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = text.color;
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.lineWidth = 3;
      ctx.strokeText(text.text, text.x, text.y);
      ctx.fillText(text.text, text.x, text.y);
      ctx.globalAlpha = 1;
    });

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 3;
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 35);
    ctx.fillText(`Time: ${timeLeft}s`, 20, 60);
    
    if (multiplier > 1) {
      ctx.fillStyle = '#f9ca24';
      ctx.fillText(`x${multiplier}`, 20, 85);
    }
    
    if (streak > 0) {
      ctx.fillStyle = '#4ecdc4';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`Streak: ${streak}`, 20, 110);
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
      ctx.fillText('TIME\'S UP!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
      
      ctx.font = 'bold 24px Arial';
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.fillText(`Perfect Hits: ${perfectHits}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
      ctx.fillText(`Max Streak: ${streak}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
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
        <div>⚡ Tap Dash</div>
        <div>Score: {score}</div>
        <div>Time: {timeLeft}s</div>
        {multiplier > 1 && <div style={{ color: '#f9ca24' }}>x{multiplier}</div>}
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
          Tap targets before they disappear! ★ Bonus, ⚡ Speed, ● Normal, ✕ Danger. 
          Hit center for perfect bonuses!
        </div>
      </div>
    </div>
  );
}
