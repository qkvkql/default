import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const GLOBE_RADIUS      = 1;
const ATMOSPHERE_RADIUS = 1.08;
const STAR_COUNT        = 3000;

// ─── Scene Setup ──────────────────────────────────────────────────────────────
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);
// Default view: lat 40°N, lon 110°E, distance 1.9 (central China, mid zoom)
// Computed via latLonToVec3(40, 110, 1.9): phi=50°, theta=290°
camera.position.set(-0.498, 1.221, -1.368);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x020b18, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

const container = document.getElementById('globe-container');
container.appendChild(renderer.domElement);

// HTML overlay containers
const labelsContainer = document.createElement('div');
labelsContainer.id = 'labels-container';
labelsContainer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;';
container.appendChild(labelsContainer);

const dotsContainer = document.createElement('div');
dotsContainer.id = 'dots-container';
dotsContainer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;';
container.appendChild(dotsContainer);

// ── OrbitControls ─────────────────────────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance   = 1.15;
controls.maxDistance   = 8;
controls.rotateSpeed   = 0.18;
controls.zoomSpeed     = 0.9;
controls.autoRotate    = false;

// Lighting
const ambientLight = new THREE.AmbientLight(0x223355, 1.8);
scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
sunLight.position.set(5, 3, 5);
scene.add(sunLight);
const fillLight = new THREE.DirectionalLight(0x3b6ea5, 0.6);
fillLight.position.set(-5, -2, -3);
scene.add(fillLight);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function latLonToVec3(lat, lon, r) {
  const phi   = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}

function tempToColor(t) {
  const stops = [
    [-20, new THREE.Color(0x1a6fff)],
    [  0, new THREE.Color(0x00cfff)],
    [ 15, new THREE.Color(0x00e87a)],
    [ 25, new THREE.Color(0xffe600)],
    [ 30, new THREE.Color(0xff7700)],
    [ 45, new THREE.Color(0xff1a1a)],
  ];
  if (t <= stops[0][0]) return stops[0][1].clone();
  if (t >= stops[stops.length-1][0]) return stops[stops.length-1][1].clone();
  for (let i = 0; i < stops.length - 1; i++) {
    if (t <= stops[i+1][0]) {
      const f = (t - stops[i][0]) / (stops[i+1][0] - stops[i][0]);
      return stops[i][1].clone().lerp(stops[i+1][1], f);
    }
  }
}

function formatTemp(v) {
  return (v >= 0 ? '+' : '') + v.toFixed(1) + '°C';
}

function formatCardTemp(v) {
  return v.toFixed(1) + '°C';
}

function setProgress(p) {
  const fill = document.getElementById('loader-fill');
  if (fill) fill.style.width = Math.round(p * 100) + '%';
}

function worldToScreen(worldPos) {
  const v = worldPos.clone().project(camera);
  return {
    x: ( v.x + 1) / 2 * window.innerWidth,
    y: (-v.y + 1) / 2 * window.innerHeight,
    behind: v.z > 1,
  };
}

// ─── Stars ────────────────────────────────────────────────────────────────────
function addStars() {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT * 3; i++) pos[i] = (Math.random() - 0.5) * 200;
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, sizeAttenuation: true })));
}

// ─── Globe ────────────────────────────────────────────────────────────────────
function addGlobe() {
  const geo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
  const mat = new THREE.MeshPhongMaterial({
    color:     0x040f22,
    emissive:  0x040f22,
    emissiveIntensity: 0.4,
    shininess: 18,
    specular:  new THREE.Color(0x1a4080),
  });
  scene.add(new THREE.Mesh(geo, mat));
}

// ─── Atmosphere ───────────────────────────────────────────────────────────────
function addAtmosphere() {
  const geo = new THREE.SphereGeometry(ATMOSPHERE_RADIUS, 64, 64);
  const mat = new THREE.MeshPhongMaterial({
    color:       0x1a5aad,
    transparent: true,
    opacity:     0.08,
    side:        THREE.FrontSide,
  });
  scene.add(new THREE.Mesh(geo, mat));
}

