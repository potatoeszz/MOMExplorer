const posEl = document.getElementById('pos');
const landmarkEl = document.getElementById('landmark');
const actionEl = document.getElementById('action');
const popup = document.getElementById('popup');
const popupTitle = document.getElementById('popup-title');
const popupText = document.getElementById('popup-text');
const popupClose = document.getElementById('popup-close');
const quizArea = document.getElementById('quiz-area');
const quizQuestion = document.getElementById('quiz-question');
const quizChoices = document.getElementById('quiz-choices');
const quizResult = document.getElementById('quiz-result');
const startQuizBtn = document.getElementById('start-quiz');

const monmouthCenter = [40.324, -74.2585];
const map = L.map('leafletMap', { zoomControl: true }).setView(monmouthCenter, 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const landmarks = [
  { id: 'asbury', name: 'Asbury Park Boardwalk', lat: 40.2206, lon: -73.9870, radiusMeters: 450,
    description: 'Asbury Park Boardwalk has been a cultural center since the late 19th century. It was a major African American leisure destination during segregation, then reinvented as a major rock music mecca with the Stone Pony (Springsteen, Bon Jovi). The boardwalk is now a case study in urban renewal and coastal tourism.',
    quiz: {
      question: 'Which famous musician is closely associated with the Asbury Park music scene?',
      options: ['Bruce Springsteen', 'Johnny Cash', 'Lady Gaga', 'Beyonce'],
      answerIndex: 0
    }
  },
  { id: 'monmouth', name: 'Monmouth Battlefield State Park', lat: 40.3052, lon: -74.2132, radiusMeters: 450,
    description: 'Monmouth Battlefield is the site of the 1778 Revolutionary War battle where George Washington deployed one of the Continental Army\'s first large field tests against British regulars. The battle affirmed the army\'s endurance through torrential heat, introduced stricter drill discipline by von Steuben, and helped keep New Jersey under American control.',
    quiz: {
      question: 'In what year did the Battle of Monmouth take place?',
      options: ['1778', '1812', '1863', '1939'],
      answerIndex: 0
    }
  },
  { id: 'twin', name: 'Twin Lights of Navesink', lat: 40.4684, lon: -74.0163, radiusMeters: 450,
    description: 'Twin Lights (completed 1862; rebuilt 1867) were the first U.S. station to use both dioptric and catadioptric lenses. They served as a key coastal signal station through two world wars and as an early U.S. Coast Guard beacon. The museum includes 19th-century Fresnel lens history and maritime radio exhibits.',
    quiz: {
      question: 'Why was Twin Lights historically important for ship navigation?',
      options: ['It was an early lighthouse with advanced lighting tech', 'It was a movie studio', 'It served as a railroad terminal', 'It was a shopping center'],
      answerIndex: 0
    }
  },
  { id: 'freehold', name: 'Freehold Raceway', lat: 40.2456, lon: -74.2650, radiusMeters: 450,
    description: 'Freehold Raceway, a harness racing venue since 1830, influenced the growth of the Standardbred breed and American race betting culture. It remains one of only two historic trotting tracks still in operation, hosting the New Jersey Sires Stakes and preserving equestrian traditions in Monmouth County.',
    quiz: {
      question: 'What kind of racing is Freehold Raceway famous for?',
      options: ['Harness racing', 'Formula 1 racing', 'Horse show jumping', 'Marathon running'],
      answerIndex: 0
    }
  },
  { id: 'sandyhook', name: 'Sandy Hook Lighthouse', lat: 40.4661, lon: -74.0120, radiusMeters: 450,
    description: 'Sandy Hook Lighthouse (first lit 1764) is the oldest working lighthouse in the United States. It guided colonial and early federal shipping into New York Harbor, and the surrounding Sandy Hook Fort Hancock served as a U.S. Coast Artillery post defending the port from 1895 to 1950.',
    quiz: {
      question: 'Which year was Sandy Hook Lighthouse first lit?',
      options: ['1764', '1864', '1964', '1664'],
      answerIndex: 0
    }
  },
  { id: 'allaire', name: 'Allaire Historic Village', lat: 40.2747, lon: -74.1472, radiusMeters: 450,
    description: 'Allaire Historic Village is a restored 1830s ironworks community once known for railroad car wheels and machinery. It demonstrates early industrialization, water-powered iron production, 19th-century worker housing, and the transition from charcoal to anthracite fuel in American manufacturing.',
    quiz: {
      question: 'Allaire Historic Village is known for producing what type of industrial product?',
      options: ['Iron and machinery', 'Textiles', 'Consumer electronics', 'Aeroplanes'],
      answerIndex: 0
    }
  },
  { id: 'freeholdcourt', name: 'Freehold Historic District', lat: 40.2570, lon: -74.2830, radiusMeters: 350,
    description: 'Freehold Historic District includes the 1715 Monmouth County Courthouse and Remnants of the 1778 Freehold Tea Party. It is tied to Revolutionary rhetoric, later 19th-century Victorian rebuilding after fire, and a historical downtown that served as a county government and commerce hub.',
    quiz: {
      question: 'Freehold Historic District includes a courthouse built in which year?',
      options: ['1715', '1815', '1915', '1615'],
      answerIndex: 0
    }
  }
];

const landmarkLayerGroup = L.layerGroup().addTo(map);
landmarks.forEach(l => {
  const marker = L.circle([l.lat, l.lon], {
    radius: l.radiusMeters,
    color: '#4a5568',
    fillColor: '#4a5568',
    fillOpacity: 0.15,
    weight: 1
  }).addTo(landmarkLayerGroup);

  const pin = L.circleMarker([l.lat, l.lon], {
    radius: 8,
    color: '#2d3748',
    fillColor: '#63b3ed',
    fillOpacity: 0.8
  }).addTo(landmarkLayerGroup);

  pin.bindPopup(`<strong>${l.name}</strong><br>${l.description}`);
  l.marker = marker;
  l.pin = pin;
});

const player = {
  lat: 40.2206,
  lon: -73.9870,
  speedDeg: 0.1,
  marker: null
};

const moveState = {
  up: false,
  down: false,
  left: false,
  right: false
};

function createPlayer() {
  player.marker = L.circleMarker([player.lat, player.lon], {
    radius: 10,
    color: '#2d3748',
    fillColor: '#fbb6ce',
    fillOpacity: 1,
    weight: 2
  }).addTo(map);
  player.marker.bindPopup('Detective');
}

createPlayer();

function setPlayerPosition(lat, lon) {
  player.lat = lat;
  player.lon = lon;
  player.marker.setLatLng([lat, lon]);
  map.panTo([lat, lon], { animate: true, duration: 0.2 });
  checkLandmarks();
  posEl.textContent = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}

function distanceInMeters(a, b) {
  const toRad = angle => (angle * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon), Math.sqrt(1 - (sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon)));
  return R * c;
}

