// Tower Block Game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
const view = { w: window.innerWidth, h: window.innerHeight };
function resize() {
  view.w = window.innerWidth;
  view.h = window.innerHeight;
  canvas.width = view.w * DPR;
  canvas.height = view.h * DPR;
  canvas.style.width = view.w + 'px';
  canvas.style.height = view.h + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resize);
resize();

const BLOCK_HEIGHT = 30;
const INITIAL_BLOCK_WIDTH = 200;
const MAX_SPEED = 9;
const MIN_BLOCK_WIDTH = 8;
function hslColor(i) {
  const hue = (i * 18) % 360;
  return `hsl(${hue}, 70%, 60%)`;
}
const COLORS = ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#5f27cd', '#ff9ff3'];

let storedBest = 0;
try { storedBest = parseInt(localStorage.getItem('tb_best') || '0', 10) || 0; } catch (_) {}

let audioCtx = null;
let muted = false;
try { muted = localStorage.getItem('tb_muted') === '1'; } catch (_) {}

function ensureAudio() {
  if (!audioCtx && typeof AudioContext !== 'undefined') audioCtx = new AudioContext();
  else if (!audioCtx && typeof webkitAudioContext !== 'undefined') audioCtx = new webkitAudioContext();
}

function beep(freq, duration, type) {
  if (muted) return;
  ensureAudio();
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type || 'square';
  osc.frequency.value = freq;
  gain.gain.value = 0.08;
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playPlace() { beep(440, 0.08, 'square'); }
function playPerfect() { beep(880, 0.1, 'triangle'); setTimeout(() => beep(1320, 0.12, 'triangle'), 60); }
function playFail() { beep(140, 0.4, 'sawtooth'); }

const state = {
  blocks: [],
  fragments: [],
  particles: [],
  flash: 0,
  current: null,
  score: 0,
  best: storedBest,
  speed: 2,
  direction: 1,
  running: false,
  over: false,
  cameraY: 0,
};

function spawnFragment(top, left, right) {
  if (!state.current) return;
  // left overhang
  if (state.current.x < left) {
    state.fragments.push({
      x: state.current.x,
      y: state.current.y,
      width: left - state.current.x,
      height: BLOCK_HEIGHT,
      vy: 0,
      vx: -2,
      rot: 0,
      vrot: -0.05,
      color: state.current.color,
    });
  }
  // right overhang
  const curRight = state.current.x + state.current.width;
  if (curRight > right) {
    state.fragments.push({
      x: right,
      y: state.current.y,
      width: curRight - right,
      height: BLOCK_HEIGHT,
      vy: 0,
      vx: 2,
      rot: 0,
      vrot: 0.05,
      color: state.current.color,
    });
  }
}

function Block(x, y, width, color) {
  return { x, y, width, height: BLOCK_HEIGHT, color };
}

function drawBlock(block) {
  const screenY = block.y - state.cameraY;
  // drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(block.x + 3, screenY + 4, block.width, block.height);
  ctx.fillStyle = block.color;
  ctx.fillRect(block.x, screenY, block.width, block.height);
  // top highlight
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(block.x, screenY, block.width, 4);
  // bottom shadow strip
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(block.x, screenY + block.height - 4, block.width, 4);
}

function initGame() {
  state.blocks = [];
  state.fragments = [];
  state.particles = [];
  state.flash = 0;
  state.combo = 0;
  state.score = 0;
  state.speed = 2;
  state.direction = 1;
  state.cameraY = 0;
  state.over = false;
  const baseX = (view.w - INITIAL_BLOCK_WIDTH) / 2;
  const baseY = view.h - BLOCK_HEIGHT * 2;
  state.blocks.push(Block(baseX, baseY, INITIAL_BLOCK_WIDTH, hslColor(0)));
  spawnCurrent();
}

function spawnCurrent() {
  const top = state.blocks[state.blocks.length - 1];
  state.current = Block(0, top.y - BLOCK_HEIGHT, top.width, hslColor(state.blocks.length));
  state.direction = Math.random() < 0.5 ? 1 : -1;
  if (state.direction < 0) state.current.x = view.w - state.current.width;
  // alternate axis: small bob effect for visual interest
  state.currentBob = 0;
}

function updateCurrent() {
  if (!state.current) return;
  state.current.x += state.speed * state.direction;
  if (state.current.x + state.current.width >= view.w) {
    state.current.x = view.w - state.current.width;
    state.direction = -1;
  } else if (state.current.x <= 0) {
    state.current.x = 0;
    state.direction = 1;
  }
  state.currentBob = (state.currentBob || 0) + 0.12;
}

function drawBackground() {
  const t = Math.min(1, state.score / 60);
  const topColor = `hsl(${220 - t * 80}, 50%, ${15 + t * 10}%)`;
  const botColor = `hsl(${230 - t * 80}, 40%, ${6 + t * 6}%)`;
  const grad = ctx.createLinearGradient(0, 0, 0, view.h);
  grad.addColorStop(0, topColor);
  grad.addColorStop(1, botColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, view.w, view.h);
  drawStars();
}

function drawStars() {
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  const offset = state.cameraY * 0.2;
  for (let i = 0; i < 60; i++) {
    const x = (i * 97) % view.w;
    const y = ((i * 53 + offset) % view.h + view.h) % view.h;
    const size = (i % 3 === 0) ? 2 : 1;
    ctx.fillRect(x, y, size, size);
  }
}

function updateCamera() {
  const top = state.blocks[state.blocks.length - 1];
  if (!top) return;
  const target = Math.min(0, top.y - view.h * 0.35);
  state.cameraY += (target - state.cameraY) * 0.1;
}

function updateFragments() {
  for (const f of state.fragments) {
    f.vy += 0.6;
    f.y += f.vy;
    f.x += f.vx;
    f.rot += f.vrot;
  }
  state.fragments = state.fragments.filter(f => (f.y - state.cameraY) < view.h + 200);
}

function updateParticles() {
  for (const p of state.particles) {
    p.vy += 0.15;
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.02;
  }
  state.particles = state.particles.filter(p => p.life > 0);
  state.flash = Math.max(0, state.flash - 0.04);
}

function drawParticles() {
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 3, p.y - state.cameraY - 3, 6, 6);
  }
  ctx.globalAlpha = 1;
}

