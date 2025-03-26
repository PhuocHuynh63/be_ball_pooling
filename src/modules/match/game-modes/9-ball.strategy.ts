// import { Match } from '../entities/Match.schema';

// export class NineBallStrategy {
//   calculateScore(match: Match) {
//     let winner = null;

//     for (const progress of match.progress) {
//       if (progress.ballsPotted.includes('9') && !progress.foul) {
//         winner = progress.player;
//         break;
//       }
//     }

    if (winner) {
      match.result = {
        name: '9-Ball Match Result',
        score: 1, // Winner score
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      match.result = {
        name: '9-Ball Match Result',
        score: 0, // No winner test
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }


// }