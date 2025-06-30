# 🎮 Návod pro přidávání nových her do Bargain Hunter

Tento návod popisuje kompletní proces přidání nové hry do Bargain Hunter aplikace.

## 📋 Přehled kroků

1. **Vytvoření herního enginu**
2. **Aktualizace konfigurací a typů**
3. **Integrace do hlavní Game komponenty**
4. **Aktualizace intro screen**
5. **Testování a nasazení**

## 🎯 Krok 1: Vytvoření herního enginu

### 1.1 Vytvořte nový soubor enginu
```
src/components/Game/YourGameEngine.tsx
```

### 1.2 Základní struktura enginu

```typescript
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

interface YourGameEngineProps {
  onGameEnd: (score: number, gameData: any) => void;
  onScoreUpdate: (score: number) => void;
  gameConfig: GameConfig;
  onShowIntro: () => void;
}

// Game constants
const getCanvasSize = () => {
  const isMobile = window.innerWidth <= 768;
  
  if (isMobile) {
    return {
      width: Math.min(window.innerWidth - 20, 400),
      height: 300,
    };
  } else {
    return {
      width: Math.min(window.innerWidth - 40, 800),
      height: 400,
    };
  }
};

export default function YourGameEngine({ 
  onGameEnd, 
  onScoreUpdate, 
  gameConfig,
  onShowIntro 
}: YourGameEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gameStartTime = useRef<number>(0);
  
  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [canvasSize, setCanvasSize] = useState(getCanvasSize());
  const [gameScorer] = useState(() => new GameScorer());
  const [difficultyLevel, setDifficultyLevel] = useState(0);

  // Game state variables here...

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newSize = getCanvasSize();
      setCanvasSize(newSize);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
        case 'ArrowUp':
          e.preventDefault();
          // Handle input
          break;
        case 'Escape':
          e.preventDefault();
          if (isRunning) {
            setIsRunning(false);
            onShowIntro();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRunning, onShowIntro]);

  // Mouse/Touch controls
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isRunning) return;
    // Handle click
  }, [isRunning]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isRunning) return;
    // Handle touch
  }, [isRunning]);

  // Game logic functions
  const updateGame = useCallback(() => {
    // Update game state
    
    // Add points when appropriate
    gameScorer.addObstaclePoints(); // For clearing obstacles/collecting items
    
    // Update score
    const newScore = gameScorer.getScore();
    setScore(newScore);
    onScoreUpdate(newScore);
    
    // Check game over conditions
    if (/* game over condition */) {
      setIsRunning(false);
      onGameEnd(gameScorer.getScore(), {
        ...gameScorer.getGameStats(),
        gameType: 'your_game_name'
      });
    }
  }, [gameScorer, onScoreUpdate, onGameEnd]);

  // Draw function
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    
    // Draw game elements
    
    // Draw UI
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${formatScore(score)}`, 10, 25);
    
    if (difficultyLevel > 0) {
      ctx.fillText(`Level: ${difficultyLevel + 1}`, 10, 45);
    }
  }, [canvasSize, score, difficultyLevel]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (!isRunning) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    updateGame();
    draw(ctx);
    
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [isRunning, updateGame, draw]);

  // Start game
  const startGame = useCallback(() => {
    gameScorer.reset();
    setIsRunning(true);
    setScore(0);
    setDifficultyLevel(0);
    
    // Initialize game state
    
    gameStartTime.current = Date.now();
  }, [gameScorer]);

  // Auto-start game when component mounts
  useEffect(() => {
    startGame();
  }, [startGame]);

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

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: '20px',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      <div style={{ marginBottom: '10px', textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>🎮 Your Game Name</h2>
        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
          Game description and instructions
        </p>
      </div>
      
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onClick={handleCanvasClick}
        onTouchStart={handleTouchStart}
        style={{
          border: '2px solid #333',
          borderRadius: '8px',
          backgroundColor: '#fff',
          cursor: 'pointer',
          touchAction: 'none'
        }}
      />
      
      <div style={{ 
        marginTop: '15px', 
        textAlign: 'center',
        maxWidth: canvasSize.width,
        fontSize: '12px',
        color: '#666'
      }}>
        <p style={{ margin: '5px 0' }}>
          <strong>Controls:</strong> Space to jump, click to interact
        </p>
        <p style={{ margin: '5px 0' }}>
          Press ESC to pause
        </p>
      </div>
    </div>
  );
}
```

### 1.3 Důležité poznámky k enginu

- **Používejte GameScorer**: `gameScorer.addObstaclePoints()` pro body
- **Responzivní design**: `getCanvasSize()` pro různé velikosti
- **Ovládání**: Klávesnice + myš + dotyk
- **Game over**: Volejte `onGameEnd()` s game stats
- **Escape**: Vždy implementujte ESC pro návrat do intro

## ⚙️ Krok 2: Aktualizace konfigurací a typů

### 2.1 Dashboard Settings (`pages/dashboard/settings.tsx`)

```typescript
// Přidejte nový typ do interface
interface GameSettings {
  gameType: 'dino' | 'flappy_bird' | 'tetris' | 'snake' | 'your_game_name';
  // ... ostatní properties
}

