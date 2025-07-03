// Game Library Manager - Integration with external game databases
export interface ExternalGame {
  id: string;
  name: string;
  description: string;
  category: 'arcade' | 'puzzle' | 'action' | 'casual' | 'retro';
  difficulty: 'easy' | 'medium' | 'hard';
  controls: string;
  thumbnail?: string;
  sourceUrl: string;
  gameType: 'html5' | 'canvas' | 'iframe' | 'js';
  author: string;
  license: 'MIT' | 'CC0' | 'GPL' | 'Apache' | 'BSD' | 'Custom';
  tags: string[];
  minScore?: number;
  maxScore?: number;
  estimatedPlayTime: number; // in minutes
  mobileCompatible: boolean;
  touchControls: boolean;
  keyboardControls: boolean;
  mouseControls: boolean;
}

export interface GameLibraryConfig {
  enabled: boolean;
  allowedCategories: string[];
  maxGamesPerCategory: number;
  autoUpdate: boolean;
  lastUpdated: Date;
}

// Free game databases and sources
export const GAME_SOURCES = {
  // Open Game Art - Free games collection
  openGameArt: {
    name: 'OpenGameArt.org',
    url: 'https://opengameart.org',
    apiUrl: 'https://opengameart.org/content',
    type: 'scraping',
    license: 'Various (CC0, CC-BY, GPL)',
    description: 'Community-driven collection of free game assets and complete games'
  },
  
  // GitHub repositories with free games
  github: {
    name: 'GitHub Free Games',
    url: 'https://github.com',
    searchQuery: 'html5+games+javascript+free+license:mit',
    type: 'api',
    license: 'MIT, Apache, BSD',
    description: 'Open source HTML5 games from GitHub'
  },
  
  // Itch.io free games
  itchIo: {
    name: 'Itch.io Free Games',
    url: 'https://itch.io',
    apiUrl: 'https://itch.io/api/1/search/games',
    type: 'api',
    license: 'Various',
    description: 'Free indie games from itch.io platform'
  },
  
  // HTML5 Games collection
  html5Games: {
    name: 'HTML5 Games Collection',
    url: 'https://html5games.com',
    type: 'curated',
    license: 'Various',
    description: 'Curated collection of HTML5 games'
  },
  
  // Phaser.io examples
  phaserExamples: {
    name: 'Phaser.js Examples',
    url: 'https://phaser.io/examples',
    type: 'examples',
    license: 'MIT',
    description: 'Game examples from Phaser.js framework'
  }
};

