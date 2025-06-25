import React, { useRef, useEffect, useState } from 'react';
import { DirectImageManager } from './DirectImageManager';

interface SimpleGameEngineProps {
  onGameEnd: (score: number, gameData: any) => void;
  onScoreUpdate: (score: number) => void;
  discountTiers: any[];
  gameConfig: any;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const GROUND_Y = CANVAS_HEIGHT - 80;

export default function SimpleGameEngine({ 
  onGameEnd, 
  onScoreUpdate, 
  discountTiers 
}: SimpleGameEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const spriteManagerRef = useRef<DirectImageManager | null>(null);
  const [score, setScore] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [player, setPlayer] = useState({
    x: 100,
    y: GROUND_Y - 80,
    width: 64,
    height: 80,
    velocityY: 0,
    isJumping: false
  });
  const [obstacles, setObstacles] = useState<any[]>([]);
  const [collectibles, setCollectibles] = useState<any[]>([]);
  const [lastObstacleSpawn, setLastObstacleSpawn] = useState(0);
  const [lastCollectibleSpawn, setLastCollectibleSpawn] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(3);
  const [clouds, setClouds] = useState<any[]>([]);
  const [particles, setParticles] = useState<any[]>([]);
  // Removed animation states since we're using static sprite

  // Jump function
  const jump = () => {
    if (!player.isJumping && isRunning) {
      setPlayer(prev => ({
        ...prev,
        velocityY: -15,
        isJumping: true
      }));
    }
  };

  // Initialize sprite manager and clouds
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && !spriteManagerRef.current) {
      spriteManagerRef.current = new DirectImageManager(canvas);
    }

