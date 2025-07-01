# Mobile Touch Controls Documentation

## Přehled

Všechny hry v Bargain Hunter aplikaci nyní podporují optimalizované touch ovládání pro mobilní zařízení. Každá hra má specifické ovládání přizpůsobené jejímu typu.

## Ovládání podle her

### 1. Chrome Dino / Enhanced Game Engine
- **Tap kdekoli na obrazovce**: Skok
- **Optimalizace**: Redukovaná gravitace pro lepší ovladatelnost na mobilu

### 2. Flappy Bird
- **Tap kdekoli na obrazovce**: Mávnutí křídly (let nahoru)
- **Optimalizace**: Upravená fyzika pro mobilní zařízení

### 3. Tetris
- **Swipe vlevo/vpravo**: Pohyb kostky doleva/doprava
- **Swipe nahoru**: Rotace kostky
- **Swipe dolů**: Rychlejší pád kostky
- **Tap**: Rotace kostky
- **Minimální vzdálenost swipe**: 30px pro rozlišení mezi tap a swipe

### 4. Snake
- **Swipe nahoru**: Pohyb nahoru
- **Swipe dolů**: Pohyb dolů
- **Swipe vlevo**: Pohyb vlevo
- **Swipe vpravo**: Pohyb vpravo
- **Minimální vzdálenost swipe**: 20px

### 5. Space Invaders
- **Touch a drag**: Pohyb lodě podle pozice prstu
- **Auto-firing**: Automatické střílení (není potřeba tapovat)
- **Optimalizace**: Plynulý pohyb podle pozice dotyku

## Technické implementace

### TouchControlsHint komponenta
```typescript
<TouchControlsHint 
  gameType="dino" | "flappy_bird" | "tetris" | "snake" | "space_invaders"
  isVisible={true}
  autoHide={true}
  autoHideDelay={3000}
/>
```

### CSS optimalizace
```css
/* Zabraňuje scrollování a zoomování */
canvas {
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
```

### Event handling
```typescript
const handleTouchStart = (e: TouchEvent) => {
  e.preventDefault(); // Zabraňuje scrollování
  // Touch logic
};

canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
```

## Hooks pro mobilní optimalizaci

### useMobileDetection
```typescript
const { isMobile, isTablet, isTouchDevice, orientation } = useMobileDetection();
```

### useTouchControls
```typescript
const { touchHandlers, addTouchListeners } = useTouchControls({
  onTap: () => jump(),
  onSwipeUp: () => rotate(),
  onSwipeLeft: () => moveLeft(),
  onSwipeRight: () => moveRight(),
  enableSwipeGestures: true,
  enableTapGestures: true
});
```

## Mobilní optimalizace

### Velikost canvas
- **Mobil**: Max 500x600px
- **Tablet**: Max 80% obrazovky
- **Desktop**: 600x600px

### Touch sensitivity
- **Mobil**: 20px minimální swipe distance
- **Desktop**: 30px minimální swipe distance

### Prevence problémů
1. **Scrollování**: `touch-action: none`
2. **Zoom**: `touch-action: manipulation`
3. **Highlight**: `-webkit-tap-highlight-color: transparent`
4. **Selection**: `user-select: none`

## Testování na mobilních zařízeních

### Chrome DevTools
1. Otevřít DevTools (F12)
2. Kliknout na ikonu mobilu (Toggle device toolbar)
3. Vybrat mobilní zařízení
4. Testovat touch gestures

### Skutečné zařízení
1. Otevřít aplikaci na mobilu
2. Testovat všechny touch gestures
3. Ověřit, že nedochází k scrollování
4. Zkontrolovat responsivitu

## Řešení problémů

### Hra se scrolluje při hraní
```css
body.mobile-game-active {
  position: fixed;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
```

### Touch eventy nefungují
```typescript
// Ujistit se, že je passive: false
element.addEventListener('touchstart', handler, { passive: false });
```

### Špatná detekce swipe směru
```typescript
// Zvýšit minimální vzdálenost swipe
const minSwipeDistance = 30;
if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
  // Process swipe
}
```

## Budoucí vylepšení

1. **Haptic feedback** pro podporovaná zařízení
2. **Gesture customization** v nastavení
3. **Touch sensitivity** nastavení
4. **Multi-touch** podpora pro pokročilé hry
5. **Voice controls** jako alternativa

## Kompatibilita

- **iOS Safari**: ✅ Plně podporováno
- **Android Chrome**: ✅ Plně podporováno  
- **Android Firefox**: ✅ Plně podporováno
- **Samsung Internet**: ✅ Plně podporováno
- **Edge Mobile**: ✅ Plně podporováno