// ─── Coastlines ───────────────────────────────────────────────────────────────
async function addCoastlines(onProgress) {
  const topoRes = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
  const topo    = await topoRes.json();
  onProgress(0.4);

  const topojson = await import('https://cdn.skypack.dev/topojson-client@3');
  onProgress(0.55);

  const coastMesh = topojson.mesh(topo, topo.objects.land);
  onProgress(0.65);

  const positions = [];
  const R = GLOBE_RADIUS + 0.001;

  function addArc(arc) {
    const pts = arc.map(([lon, lat]) => latLonToVec3(lat, lon, R));
    for (let i = 0; i < pts.length - 1; i++) {
      positions.push(pts[i].x, pts[i].y, pts[i].z, pts[i+1].x, pts[i+1].y, pts[i+1].z);
    }
  }

  if (coastMesh.type === 'LineString')       addArc(coastMesh.coordinates);
  else if (coastMesh.type === 'MultiLineString')
    coastMesh.coordinates.forEach(addArc);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  scene.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
    color: 0x4488bb, transparent: true, opacity: 0.55,
  })));
  onProgress(0.75);
}

// ─── Stations ─────────────────────────────────────────────────────────────────
// Each entry: { mesh, dotEl, labelEl, worldPos, data }
// Only stations with at least one of min/max/avg are shown.
let stationObjects = [];

function addStations(stations) {
  const withData = stations.filter(s => s.min != null || s.max != null || s.avg != null);

  document.getElementById('stat-total-val').textContent = stations.length;
  document.getElementById('stat-data-val').textContent  = withData.length;

  for (const station of withData) {
    const ref   = station.avg ?? station.max ?? station.min;
    const color = tempToColor(ref);
    const hex   = '#' + color.getHexString();

    // Invisible sphere — used ONLY for raycasting
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 6, 6),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    );
    const worldPos = latLonToVec3(station.lat, station.lon, GLOBE_RADIUS + 0.003);
    mesh.position.copy(worldPos);
    scene.add(mesh);

    // CSS dot — fixed 7 px, coloured by temperature
    const dotEl = document.createElement('div');
    dotEl.className = 'station-dot';
    dotEl.style.background = hex;
    dotEl.style.boxShadow  = `0 0 6px 1px ${hex}88`;
    dotsContainer.appendChild(dotEl);

    // HTML label
    const labelEl = buildLabelEl(station);
    labelsContainer.appendChild(labelEl);

    stationObjects.push({ mesh, dotEl, labelEl, worldPos: worldPos.clone(), data: station });
  }
}

function buildLabelEl(station) {
  const div = document.createElement('div');
  div.className = 'station-label';

  const nameEl = document.createElement('div');
  nameEl.className = 'label-name';
  nameEl.textContent = station.name;
  div.appendChild(nameEl);

  [
    ['最高: ', station.max],
    ['平均: ', station.avg],
    ['最低: ', station.min],
  ].forEach(([label, value], idx) => {
    if (value == null) return;
    const line = document.createElement('div');
    line.className = `label-temp-line label-temp-line-${idx + 1}`;
    line.textContent = label + formatCardTemp(value);
    div.appendChild(line);
  });

  if (station.date_text != null && String(station.date_text).trim()) {
    const dateLine = document.createElement('div');
    dateLine.className = 'label-date-line';
    dateLine.textContent = String(station.date_text).trim();
    div.appendChild(dateLine);
  }

  return div;
}

// ─── Animation state ──────────────────────────────────────────────────────────
let animationActiveIdx = null; // null = show all; number = index of spotlighted station

const ANIM_STATION_MS = 3000; // ms each station is spotlighted

let _flatList    = [];   // station indices sorted by min desc (hottest → coldest)
let _animIdx      = -1;   // current position in _flatList
let _animStarted  = false;
let _animPaused   = false;
let _animFinished = false; // true after last station shown; user must quit manually
let _animTimers  = [];
let _spotObj     = null; // currently spotlighted station object

