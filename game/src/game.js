// The rules: sets, finds, misses, hints, the clock and the score.
import { buildScene, PANEL_W, PANEL_H } from './scenes.js';

export const SETS = 3;
export const MISS_PENALTY = 5;
export const HINT_PENALTY = 8;

export function createGame() {
  return { screen: 'title', level: 0, scene: buildScene(0), found: [], misses: [], pops: [], hint: null, hints: 3, time: 75, limit: 75, score: 0, streak: 0, cursor: { x: PANEL_W / 2, y: PANEL_H / 2, on: false } };
}

export function startSet(game, level) {
  Object.assign(game, { screen: 'play', level, scene: buildScene(level), found: [], misses: [], pops: [], hint: null, streak: 0 });
  game.limit = 75 + level * 15;
  game.time = game.limit;
  if (level === 0) {
    game.score = 0;
    game.hints = 3;
  }
}

export function remaining(game) {
  return game.scene.diffs.length - game.found.length;
}

export function guess(game, x, y, now) {
  if (game.screen !== 'play') return 'idle';
  const i = game.scene.diffs.findIndex((d, n) => !game.found.includes(n) && Math.hypot(d.x - x, d.y - y) <= d.radius + 8);
  if (i < 0) {
    game.misses.push({ x, y, at: now });
    game.time = Math.max(0, game.time - MISS_PENALTY);
    game.streak = 0;
    return 'miss';
  }
  game.found.push(i);
  game.streak++;
  game.score += 100 + game.streak * 25 + Math.round(game.time);
  game.pops.push({ i, at: now });
  if (game.hint && game.hint.i === i) game.hint = null;
  if (remaining(game) === 0) game.screen = game.level + 1 < SETS ? 'cleared' : 'won';
  return 'hit';
}

export function useHint(game, now) {
  if (game.screen !== 'play' || game.hints < 1 || game.hint) return false;
  const i = game.scene.diffs.findIndex((d, n) => !game.found.includes(n));
  if (i < 0) return false;
  game.hints--;
  game.time = Math.max(0, game.time - HINT_PENALTY);
  game.hint = { i, at: now };
  return true;
}

export function tick(game, dt, now) {
  if (game.screen !== 'play') return;
  game.time -= dt;
  if (game.hint && now - game.hint.at > 4000) game.hint = null;
  game.misses = game.misses.filter((m) => now - m.at < 700);
  if (game.time <= 0) {
    game.time = 0;
    game.screen = 'lost';
  }
}
