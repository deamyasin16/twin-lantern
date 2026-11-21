// Builds each picture set: a seeded harbour-town scene and the list of differences hidden in its twin.
import { rng } from './random.js';

export const PANEL_W = 590;
export const PANEL_H = 500;

const THEMES = [
  { name: 'Harbour Dusk', sky: ['#2b2d5b', '#e2725b'], moon: '#ffe9a8', hill: '#3b2f5c', ground: '#1d1b33', roof: '#7a2e3a', door: '#4a2c2a', lit: '#ffd166', dark: '#3a3357', walls: ['#e9b872', '#c8553d', '#6b9ac4', '#97b1a6', '#d98e73'], lanterns: ['#ff6b6b', '#ffd166', '#4ecdc4'] },
  { name: 'Lantern Market', sky: ['#0f1b3d', '#3f6ea3'], moon: '#f4f1de', hill: '#16264f', ground: '#0c1430', roof: '#e07a5f', door: '#2d1e2f', lit: '#f2cc8f', dark: '#22305c', walls: ['#81b29a', '#3d5a80', '#98c1d9', '#b56576', '#6d597a'], lanterns: ['#f2cc8f', '#e07a5f', '#f4f1de'] },
  { name: 'Frost Quarter', sky: ['#1b3a4b', '#9ad1d4'], moon: '#ffffff', hill: '#27566b', ground: '#12303d', roof: '#f1f7f7', door: '#274c5e', lit: '#ffe5a0', dark: '#2f5d70', walls: ['#bcd4de', '#a5ccd1', '#7fb7be', '#d3ab9e', '#e8c7c8'], lanterns: ['#ffe5a0', '#ff9f9f', '#b8f2e6'] },
];

export function buildScene(level) {
  const theme = THEMES[level % THEMES.length];
  const r = rng(1000 + level * 7919);
  const pick = (list) => list[Math.floor(r() * list.length)];
  const items = [];
  const add = (item) => items.push(item);
  add({ t: 'moon', x: 90 + r() * 400, y: 64 + r() * 30, r: 32, c: theme.moon });
  for (let i = 0; i < 16; i++) add({ t: 'star', x: 20 + r() * 550, y: 15 + r() * 150, r: 2.2 + r() * 2.2, c: '#fff6d8' });
  for (let i = 0; i < 3; i++) add({ t: 'hill', x: 80 + i * 210 + r() * 40, y: 410, r: 150 + r() * 60, c: theme.hill, fixed: true });
  let x = 14;
  while (x < PANEL_W - 70) {
    const w = 58 + Math.floor(r() * 36);
    const h = 120 + Math.floor(r() * 130);
    const top = 410 - h;
    add({ t: 'wall', x, y: top, w, h, c: pick(theme.walls) });
    if (r() < 0.6) add({ t: 'roof', x: x - 4, y: top, w: w + 8, h: 24 + r() * 16, c: theme.roof });
    else add({ t: 'flag', x: x + w / 2, y: top, h: 30, c: pick(theme.lanterns) });
    const cols = w > 74 ? 3 : 2;
    const rows = Math.floor((h - 50) / 34);
    const step = (w - 16) / cols;
    for (let a = 0; a < cols; a++) {
      for (let b = 0; b < rows; b++) add({ t: 'win', x: x + 8 + a * step + 3, y: top + 14 + b * 34, w: step - 6, h: 20, c: r() < 0.6 ? theme.lit : theme.dark });
    }
    add({ t: 'door', x: x + w / 2 - 8, y: 384, w: 16, h: 26, c: theme.door });
    x += w + 8 + Math.floor(r() * 10);
  }
  add({ t: 'ground', x: 0, y: 410, w: PANEL_W, h: 90, c: theme.ground, fixed: true });
  for (let i = 0; i < 9; i++) add({ t: 'lantern', x: 30 + i * 66, y: 432 + Math.sin(i * 1.3) * 8, r: 9, c: pick(theme.lanterns) });
  for (let i = 0; i < 4; i++) add({ t: 'boat', x: 40 + i * 140 + r() * 40, y: 486, w: 46, c: pick(theme.walls) });
  return { name: theme.name, theme, items, diffs: chooseDifferences(items, level, r, theme) };
}

// Where a player aims for an item, and how forgiving the click is.
function centreOf(item) {
  if (item.t === 'roof') return { x: item.x + item.w / 2, y: item.y - item.h / 2, size: 24 };
  if (item.t === 'flag') return { x: item.x + 8, y: item.y - item.h + 8, size: 20 };
  if (item.t === 'boat') return { x: item.x + item.w / 2, y: item.y - 14, size: 26 };
  if (item.w) return { x: item.x + item.w / 2, y: item.y + item.h / 2, size: Math.min(40, Math.max(item.w, item.h) / 2) };
  return { x: item.x, y: item.y, size: item.r };
}

// One change per item kind, subtler as the sets go on.
function changeFor(item, r, theme, level) {
  const others = [...theme.walls, ...theme.lanterns].filter((c) => c !== item.c);
  const recolor = { c: others[Math.floor(r() * others.length)] };
  if (item.t === 'wall') return recolor;
  if (item.t === 'win') return r() < 0.6 ? { c: item.c === theme.lit ? theme.dark : theme.lit } : { grow: 1.5 };
  if (item.t === 'star') return r() < 0.5 ? { hide: true } : { grow: 2.4 - level * 0.3 };
  const roll = r();
  if (roll < 0.34) return { hide: true };
  if (roll < 0.67) return { grow: 1.6 - level * 0.1 };
  return recolor;
}

function chooseDifferences(items, level, r, theme) {
  const want = 5 + level * 2;
  const pool = items.map((item, i) => i).filter((i) => !items[i].fixed);
  const diffs = [];
  for (let guard = 0; diffs.length < want && guard < 4000; guard++) {
    const i = pool[Math.floor(r() * pool.length)];
    const c = centreOf(items[i]);
    if (diffs.some((d) => Math.hypot(d.x - c.x, d.y - c.y) < 80)) continue;
    diffs.push({ i, x: c.x, y: c.y, radius: Math.max(22, c.size), change: changeFor(items[i], r, theme, level) });
  }
  return diffs;
}
