const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const coinMeterElement = document.getElementById('coinMeter');
const levelElement = document.getElementById('level');
const restartButton = document.getElementById('restartButton');
const startButton = document.getElementById('startButton');
const startScreen = document.getElementById('startScreen');
const levelAnnouncement = document.getElementById('levelAnnouncement');

const worldThemes = [
  {
    name: 'Kristallhöhle',
    background: ['#1a1a2e', '#16213e', '#0f0f23'],
    walls: '#2a2a4a',
    crystals: ['rgba(138, 43, 226, 0.8)', 'rgba(75, 0, 130, 0.6)', 'rgba(25, 25, 112, 0.2)'],
  },
  {
    name: 'Smaragdgrotte',
    background: ['#123b35', '#10524a', '#082b32'],
    walls: '#1c6557',
    crystals: ['rgba(115, 255, 174, 0.85)', 'rgba(24, 165, 126, 0.65)', 'rgba(8, 70, 91, 0.2)'],
  },
  {
    name: 'Eispalast',
    background: ['#183653', '#245b78', '#10243f'],
    walls: '#39718c',
    crystals: ['rgba(175, 245, 255, 0.9)', 'rgba(69, 179, 220, 0.65)', 'rgba(32, 87, 150, 0.2)'],
  },
  {
    name: 'Lavahöhle',
    background: ['#4a1f2c', '#32152b', '#170f25'],
    walls: '#733747',
    crystals: ['rgba(255, 195, 91, 0.9)', 'rgba(238, 83, 55, 0.65)', 'rgba(102, 24, 45, 0.2)'],
  },
  {
    name: 'Sternengrotte',
    background: ['#25204c', '#38285f', '#11132f'],
    walls: '#51427a',
    crystals: ['rgba(255, 154, 229, 0.9)', 'rgba(128, 99, 231, 0.65)', 'rgba(35, 55, 133, 0.2)'],
  },
];

const bossTheme = {
  name: 'Bossarena',
  background: ['#321a35', '#21152f', '#100f24'],
  walls: '#4b2948',
  crystals: ['rgba(255, 108, 159, 0.8)', 'rgba(190, 53, 117, 0.6)', 'rgba(55, 25, 82, 0.2)'],
};

let levelAnnouncementTimeout;

const game = {
  width: canvas.width,
  height: canvas.height,
  worldTheme: worldThemes[0],
  player: {
    width: 64,
    height: 64,
    x: 120,
    y: canvas.height - 90,
    speed: 5,
    color: '#ffcb45',
    image: new Image(),
    imageLoaded: false,
  },
  worldOffset: 0,
  worldSpeed: 4,
  obstacles: [],
  obstacleSpeed: 4,
  levelSpeedMultiplier: 1,
  obstacleCount: 3,
  level: 1,
  maxLevel: 6,
  levelDuration: 60000,
  levelElapsed: 0,
  tunnel: {
    active: false,
    x: 0,
    width: 1500,
    gapHeight: 340,
    centerY: 250,
    amplitude: 65,
    speed: 4,
    nextIn: 8000,
  },
  spikes: [],
  spikeTimer: 6000,
  knockedBack: false,
  coins: [],
  coinCount: 4,
  coinsCollected: 0,
  score: 0,
  lasers: [],
  lastShot: 0,
  boss: {
    active: false,
    x: canvas.width - 170,
    y: canvas.height / 2 - 60,
    width: 96,
    height: 96,
    verticalSpeed: 3.6,
    verticalDirection: 1,
    health: 20,
    maxHealth: 20,
    shotTimer: 500,
  },
  celebration: {
    active: false,
    elapsed: 0,
    nextBurst: 0,
    particles: [],
  },
  enemyShots: [],
  laserShockwaves: [],
  shockwave: {
    active: false,
    radius: 0,
    maxRadius: 360,
    speed: 18,
  },
  shield: {
    active: false,
    width: 56,
    height: 49,
    image: new Image(),
    imageLoaded: false,
  },
  gameOverReason: null,
  won: false,
  running: false,
  keys: {
    arrowleft: false,
    arrowright: false,
    arrowup: false,
    arrowdown: false,
    d: false,
    s: false,
    w: false,
  },
  lastFrameTime: null,
};

function createObstacle() {
  const isBig = Math.random() < 0.25;
  const width = isBig ? 100 + Math.random() * 40 : 60 + Math.random() * 20;
  const height = isBig ? 70 + Math.random() * 30 : 40 + Math.random() * 20;
  return {
    x: game.width + 220 + Math.random() * 320,
    y: 120 + Math.random() * (game.height - 260),
    width,
    height,
    color: isBig ? '#5a5a5a' : '#7a7a7a',
    health: isBig ? 5 : 2,
    speed: game.obstacleSpeed + (isBig ? Math.random() * 1.0 : Math.random() * 1.5) * game.levelSpeedMultiplier,
    isBig,
  };
}