// ─── Station List Drawer ───────────────────────────────────────────────────────
function buildStationList() {
  const body = document.getElementById('station-list-body');
  body.innerHTML = '';

  const query = (document.getElementById('station-list-search').value || '').trim().toLowerCase();

  // Use the same sorted order as the animation (_flatList already built or build now)
  const sortedIndices = stationObjects
    .map((o, i) => ({ i, min: o.data.min ?? -Infinity }))
    .sort((a, b) => b.min - a.min)
    .map(e => e.i);

  let rank = 0;
  for (const globalIdx of sortedIndices) {
    const obj = stationObjects[globalIdx];
    const d   = obj.data;
    if (query && !d.name.toLowerCase().includes(query)) continue;
    rank++;

    const ref   = d.avg ?? d.max ?? d.min;
    const color = tempToColor(ref ?? 0);
    const hex   = '#' + color.getHexString();

    const row = document.createElement('div');
    row.className = 'station-list-item' + (globalIdx === animationActiveIdx ? ' active-station' : '');
    row.dataset.idx = globalIdx;

    row.innerHTML = `
      <span class="sli-rank">${rank}</span>
      <span class="sli-dot" style="background:${hex};color:${hex}"></span>
      <span class="sli-name">${d.name}</span>
      <span class="sli-temps">
        ${d.min != null ? `<span class="sli-temp-chip chip-min">${formatTemp(d.min)}</span>` : ''}
        ${d.avg != null ? `<span class="sli-temp-chip chip-avg">${formatTemp(d.avg)}</span>` : ''}
        ${d.max != null ? `<span class="sli-temp-chip chip-max">${formatTemp(d.max)}</span>` : ''}
      </span>
    `;

    row.addEventListener('click', () => {
      selectStationFromList(globalIdx);
      closeStationList();
    });
    body.appendChild(row);
  }

  if (rank === 0) {
    body.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-dim);font-size:12px;">No stations match</div>';
  }
}

function openStationList() {
  buildStationList();
  const overlay = document.getElementById('station-list-overlay');
  overlay.classList.remove('hidden');
  // Focus search box
  setTimeout(() => document.getElementById('station-list-search').focus(), 80);
}

function closeStationList() {
  document.getElementById('station-list-overlay').classList.add('hidden');
  document.getElementById('station-list-search').value = '';
}

function selectStationFromList(globalIdx) {
  // Pause if running
  if (_animStarted && !_animPaused && !_animFinished) {
    pauseAnimation();
  }

  // If animation hasn't been started yet, we can still spotlight manually
  if (!_animStarted) {
    _animStarted  = true;
    _animPaused   = true;
    _animFinished = false;
    _buildFlatList();
    _updateButtons();
    const info = document.getElementById('anim-info');
    info.classList.remove('hidden');
    if (!document.getElementById('anim-progress-bar-wrap')) {
      const wrap = document.createElement('div'); wrap.id = 'anim-progress-bar-wrap';
      const bar  = document.createElement('div'); bar.id  = 'anim-progress-bar'; bar.style.width = '0%';
      wrap.appendChild(bar); info.appendChild(wrap);
    }
  }

  // Find position of globalIdx in _flatList for the counter display
  const posInList = _flatList.indexOf(globalIdx);
  _animIdx = posInList >= 0 ? posInList : _animIdx;

  animationActiveIdx = globalIdx;
  _applySpotlight(stationObjects[globalIdx]);

  // Update info panel
  const obj   = stationObjects[globalIdx];
  const total = _flatList.length;
  document.getElementById('anim-countdown').textContent    = '';
  document.getElementById('anim-station-name').textContent = obj.data.name;
  document.getElementById('anim-meta').textContent =
    posInList >= 0 ? `${posInList + 1} / ${total}` : obj.data.name;

  // Reset progress bar
  const bar = document.getElementById('anim-progress-bar');
  if (bar) {
    bar.style.transition = 'none';
    bar.style.width = '0%';
  }
}

function _clearAnimTimers() {
  _animTimers.forEach(id => clearTimeout(id));
  _animTimers = [];
}

function _removeSpotlight() {
  if (_spotObj) {
    _spotObj.dotEl.classList.remove('spotlighted');
    _spotObj.labelEl.classList.remove('spotlighted');
    _spotObj = null;
  }
}

function _applySpotlight(obj) {
  _removeSpotlight();
  obj.dotEl.classList.add('spotlighted');
  obj.labelEl.classList.add('spotlighted');
  _spotObj = obj;
}

