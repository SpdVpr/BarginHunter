/** @jsxImportSource react */
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface BubblePopGameProps {
  onGameEnd: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface Bubble {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  popping: boolean;
  popTime: number;
}

const COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#fd79a8', '#00b894', '#fdcb6e'];

export default function BubblePopGame({ onGameEnd, onScoreUpdate }: BubblePopGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [combo, setCombo] = useState(0);
  const [lastPopTime, setLastPopTime] = useState(0);
  const [particles, setParticles] = useState<any[]>([]);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const MAX_BUBBLES = 15;

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

  // Spawn bubbles
  const spawnBubble = useCallback(() => {
    const newBubble: Bubble = {
      id: Date.now() + Math.random(),
      x: Math.random() * (CANVAS_WIDTH - 100) + 50,
      y: Math.random() * (CANVAS_HEIGHT - 100) + 50,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 30 + Math.random() * 40,
      popping: false,
      popTime: 0
    };

    setBubbles(prev => {
      if (prev.length >= MAX_BUBBLES) return prev;
      return [...prev, newBubble];
    });
  }, []);

  // Handle canvas click
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleClick = (e: MouseEvent) => {
      if (gameState !== 'playing') return;

      const rect = canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
      const clickY = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);

      setBubbles(prev => {
        let poppedBubble = false;
        const newBubbles = prev.map(bubble => {
          if (bubble.popping) return bubble;

          const distance = Math.sqrt(
            Math.pow(clickX - bubble.x, 2) + Math.pow(clickY - bubble.y, 2)
          );

          if (distance <= bubble.size / 2) {
            poppedBubble = true;
            
            // Create particles
            const newParticles = [];
            for (let i = 0; i < 8; i++) {
              newParticles.push({
                x: bubble.x,
                y: bubble.y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                color: bubble.color,
                life: 30,
                maxLife: 30
              });
            }
            setParticles(prev => [...prev, ...newParticles]);

            // Calculate score with combo
            const now = Date.now();
            let currentCombo = combo;
            
            if (now - lastPopTime < 1000) { // Within 1 second
              currentCombo++;
            } else {
              currentCombo = 1;
            }
            
            setCombo(currentCombo);
            setLastPopTime(now);
            
            const basePoints = Math.floor(bubble.size);
            const comboBonus = currentCombo * 10;
            const sizeBonus = bubble.size > 50 ? 50 : 0;
            const totalPoints = basePoints + comboBonus + sizeBonus;
            
            setScore(prevScore => {
              const newScore = prevScore + totalPoints;
              onScoreUpdate(newScore);
              return newScore;
            });

            return { ...bubble, popping: true, popTime: Date.now() };
          }
          return bubble;
        });

        return newBubbles;
      });
    };

    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [gameState, combo, lastPopTime, onScoreUpdate]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      // Spawn new bubbles
      if (Math.random() < 0.03 && bubbles.length < MAX_BUBBLES) {
        spawnBubble();
      }

      // Update bubbles
      setBubbles(prev => {
        return prev.filter(bubble => {
          if (bubble.popping) {
            return Date.now() - bubble.popTime < 300; // Remove after pop animation
          }
          return true;
        }).map(bubble => {
          // Floating animation
          if (!bubble.popping) {
            return {
              ...bubble,
              y: bubble.y + Math.sin(Date.now() * 0.001 + bubble.id) * 0.5,
              x: bubble.x + Math.cos(Date.now() * 0.0008 + bubble.id) * 0.3
            };
          }
          return bubble;
        });
      });

      // Update particles
      setParticles(prev => prev.map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        vy: particle.vy + 0.2, // gravity
        life: particle.life - 1
      })).filter(particle => particle.life > 0));

      // Reset combo if no pops for 2 seconds
      if (Date.now() - lastPopTime > 2000) {
        setCombo(0);
      }
    }, 16);

    return () => clearInterval(gameLoop);
  }, [gameState, bubbles.length, spawnBubble, lastPopTime]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Underwater gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#4facfe');
    gradient.addColorStop(1, '#00f2fe');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw underwater effects
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    for (let i = 0; i < 20; i++) {
      const x = (i * 50 + Date.now() * 0.02) % (CANVAS_WIDTH + 50);
      const y = (i * 30 + Date.now() * 0.01) % CANVAS_HEIGHT;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw bubbles
    bubbles.forEach(bubble => {
      if (bubble.popping) {
        // Pop animation
        const popProgress = (Date.now() - bubble.popTime) / 300;
        const popSize = bubble.size * (1 + popProgress * 2);
        const alpha = 1 - popProgress;
        
        ctx.globalAlpha = alpha;
        ctx.fillStyle = bubble.color;
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, popSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else {
        // Normal bubble with shine effect
        const gradient = ctx.createRadialGradient(
          bubble.x - bubble.size * 0.3, bubble.y - bubble.size * 0.3, 0,
          bubble.x, bubble.y, bubble.size / 2
        );
        gradient.addColorStop(0, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(0.3, bubble.color);
        gradient.addColorStop(1, bubble.color);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Bubble highlight
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.arc(bubble.x - bubble.size * 0.2, bubble.y - bubble.size * 0.2, bubble.size * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw particles
    particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Draw UI
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    
    ctx.strokeText(`Score: ${score}`, 20, 40);
    ctx.fillText(`Score: ${score}`, 20, 40);
    
    ctx.strokeText(`Time: ${timeLeft}s`, 20, 70);
    ctx.fillText(`Time: ${timeLeft}s`, 20, 70);
    
    if (combo > 1) {
      ctx.fillStyle = '#FFD700';
      ctx.strokeStyle = '#FF6347';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.strokeText(`COMBO x${combo}!`, CANVAS_WIDTH / 2, 100);
      ctx.fillText(`COMBO x${combo}!`, CANVAS_WIDTH / 2, 100);
    }

    // Game over screen
    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Time\'s Up!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.font = 'bold 32px Arial';
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      
      ctx.font = '20px Arial';
      ctx.fillText('Click bubbles to pop them and build combos!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
    }
  });

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      {/* Game Header */}
      <div style={{
        background: 'rgba(255,255,255,0.9)',
        padding: '15px 30px',
        borderRadius: '15px',
        marginBottom: '20px',
        display: 'flex',
        gap: '30px',
        alignItems: 'center',
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#333'
      }}>
        <div>🫧 Bubble Pop</div>
        <div>Score: {score}</div>
        <div>Time: {timeLeft}s</div>
        {combo > 1 && <div style={{ color: '#ff6b6b' }}>Combo: x{combo}</div>}
      </div>

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          border: '3px solid rgba(255,255,255,0.5)',
          borderRadius: '15px',
          background: '#4facfe',
          maxWidth: '100%',
          maxHeight: '70vh',
          cursor: 'crosshair',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}
      />

      {/* Instructions */}
      <div style={{
        background: 'rgba(255,255,255,0.9)',
        padding: '15px 25px',
        borderRadius: '12px',
        marginTop: '20px',
        textAlign: 'center',
        color: '#333',
        fontSize: '14px',
        maxWidth: '600px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
          🎯 How to Play
        </div>
        <div>
          Click on bubbles to pop them! Build combos by popping bubbles quickly. 
          Larger bubbles give more points. You have 60 seconds!
        </div>
      </div>
    </div>
  );
}
