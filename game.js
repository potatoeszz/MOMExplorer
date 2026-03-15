const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const posEl = document.getElementById('pos');
const landmarkEl = document.getElementById('landmark');
const actionEl = document.getElementById('action');
const popup = document.getElementById('popup');
const popupTitle = document.getElementById('popup-title');
const popupText = document.getElementById('popup-text');
const popupClose = document.getElementById('popup-close');
const mapIframe = document.getElementById('mapIframe');
const offsetLabel = document.getElementById('offsetLabel');
const panLeft = document.getElementById('panLeft');
const panRight = document.getElementById('panRight');
const panUp = document.getElementById('panUp');
const panDown = document.getElementById('panDown');
const resetPan = document.getElementById('resetPan');

const camera = { x: 0, y: 0 };

function updatePan() {
  mapIframe.style.transform = `translate(${camera.x}px, ${camera.y}px)`;
  offsetLabel.textContent = `${Math.round(camera.x)}, ${Math.round(camera.y)}`;
}

panLeft.addEventListener('click', () => { camera.x -= 30; updatePan(); });
panRight.addEventListener('click', () => { camera.x += 30; updatePan(); });
panUp.addEventListener('click', () => { camera.y -= 30; updatePan(); });
panDown.addEventListener('click', () => { camera.y += 30; updatePan(); });
resetPan.addEventListener('click', () => { camera.x = 0; camera.y = 0; updatePan(); });

updatePan();

const TILE = 60;
const MAP_W = 15;
const MAP_H = 10;

const map = {
  width: MAP_W * TILE,
  height: MAP_H * TILE
};

const mapBounds = {
  latMin: 40.121,
  latMax: 40.470,
  lonMin: -74.350,
  lonMax: -73.840
};

function geoToCanvas(lat, lon) {
  const x = ((lon - mapBounds.lonMin) / (mapBounds.lonMax - mapBounds.lonMin)) * map.width;
  const y = ((mapBounds.latMax - lat) / (mapBounds.latMax - mapBounds.latMin)) * map.height;
  return { x, y };
}

const landmarks = [
  {
    id: 'asbury',
    name: 'Asbury Park Boardwalk',
    lat: 40.2206,
    lon: -73.9870,
    radius: 14,
    description:
      'Asbury Park Boardwalk is a legendary Jersey Shore destination with a historic roller coaster, vintage arcades, and a deep rock & roll heritage tied to the Stone Pony and Bruce Springsteen.'
  },
  {
    id: 'monmouth',
    name: 'Monmouth Battlefield State Park',
    lat: 40.3052,
    lon: -74.2132,
    radius: 14,
    description:
      'Monmouth Battlefield preserves the 1778 Revolutionary War battlefield where George Washington faced British forces; it features tours, reenactments, an interpretive center, and peaceful walking trails.'
  },
  {
    id: 'twin',
    name: 'Twin Lights of Navesink',
    lat: 40.4684,
    lon: -74.0163,
    radius: 14,
    description:
      'Twin Lights are two historic lighthouse towers on the Navesink Highlands near Sandy Hook; they helped advance lighthouse optics and offer wide views of New York Harbor and the Atlantic Ocean.'
  },
  {
    id: 'freehold',
    name: 'Freehold Raceway',
    lat: 40.2456,
    lon: -74.2650,
    radius: 14,
    description:
      'Freehold Raceway, established in 1830, is among the nation\'s oldest harness racetracks. It hosts major trotting races, community events, and lively entertainment.'
  }
];

landmarks.forEach(l => {
  const pt = geoToCanvas(l.lat, l.lon);
  l.x = pt.x;
  l.y = pt.y;
});

const playerStart = geoToCanvas(40.2206, -73.9870);

const player = {
  x: playerStart.x,
  y: playerStart.y,
  size: 22,
  speed: 2.8,
  color: '#f1b33f',
  staff: true,
  direction: 0
};

