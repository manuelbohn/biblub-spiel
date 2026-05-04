const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const coinMeterElement = document.getElementById('coinMeter');
const statusElement = document.getElementById('status');
const restartButton = document.getElementById('restartButton');

const game = {
  width: canvas.width,
  height: canvas.height,
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
  obstacleCount: 4,
  coins: [],
  coinCount: 4,
  coinsCollected: 0,
  score: 0,
  lasers: [],
  lastShot: 0,
  shockwave: {
    active: false,
    radius: 0,
    maxRadius: 360,
    speed: 18,
  },
  running: false,
  keys: {
    arrowleft: false,
    arrowright: false,
    arrowup: false,
    arrowdown: false,
    w: false,
    s: false,
  },
  lastFrameTime: 0,
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
    speed: game.obstacleSpeed + (isBig ? Math.random() * 1.0 : Math.random() * 1.5),
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
    speed: game.obstacleSpeed * 0.9 + Math.random() * 1.2,
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

function resetGame() {
  game.player.x = 120;
  game.player.y = game.height - game.player.height - 40;
  game.worldOffset = 0;
  game.obstacles = Array.from({ length: game.obstacleCount }, createObstacle);
  game.coins = Array.from({ length: game.coinCount }, createCoin);
  game.coinsCollected = 0;
  game.score = 0;
  game.lasers = [];
  game.shockwave.active = false;
  game.shockwave.radius = 0;
  game.running = true;
  statusElement.textContent = 'Playing';
  scoreElement.textContent = 'Score: 0';
  updateCoinMeter();
  game.lastFrameTime = 0;
  requestAnimationFrame(gameLoop);
}

function drawLandscape() {
  // Dark cave background
  const caveGradient = ctx.createLinearGradient(0, 0, 0, game.height);
  caveGradient.addColorStop(0, '#1a1a2e');
  caveGradient.addColorStop(0.5, '#16213e');
  caveGradient.addColorStop(1, '#0f0f23');
  ctx.fillStyle = caveGradient;
  ctx.fillRect(0, 0, game.width, game.height);

  drawCaveWalls(game.worldOffset * 0.3);
  drawGlowingCrystals(game.worldOffset * 0.4);
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

function drawCaveWalls(offset) {
  ctx.save();
  ctx.translate(-offset % game.width, 0);
  for (let i = -1; i < 3; i += 1) {
    const base = i * game.width;
    ctx.fillStyle = '#2a2a4a';
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
      gradient.addColorStop(0, 'rgba(138, 43, 226, 0.8)');
      gradient.addColorStop(0.5, 'rgba(75, 0, 130, 0.6)');
      gradient.addColorStop(1, 'rgba(25, 25, 112, 0.2)');
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
    ctx.strokeRect(p.x + 2, p.y + 2, p.width - 4, p.height - 4);
  } else {
    ctx.fillStyle = '#ff9c48';
    ctx.beginPath();
    ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
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
  ctx.fillText('Game Over', game.width / 2, game.height / 2 - 10);
  ctx.font = '22px system-ui, sans-serif';
  ctx.fillText('Press Restart to play again', game.width / 2, game.height / 2 + 34);
}

function drawWin() {
  ctx.fillStyle = 'rgba(30, 0, 60, 0.7)';
  ctx.fillRect(0, 0, game.width, game.height);
  ctx.fillStyle = '#f8c4ff';
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('You Win!', game.width / 2, game.height / 2 - 10);
  ctx.font = '24px system-ui, sans-serif';
  ctx.fillText('20 diamonds collected!', game.width / 2, game.height / 2 + 34);
}

function updatePlayer(timestamp) {
  const p = game.player;
  if (game.keys.arrowleft) {
    game.worldOffset = Math.max(0, game.worldOffset - game.worldSpeed);
  }
  if (game.keys.arrowright) {
    game.worldOffset += game.worldSpeed * 1.4;
  }
  if (game.keys.arrowup) {
    p.y -= p.speed;
  }
  if (game.keys.arrowdown) {
    p.y += p.speed;
  }
  p.y = Math.max(20, Math.min(game.height - p.height - 20, p.y));

  if (game.keys.w && timestamp - game.lastShot > 500) {
    game.lasers.push({
      x: p.x + p.width,
      y: p.y + p.height / 2,
      width: 20,
      height: 4,
      speed: 10,
    });
    game.lastShot = timestamp;
  }

  if (game.keys.s && game.coinsCollected >= 5 && !game.shockwave.active) {
    game.shockwave.active = true;
    game.shockwave.radius = 10;
    game.coinsCollected = 0;
    updateCoinMeter();
    statusElement.textContent = 'Shockwave!';
    game.obstacles = [];
    game.keys.s = false;
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

function updateLasers(delta) {
  game.lasers.forEach(laser => {
    laser.x += laser.speed;
  });
  game.lasers = game.lasers.filter(laser => laser.x < game.width + laser.width);

  game.lasers.forEach(laser => {
    game.obstacles.forEach(obs => {
      if (laser.x < obs.x + obs.width &&
          laser.x + laser.width > obs.x &&
          laser.y < obs.y + obs.height &&
          laser.y + laser.height > obs.y) {
        obs.health -= 1;
        if (obs.health <= 0) {
          Object.assign(obs, createObstacle());
        }
        // Remove laser on hit
        laser.x = game.width + 100;
      }
    });
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
    statusElement.textContent = 'Playing';
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
  game.coins.forEach(coin => {
    coin.x -= coin.speed + delta * 0.0015;
    if (coin.x < -coin.radius) {
      Object.assign(coin, createCoin());
    }
    if (checkCollision(game.player, coin)) {
      game.coinsCollected += coin.value;
      game.score += coin.value;
      scoreElement.textContent = `Score: ${Math.floor(game.score)}`;
      updateCoinMeter();
      Object.assign(coin, createCoin());
      if (game.coinsCollected >= 20) {
        game.running = false;
        statusElement.textContent = 'You Win!';
        drawWin();
      }
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
  const delta = timestamp - game.lastFrameTime;
  game.lastFrameTime = timestamp;

  drawLandscape();
  updatePlayer(timestamp);
  updateObstacles(delta);
  updateLasers(delta);
  updateShockwave(delta);
  updateCoins(delta);
  if (!game.running) {
    return;
  }
  drawObstacles();
  drawLasers();
  drawShockwave();
  drawCoins();
  drawPlayer();

  if (game.obstacles.some(obs => checkCollision(game.player, obs))) {
    game.running = false;
    statusElement.textContent = 'Game Over';
    drawGameOver();
    return;
  }

  game.score += delta * 0.015 + game.worldOffset * 0.002;
  scoreElement.textContent = `Score: ${Math.floor(game.score)}`;
  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
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
  resetGame();
});