function _updateButtons() {
  const playBtn = document.getElementById('anim-play-btn');
  const quitBtn = document.getElementById('anim-quit-btn');
  if (!_animStarted) {
    playBtn.textContent = '▶ Start';
    playBtn.disabled = false;
    quitBtn.classList.add('hidden');
  } else if (_animFinished) {
    playBtn.textContent = '✓ Finished';
    playBtn.disabled = true;
    quitBtn.classList.remove('hidden');
  } else if (_animPaused) {
    playBtn.textContent = '▶ Resume';
    playBtn.disabled = false;
    quitBtn.classList.remove('hidden');
  } else {
    playBtn.textContent = '⏸ Pause';
    playBtn.disabled = false;
    quitBtn.classList.remove('hidden');
  }
}

function _updateInfoPanel(idx) {
  const globalIdx = _flatList[idx];
  const obj = stationObjects[globalIdx];
  const total = _flatList.length;
  document.getElementById('anim-countdown').textContent = '';
  document.getElementById('anim-station-name').textContent = obj.data.name;
  document.getElementById('anim-meta').textContent = `${idx + 1} / ${total}`;

  const bar = document.getElementById('anim-progress-bar');
  if (bar) {
    bar.style.transition = 'none';
    bar.style.width = '0%';
    void bar.offsetWidth;
    bar.style.transition = `width ${ANIM_STATION_MS}ms linear`;
    bar.style.width = '100%';
  }
}

function _buildFlatList() {
  // Sort all stations with min data by min temp descending (hottest first)
  const withMin = stationObjects
    .map((o, i) => ({ i, min: o.data.min }))
    .filter(e => e.min != null)
    .sort((a, b) => b.min - a.min);
  _flatList = withMin.map(e => e.i);
}

function _doStep(idx) {
  if (!_animStarted || _animPaused) return;

  // Past the last station — hold spotlight on the last one; wait for manual quit
  if (idx >= _flatList.length) {
    _animFinished = true;
    _updateButtons();
    return;
  }

  _animIdx = idx;
  const globalIdx = _flatList[idx];
  const obj = stationObjects[globalIdx];
  animationActiveIdx = globalIdx;
  _applySpotlight(obj);
  _updateInfoPanel(idx);

  // Only schedule the next step if this is NOT the last station
  if (idx < _flatList.length - 1) {
    _animTimers.push(setTimeout(() => _doStep(idx + 1), ANIM_STATION_MS));
  } else {
    // Last station reached — mark finished but keep spotlight alive
    _animTimers.push(setTimeout(() => {
      _animFinished = true;
      _updateButtons();
    }, ANIM_STATION_MS));
  }
}

function quitAnimation() {
  _animStarted  = false;
  _animPaused   = false;
  _animFinished = false;
  _clearAnimTimers();
  _removeSpotlight();
  animationActiveIdx = null;  // restore all stations
  _updateButtons();
  document.getElementById('anim-info').classList.add('hidden');
}

function pauseAnimation() {
  _animPaused = true;
  _clearAnimTimers();
  _updateButtons();
}

function resumeAnimation() {
  _animPaused = false;
  _updateButtons();
  _doStep(_animIdx);
}

function startAnimation() {
  _buildFlatList();
  if (!_flatList.length) return;

  _animIdx      = -1;
  _animStarted  = true;
  _animPaused   = false;
  _animFinished = false;
  _updateButtons();

  const info = document.getElementById('anim-info');
  info.classList.remove('hidden');
  document.getElementById('anim-station-name').textContent = '';
  document.getElementById('anim-meta').textContent  = 'Starting in...';

  if (!document.getElementById('anim-progress-bar-wrap')) {
    const wrap = document.createElement('div'); wrap.id = 'anim-progress-bar-wrap';
    const bar  = document.createElement('div'); bar.id  = 'anim-progress-bar'; bar.style.width = '0%';
    wrap.appendChild(bar); info.appendChild(wrap);
  }

  const tick = (n) => {
    if (!_animStarted) return;
    const el = document.getElementById('anim-countdown');
    el.textContent = n;
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
    if (n > 1) {
      _animTimers.push(setTimeout(() => tick(n - 1), 1000));
    } else {
      // After showing "1" for 1 s, clear the digit, then wait 3 extra seconds
      // before revealing the first station card.
      _animTimers.push(setTimeout(() => {
        document.getElementById('anim-countdown').textContent = '';
      }, 1000));
      _animTimers.push(setTimeout(() => _doStep(0), 4000)); // 1 s + 3 s gap
    }
  };
  tick(3);
}

