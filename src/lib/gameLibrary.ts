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

// Premium collection of engaging games inspired by popular mobile and arcade games
export const CURATED_GAMES: ExternalGame[] = [
  {
    id: 'jumpy-bird',
    name: 'Jumpy Bird',
    description: 'Navigate through colorful pipes in this addictive flying adventure',
    category: 'arcade',
    difficulty: 'medium',
    controls: 'Click or Spacebar',
    sourceUrl: '/games/jumpy-bird',
    gameType: 'html5',
    author: 'Premium Games',
    license: 'MIT',
    tags: ['flying', 'arcade', 'endless', 'addictive'],
    minScore: 0,
    maxScore: 10000,
    estimatedPlayTime: 4,
    mobileCompatible: true,
    touchControls: true,
    keyboardControls: true,
    mouseControls: true
  },
  {
    id: 'bubble-pop',
    name: 'Bubble Pop Frenzy',
    description: 'Pop colorful bubbles underwater and build amazing combos',
    category: 'casual',
    difficulty: 'easy',
    controls: 'Mouse Click or Touch',
    sourceUrl: '/games/bubble-pop',
    gameType: 'html5',
    author: 'Premium Games',
    license: 'MIT',
    tags: ['bubbles', 'underwater', 'combo', 'satisfying'],
    minScore: 0,
    maxScore: 50000,
    estimatedPlayTime: 3,
    mobileCompatible: true,
    touchControls: true,
    keyboardControls: false,
    mouseControls: true
  },
  {
    id: 'neon-runner',
    name: 'Neon Runner',
    description: 'Sprint through a cyberpunk world avoiding neon obstacles',
    category: 'action',
    difficulty: 'medium',
    controls: 'Click or Spacebar to Jump',
    sourceUrl: '/games/neon-runner',
    gameType: 'html5',
    author: 'Premium Games',
    license: 'MIT',
    tags: ['cyberpunk', 'neon', 'endless', 'futuristic'],
    minScore: 0,
    maxScore: 100000,
    estimatedPlayTime: 5,
    mobileCompatible: true,
    touchControls: true,
    keyboardControls: true,
    mouseControls: true
  },
  {
    id: 'gem-crusher',
    name: 'Gem Crusher Saga',
    description: 'Match sparkling gems and create explosive combos',
    category: 'puzzle',
    difficulty: 'medium',
    controls: 'Mouse Click to Select and Swap',
    sourceUrl: '/games/gem-crusher',
    gameType: 'html5',
    author: 'Premium Games',
    license: 'MIT',
    tags: ['match3', 'gems', 'puzzle', 'combo'],
    minScore: 0,
    maxScore: 100000,
    estimatedPlayTime: 4,
    mobileCompatible: true,
    touchControls: true,
    keyboardControls: false,
    mouseControls: true
  },
  {
    id: 'memory-cards',
    name: 'Memory Palace',
    description: 'Test your memory with beautiful animated cards',
    category: 'puzzle',
    difficulty: 'easy',
    controls: 'Mouse Click or Touch',
    sourceUrl: '/games/memory-cards',
    gameType: 'html5',
    author: 'Premium Games',
    license: 'MIT',
    tags: ['memory', 'cards', 'brain', 'classic'],
    minScore: 0,
    maxScore: 5000,
    estimatedPlayTime: 3,
    mobileCompatible: true,
    touchControls: true,
    keyboardControls: false,
    mouseControls: true
  },
  {
    id: 'breakout-classic',
    name: 'Neon Breakout',
    description: 'Classic brick-breaking with stunning neon effects',
    category: 'retro',
    difficulty: 'medium',
    controls: 'Mouse or Arrow Keys',
    sourceUrl: '/games/breakout-classic',
    gameType: 'html5',
    author: 'Premium Games',
    license: 'MIT',
    tags: ['breakout', 'neon', 'retro', 'classic'],
    minScore: 0,
    maxScore: 50000,
    estimatedPlayTime: 4,
    mobileCompatible: true,
    touchControls: false,
    keyboardControls: true,
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