// Přidejte do Select options
<Select
  label="Game Type"
  options={[
    { label: '🦕 Dino Runner (Chrome Dino style)', value: 'dino' },
    { label: '🐦 Flappy Bird (Tap to fly)', value: 'flappy_bird' },
    { label: '🧩 Tetris (Click to rotate)', value: 'tetris' },
    { label: '🐍 Snake (Arrow keys or click)', value: 'snake' },
    { label: '🎮 Your Game Name (Description)', value: 'your_game_name' },
  ]}
  value={gameSettings.gameType}
  onChange={(value) =>
    setGameSettings({
      ...gameSettings,
      gameType: value as 'dino' | 'flappy_bird' | 'tetris' | 'snake' | 'your_game_name'
    })
  }
/>
```

### 2.2 API Settings Validation (`pages/api/dashboard/settings.ts`)

```typescript
// Přidejte do validace
!['dino', 'flappy_bird', 'tetris', 'snake', 'your_game_name'].includes(gameSettings.gameType)
```

### 2.3 Game Config API (`pages/api/game/config/[shop].ts`)

```typescript
// Aktualizujte typ
gameType: 'dino' as 'dino' | 'flappy_bird' | 'tetris' | 'snake' | 'your_game_name',
```

### 2.4 GameIntroScreen (`src/components/Game/GameIntroScreen.tsx`)

```typescript
// Přidejte do interface
gameType?: 'dino' | 'flappy_bird' | 'tetris' | 'snake' | 'your_game_name';

// Přidejte konstantu
const isYourGame = gameConfig.gameType === 'your_game_name';

// Aktualizujte title
{isFlappyBird ? '🐦 Flappy Hunter' :
 isTetris ? '🧩 Tetris Hunter' :
 isSnake ? '🐍 Snake Hunter' :
 isYourGame ? '🎮 Your Game Hunter' :
 '🦕 Bargain Hunter'}

// Aktualizujte description
{isFlappyBird ? 'Fly through pipes and earn amazing discounts!' :
 isTetris ? 'Stack blocks, clear lines, and earn amazing discounts!' :
 isSnake ? 'Eat food, grow longer, and earn amazing discounts!' :
 isYourGame ? 'Your game description here!' :
 'Jump, dodge, and earn amazing discounts!'}

