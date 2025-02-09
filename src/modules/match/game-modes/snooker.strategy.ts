import { Match } from '../entities/Match.schema';

export class SnookerStrategy {
  calculateScore(match: Match) {
    let score = 0;
    let currentPlayer = null;

    for (const progress of match.progress) {
      if (progress.foul) {
        // Handle fouls
        score -= this.getFoulPenalty(progress.ballsPotted);
      } else {
        // Calculate score based on potted balls
        score += this.getScoreForPottedBalls(progress.ballsPotted);
        currentPlayer = progress.player;
      }
    }

    match.result = {
      name: 'Snooker Match Result',
      score: score,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private getScoreForPottedBalls(ballsPotted: string[]): number {
    const ballValues = {
      'red': 1,
      'yellow': 2,
      'green': 3,
      'brown': 4,
      'blue': 5,
      'pink': 6,
      'black': 7,
    };

    return ballsPotted.reduce((total, ball) => total + (ballValues[ball] || 0), 0);
  }

  private getFoulPenalty(ballsPotted: string[]): number {
    const ballValues = {
      'red': 4,
      'yellow': 4,
      'green': 4,
      'brown': 4,
      'blue': 5,
      'pink': 6,
      'black': 7,
    };

    return ballsPotted.reduce((total, ball) => total + (ballValues[ball] || 4), 0);
  }

  // Add other methods specific to Snooker game mode if needed
}