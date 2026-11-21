// Draws everything: the two pictures, the markers on finds, the hint ring, the counter and the clock.
import { PANEL_W, PANEL_H } from './scenes.js';
import { remaining, SETS } from './game.js';

export const LEFT_X = 40;
export const RIGHT_X = 650;
export const PANEL_Y = 118;
const FONT = '"Trebuchet MS", "Segoe UI", sans-serif';

function disc(g, x, y, r) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}

function paintItem(g, item) {
  if (item.hide) return;
  const k = item.grow || 1;
  g.fillStyle = item.c;
  if (item.t === 'moon' || item.t === 'star' || item.t === 'hill') disc(g, item.x, item.y, item.r * k);
  else if (item.t === 'lantern') {
    g.fillRect(item.x - 1, item.y - item.r * k - 8, 2, 8);
    disc(g, item.x, item.y, item.r * k);
    g.fillStyle = 'rgba(255,255,255,.55)';
    disc(g, item.x - 3, item.y - 3, 2.5);
  } else if (item.t === 'roof') {
    g.beginPath();
    g.moveTo(item.x, item.y);
    g.lineTo(item.x + item.w / 2, item.y - item.h * k);
    g.lineTo(item.x + item.w, item.y);
    g.fill();
  } else if (item.t === 'flag') {
    g.fillRect(item.x - 1, item.y - item.h, 2, item.h);
    g.beginPath();
    g.moveTo(item.x + 1, item.y - item.h);
    g.lineTo(item.x + 20 * k, item.y - item.h + 7);
    g.lineTo(item.x + 1, item.y - item.h + 14);
    g.fill();
  } else if (item.t === 'boat') {
    g.beginPath();
    g.moveTo(item.x, item.y - 12);
    g.lineTo(item.x + item.w, item.y - 12);
    g.lineTo(item.x + item.w - 10, item.y);
    g.lineTo(item.x + 10, item.y);
    g.fill();
    g.fillRect(item.x + item.w / 2 - 1, item.y - 12 - 22 * k, 2, 22 * k);
  } else {
    const h = item.h * k;
    g.fillRect(item.x, item.y + item.h - h, item.w, h);
  }
}

function drawPicture(g, game, altered) {
  const { scene } = game;
  const sky = g.createLinearGradient(0, 0, 0, 410);
  sky.addColorStop(0, scene.theme.sky[0]);
  sky.addColorStop(1, scene.theme.sky[1]);
  g.fillStyle = sky;
  g.fillRect(0, 0, PANEL_W, PANEL_H);
  const changes = new Map(altered ? scene.diffs.map((d) => [d.i, d.change]) : []);
  scene.items.forEach((item, i) => paintItem(g, changes.has(i) ? { ...item, ...changes.get(i) } : item));
}

