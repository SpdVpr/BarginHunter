// Universal game scoring system for all games including external games

export interface ScoringConfig {
  basePointsPerSecond: number;
  bonusPointsPerObstacle: number;
  difficultyMultiplier: number;
  maxDifficultyLevel: number;
}

export interface DifficultyLevel {
  level: number;
  speed: number;
  spawnRate: number;
  obstacleSize: number;
  scoreThreshold: number;
}

// Universal scoring configuration
export const UNIVERSAL_SCORING: ScoringConfig = {
  basePointsPerSecond: 10, // 10 points per second of survival
  bonusPointsPerObstacle: 50, // 50 points for each obstacle cleared
  difficultyMultiplier: 1.2, // 20% increase per level
  maxDifficultyLevel: 8
};

// Universal difficulty progression for both games
export const DIFFICULTY_PROGRESSION: DifficultyLevel[] = [
  { level: 1, speed: 3, spawnRate: 2500, obstacleSize: 0.8, scoreThreshold: 0 },
  { level: 2, speed: 4, spawnRate: 2200, obstacleSize: 0.9, scoreThreshold: 200 },
  { level: 3, speed: 5, spawnRate: 2000, obstacleSize: 1.0, scoreThreshold: 500 },
  { level: 4, speed: 6, spawnRate: 1800, obstacleSize: 1.0, scoreThreshold: 900 },
  { level: 5, speed: 7, spawnRate: 1600, obstacleSize: 1.1, scoreThreshold: 1400 },
  { level: 6, speed: 8, spawnRate: 1400, obstacleSize: 1.1, scoreThreshold: 2000 },
  { level: 7, speed: 9, spawnRate: 1200, obstacleSize: 1.2, scoreThreshold: 2700 },
  { level: 8, speed: 10, spawnRate: 1000, obstacleSize: 1.2, scoreThreshold: 3500 }
];

export class GameScorer {
  private startTime: number;
  private currentScore: number;
  private obstaclesClearedCount: number;
  private currentDifficultyLevel: number;
  private lastScoreUpdate: number;

  constructor() {
    this.startTime = Date.now();
    this.currentScore = 0;
    this.obstaclesClearedCount = 0;
    this.currentDifficultyLevel = 0;
    this.lastScoreUpdate = Date.now();
  }

  // Update score based on time survival
  updateTimeScore(): number {
    const now = Date.now();
    const timeDelta = now - this.lastScoreUpdate;
    
    if (timeDelta >= 100) { // Update every 100ms
      const secondsElapsed = timeDelta / 1000;
      const timePoints = secondsElapsed * UNIVERSAL_SCORING.basePointsPerSecond;
      const difficultyBonus = timePoints * (this.currentDifficultyLevel * 0.1);
      
      this.currentScore += Math.floor(timePoints + difficultyBonus);
      this.lastScoreUpdate = now;
    }
    
    return this.currentScore;
  }

  // Add points for clearing an obstacle
  addObstaclePoints(): number {
    this.obstaclesClearedCount++;
    const basePoints = UNIVERSAL_SCORING.bonusPointsPerObstacle;
    const difficultyBonus = basePoints * (this.currentDifficultyLevel * 0.2);
    
    this.currentScore += Math.floor(basePoints + difficultyBonus);
    return this.currentScore;
  }

  // Get current difficulty level based on score
  getCurrentDifficultyLevel(): DifficultyLevel {
    // Find the highest difficulty level we've reached
    for (let i = DIFFICULTY_PROGRESSION.length - 1; i >= 0; i--) {
      if (this.currentScore >= DIFFICULTY_PROGRESSION[i].scoreThreshold) {
        this.currentDifficultyLevel = i;
        return DIFFICULTY_PROGRESSION[i];
      }
    }
    
    this.currentDifficultyLevel = 0;
    return DIFFICULTY_PROGRESSION[0];
  }

  // Check if difficulty should increase
  shouldIncreaseDifficulty(): boolean {
    const nextLevel = this.currentDifficultyLevel + 1;
    if (nextLevel >= DIFFICULTY_PROGRESSION.length) return false;
    
    return this.currentScore >= DIFFICULTY_PROGRESSION[nextLevel].scoreThreshold;
  }

  // Get current score
  getScore(): number {
    return this.currentScore;
  }

  // Get obstacles cleared count
  getObstaclesCleared(): number {
    return this.obstaclesClearedCount;
  }

  // Get game duration in seconds
  getGameDuration(): number {
    return (Date.now() - this.startTime) / 1000;
  }

  // Get stats for game end
  getGameStats() {
    return {
      finalScore: this.currentScore,
      obstaclesCleared: this.obstaclesClearedCount,
      gameTime: this.getGameDuration(),
      maxDifficultyReached: this.currentDifficultyLevel + 1,
      averagePointsPerSecond: this.currentScore / this.getGameDuration()
    };
  }

  // Reset scorer for new game
  reset(): void {
    this.startTime = Date.now();
    this.currentScore = 0;
    this.obstaclesClearedCount = 0;
    this.currentDifficultyLevel = 0;
    this.lastScoreUpdate = Date.now();
  }
}

// Helper function to format score display
export function formatScore(score: number): string {
  return score.toLocaleString();
}

// Helper function to get difficulty name
export function getDifficultyName(level: number): string {
  const names = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert', 'Master', 'Insane', 'Legendary'];
  return names[Math.min(level, names.length - 1)] || 'Unknown';
}

// External Game Scorer Class
export class GameScorer {
  private startTime: number = 0;
  private currentScore: number = 0;
  private gameEvents: Array<{
    type: string;
    timestamp: number;
    value?: number;
  }> = [];

  constructor() {
    this.reset();
  }

  reset(): void {
    this.startTime = Date.now();
    this.currentScore = 0;
    this.gameEvents = [];
  }

  updateScore(score: number): void {
    this.currentScore = score;
    this.addEvent('score_update', score);
  }

  addEvent(type: string, value?: number): void {
    this.gameEvents.push({
      type,
      timestamp: Date.now() - this.startTime,
      value
    });
  }

  getScore(): number {
    return this.currentScore;
  }

  getDuration(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  normalizeScore(maxPossibleScore?: number): number {
    if (!maxPossibleScore) {
      const duration = this.getDuration();
      const scorePerSecond = duration > 0 ? this.currentScore / duration : 0;
      return Math.min(Math.round(scorePerSecond * 10), 1000);
    }
    const normalized = (this.currentScore / maxPossibleScore) * 1000;
    return Math.min(Math.round(normalized), 1000);
  }
}
