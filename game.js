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