function drawMarkers(g, game, now) {
  for (const n of game.found) {
    const d = game.scene.diffs[n];
    const pop = game.pops.find((p) => p.i === n);
    const age = pop ? Math.min(1, (now - pop.at) / 350) : 1;
    g.strokeStyle = '#7cffb2';
    g.lineWidth = 5;
    g.beginPath();
    g.arc(d.x, d.y, (d.radius + 8) * (1.6 - 0.6 * age), 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = 'rgba(10,30,20,.55)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(d.x, d.y, d.radius + 11, 0, Math.PI * 2);
    g.stroke();
  }
  if (game.hint) {
    const d = game.scene.diffs[game.hint.i];
    g.strokeStyle = '#ffd166';
    g.lineWidth = 4;
    g.setLineDash([9, 7]);
    g.beginPath();
    g.arc(d.x, d.y, 62 + Math.sin(now / 160) * 8, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([]);
  }
  for (const m of game.misses) {
    g.globalAlpha = Math.max(0, Math.min(1, 1 - (now - m.at) / 700));
    g.strokeStyle = '#ff5d73';
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(m.x - 11, m.y - 11);
    g.lineTo(m.x + 11, m.y + 11);
    g.moveTo(m.x + 11, m.y - 11);
    g.lineTo(m.x - 11, m.y + 11);
    g.stroke();
    g.globalAlpha = 1;
  }
  if (game.cursor.on) {
    g.strokeStyle = '#ffffff';
    g.lineWidth = 2;
    g.strokeRect(game.cursor.x - 12, game.cursor.y - 12, 24, 24);
  }
}

function drawPanel(g, game, ox, altered, now) {
  g.save();
  g.translate(ox, PANEL_Y);
  g.beginPath();
  g.rect(0, 0, PANEL_W, PANEL_H);
  g.clip();
  drawPicture(g, game, altered);
  drawMarkers(g, game, now);
  g.restore();
  g.strokeStyle = '#f4f1de';
  g.lineWidth = 3;
  g.strokeRect(ox - 1.5, PANEL_Y - 1.5, PANEL_W + 3, PANEL_H + 3);
}

function drawCounter(g, game) {
  const left = remaining(game);
  const total = game.scene.diffs.length;
  g.textAlign = 'center';
  g.fillStyle = '#ffd166';
  g.font = `bold 44px ${FONT}`;
  g.fillText(`${left} LEFT`, 640, 56);
  for (let i = 0; i < total; i++) {
    g.fillStyle = i < total - left ? '#7cffb2' : '#4b4770';
    disc(g, 640 - (total - 1) * 11 + i * 22, 84, 7);
  }
}

function drawClock(g, game, now) {
  const share = game.time / game.limit;
  const urgent = game.time <= 15;
  g.fillStyle = '#2c2848';
  g.fillRect(900, 30, 340, 22);
  g.fillStyle = urgent ? (Math.sin(now / 90) > 0 ? '#ff5d73' : '#ff9aa8') : '#4ecdc4';
  g.fillRect(900, 30, 340 * share, 22);
  g.textAlign = 'right';
  g.fillStyle = urgent ? '#ff5d73' : '#f4f1de';
  g.font = `bold 22px ${FONT}`;
  g.fillText(`${Math.ceil(game.time)}s`, 1240, 84);
  g.textAlign = 'left';
  g.fillStyle = '#f4f1de';
  g.font = `18px ${FONT}`;
  g.fillText(`Hints ${'●'.repeat(game.hints)}${'○'.repeat(3 - game.hints)}  ·  Score ${game.score}`, 900, 84);
}

function drawHud(g, game, now) {
  g.textAlign = 'left';
  g.fillStyle = '#f4f1de';
  g.font = `bold 30px ${FONT}`;
  g.fillText('TWIN LANTERN', 40, 50);
  g.font = `18px ${FONT}`;
  g.fillStyle = '#b8b3d9';
  g.fillText(`Set ${game.level + 1} of ${SETS}  ·  ${game.scene.name}`, 40, 84);
  drawCounter(g, game);
  drawClock(g, game, now);
  g.textAlign = 'center';
  g.fillStyle = '#b8b3d9';
  g.font = `17px ${FONT}`;
  g.fillText('Click a difference on either picture  ·  Arrows + Space: keyboard aim  ·  H: hint (−8s)  ·  Wrong click: −5s  ·  R: restart', 640, 668);
}

const BANNERS = {
  title: ['TWIN LANTERN', 'Two harbour towns, almost alike. Press Enter or click to begin.'],
  cleared: ['SET CLEARED', 'Every difference found. Press Enter or click for the next set.'],
  won: ['ALL SETS CLEARED', 'Press Enter or click to play again.'],
  lost: ['OUT OF TIME', 'Press Enter or click to try again from set 1.'],
};

function drawBanner(g, game) {
  const [head, line] = BANNERS[game.screen];
  g.fillStyle = 'rgba(15,12,34,.82)';
  g.fillRect(240, 270, 800, 190);
  g.strokeStyle = '#ffd166';
  g.lineWidth = 3;
  g.strokeRect(240, 270, 800, 190);
  g.textAlign = 'center';
  g.fillStyle = '#ffd166';
  g.font = `bold 54px ${FONT}`;
  g.fillText(head, 640, 350);
  g.fillStyle = '#f4f1de';
  g.font = `22px ${FONT}`;
  g.fillText(line, 640, 400);
  if (game.screen !== 'title') g.fillText(`Score ${game.score}`, 640, 436);
}

export function drawFrame(g, game, now) {
  g.fillStyle = '#17142b';
  g.fillRect(0, 0, 1280, 720);
  drawHud(g, game, now);
  drawPanel(g, game, LEFT_X, false, now);
  drawPanel(g, game, RIGHT_X, true, now);
  if (game.screen !== 'play') drawBanner(g, game);
}
