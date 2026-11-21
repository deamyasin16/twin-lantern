// Boots the game: wires mouse and keyboard to the rules and runs the frame loop.
import { createGame, startSet, guess, useHint, tick } from './game.js';
import { drawFrame, LEFT_X, RIGHT_X, PANEL_Y } from './render.js';
import { PANEL_W, PANEL_H } from './scenes.js';
import { chime } from './audio.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('stage');
const g = canvas.getContext('2d');
const game = createGame();
const frozen = applyShot(game, new URLSearchParams(location.search));

function advance() {
  if (game.screen === 'cleared') startSet(game, game.level + 1);
  else if (game.screen !== 'play') startSet(game, 0);
  else return false;
  chime('start');
  return true;
}

function tryGuess(x, y) {
  const result = guess(game, x, y, performance.now());
  if (result !== 'idle') chime(game.screen === 'play' ? result : 'clear');
}

function toPanel(ev) {
  const box = canvas.getBoundingClientRect();
  const mx = ((ev.clientX - box.left) * 1280) / box.width;
  const my = ((ev.clientY - box.top) * 720) / box.height;
  const x = mx - (mx >= RIGHT_X ? RIGHT_X : LEFT_X);
  const y = my - PANEL_Y;
  return x >= 0 && x <= PANEL_W && y >= 0 && y <= PANEL_H ? { x, y } : null;
}

canvas.addEventListener('mousedown', (ev) => {
  if (advance()) return;
  const p = toPanel(ev);
  if (!p) return;
  game.cursor.on = false;
  tryGuess(p.x, p.y);
});

const MOVES = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

addEventListener('keydown', (ev) => {
  const move = MOVES[ev.key];
  if (move) {
    const stride = ev.shiftKey ? 40 : 14;
    game.cursor.on = true;
    game.cursor.x = Math.max(0, Math.min(PANEL_W, game.cursor.x + move[0] * stride));
    game.cursor.y = Math.max(0, Math.min(PANEL_H, game.cursor.y + move[1] * stride));
  } else if (ev.key === 'Enter') advance();
  else if (ev.key === ' ') {
    if (!advance()) tryGuess(game.cursor.x, game.cursor.y);
  } else if (ev.key === 'h' || ev.key === 'H') {
    if (useHint(game, performance.now())) chime('hint');
  } else if (ev.key === 'r' || ev.key === 'R') startSet(game, 0);
  else return;
  ev.preventDefault();
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!frozen) tick(game, dt, now);
  drawFrame(g, game, now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