const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, w: false, a: false, s: false, d: false };
let currentLandmark = null;

function worldToScreen(x) { return x; }

function drawGrid() {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= MAP_W; i++) {
    ctx.beginPath();
    ctx.moveTo(i * TILE, 0);
    ctx.lineTo(i * TILE, map.height);
    ctx.stroke();
  }
  for (let j = 0; j <= MAP_H; j++) {
    ctx.beginPath();
    ctx.moveTo(0, j * TILE);
    ctx.lineTo(map.width, j * TILE);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(0, 0, map.width, map.height);
  ctx.restore();
}

function drawLandmarks() {
  landmarks.forEach(l => {
    ctx.save();
    ctx.fillStyle = '#4f93a1';
    ctx.globalAlpha = 0.30;
    ctx.beginPath();
    ctx.arc(l.x, l.y, l.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#f7f9ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(l.x, l.y, l.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#224';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(l.name, l.x + l.radius + 4, l.y + 4);
    ctx.restore();
  });
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.beginPath();
  ctx.fillStyle = player.color;
  ctx.arc(0, 0, player.size, 0, Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = '#653b12';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (player.staff) {
    ctx.strokeStyle = '#d1a655';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -player.size*0.3);
    const dx = Math.cos(player.direction); const dy = Math.sin(player.direction);
    ctx.lineTo(dx * 42, dy * 42);
    ctx.stroke();
  }
  ctx.restore();
}

function clampPlayer() {
  player.x = Math.max(player.size, Math.min(map.width - player.size, player.x));
  player.y = Math.max(player.size, Math.min(map.height - player.size, player.y));
}

function updatePlayer() {
  let dx = 0, dy = 0;
  if (keys.ArrowUp || keys.w) dy -= 1;
  if (keys.ArrowDown || keys.s) dy += 1;
  if (keys.ArrowLeft || keys.a) dx -= 1;
  if (keys.ArrowRight || keys.d) dx += 1;
  if (dx || dy) {
    const len = Math.hypot(dx, dy);
    dx = (dx / len) * player.speed;
    dy = (dy / len) * player.speed;
    player.x += dx;
    player.y += dy;
    player.direction = Math.atan2(dy, dx);
  }
  clampPlayer();
}

function checkLandmarks() {
  const found = landmarks.find(l => {
    const distance = Math.hypot(player.x - l.x, player.y - l.y);
    return distance <= l.radius + player.size * 0.6;
  });
  currentLandmark = found || null;
  landmarkEl.textContent = currentLandmark ? currentLandmark.name : 'None';
  actionEl.textContent = currentLandmark ? 'Press Space/Enter to inspect' : 'Move with arrows';
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawGrid();
  drawLandmarks();
  drawPlayer();

  posEl.textContent = `${Math.round(player.x)}, ${Math.round(player.y)}`;
}

function gameLoop() {
  updatePlayer();
  checkLandmarks();
  draw();
  requestAnimationFrame(gameLoop);
}

function openLandmark(l) {
  if (!l) return;
  popupTitle.textContent = l.name;
  popupText.textContent = l.description;
  popup.classList.remove('hidden');
}

function closePopup() {
  popup.classList.add('hidden');
}

window.addEventListener('keydown', (e) => {
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)) {
    keys[e.key] = true;
    e.preventDefault();
  }
  if (e.key === ' ' || e.key === 'Enter') {
    if (popup.classList.contains('hidden')) {
      if (currentLandmark) openLandmark(currentLandmark);
    } else {
      closePopup();
    }
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  if (keys[e.key] !== undefined) {
    keys[e.key] = false;
  }
});

popupClose.addEventListener('click', closePopup);

canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  player.x = event.clientX - rect.left;
  player.y = event.clientY - rect.top;
  clampPlayer();
});

window.addEventListener('resize', () => {
  // preserve our design; canvas is fixed 900x600
});

requestAnimationFrame(gameLoop);