// Mobile-optimized games designed for maximum engagement and high scores
export const CURATED_GAMES: ExternalGame[] = [
  {
    id: 'tap-dash',
    name: 'Tap Dash',
    description: 'Lightning-fast target tapping with combos and multipliers',
    category: 'action',
    difficulty: 'hard',
    controls: 'Tap Targets',
    sourceUrl: '/games/tap-dash',
    gameType: 'html5',
    author: 'Mobile Games Pro',
    license: 'MIT',
    tags: ['tap', 'speed', 'reaction', 'combo'],
    minScore: 0,
    maxScore: 200000,
    estimatedPlayTime: 4,
    mobileCompatible: true,
    touchControls: true,
    keyboardControls: false,
    mouseControls: true
  },
  {
    id: 'swipe-rush',
    name: 'Swipe Rush',
    description: 'Swipe to dodge obstacles in this high-speed endless runner',
    category: 'action',
    difficulty: 'medium',
    controls: 'Swipe or Arrow Keys',
    sourceUrl: '/games/swipe-rush',
    gameType: 'html5',
    author: 'Mobile Games Pro',
    license: 'MIT',
    tags: ['swipe', 'runner', 'endless', 'speed'],
    minScore: 0,
    maxScore: 150000,
    estimatedPlayTime: 6,
    mobileCompatible: true,
    touchControls: true,
    keyboardControls: true,
    mouseControls: true
  },
  {
    id: 'color-switch',
    name: 'Color Switch',
    description: 'Navigate through colorful obstacles by matching your ball color',
    category: 'arcade',
    difficulty: 'medium',
    controls: 'Tap to Jump',
    sourceUrl: '/games/color-switch',
    gameType: 'html5',
    author: 'Mobile Games Pro',
    license: 'MIT',
    tags: ['color', 'switch', 'obstacles', 'timing'],
    minScore: 0,
    maxScore: 500,
    estimatedPlayTime: 5,
    mobileCompatible: true,
    touchControls: true,
    keyboardControls: true,
    mouseControls: true
  },
  {
    id: 'helix-jump',
    name: 'Helix Jump',
    description: 'Guide the ball down the helix tower through gaps and avoid obstacles',
    category: 'arcade',
    difficulty: 'easy',
    controls: 'Move Mouse or Arrow Keys',
    sourceUrl: '/games/helix-jump',
    gameType: 'html5',
    author: 'Mobile Games Pro',
    license: 'MIT',
    tags: ['helix', 'tower', 'ball', 'rotation'],
    minScore: 0,
    maxScore: 1000,
    estimatedPlayTime: 4,
    mobileCompatible: true,
    touchControls: true,
    keyboardControls: true,
    mouseControls: true
  },
  {
    id: 'knife-hit',
    name: 'Knife Hit',
    description: 'Throw knives at the rotating target without hitting other knives',
    category: 'casual',
    difficulty: 'medium',
    controls: 'Tap to Throw',
    sourceUrl: '/games/knife-hit',
    gameType: 'html5',
    author: 'Mobile Games Pro',
    license: 'MIT',
    tags: ['knife', 'target', 'precision', 'timing'],
    minScore: 0,
    maxScore: 2000,
    estimatedPlayTime: 5,
    mobileCompatible: true,
    touchControls: true,
    keyboardControls: true,
    mouseControls: true
  },

];

export class GameLibraryManager {
  private config: GameLibraryConfig;
  private games: ExternalGame[] = [];

  constructor(config?: Partial<GameLibraryConfig>) {
    this.config = {
      enabled: true,
      allowedCategories: ['arcade', 'puzzle', 'casual', 'action', 'retro'],
      maxGamesPerCategory: 10,
      autoUpdate: false,
      lastUpdated: new Date(),
      ...config
    };
    
    // Load curated games by default
    this.games = CURATED_GAMES.filter(game => 
      this.config.allowedCategories.includes(game.category)
    );
  }

  // Get all available games
  getAvailableGames(): ExternalGame[] {
    return this.games.filter(game => 
      this.config.allowedCategories.includes(game.category)
    );
  }

  // Get games by category
  getGamesByCategory(category: string): ExternalGame[] {
    return this.games
      .filter(game => game.category === category)
      .slice(0, this.config.maxGamesPerCategory);
  }

  // Get game by ID
  getGameById(id: string): ExternalGame | undefined {
    return this.games.find(game => game.id === id);
  }

  // Search games
  searchGames(query: string): ExternalGame[] {
    const lowercaseQuery = query.toLowerCase();
    return this.games.filter(game =>
      game.name.toLowerCase().includes(lowercaseQuery) ||
      game.description.toLowerCase().includes(lowercaseQuery) ||
      game.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  // Get games suitable for mobile
  getMobileGames(): ExternalGame[] {
    return this.games.filter(game => game.mobileCompatible && game.touchControls);
  }

  // Get easy games for beginners
  getEasyGames(): ExternalGame[] {
    return this.games.filter(game => game.difficulty === 'easy');
  }

  // Get quick games (under 5 minutes)
  getQuickGames(): ExternalGame[] {
    return this.games.filter(game => game.estimatedPlayTime <= 5);
  }

  // Update configuration
  updateConfig(newConfig: Partial<GameLibraryConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get configuration
  getConfig(): GameLibraryConfig {
    return { ...this.config };
  }
}

// Default instance
export const gameLibrary = new GameLibraryManager();