function createCoin() {
  const isBig = Math.random() < 0.25;
  const radius = isBig ? 24 : 14;
  const colors = [
    { color: '#ff6b6b', innerColor: '#ff9999' }, // Red
    { color: '#4ecdc4', innerColor: '#81e6d9' }, // Teal
    { color: '#45b7d1', innerColor: '#87ceeb' }, // Blue
    { color: '#f9ca24', innerColor: '#f6e58d' }, // Yellow
    { color: '#6c5ce7', innerColor: '#a29bfe' }, // Purple
  ];
  const colorSet = colors[Math.floor(Math.random() * colors.length)];
  return {
    x: game.width + radius + Math.random() * 360,
    y: 100 + Math.random() * (game.height - 180),
    radius,
    width: radius * 2,
    height: radius * 2,
    color: colorSet.color,
    innerColor: colorSet.innerColor,
    speed: game.obstacleSpeed * 0.9 + Math.random() * 1.2 * game.levelSpeedMultiplier,
    value: isBig ? 5 : 1,
    isBig,
  };
}

function initCoinMeter() {
  coinMeterElement.innerHTML = '';
  for (let i = 0; i < 20; i += 1) {
    const slot = document.createElement('div');
    slot.className = 'coin-slot';
    coinMeterElement.appendChild(slot);
  }
}

function updateCoinMeter() {
  const slots = coinMeterElement.children;
  for (let i = 0; i < slots.length; i += 1) {
    slots[i].classList.toggle('active', i < game.coinsCollected);
  }
}

function startLevel(level, announce = false) {
  window.clearTimeout(levelAnnouncementTimeout);
  levelAnnouncement.hidden = true;
  game.level = level;
  const isBossLevel = level === game.maxLevel;
  const caveLevel = level;
  game.worldTheme = isBossLevel ? bossTheme : worldThemes[caveLevel - 1];
  game.levelElapsed = 0;
  game.levelSpeedMultiplier = caveLevel === 1 ? 0.5 : 1 + (caveLevel - 1) * 0.05;
  game.obstacleSpeed = 4 * game.levelSpeedMultiplier;
  game.levelDuration = isBossLevel ? Infinity : 30000;
  game.obstacleCount = isBossLevel ? 0 : 3 + caveLevel - 1;
  game.obstacles = Array.from({ length: game.obstacleCount }, createObstacle);
  game.boss.active = isBossLevel;
  game.boss.health = game.boss.maxHealth;
  game.boss.y = game.height / 2 - game.boss.height / 2;
  game.boss.verticalDirection = 1;
  game.boss.shotTimer = 500;
  game.enemyShots = [];
  game.tunnel.active = false;
  game.tunnel.x = 0;
  game.tunnel.width = 1500 + (caveLevel - 1) * 180;
  game.tunnel.gapHeight = 340 - (caveLevel - 1) * 24;
  game.tunnel.speed = game.obstacleSpeed;
  game.tunnel.nextIn = 6000 + Math.random() * 3000;
  game.spikes = [];
  game.spikeTimer = 5000 + Math.random() * 3000;
  if (isBossLevel) {
    game.worldOffset = 0;
    game.player.x = 120;
    game.player.y = game.height / 2 - game.player.height / 2;
  }
  levelElement.textContent = `Level ${level}/${game.maxLevel}`;
  if (announce) {
    levelAnnouncement.textContent = isBossLevel
      ? `Level ${level}: Bosskampf gegen Biblub`
      : `Welt ${caveLevel}: ${game.worldTheme.name}`;
    levelAnnouncement.hidden = false;
    levelAnnouncementTimeout = window.setTimeout(() => {
      levelAnnouncement.hidden = true;
    }, 2400);
  }
}

function resetGame() {
  game.player.x = 120;
  game.player.y = game.height - game.player.height - 40;
  game.worldOffset = 0;
  game.knockedBack = false;
  game.gameOverReason = null;
  game.won = false;
  game.celebration.active = false;
  game.celebration.particles = [];
  startLevel(1);
  game.coins = Array.from({ length: game.coinCount }, createCoin);
  game.coinsCollected = 5;
  game.score = 0;
  game.lasers = [];
  game.enemyShots = [];
  game.laserShockwaves = [];
  game.shockwave.active = false;
  game.shockwave.radius = 0;
  game.shield.active = false;
  game.keys.s = false;
  game.keys.d = false;
  game.running = true;
  scoreElement.textContent = 'Punktzahl: 0';
  updateCoinMeter();
  game.lastFrameTime = null;
  startScreen.hidden = true;
  requestAnimationFrame(gameLoop);
}

function drawLandscape() {
  const theme = game.worldTheme;
  const caveGradient = ctx.createLinearGradient(0, 0, 0, game.height);
  caveGradient.addColorStop(0, theme.background[0]);
  caveGradient.addColorStop(0.5, theme.background[1]);
  caveGradient.addColorStop(1, theme.background[2]);
  ctx.fillStyle = caveGradient;
  ctx.fillRect(0, 0, game.width, game.height);

  const offset = game.boss.active ? 0 : game.worldOffset;
  drawCaveWalls(offset * 0.3, theme.walls);
  drawGlowingCrystals(offset * 0.4);
}

