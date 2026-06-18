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

const state = {
  blocks: [],
  current: null,
  score: 0,
  best: 0,
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
}