function togglePlayPause() {
  if (!_animStarted)    startAnimation();
  else if (_animPaused) resumeAnimation();
  else                  pauseAnimation();
}

// ─── Update overlay positions every frame ─────────────────────────────────────
const _camDir   = new THREE.Vector3();
const _stationN = new THREE.Vector3();

function updateOverlays() {
  camera.getWorldDirection(_camDir);

  for (let i = 0; i < stationObjects.length; i++) {
    const { dotEl, labelEl, worldPos } = stationObjects[i];

    // During animation, hide all stations except the spotlighted one
    if (animationActiveIdx !== null && i !== animationActiveIdx) {
      dotEl.style.visibility   = 'hidden';
      labelEl.style.visibility = 'hidden';
      continue;
    }

    // Hide if on the far side of the globe
    _stationN.copy(worldPos).normalize();
    if (_stationN.dot(_camDir) > 0.05) {
      dotEl.style.visibility   = 'hidden';
      labelEl.style.visibility = 'hidden';
      continue;
    }

    const sc = worldToScreen(worldPos);
    if (sc.behind) {
      dotEl.style.visibility   = 'hidden';
      labelEl.style.visibility = 'hidden';
      continue;
    }

    dotEl.style.visibility = 'visible';
    dotEl.style.left = sc.x + 'px';
    dotEl.style.top  = sc.y + 'px';

    labelEl.style.visibility = 'visible';
    labelEl.style.left = sc.x + 'px';
    labelEl.style.top  = sc.y + 'px';
  }
}

