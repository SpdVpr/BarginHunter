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
    id: 'memory-cards',
    name: 'Memory Cards',
    description: 'Match pairs of cards to clear the board',
    category: 'puzzle',
    difficulty: 'easy',
    controls: 'Mouse Click or Touch',
    sourceUrl: '/games/memory-cards',
    gameType: 'html5',
    author: 'Bargain Hunter',
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
    id: 'color-match',
    name: 'Color Match',
    description: 'Click the matching color as fast as you can',
    category: 'casual',
    difficulty: 'easy',
    controls: 'Mouse Click or Touch',
    sourceUrl: '/games/color-match',
    gameType: 'html5',
    author: 'Bargain Hunter',
    license: 'MIT',
    tags: ['color', 'speed', 'reaction', 'casual'],
    minScore: 0,
    maxScore: 2000,
    estimatedPlayTime: 2,
    mobileCompatible: true,
    touchControls: true,
    keyboardControls: false,
    mouseControls: true
  },
  {
    id: 'number-sequence',
    name: 'Number Sequence',
    description: 'Click numbers in ascending order as fast as possible',
    category: 'puzzle',
    difficulty: 'easy',
    controls: 'Mouse Click or Touch',
    sourceUrl: '/games/number-sequence',
    gameType: 'html5',
    author: 'Bargain Hunter',
    license: 'MIT',
    tags: ['numbers', 'sequence', 'speed', 'brain'],
    minScore: 0,
    maxScore: 3000,
    estimatedPlayTime: 2,
    mobileCompatible: true,
    touchControls: true,
    keyboardControls: false,
    mouseControls: true
  },
  {
    id: 'reaction-time',
    name: 'Reaction Time',
    description: 'Test your reflexes - click when the color changes',
    category: 'casual',
    difficulty: 'easy',
    controls: 'Mouse Click or Touch',
    sourceUrl: '/games/reaction-time',
    gameType: 'html5',
    author: 'Bargain Hunter',
    license: 'MIT',
    tags: ['reaction', 'speed', 'reflexes', 'timing'],
    minScore: 0,
    maxScore: 1000,
    estimatedPlayTime: 1,
    mobileCompatible: true,
    touchControls: true,
    keyboardControls: false,
    mouseControls: true
  },
  {
    id: 'word-typing',
    name: 'Speed Typing',
    description: 'Type the words as fast and accurately as possible',
    category: 'puzzle',
    difficulty: 'medium',
    controls: 'Keyboard',
    sourceUrl: '/games/word-typing',
    gameType: 'html5',
    author: 'Bargain Hunter',
    license: 'MIT',
    tags: ['typing', 'words', 'speed', 'accuracy'],
    minScore: 0,
    maxScore: 5000,
    estimatedPlayTime: 3,
    mobileCompatible: false,
    touchControls: false,
    keyboardControls: true,
    mouseControls: false
  },
  {
    id: 'pattern-memory',
    name: 'Pattern Memory',
    description: 'Remember and repeat the pattern sequence',
    category: 'puzzle',
    difficulty: 'medium',
    controls: 'Mouse Click or Touch',
    sourceUrl: '/games/pattern-memory',
    gameType: 'html5',
    author: 'Bargain Hunter',
    license: 'MIT',
    tags: ['pattern', 'memory', 'sequence', 'brain'],
    minScore: 0,
    maxScore: 2000,
    estimatedPlayTime: 3,
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