    const initialClouds = [];
    for (let i = 0; i < 5; i++) {
      initialClouds.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * 100 + 20,
        size: Math.random() * 30 + 20,
        speed: Math.random() * 0.5 + 0.2,
        id: i
      });
    }
    setClouds(initialClouds);
  }, []);

  // Event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    };

    const handleClick = () => {
      jump();
    };

    const canvas = canvasRef.current;
    
    window.addEventListener('keydown', handleKeyDown);
    if (canvas) {
      canvas.addEventListener('click', handleClick);
      canvas.addEventListener('touchstart', handleClick);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (canvas) {
        canvas.removeEventListener('click', handleClick);
        canvas.removeEventListener('touchstart', handleClick);
      }
    };
  }, [isRunning, player.isJumping]);

  // Game loop
  useEffect(() => {
    const gameLoop = () => {
      if (!isRunning) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      
      if (!canvas || !ctx) {
        animationRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      // Clear canvas
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw sky gradient
      const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      skyGradient.addColorStop(0, '#87CEEB');
      skyGradient.addColorStop(0.7, '#B0E0E6');
      skyGradient.addColorStop(1, '#F0F8FF');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);

      // Draw and update clouds
      setClouds(prev => prev.map(cloud => ({
        ...cloud,
        x: cloud.x - cloud.speed < -cloud.size ? CANVAS_WIDTH + cloud.size : cloud.x - cloud.speed
      })));

      clouds.forEach(cloud => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 0.5, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
        ctx.arc(cloud.x - cloud.size * 0.5, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw ground with texture
      const groundGradient = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_HEIGHT);
      groundGradient.addColorStop(0, '#8B4513');
      groundGradient.addColorStop(0.3, '#A0522D');
      groundGradient.addColorStop(1, '#654321');
      ctx.fillStyle = groundGradient;
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

      // Draw ground pattern
      ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
      for (let i = 0; i < CANVAS_WIDTH; i += 40) {
        ctx.fillRect(i, GROUND_Y + 10, 20, 5);
      }

      // Update player physics and animation
      setPlayer(prev => {
        let newY = prev.y + prev.velocityY;
        let newVelocityY = prev.velocityY + 0.8; // gravity
        let newIsJumping = prev.isJumping;

        // Ground collision
        if (newY >= GROUND_Y - prev.height) {
          newY = GROUND_Y - prev.height;
          newVelocityY = 0;
          newIsJumping = false;
        }

        // No animation updates needed for static sprite

        return {
          ...prev,
          y: newY,
          velocityY: newVelocityY,
          isJumping: newIsJumping
        };
      });

      // No animation frame updates needed for static sprite

      // Draw player with sprite animation
      const playerCenterX = player.x + player.width / 2;
      const playerCenterY = player.y + player.height / 2;

      // Player shadow (bigger for larger character)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(playerCenterX, GROUND_Y - 8, player.width / 1.5, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw your exact PNG image
      if (spriteManagerRef.current && spriteManagerRef.current.isReady()) {
        spriteManagerRef.current.drawCharacter(
          playerCenterX,
          playerCenterY,
          2.0 // Scale up to make your character clearly visible
        );
      } else {
        // Fallback to simple rectangle while image loads
        ctx.fillStyle = '#4ECDC4';
        ctx.fillRect(player.x, player.y, player.width, player.height);

        // Show loading message
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        ctx.fillText('Loading character...', player.x, player.y - 10);
      }

      // Update game speed based on score (progressive difficulty)
      const currentSpeed = Math.min(3 + Math.floor(score / 200), 8);
      setGameSpeed(currentSpeed);

      // Spawn obstacles with dynamic timing
      const now = Date.now();
      const obstacleInterval = Math.max(1500 - Math.floor(score / 100) * 100, 800);

      if (now - lastObstacleSpawn > obstacleInterval) {
        const obstacleTypes = ['cart', 'box', 'cone', 'barrier'];
        const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];

        setObstacles(prev => [...prev, {
          x: CANVAS_WIDTH,
          y: GROUND_Y - 60,
          width: 45 + Math.random() * 20,
          height: 45 + Math.random() * 20,
          type: type,
          speed: currentSpeed,
          id: now
        }]);
        setLastObstacleSpawn(now);
      }

      // Spawn collectibles (discount tags, coins)
      const collectibleInterval = Math.max(2500 - Math.floor(score / 150) * 200, 1200);

      if (now - lastCollectibleSpawn > collectibleInterval) {
        const collectibleTypes = ['discount', 'coin', 'gem', 'star'];
        const type = collectibleTypes[Math.floor(Math.random() * collectibleTypes.length)];

        setCollectibles(prev => [...prev, {
          x: CANVAS_WIDTH,
          y: GROUND_Y - 120 - Math.random() * 80,
          width: 35,
          height: 35,
          type: type,
          value: type === 'discount' ? 50 : type === 'gem' ? 30 : type === 'star' ? 20 : 10,
          speed: currentSpeed * 0.8,
          id: now + 0.5
        }]);
        setLastCollectibleSpawn(now);
      }

      // Update and draw obstacles
      setObstacles(prev => {
        const updated = prev.map(obstacle => ({
          ...obstacle,
          x: obstacle.x - obstacle.speed
        })).filter(obstacle => obstacle.x > -100);

        // Check obstacle collisions (adjusted for larger character)
        updated.forEach(obstacle => {
          if (player.x + 10 < obstacle.x + obstacle.width - 10 &&
              player.x + player.width - 10 > obstacle.x + 10 &&
              player.y + 10 < obstacle.y + obstacle.height - 10 &&
              player.y + player.height - 10 > obstacle.y + 10) {
            setIsRunning(false);
            onGameEnd(score, {
              duration: Date.now() - (now - score * 16),
              objectsCollected: Math.floor(score / 50),
              obstaclesHit: 1
            });
          }
        });

        return updated;
      });

      // Update and draw collectibles
      setCollectibles(prev => {
        const updated = prev.map(collectible => ({
          ...collectible,
          x: collectible.x - collectible.speed,
          y: collectible.y + Math.sin(Date.now() * 0.005 + collectible.id) * 0.5 // Floating animation
        })).filter(collectible => collectible.x > -50);

        // Check collectible collisions
        updated.forEach((collectible, index) => {
          if (player.x < collectible.x + collectible.width &&
              player.x + player.width > collectible.x &&
              player.y < collectible.y + collectible.height &&
              player.y + player.height > collectible.y) {
            // Collected!
            setScore(prev => prev + collectible.value);

            // Add particle effect
            setParticles(prev => [...prev, {
              x: collectible.x + collectible.width / 2,
              y: collectible.y + collectible.height / 2,
              vx: (Math.random() - 0.5) * 4,
              vy: -Math.random() * 3 - 1,
              life: 30,
              color: collectible.type === 'discount' ? '#FFD700' : '#4ECDC4',
              id: Date.now() + index
            }]);

            updated.splice(index, 1);
          }
        });

        return updated;
      });

      // Draw obstacles with different styles
      obstacles.forEach(obstacle => {
        const obstacleGradient = ctx.createLinearGradient(
          obstacle.x, obstacle.y,
          obstacle.x, obstacle.y + obstacle.height
        );

        switch (obstacle.type) {
          case 'cart':
            obstacleGradient.addColorStop(0, '#8B0000');
            obstacleGradient.addColorStop(1, '#654321');
            break;
          case 'box':
            obstacleGradient.addColorStop(0, '#D2691E');
            obstacleGradient.addColorStop(1, '#8B4513');
            break;
          case 'cone':
            obstacleGradient.addColorStop(0, '#FF4500');
            obstacleGradient.addColorStop(1, '#FF6347');
            break;
          default:
            obstacleGradient.addColorStop(0, '#696969');
            obstacleGradient.addColorStop(1, '#2F4F4F');
        }

        ctx.fillStyle = obstacleGradient;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

        // Add obstacle outline
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      });

      // Draw collectibles with animations
      collectibles.forEach(collectible => {
        const collectibleGradient = ctx.createRadialGradient(
          collectible.x + collectible.width / 2,
          collectible.y + collectible.height / 2,
          0,
          collectible.x + collectible.width / 2,
          collectible.y + collectible.height / 2,
          collectible.width / 2
        );

        switch (collectible.type) {
          case 'discount':
            collectibleGradient.addColorStop(0, '#FFD700');
            collectibleGradient.addColorStop(1, '#FFA500');
            break;
          case 'gem':
            collectibleGradient.addColorStop(0, '#9370DB');
            collectibleGradient.addColorStop(1, '#8A2BE2');
            break;
          case 'star':
            collectibleGradient.addColorStop(0, '#FF69B4');
            collectibleGradient.addColorStop(1, '#FF1493');
            break;
          default:
            collectibleGradient.addColorStop(0, '#4ECDC4');
            collectibleGradient.addColorStop(1, '#45B7D1');
        }

        ctx.fillStyle = collectibleGradient;
        ctx.beginPath();
        ctx.arc(
          collectible.x + collectible.width / 2,
          collectible.y + collectible.height / 2,
          collectible.width / 2,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Add sparkle effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(
          collectible.x + collectible.width / 2 - 3,
          collectible.y + collectible.height / 2 - 3,
          2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });

      // Update and draw particles
      setParticles(prev => {
        const updated = prev.map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.1, // gravity
          life: particle.life - 1
        })).filter(particle => particle.life > 0);

        return updated;
      });

      particles.forEach(particle => {
        const alpha = particle.life / 30;
        ctx.fillStyle = particle.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Update score (slower increment for better balance)
      setScore(prev => {
        const newScore = prev + 0.5;
        onScoreUpdate(Math.floor(newScore));
        return newScore;
      });

      // Continue game loop
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, player, obstacles, collectibles, particles, clouds, score, lastObstacleSpawn, lastCollectibleSpawn, gameSpeed, onGameEnd, onScoreUpdate]);

  const currentDiscount = discountTiers.find(tier => Math.floor(score) >= tier.minScore)?.discount || 0;
  const nextTier = discountTiers.find(tier => Math.floor(score) < tier.minScore);

  return (
    <div className="game-container" style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="game-canvas"
        style={{
          border: '3px solid #4ECDC4',
          borderRadius: '12px',
          cursor: 'pointer',
          display: 'block',
          boxShadow: '0 8px 32px rgba(78, 205, 196, 0.3)',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      />

      {/* Score Display */}
      <div style={{
        position: 'absolute',
        top: '15px',
        right: '15px',
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.6))',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '25px',
        fontWeight: 'bold',
        fontSize: '18px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
        border: '2px solid rgba(255, 255, 255, 0.2)'
      }}>
        🏆 {Math.floor(score)}
      </div>

      {/* Discount Display */}
      <div style={{
        position: 'absolute',
        top: '15px',
        left: '15px',
        background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '25px',
        fontWeight: 'bold',
        fontSize: '16px',
        boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        animation: currentDiscount > 0 ? 'pulse 2s infinite' : 'none'
      }}>
        💰 {currentDiscount}% OFF
      </div>

      {/* Speed Indicator */}
      <div style={{
        position: 'absolute',
        top: '70px',
        right: '15px',
        background: 'linear-gradient(135deg, #4ECDC4, #45B7D1)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '20px',
        fontWeight: 'bold',
        fontSize: '14px',
        boxShadow: '0 4px 15px rgba(78, 205, 196, 0.4)'
      }}>
        ⚡ Speed: {gameSpeed}x
      </div>

      {/* Progress to Next Tier */}
      {nextTier && (
        <div style={{
          position: 'absolute',
          bottom: '15px',
          left: '15px',
          right: '15px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '10px 15px',
          borderRadius: '20px',
          fontSize: '12px'
        }}>
          <div style={{ marginBottom: '5px' }}>
            Next: {nextTier.discount}% OFF at {nextTier.minScore} points
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min((Math.floor(score) / nextTier.minScore) * 100, 100)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #4ECDC4, #45B7D1)',
              borderRadius: '3px',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}

      <div style={{
        marginTop: '25px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        padding: '15px',
        borderRadius: '12px',
        color: 'white',
        boxShadow: '0 4px 15px rgba(240, 147, 251, 0.3)'
      }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
          🎮 Click anywhere or press SPACE to jump!
        </p>
        <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
          Collect golden items • Avoid obstacles • Earn bigger discounts!
        </p>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
