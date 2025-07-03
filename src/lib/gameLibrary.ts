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

// Curated list of simple, proven games suitable for discount campaigns
export const CURATED_GAMES: ExternalGame[] = [
  {
    id: 'breakout-classic',
    name: 'Breakout Classic',
    description: 'Classic brick-breaking game with paddle and ball',
    category: 'arcade',
    difficulty: 'easy',
    controls: 'Mouse or Arrow Keys',
    sourceUrl: 'https://github.com/end3r/Gamedev-Canvas-workshop',
    gameType: 'canvas',
    author: 'Mozilla Developer Network',
    license: 'CC0',
    tags: ['classic', 'arcade', 'simple', 'retro'],
    minScore: 0,
    maxScore: 10000,
    estimatedPlayTime: 3,
    mobileCompatible: true,
    touchControls: true,
    keyboardControls: true,
    mouseControls: true
  },
  {
    id: 'asteroids-mini',
    name: 'Mini Asteroids',
    description: 'Simplified asteroids game with spaceship',
    category: 'action',
    difficulty: 'medium',
    controls: 'Arrow Keys + Spacebar',
    sourceUrl: 'https://github.com/cykod/AlienInvasion',
    gameType: 'canvas',
    author: 'Pascal Rettig',
    license: 'MIT',
    tags: ['space', 'shooter', 'classic'],
    minScore: 0,
    maxScore: 50000,
    estimatedPlayTime: 5,
    mobileCompatible: true,
    touchControls: true,
    keyboardControls: true,
    mouseControls: false
  },
  {
    id: 'memory-cards',
    name: 'Memory Cards',
    description: 'Match pairs of cards to clear the board',
    category: 'puzzle',
    difficulty: 'easy',
    controls: 'Mouse Click',
    sourceUrl: 'https://github.com/bradtraversy/vanillawebprojects',
    gameType: 'html5',
    author: 'Brad Traversy',
    license: 'MIT',
    tags: ['memory', 'cards', 'puzzle', 'brain'],
    minScore: 0,
    maxScore: 1000,
    estimatedPlayTime: 2,
    mobileCompatible: true,
    touchControls: true,
    keyboardControls: false,
    mouseControls: true
  },
  {
    id: 'frogger-simple',
    name: 'Simple Frogger',
    description: 'Cross the road avoiding cars and obstacles',
    category: 'arcade',
    difficulty: 'medium',
    controls: 'Arrow Keys or Swipe',
    sourceUrl: 'https://github.com/udacity/frontend-nanodegree-arcade-game',
    gameType: 'canvas',
    author: 'Udacity',
    license: 'MIT',
    tags: ['classic', 'arcade', 'crossing', 'retro'],
    minScore: 0,
    maxScore: 20000,
    estimatedPlayTime: 4,
    mobileCompatible: true,
    touchControls: true,
    keyboardControls: true,
    mouseControls: false
  },
  {
    id: 'bubble-shooter',
    name: 'Bubble Shooter',
    description: 'Shoot colored bubbles to match and clear them',
    category: 'puzzle',
    difficulty: 'easy',
    controls: 'Mouse Aim and Click',
    sourceUrl: 'https://github.com/end3r/Gamedev-Canvas-workshop',
    gameType: 'canvas',
    author: 'Community',
    license: 'MIT',
    tags: ['bubbles', 'shooter', 'match', 'casual'],
    minScore: 0,
    maxScore: 100000,
    estimatedPlayTime: 5,
    mobileCompatible: true,
    touchControls: true,
    keyboardControls: false,
    mouseControls: true
  },
  {
    id: 'pong-classic',
    name: 'Pong Classic',
    description: 'Classic two-paddle ball game',
    category: 'arcade',
    difficulty: 'easy',
    controls: 'Arrow Keys or Mouse',
    sourceUrl: 'https://github.com/topics/pong-game',
    gameType: 'canvas',
    author: 'Various',
    license: 'MIT',
    tags: ['classic', 'pong', 'retro', 'simple'],
    minScore: 0,
    maxScore: 21,
    estimatedPlayTime: 3,
    mobileCompatible: true,
    touchControls: true,
    keyboardControls: true,
    mouseControls: true
  },
  {
    id: 'word-scramble',
    name: 'Word Scramble',
    description: 'Unscramble letters to form words',
    category: 'puzzle',
    difficulty: 'medium',
    controls: 'Keyboard or Touch',
    sourceUrl: 'https://github.com/bradtraversy/vanillawebprojects',
    gameType: 'html5',
    author: 'Community',
    license: 'MIT',
    tags: ['words', 'puzzle', 'brain', 'educational'],
    minScore: 0,
    maxScore: 5000,
    estimatedPlayTime: 4,
    mobileCompatible: true,
    touchControls: true,
    keyboardControls: true,
    mouseControls: true
  },
  {
    id: 'connect-four',
    name: 'Connect Four',
    description: 'Connect four pieces in a row to win',
    category: 'puzzle',
    difficulty: 'medium',
    controls: 'Mouse Click',
    sourceUrl: 'https://github.com/topics/connect-four',
    gameType: 'html5',
    author: 'Various',
    license: 'MIT',
    tags: ['strategy', 'connect', 'classic', 'board'],
    minScore: 0,
    maxScore: 100,
    estimatedPlayTime: 5,
    mobileCompatible: true,
    touchControls: true,
    keyboardControls: false,
    mouseControls: true
  }
];

export class GameLibraryManager {
  private config: GameLibraryConfig;
  private games: ExternalGame[] = [];

  constructor(config?: Partial<GameLibraryConfig>) {
    this.config = {
      enabled: true,
      allowedCategories: ['arcade', 'puzzle', 'casual'],
      maxGamesPerCategory: 5,
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