function getTunnelGapAt(x) {
  const progress = (x - game.tunnel.x) / game.tunnel.width;
  const centerY = game.tunnel.centerY + Math.sin(progress * Math.PI * 2) * game.tunnel.amplitude;
  return {
    top: centerY - game.tunnel.gapHeight / 2,
    bottom: centerY + game.tunnel.gapHeight / 2,
  };
}

function drawTunnels() {
  if (!game.tunnel.active) {
    return;
  }

  const tunnel = game.tunnel;
  const segments = Math.ceil(tunnel.width / 24);
  const points = Array.from({ length: segments + 1 }, (_, index) => {
    const x = tunnel.x + (tunnel.width * index) / segments;
    return { x, ...getTunnelGapAt(x) };
  });

  ctx.fillStyle = '#29243f';
  ctx.strokeStyle = 'rgba(190, 177, 220, 0.8)';
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.moveTo(tunnel.x, 0);
  ctx.lineTo(tunnel.x + tunnel.width, 0);
  points.slice().reverse().forEach(point => ctx.lineTo(point.x, point.top));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(tunnel.x, game.height);
  ctx.lineTo(tunnel.x + tunnel.width, game.height);
  points.slice().reverse().forEach(point => ctx.lineTo(point.x, point.bottom));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function updateTunnel(delta) {
  const tunnel = game.tunnel;
  if (!tunnel.active) {
    tunnel.nextIn -= delta;
    if (tunnel.nextIn <= 0) {
      tunnel.active = true;
      tunnel.x = game.width;
      tunnel.centerY = game.height / 2 + (Math.random() - 0.5) * 50;
      tunnel.speed = game.obstacleSpeed;
    }
    return;
  }

  tunnel.x -= tunnel.speed + delta * 0.002;
  if (tunnel.x + tunnel.width < 0) {
    tunnel.active = false;
    tunnel.nextIn = 15000 + Math.random() * 10000;
  }
}

function drawSpikes() {
  game.spikes.forEach(spike => {
    ctx.fillStyle = '#777389';
    ctx.strokeStyle = '#c1bdcc';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(spike.x, 0);
    ctx.lineTo(spike.x + spike.width, 0);
    ctx.lineTo(spike.x + spike.width / 2, spike.topHeight);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(spike.x, game.height);
    ctx.lineTo(spike.x + spike.width, game.height);
    ctx.lineTo(spike.x + spike.width / 2, game.height - spike.bottomHeight);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });
}

function updateSpikes(delta) {
  if (game.tunnel.active) {
    game.spikes = [];
    game.spikeTimer = 7000;
    return;
  }

  game.spikeTimer -= delta;
  if (game.spikeTimer <= 0) {
    const width = 70 + Math.random() * 25;
    const topHeight = 75 + Math.random() * 125;
    const maxBottomHeight = game.height - topHeight - 140;
    game.spikes.push({
      x: game.width + width,
      width,
      topHeight,
      bottomHeight: 65 + Math.random() * Math.max(0, maxBottomHeight - 65),
    });
    game.spikeTimer = 7000 + Math.random() * 5000;
  }

  game.spikes.forEach(spike => {
    spike.x -= game.obstacleSpeed + delta * 0.002;
  });
  game.spikes = game.spikes.filter(spike => spike.x + spike.width > 0);
}

function checkSpikeCollision(player, spike) {
  const left = Math.max(player.x, spike.x);
  const right = Math.min(player.x + player.width, spike.x + spike.width);
  if (left >= right) {
    return false;
  }

  for (let index = 0; index <= 4; index += 1) {
    const x = left + ((right - left) * index) / 4;
    const centerDistance = Math.abs(x - (spike.x + spike.width / 2));
    const tipFactor = 1 - centerDistance / (spike.width / 2);
    const topEdge = spike.topHeight * tipFactor;
    const bottomEdge = game.height - spike.bottomHeight * tipFactor;
    if (player.y < topEdge || player.y + player.height > bottomEdge) {
      return true;
    }
  }
  return false;
}

function checkTunnelCollision() {
  const tunnel = game.tunnel;
  if (!tunnel.active) {
    return false;
  }

  const player = game.player;
  const left = Math.max(player.x, tunnel.x);
  const right = Math.min(player.x + player.width, tunnel.x + tunnel.width);
  if (left >= right) {
    return false;
  }

  for (let index = 0; index <= 4; index += 1) {
    const x = left + ((right - left) * index) / 4;
    const gap = getTunnelGapAt(x);
    if (player.y < gap.top || player.y + player.height > gap.bottom) {
      return true;
    }
  }
  return false;
}

function drawSun() {
  const x = 120;
  const y = 100;
  const radius = 50;
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, 'rgba(255, 244, 153, 1)');
  gradient.addColorStop(1, 'rgba(255, 210, 86, 0.3)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawClouds(offset) {
  const clouds = [
    { x: 180, y: 80 },
    { x: 530, y: 60 },
    { x: 700, y: 110 },
  ];
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  clouds.forEach(cloud => {
    let x = cloud.x - offset;
    x = ((x % (game.width + 220)) + (game.width + 220)) % (game.width + 220);
    if (x > game.width + 60) x -= game.width + 220;
    ctx.beginPath();
    ctx.arc(x, cloud.y, 26, 0, Math.PI * 2);
    ctx.arc(x + 40, cloud.y - 12, 28, 0, Math.PI * 2);
    ctx.arc(x + 80, cloud.y + 6, 24, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawCaveWalls(offset, color) {
  ctx.save();
  ctx.translate(-offset % game.width, 0);
  for (let i = -1; i < 3; i += 1) {
    const base = i * game.width;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(base, 0);
    ctx.quadraticCurveTo(base + 200, 100, base + 400, 50);
    ctx.quadraticCurveTo(base + 600, 120, base + game.width, 80);
    ctx.lineTo(base + game.width, 0);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(base, game.height);
    ctx.quadraticCurveTo(base + 250, game.height - 100, base + 450, game.height - 60);
    ctx.quadraticCurveTo(base + 650, game.height - 120, base + game.width, game.height - 80);
    ctx.lineTo(base + game.width, game.height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawGlowingCrystals(offset) {
  const crystals = [
    { x: 150, y: 120, size: 40 },
    { x: 450, y: 180, size: 30 },
    { x: 750, y: 100, size: 50 },
  ];
  ctx.save();
  ctx.translate(-offset % game.width, 0);
  for (let i = -1; i < 3; i += 1) {
    const base = i * game.width;
    crystals.forEach(crystal => {
      const x = base + crystal.x;
      const y = crystal.y;
      const size = crystal.size;

      // Glowing effect
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, game.worldTheme.crystals[0]);
      gradient.addColorStop(0.5, game.worldTheme.crystals[1]);
      gradient.addColorStop(1, game.worldTheme.crystals[2]);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x - size * 0.6, y + size * 0.4);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x + size * 0.6, y + size * 0.4);
      ctx.closePath();
      ctx.fill();

      // Crystal outline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }
  ctx.restore();
}

function drawHills(offset) {
  ctx.save();
  ctx.translate(-offset % game.width, 0);
  for (let i = -1; i < 2; i += 1) {
    const base = i * game.width;
    ctx.fillStyle = '#5ea75b';
    ctx.beginPath();
    ctx.moveTo(base, game.height);
    ctx.quadraticCurveTo(base + 200, game.height - 160, base + 420, game.height - 70);
    ctx.quadraticCurveTo(base + 600, game.height - 20, base + game.width, game.height - 120);
    ctx.lineTo(base + game.width, game.height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#4a8b49';
    ctx.beginPath();
    ctx.moveTo(base, game.height);
    ctx.quadraticCurveTo(base + 260, game.height - 120, base + 520, game.height - 40);
    ctx.quadraticCurveTo(base + 700, game.height - 10, base + game.width, game.height - 90);
    ctx.lineTo(base + game.width, game.height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawTrees(offset) {
  const treePositions = [
    { x: 120, y: 360 },
    { x: 300, y: 380 },
    { x: 520, y: 360 },
    { x: 760, y: 390 },
  ];
  ctx.save();
  ctx.translate(-offset % game.width, 0);
  for (let i = -1; i < 2; i += 1) {
    const base = i * game.width;
    treePositions.forEach(tree => {
      const x = base + tree.x;
      ctx.fillStyle = '#7a5130';
      ctx.fillRect(x, tree.y, 18, 70);
      ctx.fillStyle = '#2f7b36';
      ctx.beginPath();
      ctx.arc(x + 9, tree.y, 35, 0, Math.PI * 2);
      ctx.arc(x - 15, tree.y + 20, 28, 0, Math.PI * 2);
      ctx.arc(x + 33, tree.y + 20, 28, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  ctx.restore();
}

function drawPlayer() {
  const p = game.player;
  ctx.save();
  ctx.shadowColor = 'rgba(255, 80, 80, 0.8)';
  ctx.shadowBlur = 18;
  ctx.strokeStyle = 'rgba(255, 120, 120, 0.95)';
  ctx.lineWidth = 4;
  if (p.imageLoaded) {
    ctx.drawImage(p.image, p.x, p.y, p.width, p.height);
  } else {
    ctx.fillStyle = '#ff9c48';
    ctx.beginPath();
    ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function getShieldBounds() {
  const p = game.player;
  return {
    x: p.x + p.width - 12,
    y: p.y + (p.height - game.shield.height) / 2,
    width: game.shield.width,
    height: game.shield.height,
  };
}

function drawShield() {
  if (!game.shield.active) {
    return;
  }
  const bounds = getShieldBounds();
  if (game.shield.imageLoaded) {
    ctx.drawImage(game.shield.image, bounds.x, bounds.y, bounds.width, bounds.height);
    return;
  }

  ctx.fillStyle = 'rgba(80, 210, 255, 0.65)';
  ctx.strokeStyle = '#b7f4ff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(bounds.x + bounds.width, bounds.y + bounds.height / 2);
  ctx.lineTo(bounds.x + bounds.width * 0.65, bounds.y);
  ctx.lineTo(bounds.x, bounds.y + bounds.height * 0.15);
  ctx.lineTo(bounds.x, bounds.y + bounds.height * 0.85);
  ctx.lineTo(bounds.x + bounds.width * 0.65, bounds.y + bounds.height);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function activateShield() {
  if (game.shield.active || !game.running) {
    return;
  }
  if (game.coinsCollected < 5) {
    return;
  }

  game.coinsCollected -= 5;
  game.shield.active = true;
  updateCoinMeter();
}

function drawObstacles() {
  game.obstacles.forEach(obs => {
    const gradient = ctx.createLinearGradient(obs.x, obs.y, obs.x + obs.width, obs.y + obs.height);
    gradient.addColorStop(0, '#b0b0b0');
    gradient.addColorStop(0.5, '#7a7a7a');
    gradient.addColorStop(1, '#4d4d4d');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(obs.x + obs.width * 0.1, obs.y + obs.height * 0.15);
    ctx.lineTo(obs.x + obs.width * 0.6, obs.y + obs.height * 0.05);
    ctx.lineTo(obs.x + obs.width * 0.95, obs.y + obs.height * 0.3);
    ctx.lineTo(obs.x + obs.width * 0.85, obs.y + obs.height * 0.7);
    ctx.lineTo(obs.x + obs.width * 0.5, obs.y + obs.height * 0.95);
    ctx.lineTo(obs.x + obs.width * 0.2, obs.y + obs.height * 0.8);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(170,170,170,0.9)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Add small cracks for realistic rock detail
    ctx.strokeStyle = 'rgba(220,220,220,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(obs.x + obs.width * 0.3, obs.y + obs.height * 0.25);
    ctx.lineTo(obs.x + obs.width * 0.35, obs.y + obs.height * 0.45);
    ctx.lineTo(obs.x + obs.width * 0.28, obs.y + obs.height * 0.55);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(obs.x + obs.width * 0.65, obs.y + obs.height * 0.35);
    ctx.lineTo(obs.x + obs.width * 0.75, obs.y + obs.height * 0.5);
    ctx.lineTo(obs.x + obs.width * 0.72, obs.y + obs.height * 0.7);
    ctx.stroke();
  });
}

function drawBoss() {
  if (!game.boss.active) {
    return;
  }

  const boss = game.boss;
  if (game.player.imageLoaded) {
    ctx.drawImage(game.player.image, boss.x, boss.y, boss.width, boss.height);
  } else {
    ctx.fillStyle = '#d84c87';
    ctx.beginPath();
    ctx.arc(boss.x + boss.width / 2, boss.y + boss.height / 2, boss.width / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  const barWidth = 150;
  const barX = boss.x + (boss.width - barWidth) / 2;
  const barY = boss.y - 20;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(barX, barY, barWidth, 10);
  ctx.fillStyle = '#ff4f79';
  ctx.fillRect(barX, barY, barWidth * (boss.health / boss.maxHealth), 10);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, 10);
}

function drawEnemyShots() {
  game.enemyShots.forEach(shot => {
    ctx.save();
    ctx.fillStyle = '#ffb347';
    ctx.shadowColor = '#ff5d3d';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.ellipse(
      shot.x + shot.width / 2,
      shot.y + shot.height / 2,
      shot.width / 2,
      shot.height / 2,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  });
}

function drawLasers() {
  game.lasers.forEach(laser => {
    const tipX = laser.x + laser.width;
    const tipY = laser.y + laser.height / 2;
    ctx.fillStyle = '#9b30ff';
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - 12, tipY - 8);
    ctx.lineTo(tipX - 12, tipY + 8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#6a0dad';
    ctx.fillRect(laser.x, laser.y + laser.height * 0.2, laser.width - 12, laser.height * 0.6);

    ctx.fillStyle = '#dda0dd';
    ctx.fillRect(laser.x - 4, laser.y, 4, laser.height);
    ctx.fillRect(laser.x - 8, laser.y - 2, 4, laser.height + 4);
  });
}

function drawCoins() {
  if (game.boss.active || game.celebration.active) {
    return;
  }

  game.coins.forEach(coin => {
    const gradient = ctx.createRadialGradient(coin.x, coin.y, coin.radius * 0.1, coin.x, coin.y, coin.radius);
    gradient.addColorStop(0, coin.innerColor);
    gradient.addColorStop(1, coin.color);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(coin.x, coin.y - coin.radius);
    ctx.lineTo(coin.x + coin.radius, coin.y);
    ctx.lineTo(coin.x, coin.y + coin.radius);
    ctx.lineTo(coin.x - coin.radius, coin.y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#fff9c4';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(0, 0, game.width, game.height);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(game.gameOverReason || 'Spiel vorbei', game.width / 2, game.height / 2 - 10);
  ctx.font = '22px system-ui, sans-serif';
  ctx.fillText('Drücke „Spiel neu starten“ für einen neuen Versuch', game.width / 2, game.height / 2 + 34);
}

function drawWin() {
  ctx.fillStyle = 'rgba(30, 0, 60, 0.7)';
  ctx.fillRect(0, 0, game.width, game.height);
  ctx.fillStyle = '#f8c4ff';
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Gewonnen!', game.width / 2, game.height / 2 - 10);
  ctx.font = '24px system-ui, sans-serif';
  ctx.fillText('Alle 6 Level abgeschlossen!', game.width / 2, game.height / 2 + 34);
}

function updateLevel(delta) {
  if (game.won) {
    return;
  }

  if (game.boss.active) {
    if (game.boss.health <= 0) {
      game.boss.active = false;
      game.enemyShots = [];
      game.celebration.active = true;
      game.celebration.elapsed = 0;
      game.celebration.nextBurst = 0;
      game.celebration.particles = [];
    }
    return;
  }

  if (game.level === game.maxLevel) {
    return;
  }

  game.levelElapsed += delta;

  if (game.levelElapsed < game.levelDuration) {
    return;
  }
  if (game.level === game.maxLevel) {
    game.running = false;
    drawWin();
    return;
  }

  startLevel(game.level + 1, true);
}

function updatePlayer(timestamp) {
  const p = game.player;
  if (game.knockedBack) {
    p.x -= 8;
    return;
  }

  if (game.keys.arrowleft) {
    if (game.boss.active) {
      p.x = Math.max(20, p.x - p.speed);
    } else {
      game.worldOffset = Math.max(0, game.worldOffset - game.worldSpeed);
    }
  }
  if (game.keys.arrowright) {
    if (game.boss.active) {
      p.x = Math.min(game.width - p.width - 20, p.x + p.speed);
    } else {
      game.worldOffset += game.worldSpeed * 2.5;
    }
  }
  if (game.keys.arrowup) {
    p.y -= p.speed;
  }
  if (game.keys.arrowdown) {
    p.y += p.speed;
  }
  p.y = Math.max(20, Math.min(game.height - p.height - 20, p.y));

  if (game.keys.w && timestamp - game.lastShot > 250) {
    game.lasers.push({
      x: p.x + p.width,
      y: p.y + p.height / 2,
      width: 20,
      height: 4,
      speed: 10,
    });
    game.lastShot = timestamp;
  }

  if (game.keys.d && game.coinsCollected >= 5 && !game.shockwave.active) {
    game.shockwave.active = true;
    game.shockwave.radius = 10;
    game.coinsCollected -= 5;
    updateCoinMeter();
    game.obstacles = [];
    game.keys.d = false;
  }
}

function resolveShieldCollisions() {
  if (!game.shield.active) {
    return;
  }

  const shieldBounds = getShieldBounds();
  const hitIndex = game.obstacles.findIndex(obs =>
    checkCollision(shieldBounds, obs) || checkCollision(game.player, obs)
  );
  if (hitIndex !== -1) {
    game.obstacles.splice(hitIndex, 1);
    game.shield.active = false;
  }
}

function updateObstacles(delta) {
  game.obstacles.forEach(obs => {
    obs.x -= obs.speed + delta * 0.002;
    if (obs.x < -obs.width) {
      Object.assign(obs, createObstacle());
    }
  });
}

function updateBoss(delta) {
  if (!game.boss.active) {
    return;
  }

  const boss = game.boss;
  boss.y += boss.verticalSpeed * boss.verticalDirection * delta / 16.67;
  const minY = 30;
  const maxY = game.height - boss.height - 30;
  if (boss.y <= minY || boss.y >= maxY) {
    boss.y = Math.max(minY, Math.min(maxY, boss.y));
    boss.verticalDirection *= -1;
  }

  game.boss.shotTimer -= delta;
  if (game.boss.shotTimer > 0) {
    return;
  }

  const player = game.player;
  const originX = boss.x;
  const originY = boss.y + boss.height / 2;
  const targetX = player.x + player.width / 2;
  const targetY = player.y + player.height / 2;
  const angle = Math.atan2(targetY - originY, targetX - originX);
  const speed = 4.5;
  game.enemyShots.push({
    x: originX,
    y: originY - 6,
    width: 20,
    height: 12,
    velocityX: Math.cos(angle) * speed,
    velocityY: Math.sin(angle) * speed,
  });
  game.boss.shotTimer = 500;
}

function updateCelebration(delta) {
  const celebration = game.celebration;
  if (!celebration.active) {
    return;
  }

  celebration.elapsed += delta;
  if (celebration.elapsed >= celebration.nextBurst && celebration.elapsed < 3200) {
    const colors = ['#ffd54f', '#ff5ca8', '#70e1ff', '#ffffff', '#b08cff'];
    const centerX = 120 + Math.random() * (game.width - 240);
    const centerY = 60 + Math.random() * 170;
    for (let index = 0; index < 24; index += 1) {
      const angle = (Math.PI * 2 * index) / 24;
      const speed = 1.5 + Math.random() * 3;
      celebration.particles.push({
        x: centerX,
        y: centerY,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 900,
      });
    }
    celebration.nextBurst += 650;
  }

  celebration.particles.forEach(particle => {
    const frameScale = delta / 16.67;
    particle.x += particle.velocityX * frameScale;
    particle.y += particle.velocityY * frameScale;
    particle.velocityY += 0.045 * frameScale;
    particle.life -= delta;
  });
  celebration.particles = celebration.particles.filter(particle => particle.life > 0);

  if (celebration.elapsed >= 4000) {
    celebration.active = false;
    celebration.particles = [];
    game.won = true;
  }
}

function drawCelebration() {
  const celebration = game.celebration;
  if (!celebration.active) {
    return;
  }

  celebration.particles.forEach(particle => {
    ctx.save();
    ctx.globalAlpha = Math.min(1, particle.life / 250);
    ctx.fillStyle = particle.color;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  const centerX = game.width / 2;
  const cupTop = 118;
  ctx.save();
  ctx.shadowColor = 'rgba(255, 213, 79, 0.9)';
  ctx.shadowBlur = 24;
  ctx.fillStyle = '#ffd54f';
  ctx.strokeStyle = '#fff2a8';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(centerX - 36, cupTop);
  ctx.lineTo(centerX + 36, cupTop);
  ctx.lineTo(centerX + 28, cupTop + 40);
  ctx.quadraticCurveTo(centerX, cupTop + 72, centerX - 28, cupTop + 40);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(centerX - 34, cupTop + 22, 18, -Math.PI / 2, Math.PI / 2);
  ctx.arc(centerX + 34, cupTop + 22, 18, Math.PI / 2, -Math.PI / 2);
  ctx.stroke();
  ctx.fillRect(centerX - 5, cupTop + 62, 10, 20);
  ctx.fillRect(centerX - 24, cupTop + 82, 48, 9);
  ctx.restore();

  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(16, 15, 36, 0.8)';
  ctx.fillStyle = '#fff2a8';
  ctx.strokeText('Biblub besiegt!', centerX, 230);
  ctx.fillText('Biblub besiegt!', centerX, 230);
  ctx.restore();
}

function updateEnemyShots(delta) {
  const remainingShots = [];
  game.enemyShots.forEach(shot => {
    shot.x += shot.velocityX * delta / 16.67;
    shot.y += shot.velocityY * delta / 16.67;
    if (checkCollision(game.player, shot)) {
      if (game.boss.active && game.shield.active) {
        game.shield.active = false;
        return;
      }

      game.coinsCollected = Math.max(0, game.coinsCollected - 1);
      updateCoinMeter();
      if (game.coinsCollected === 0) {
        game.gameOverReason = 'Game over';
        game.running = false;
        drawGameOver();
        return;
      }
      return;
    }

    if (
      shot.x + shot.width > 0 &&
      shot.x < game.width &&
      shot.y + shot.height > 0 &&
      shot.y < game.height
    ) {
      remainingShots.push(shot);
    }
  });
  game.enemyShots = remainingShots;
}

function updateLasers(delta) {
  game.lasers.forEach(laser => {
    laser.x += laser.speed;
  });
  game.lasers = game.lasers.filter(laser => laser.x < game.width + laser.width);

  game.lasers = game.lasers.filter(laser => {
    const hitIndex = game.obstacles.findIndex(obs => checkCollision(laser, obs));
    if (hitIndex !== -1) {
      const obstacle = game.obstacles[hitIndex];
      obstacle.health -= 1;
      if (obstacle.health <= 0) {
        game.laserShockwaves.push({
          x: obstacle.x + obstacle.width / 2,
          y: obstacle.y + obstacle.height / 2,
          radius: 0,
          maxRadius: Math.max(obstacle.width, obstacle.height) * 0.75,
          speed: 10,
        });
        Object.assign(obstacle, createObstacle());
      }
      return false;
    }

    if (game.boss.active && checkCollision(laser, game.boss)) {
      game.boss.health = Math.max(0, game.boss.health - 1);
      return false;
    }
    return true;
  });
}

function updateLaserShockwaves() {
  game.laserShockwaves.forEach(wave => {
    wave.radius = Math.min(wave.radius + wave.speed, wave.maxRadius);
    game.obstacles.forEach(obstacle => {
      const dx = obstacle.x + obstacle.width / 2 - wave.x;
      const dy = obstacle.y + obstacle.height / 2 - wave.y;
      const obstacleRadius = Math.hypot(obstacle.width, obstacle.height) / 2;
      if (Math.hypot(dx, dy) <= wave.radius + obstacleRadius) {
        Object.assign(obstacle, createObstacle());
      }
    });
  });
  game.laserShockwaves = game.laserShockwaves.filter(wave => wave.radius < wave.maxRadius);
}

function drawLaserShockwaves() {
  game.laserShockwaves.forEach(wave => {
    const progress = wave.radius / wave.maxRadius;
    ctx.save();
    ctx.strokeStyle = `rgba(255, 190, 110, ${1 - progress})`;
    ctx.lineWidth = 5 * (1 - progress * 0.5);
    ctx.shadowColor = 'rgba(255, 120, 60, 0.8)';
    ctx.shadowBlur = 12 * (1 - progress);
    ctx.beginPath();
    ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });
}

function updateShockwave(delta) {
  if (!game.shockwave.active) {
    return;
  }
  game.shockwave.radius += game.shockwave.speed;
  if (game.shockwave.radius > game.shockwave.maxRadius) {
    game.shockwave.active = false;
    game.shockwave.radius = 0;
    game.obstacles = Array.from({ length: game.obstacleCount }, createObstacle);
  }
}

function drawShockwave() {
  if (!game.shockwave.active) {
    return;
  }
  const p = game.player;
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 70, 130, 0.8)';
  ctx.lineWidth = 6;
  ctx.shadowColor = 'rgba(255, 50, 80, 0.7)';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(p.x + p.width / 2, p.y + p.height / 2, game.shockwave.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function updateCoins(delta) {
  if (game.boss.active || game.celebration.active) {
    return;
  }

  game.coins.forEach(coin => {
    coin.x -= coin.speed + delta * 0.0015;
    if (coin.x < -coin.radius) {
      Object.assign(coin, createCoin());
    }
    if (checkCollision(game.player, coin)) {
      game.coinsCollected += coin.value;
      game.coinsCollected = Math.min(20, game.coinsCollected);
      game.score += coin.value;
      scoreElement.textContent = `Punktzahl: ${Math.floor(game.score)}`;
      updateCoinMeter();
      Object.assign(coin, createCoin());
    }
  });
}

function checkCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

function gameLoop(timestamp) {
  if (!game.running) {
    return;
  }
  const delta = game.lastFrameTime === null
    ? 0
    : Math.min(timestamp - game.lastFrameTime, 100);
  game.lastFrameTime = timestamp;

  drawLandscape();
  updatePlayer(timestamp);
  updateObstacles(delta);
  if (!game.boss.active) {
    updateTunnel(delta);
    updateSpikes(delta);
  }
  updateBoss(delta);
  updateEnemyShots(delta);
  if (!game.running) {
    return;
  }
  updateLasers(delta);
  updateLaserShockwaves();
  updateShockwave(delta);
  updateCoins(delta);
  if (!game.running) {
    return;
  }
  if (!game.knockedBack && checkTunnelCollision()) {
    game.knockedBack = true;
  }
  updateLevel(delta);
  if (!game.running) {
    return;
  }
  updateCelebration(delta);
  resolveShieldCollisions();
  drawTunnels();
  drawSpikes();
  drawObstacles();
  drawBoss();
  drawEnemyShots();
  drawLasers();
  drawLaserShockwaves();
  drawShockwave();
  drawCoins();
  drawPlayer();
  drawShield();
  drawCelebration();

  if (game.won) {
    game.running = false;
    drawWin();
    return;
  }

  if (game.knockedBack && game.player.x + game.player.width < 0) {
    game.running = false;
    drawGameOver();
    return;
  }

  if (!game.knockedBack && (
    game.obstacles.some(obs => checkCollision(game.player, obs)) ||
    game.spikes.some(spike => checkSpikeCollision(game.player, spike))
  )) {
    game.running = false;
    drawGameOver();
    return;
  }

  game.score += delta * 0.015 + game.worldOffset * 0.002;
  scoreElement.textContent = `Punktzahl: ${Math.floor(game.score)}`;
  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  if (key === 's' && !event.repeat) {
    activateShield();
  }
  if (key in game.keys) {
    game.keys[key] = true;
    event.preventDefault();
  }
});

window.addEventListener('keyup', event => {
  const key = event.key.toLowerCase();
  if (key in game.keys) {
    game.keys[key] = false;
    event.preventDefault();
  }
});

startButton.addEventListener('click', resetGame);
restartButton.addEventListener('click', resetGame);

window.addEventListener('load', () => {
  initCoinMeter();
  game.player.image.onload = () => {
    game.player.imageLoaded = true;
  };
  game.player.image.onerror = () => {
    game.player.imageLoaded = false;
  };
  game.player.image.src = 'biblub.png';
  game.shield.image.onload = () => {
    game.shield.imageLoaded = true;
  };
  game.shield.image.onerror = () => {
    game.shield.imageLoaded = false;
  };
  game.shield.image.src = 'schild.png';
  drawLandscape();
});
