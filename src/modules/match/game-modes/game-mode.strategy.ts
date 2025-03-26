// import { Match } from '../entities/Match.schema';
// import { EightBallStrategy } from './8-ball.strategy';
// import { NineBallStrategy } from './9-ball.strategy';
// import { SnookerStrategy } from './snooker.strategy';

// export class GameModeStrategy {
//   private strategy: any;

//   constructor(mode: string) {
//     switch (mode) {
//       case '8-ball':
//         this.strategy = new EightBallStrategy();
//         break;
//       case '9-ball':
//         this.strategy = new NineBallStrategy();
//         break;
//       case 'snooker':
//         this.strategy = new SnookerStrategy();
//         break;
//       default:
//         throw new Error('Unsupported game mode');
//     }
//   }

//   calculateScore(match: Match) {
//     return this.strategy.calculateScore(match);
//   }

//   // Add other methods to delegate to the strategy if needed
// }