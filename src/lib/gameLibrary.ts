// Original Games Only - No External Game Library
// This file now only contains the original built-in games

// Original built-in games available in the application
export const ORIGINAL_GAMES = [
  {
    id: 'dino',
    name: 'Chrome Dino Runner',
    description: 'Classic endless runner inspired by Chrome\'s offline game',
    gameType: 'dino',
    category: 'arcade',
    difficulty: 'medium',
    controls: 'Spacebar/Click to Jump',
    mobileCompatible: true,
    touchControls: true,
    keyboardControls: true,
    mouseControls: true
  },
  {
    id: 'flappy_bird',
    name: 'Flappy Bird',
    description: 'Navigate through pipes by tapping to flap',
    gameType: 'flappy_bird',
    category: 'arcade',
    difficulty: 'hard',
    controls: 'Spacebar/Click to Flap',
    mobileCompatible: true,
    touchControls: true,
    keyboardControls: true,
    mouseControls: true
  },
  {
    id: 'tetris',
    name: 'Tetris',
    description: 'Classic block-stacking puzzle game',
    gameType: 'tetris',
    category: 'puzzle',
    difficulty: 'medium',
    controls: 'Arrow Keys/Touch',
    mobileCompatible: true,
    touchControls: true,
    keyboardControls: true,
    mouseControls: false
  },
  {
    id: 'snake',
    name: 'Snake',
    description: 'Grow your snake by eating food, avoid walls and yourself',
    gameType: 'snake',
    category: 'arcade',
    difficulty: 'easy',
    controls: 'Arrow Keys/Swipe',
    mobileCompatible: true,
    touchControls: true,
    keyboardControls: true,
    mouseControls: false
  },
  {
    id: 'space_invaders',
    name: 'Space Invaders',
    description: 'Defend Earth from alien invasion',
    gameType: 'space_invaders',
    category: 'arcade',
    difficulty: 'medium',
    controls: 'Arrow Keys + Spacebar/Touch',
    mobileCompatible: true,
    touchControls: true,
    keyboardControls: true,
    mouseControls: true
  },
  {
    id: 'arkanoid',
    name: 'Arkanoid',
    description: 'Break all bricks with your paddle and ball',
    gameType: 'arkanoid',
    category: 'arcade',
    difficulty: 'medium',
    controls: 'Mouse/Touch to Move Paddle',
    mobileCompatible: true,
    touchControls: true,
    keyboardControls: false,
    mouseControls: true
  },
  {
    id: 'fruit_ninja',
    name: 'Fruit Ninja',
    description: 'Slice fruits with your finger, avoid bombs',
    gameType: 'fruit_ninja',
    category: 'action',
    difficulty: 'easy',
    controls: 'Mouse/Touch to Slice',
    mobileCompatible: true,
    touchControls: true,
    keyboardControls: false,
    mouseControls: true
  }
];


// Get original games list
export function getOriginalGames() {
  return ORIGINAL_GAMES;
}

// Get game by type
export function getGameByType(gameType: string) {
  return ORIGINAL_GAMES.find(game => game.gameType === gameType);
}

// Get games by category
export function getGamesByCategory(category: string) {
  return ORIGINAL_GAMES.filter(game => game.category === category);
}