// ─── Hover & Click ────────────────────────────────────────────────────────────
function setupInteraction() {
  const raycaster = new THREE.Raycaster();
  const mouse     = new THREE.Vector2();
  let hoveredIdx  = -1;

  renderer.domElement.addEventListener('pointermove', (e) => {
    mouse.set(
      (e.clientX / window.innerWidth)  * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(stationObjects.map(o => o.mesh));

    if (hoveredIdx !== -1) {
      const prev = stationObjects[hoveredIdx];
      prev.labelEl.classList.remove('highlighted');
      prev.dotEl.classList.remove('dot-highlighted');
      hoveredIdx = -1;
    }

    if (hits.length > 0) {
      hoveredIdx = stationObjects.findIndex(o => o.mesh === hits[0].object);
      if (hoveredIdx !== -1) {
        const cur = stationObjects[hoveredIdx];
        cur.labelEl.classList.add('highlighted');
        cur.dotEl.classList.add('dot-highlighted');
        renderer.domElement.style.cursor = 'pointer';
      }
    } else {
      renderer.domElement.style.cursor = '';
    }
  });

  renderer.domElement.addEventListener('click', () => {
    if (hoveredIdx !== -1) showPopup(stationObjects[hoveredIdx].data);
  });

  document.getElementById('popup-close').addEventListener('click', () => {
    document.getElementById('station-popup').classList.add('hidden');
  });
}

function showPopup(station) {
  document.getElementById('popup-name').textContent = station.name;
  document.getElementById('popup-coords').textContent =
    `${station.lat.toFixed(3)}°N  ${station.lon.toFixed(3)}°E`;

  const tempsEl = document.getElementById('popup-temps');
  tempsEl.innerHTML = '';

  function makeRow(cls, label, val) {
    if (val == null) return;
    const row = document.createElement('div');
    row.className = `popup-temp-row ${cls}`;
    const lbl = document.createElement('div');
    lbl.className = 'popup-temp-label';
    lbl.textContent = label;
    const barWrap = document.createElement('div');
    barWrap.className = 'popup-temp-bar-wrap';
    const bar = document.createElement('div');
    bar.className = 'popup-temp-bar';
    bar.style.width = Math.max(0, Math.min(100, ((val + 30) / 75) * 100)) + '%';
    barWrap.appendChild(bar);
    const valEl = document.createElement('div');
    valEl.className = 'popup-temp-val';
    valEl.textContent = formatTemp(val);
    row.appendChild(lbl); row.appendChild(barWrap); row.appendChild(valEl);
    tempsEl.appendChild(row);
  }

  makeRow('row-min', 'Min', station.min);
  makeRow('row-max', 'Max', station.max);
  makeRow('row-avg', 'Avg', station.avg);

  if (!station.min && !station.max && !station.avg) {
    tempsEl.innerHTML = '<div style="color:rgba(150,180,220,0.5);font-size:12px;">No temperature data</div>';
  }

  document.getElementById('station-popup').classList.remove('hidden');
}

// ─── Resize ───────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── Animate ──────────────────────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  updateOverlays();
  renderer.render(scene, camera);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  setProgress(0.1);
  addStars();
  setProgress(0.2);
  addGlobe();
  addAtmosphere();
  setProgress(0.3);

  try {
    await addCoastlines(setProgress);
  } catch (e) {
    console.warn('Could not load coastlines:', e);
    setProgress(0.75);
  }

  setProgress(0.80);
  try {
    const res = await fetch('/api/stations');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const stations = await res.json();
    setProgress(0.90);
    addStations(stations);
  } catch (e) {
    console.error('Failed to load /api/stations:', e);
  }

  setupInteraction();
  document.getElementById('anim-play-btn').addEventListener('click', togglePlayPause);
  document.getElementById('anim-quit-btn').addEventListener('click', quitAnimation);

  const animationUi = document.getElementById('animation-ui');
  const animToggleBtn = document.getElementById('anim-toggle-btn');
  animToggleBtn.addEventListener('click', () => {
    const hidden = animationUi.classList.toggle('hidden');
    animToggleBtn.classList.toggle('active', !hidden);
  });

  // Clickable anim-info → open station list drawer
  document.getElementById('anim-info').addEventListener('click', openStationList);
  document.getElementById('station-list-close').addEventListener('click', closeStationList);
  document.getElementById('station-list-search').addEventListener('input', buildStationList);
  // Click on backdrop to close
  document.getElementById('station-list-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('station-list-overlay')) closeStationList();
  });

  // UI panel toggle — ☰ shows panels, ✕ hides them
  document.getElementById('ui-toggle-btn').addEventListener('click', () => {
    const visible = document.body.classList.toggle('ui-visible');
    document.getElementById('ui-toggle-btn').textContent = visible ? '✕' : '☰';
  });

  // Camera Goto panel toggle
  const gotoBtn   = document.getElementById('goto-btn');
  const gotoPanel = document.getElementById('goto-panel');
  gotoBtn.addEventListener('click', () => {
    const open = gotoPanel.classList.toggle('hidden');
    gotoBtn.classList.toggle('active', !open);
  });

  document.getElementById('goto-apply-btn').addEventListener('click', () => {
    const lat  = parseFloat(document.getElementById('goto-lat').value);
    const lon  = parseFloat(document.getElementById('goto-lon').value);
    const zoom = parseFloat(document.getElementById('goto-zoom').value);
    if (!isNaN(lat) && !isNaN(lon)) {
      const dist = (!isNaN(zoom) && zoom >= 1.15 && zoom <= 8) ? zoom : camera.position.length();
      gotoCamera(lat, lon, dist);
    }
    gotoPanel.classList.add('hidden');
    gotoBtn.classList.remove('active');
  });

  setProgress(1.0);

  setTimeout(() => {
    const ls = document.getElementById('loading-screen');
    ls.classList.add('fade-out');
    ls.addEventListener('transitionend', () => ls.remove(), { once: true });
  }, 400);

  animate();
}

// ─── Camera Goto ───────────────────────────────────────────────────────────────
// Smoothly moves the camera to face the given lat/lon at the given distance.
function gotoCamera(lat, lon, dist) {
  const target = latLonToVec3(lat, lon, dist);
  const start  = camera.position.clone();
  const startDist = start.length();
  const duration  = 900; // ms
  const t0 = performance.now();

  function step(now) {
    const t = Math.min((now - t0) / duration, 1);
    // ease-in-out cubic
    const e = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
    camera.position.lerpVectors(start, target, e);
    if (t < 1) requestAnimationFrame(step);
    else camera.position.copy(target);
  }
  requestAnimationFrame(step);
}

main();