// Přidejte preview animaci
) : isYourGame ? (
  // Your game preview
  <>
    <div style={{
      width: '40px',
      height: '40px',
      background: '#your-color',
      borderRadius: '8px',
      animation: 'your-animation 1s infinite'
    }} />
  </>
) : (

// Aktualizujte instrukce
<strong>{isYourGame ? '🎮 Your controls' : '🖱️ Click/Space'}</strong><br />
{isYourGame ? 'your action' : 'to jump'}

// Přidejte CSS animaci
@keyframes your-animation {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
```

## 🔗 Krok 3: Integrace do hlavní Game komponenty

### 3.1 Import (`src/components/Game/Game.tsx`)

```typescript
import YourGameEngine from './YourGameEngine';
```

### 3.2 Podmíněné renderování

```typescript
return (
  <div>
    {gameConfig.gameType === 'flappy_bird' ? (
      <FlappyBirdEngine ... />
    ) : gameConfig.gameType === 'tetris' ? (
      <TetrisEngine ... />
    ) : gameConfig.gameType === 'snake' ? (
      <SnakeEngine ... />
    ) : gameConfig.gameType === 'your_game_name' ? (
      <YourGameEngine
        onGameEnd={handleGameEnd}
        onScoreUpdate={setCurrentScore}
        gameConfig={gameConfig}
        onShowIntro={() => setGameState('intro')}
      />
    ) : (
      <EnhancedGameEngine ... />
    )}
  </div>
);
```

## 🧪 Krok 4: Testování

### 4.1 Lokální testování
```bash
npm run dev
```

### 4.2 Test v dashboard
1. Jděte na `http://localhost:3000/dashboard/settings`
2. Změňte Game Type na vaši hru
3. Uložte nastavení

### 4.3 Test widgetu
```
http://localhost:3000/widget/game?shop=test-shop.myshopify.com
```

### 4.4 Kontrola chyb
- Otevřete Developer Console (F12)
- Zkontrolujte, že nejsou žádné JavaScript chyby
- Otestujte všechny ovládací prvky

## 🚀 Krok 5: Nasazení

### 5.1 Git commit
```bash
git add .
git commit -m "🎮 Add [Your Game Name] to Bargain Hunter

- Implement complete [game] engine with [key features]
- Add support for [control methods]
- Progressive difficulty and scoring integration
- Mobile-responsive design
- Dashboard configuration support"
```

### 5.2 Push na GitHub
```bash
git push origin master
```

### 5.3 Vercel automaticky nasadí
- Vercel automaticky detekuje změny
- Nasazení trvá 2-5 minut
- Zkontrolujte na production URL

## 📝 Checklist pro novou hru

- [ ] ✅ Vytvořen herní engine (`YourGameEngine.tsx`)
- [ ] ⚙️ Aktualizovány typy v `settings.tsx`
- [ ] 🔧 Aktualizována API validace
- [ ] 🎮 Přidána do `Game.tsx` komponenty
- [ ] 🎪 Aktualizován `GameIntroScreen.tsx`
- [ ] 🧪 Lokálně otestováno
- [ ] 📱 Mobilní responzivita ověřena
- [ ] 🎯 Všechny ovládací prvky fungují
- [ ] 🚀 Nasazeno na production

## 💡 Tipy a best practices

### Herní mechaniky
- **Progresivní obtížnost**: Používejte `DIFFICULTY_PROGRESSION`
- **Skórování**: Vždy používejte `GameScorer` třídu
- **Game Over**: Poskytněte jasné podmínky ukončení
- **Feedback**: Vizuální a audio feedback pro akce

### Ovládání
- **Multi-platform**: Klávesnice + myš + dotyk
- **Intuitivní**: Jednoduché ovládání pro všechny věkové skupiny
- **Responzivní**: Funguje na desktop i mobil
- **Escape**: Vždy umožněte návrat do menu

### Performance
- **60 FPS**: Používejte `requestAnimationFrame`
- **Optimalizace**: Minimalizujte překreslování
- **Memory**: Správně čistěte event listenery
- **Canvas**: Efektivní kreslení a collision detection

### UX/UI
- **Jasné instrukce**: Srozumitelné ovládání
- **Vizuální feedback**: Animace a efekty
- **Responzivní design**: Funguje na všech zařízeních
- **Accessibility**: Podpora klávesnice a screen readerů

## 🎮 Příklady existujících her

### Snake Game (referenční implementace)
```typescript
// Ukázka z SnakeEngine.tsx
const moveSnake = useCallback(() => {
  setSnake(currentSnake => {
    // Game logic
    const newHead = calculateNewHead(currentSnake[0], direction);

    // Collision detection
    if (!isValidPosition(newHead, currentSnake)) {
      setIsRunning(false);
      onGameEnd(gameScorer.getScore(), {
        ...gameScorer.getGameStats(),
        snakeLength: currentSnake.length,
        gameType: 'snake'
      });
      return currentSnake;
    }

    // Food collision
    if (newHead.x === food.x && newHead.y === food.y) {
      gameScorer.addObstaclePoints();
      const newScore = gameScorer.getScore();
      setScore(newScore);
      onScoreUpdate(newScore);
      generateFood(newSnake);
      return newSnake; // Don't remove tail
    }

    return newSnake.slice(0, -1); // Remove tail
  });
}, [food, isValidPosition, gameScorer, onScoreUpdate, onGameEnd]);
```

### Flappy Bird (referenční implementace)
```typescript
// Ukázka z FlappyBirdEngine.tsx
const handleFlap = useCallback(() => {
  if (!isRunning) return;

  setBird(prev => ({
    ...prev,
    velocityY: FLAP_FORCE
  }));
}, [isRunning]);

// Physics update
setBird(prev => ({
  ...prev,
  y: prev.y + prev.velocityY,
  velocityY: prev.velocityY + GRAVITY
}));
```

## 🔧 Pokročilé techniky

### Custom Hooks pro hry
```typescript
// useGameControls.ts
export const useGameControls = (onAction: () => void, isRunning: boolean) => {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isRunning) return;

      switch (e.key) {
        case ' ':
        case 'ArrowUp':
          e.preventDefault();
          onAction();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onAction, isRunning]);
};
```

### Collision Detection
```typescript
// utils/collision.ts
export const checkRectCollision = (
  rect1: { x: number, y: number, width: number, height: number },
  rect2: { x: number, y: number, width: number, height: number }
): boolean => {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y;
};

export const checkCircleCollision = (
  circle1: { x: number, y: number, radius: number },
  circle2: { x: number, y: number, radius: number }
): boolean => {
  const dx = circle1.x - circle2.x;
  const dy = circle1.y - circle2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < circle1.radius + circle2.radius;
};
```

### Particle Systems
```typescript
// Pro efekty a animace
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

const createExplosion = (x: number, y: number): Particle[] => {
  const particles: Particle[] = [];
  for (let i = 0; i < 10; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      life: 60,
      maxLife: 60,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`
    });
  }
  return particles;
};
```

## 📚 Užitečné zdroje

### Herní mechaniky
- **Physics**: Gravity, velocity, acceleration
- **AI**: Simple enemy behavior patterns
- **Procedural generation**: Random level/obstacle generation
- **Power-ups**: Temporary abilities and effects

### Canvas API
- **Drawing**: Shapes, images, text, gradients
- **Transformations**: Rotate, scale, translate
- **Compositing**: Blend modes, alpha
- **Performance**: Off-screen canvas, dirty rectangles

### Game Development Patterns
- **Game Loop**: Update → Draw → Repeat
- **State Management**: Menu → Playing → GameOver
- **Entity Component System**: For complex games
- **Object Pooling**: For performance optimization

## 🐛 Časté problémy a řešení

### Performance Issues
```typescript
// ❌ Špatně - vytváří nové objekty každý frame
const updateGame = () => {
  setPlayer({ ...player, x: player.x + 1 });
};

// ✅ Správně - používá callback
const updateGame = () => {
  setPlayer(prev => ({ ...prev, x: prev.x + 1 }));
};
```

### Memory Leaks
```typescript
// ✅ Vždy čistěte event listenery
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => { /* ... */ };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);

// ✅ Čistěte animation frames
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
```

### Mobile Touch Issues
```typescript
// ✅ Správné touch handling
const handleTouchStart = useCallback((e: React.TouchEvent) => {
  e.preventDefault(); // Zabraňuje scrollování

  const touch = e.touches[0];
  const rect = canvasRef.current?.getBoundingClientRect();
  if (!rect) return;

  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;

  // Handle touch at (x, y)
}, []);

// CSS pro touch
style={{
  touchAction: 'none' // Důležité pro touch handling
}}
```

---

**🎯 Tento návod pokrývá vše potřebné pro přidání nové hry do Bargain Hunter aplikace. Postupujte krok za krokem a vaše hra bude plně integrována do systému!**