function checkLandmarks() {
  const playerPos = { lat: player.lat, lon: player.lon };
  const nearby = landmarks.find(l => distanceInMeters(playerPos, { lat: l.lat, lon: l.lon }) <= l.radiusMeters + 30);
  currentLandmark = nearby || null;
  landmarkEl.textContent = currentLandmark ? currentLandmark.name : 'None';
  actionEl.textContent = currentLandmark ? 'Press Space/Enter to investigate' : 'Move with arrows';
}

let currentLandmark = null;

function resetQuizUI() {
  quizResult.textContent = '';
  quizChoices.innerHTML = '';
  quizArea.classList.add('hidden');
}

function inspectLandmark() {
  if (!currentLandmark) return;

  popupTitle.textContent = currentLandmark.name;
  popupText.textContent = currentLandmark.description;

  const hasQuiz = currentLandmark.quiz;
  startQuizBtn.classList.toggle('hidden', !hasQuiz);
  resetQuizUI();

  popup.classList.remove('hidden');
}

function startQuiz() {
  if (!currentLandmark || !currentLandmark.quiz) return;

  quizActive = true;
  startQuizBtn.classList.add('hidden');
  quizArea.classList.remove('hidden');
  quizQuestion.textContent = currentLandmark.quiz.question;
  quizResult.textContent = '';
  quizChoices.innerHTML = '';

  currentLandmark.quiz.options.forEach((option, index) => {
    const btn = document.createElement('button');
    btn.textContent = option;
    btn.style.marginRight = '6px';
    btn.style.marginBottom = '6px';
    btn.onclick = () => handleQuizAnswer(index);
    quizChoices.appendChild(btn);
  });
}

function handleQuizAnswer(choice) {
  if (!currentLandmark || !currentLandmark.quiz) return;

  const right = currentLandmark.quiz.answerIndex;
  if (choice === right) {
    quizResult.textContent = 'Correct! Clue uncovered. Excellent detective work.';
    quizResult.style.color = '#68d391';
  } else {
    quizResult.textContent = `Incorrect. The correct answer was: ${currentLandmark.quiz.options[right]}. Keep investigating other locations.`;
    quizResult.style.color = '#fc8181';
  }

  quizActive = false;
}

window.addEventListener('keydown', e => {
  if (e.key === 'ArrowUp' || e.key === 'w') moveState.up = true;
  if (e.key === 'ArrowDown' || e.key === 's') moveState.down = true;
  if (e.key === 'ArrowLeft' || e.key === 'a') moveState.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd') moveState.right = true;
  if (e.key === ' ' || e.key === 'Enter') inspectLandmark();
});

window.addEventListener('keyup', e => {
  if (e.key === 'ArrowUp' || e.key === 'w') moveState.up = false;
  if (e.key === 'ArrowDown' || e.key === 's') moveState.down = false;
  if (e.key === 'ArrowLeft' || e.key === 'a') moveState.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd') moveState.right = false;
});

popupClose.addEventListener('click', () => {
  popup.classList.add('hidden');
  resetQuizUI();
  quizActive = false;
});

startQuizBtn.addEventListener('click', () => startQuiz());

let lastFrame = null;

function step(timestamp) {
  if (lastFrame === null) lastFrame = timestamp;
  const delta = (timestamp - lastFrame) / 1000;
  lastFrame = timestamp;

  let vx = 0;
  let vy = 0;
  if (moveState.up) vy += 1;
  if (moveState.down) vy -= 1;
  if (moveState.left) vx -= 1;
  if (moveState.right) vx += 1;

  if (vx !== 0 || vy !== 0) {
    const norm = Math.hypot(vx, vy);
    vx /= norm;
    vy /= norm;

    const latDelta = vy * player.speedDeg * delta;
    const lonDelta = vx * player.speedDeg * delta / Math.cos(player.lat * Math.PI / 180);

    setPlayerPosition(player.lat + latDelta, player.lon + lonDelta);
  }

  requestAnimationFrame(step);
}

setPlayerPosition(player.lat, player.lon);
checkLandmarks();
requestAnimationFrame(step);
