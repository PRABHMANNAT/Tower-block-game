// Tower Block Game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const BLOCK_HEIGHT = 30;
const INITIAL_BLOCK_WIDTH = 200;
const COLORS = ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#5f27cd', '#ff9ff3'];

let storedBest = 0;
try { storedBest = parseInt(localStorage.getItem('tb_best') || '0', 10) || 0; } catch (_) {}

const state = {
  blocks: [],
  current: null,
  score: 0,
  best: storedBest,
  speed: 2,
  direction: 1,
  running: false,
  over: false,
  cameraY: 0,
};

function Block(x, y, width, color) {
  return { x, y, width, height: BLOCK_HEIGHT, color };
}

function drawBlock(block) {
  const screenY = block.y - state.cameraY;
  ctx.fillStyle = block.color;
  ctx.fillRect(block.x, screenY, block.width, block.height);
}

function initGame() {
  state.blocks = [];
  state.score = 0;
  state.speed = 2;
  state.direction = 1;
  state.cameraY = 0;
  state.over = false;
  const baseX = (canvas.width - INITIAL_BLOCK_WIDTH) / 2;
  const baseY = canvas.height - BLOCK_HEIGHT * 2;
  state.blocks.push(Block(baseX, baseY, INITIAL_BLOCK_WIDTH, COLORS[0]));
  spawnCurrent();
}

function spawnCurrent() {
  const top = state.blocks[state.blocks.length - 1];
  const colorIndex = state.blocks.length % COLORS.length;
  state.current = Block(0, top.y - BLOCK_HEIGHT, top.width, COLORS[colorIndex]);
  state.direction = Math.random() < 0.5 ? 1 : -1;
  if (state.direction < 0) state.current.x = canvas.width - state.current.width;
}

function updateCurrent() {
  if (!state.current) return;
  state.current.x += state.speed * state.direction;
  if (state.current.x + state.current.width >= canvas.width) {
    state.current.x = canvas.width - state.current.width;
    state.direction = -1;
  } else if (state.current.x <= 0) {
    state.current.x = 0;
    state.direction = 1;
  }
}

function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#1a2238');
  grad.addColorStop(1, '#0e1422');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function render() {
  drawBackground();
  for (const b of state.blocks) drawBlock(b);
  if (state.current) drawBlock(state.current);
  drawHUD();
}

function loop() {
  if (state.running && !state.over) updateCurrent();
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
    return;
  }
  state.current.x = left;
  state.current.width = overlap;
  state.blocks.push(state.current);
  state.score += 1;
  if (state.score > state.best) {
    state.best = state.score;
    try { localStorage.setItem('tb_best', String(state.best)); } catch (_) {}
  }
  state.speed += 0.15;
  spawnCurrent();
}

function handleInput(e) {
  if (e.type === 'keydown' && e.code !== 'Space') return;
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

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(state.score), canvas.width / 2, 60);
}

initGame();
loop();
