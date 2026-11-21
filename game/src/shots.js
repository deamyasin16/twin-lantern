// Freezes the game in a named state (?shot=play|hint|rush|cleared) so its screenshots can be taken.
import { startSet, remaining } from './game.js';

const PLANS = { play: [0, 2, 52, false], hint: [1, 3, 41, true], rush: [2, 5, 9, false], cleared: [1, 7, 33, false] };

export function applyShot(game, params) {
  const plan = PLANS[params.get('shot')];
  if (!plan) return false;
  const [level, finds, time, hinted] = plan;
  startSet(game, level);
  const total = game.scene.diffs.length;
  for (let n = 0; n < finds && n < total; n++) game.found.push(total - 1 - n);
  game.time = time;
  game.score = finds * 180 + level * 900;
  if (hinted) {
    game.hints = 2;
    game.hint = { i: 0, at: performance.now() };
    game.misses.push({ x: 300, y: 250, at: performance.now() + 1e9 });
  }
  if (remaining(game) === 0) game.screen = 'cleared';
  return true;
}