function drawFragment(f) {
  const screenY = f.y - state.cameraY;
  ctx.save();
  ctx.translate(f.x + f.width / 2, screenY + f.height / 2);
  ctx.rotate(f.rot);
  ctx.fillStyle = f.color;
  ctx.fillRect(-f.width / 2, -f.height / 2, f.width, f.height);
  ctx.restore();
}

function render() {
  drawBackground();
  updateCamera();
  updateFragments();
  updateParticles();
  for (const b of state.blocks) drawBlock(b);
  for (const f of state.fragments) drawFragment(f);
  if (state.current) {
    const bob = Math.sin(state.currentBob || 0) * 2;
    const orig = state.current.y;
    state.current.y = orig + bob;
    drawBlock(state.current);
    state.current.y = orig;
  }
  drawParticles();
  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${state.flash * 0.25})`;
    ctx.fillRect(0, 0, view.w, view.h);
  }
  drawCombo();
  drawHUD();
}

function loop() {
  if (state.running && !state.over && !state.paused) updateCurrent();
  render();
  requestAnimationFrame(loop);
}

function dropBlock() {
  if (!state.running || state.over || !state.current) return;
  const top = state.blocks[state.blocks.length - 1];
  const left = Math.max(state.current.x, top.x);
  const right = Math.min(state.current.x + state.current.width, top.x + top.width);
  const overlap = right - left;
  if (overlap <= 0) {
    state.over = true;
    onGameOver();
    return;
  }
  // spawn falling chunk fragment for trimmed portion
  spawnFragment(top, left, right);
  state.current.x = left;
  state.current.width = overlap;
  state.blocks.push(state.current);
  const perfect = Math.abs(overlap - top.width) < 2;
  if (perfect) {
    state.combo = (state.combo || 0) + 1;
    state.score += 1 + state.combo * 2;
    onPerfect(state.current);
  } else {
    state.combo = 0;
    state.score += 1;
  }
  if (state.score > state.best) {
    state.best = state.score;
    try { localStorage.setItem('tb_best', String(state.best)); } catch (_) {}
  }
  state.speed = Math.min(MAX_SPEED, state.speed + 0.15);
  if (!perfect) playPlace();
  if (overlap < MIN_BLOCK_WIDTH) {
    state.over = true;
    onGameOver();
    return;
  }
  spawnCurrent();
}

function onGameOver() {
  playFail();
}

function onPerfect(block) {
  state.flash = 1;
  for (let i = 0; i < 14; i++) {
    state.particles.push({
      x: block.x + Math.random() * block.width,
      y: block.y,
      vx: (Math.random() - 0.5) * 4,
      vy: -Math.random() * 4 - 1,
      life: 1,
      color: block.color,
    });
  }
  playPerfect();
}

function handleInput(e) {
  if (e.type === 'keydown') {
    if (e.code !== 'Space' && e.code !== 'Enter' && e.code !== 'ArrowDown') return;
    e.preventDefault();
  }
  ensureAudio();
  if (state.over) {
    initGame();
    state.running = true;
    return;
  }
  if (!state.running) {
    state.running = true;
    return;
  }
  dropBlock();
}

window.addEventListener('keydown', handleInput);
canvas.addEventListener('click', handleInput);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleInput(e); }, { passive: false });
window.addEventListener('blur', () => { state.paused = true; });
window.addEventListener('focus', () => { state.paused = false; });

function drawCombo() {
  if (!state.combo || state.combo < 2) return;
  ctx.fillStyle = '#feca57';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('x' + state.combo + ' COMBO', view.w / 2, 140);
}

function drawHUD() {
  const level = Math.floor(state.score / 10) + 1;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 56px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(state.score), view.w / 2, 80);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('BEST ' + state.best + '  ·  LV ' + level, view.w / 2, 105);
  if (!state.running && !state.over) drawStartOverlay();
  if (state.over) drawGameOverOverlay();
}

function drawStartOverlay() {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, view.w, view.h);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TOWER BLOCK', view.w / 2, view.h / 2 - 20);
  ctx.font = '18px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('Click, tap or press SPACE to start', view.w / 2, view.h / 2 + 20);
}

function drawGameOverOverlay() {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, view.w, view.h);
  ctx.fillStyle = '#ff6b6b';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', view.w / 2, view.h / 2 - 30);
  ctx.fillStyle = '#fff';
  ctx.font = '22px sans-serif';
  ctx.fillText('Score: ' + state.score + '  ·  Best: ' + state.best, view.w / 2, view.h / 2 + 10);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText('Click or press SPACE to retry', view.w / 2, view.h / 2 + 45);
}

const muteBtn = document.getElementById('muteBtn');
function refreshMuteLabel() { if (muteBtn) muteBtn.textContent = muted ? 'SOUND OFF' : 'SOUND ON'; }
if (muteBtn) {
  refreshMuteLabel();
  muteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    muted = !muted;
    try { localStorage.setItem('tb_muted', muted ? '1' : '0'); } catch (_) {}
    refreshMuteLabel();
  });
}

initGame();
loop();
