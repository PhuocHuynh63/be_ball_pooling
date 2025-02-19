// import { Match } from '../entities/Match.schema';

// export class EightBallStrategy {
//   calculateScore(match: Match) {
//     const playerStats = match.users.map(user => ({
//       player: user.user.toString(),
//       strokes: 0,
//       fouls: 0,
//     }));

//     // Calculate strokes and fouls for each player
//     match.progress.forEach(stroke => {
//       const playerStat = playerStats.find(stat => stat.player === stroke.player.toString());
//       if (playerStat) {
//         playerStat.strokes += 1;
//         if (stroke.foul) {
//           playerStat.fouls += 1;
//         }
//       }
//     });

//     // Determine the winner based on the last stroke
//     const lastStroke = match.progress[match.progress.length - 1];
//     let winner;
//     if (lastStroke.ballsPotted.includes('8') && !lastStroke.foul) {
//       winner = lastStroke.player.toString();
//     } else {
//       winner = match.users.find(user => user.user.toString() !== lastStroke.player.toString()).user.toString();
//     }

//     match.result = {
//       name: '8-Ball Match Result',
//       score: 1, // Winner score
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     };

//     return {
//       winner,
//       playerStats,
//     };
//   }

//   // Add other methods specific to 8-ball game mode if needed
// }