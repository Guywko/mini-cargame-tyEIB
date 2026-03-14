/* ═══════════════════════════════════════════════
   game.js – Main controller, game loop, UI
   ═══════════════════════════════════════════════ */

const Game = (() => {

  // ── State ──────────────────────────────────────
  let currentLevel   = 0;   // index into LEVELS[]
  let gameState      = 'menu'; // menu | tutorial | countdown | racing | result
  let player         = null;
  let aiCars         = [];
  let segments       = [];
  let trackLen       = 0;
  let lap            = 1;
  let raceTime       = 0;
  let lastTime       = 0;
  let animFrameId    = null;
  let raceStarted    = false;
  let countdownVal   = 3;
  let countdownTimer = 0;
  let finished       = false;
  let speedLinesEl   = null;

  const TRACK_SEGS   = 400;

  // ── DOM refs ───────────────────────────────────
  const screens  = {};
  const hud      = {};

  function queryDom() {
    ['main-menu','tutorial','game','result','credits'].forEach(id => {
      screens[id] = document.getElementById('screen-' + id);
    });
    hud.speed   = document.getElementById('hud-speed');
    hud.timer   = document.getElementById('hud-timer');
    hud.lap     = document.getElementById('hud-lap-num');
    hud.lapTot  = document.getElementById('hud-lap-total');
    hud.lvl     = document.getElementById('hud-lvl-num');
    hud.target  = document.getElementById('hud-target-time');

    // Create overlay elements dynamically
    const gameScr = document.getElementById('screen-game');
    speedLinesEl  = document.createElement('canvas');
    speedLinesEl.id = 'speed-lines';
    speedLinesEl.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:5;opacity:0;transition:opacity .2s;';
    gameScr.appendChild(speedLinesEl);

    const flash   = document.createElement('div');
    flash.id = 'flash';
    flash.style.cssText = 'position:fixed;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:100;transition:opacity .3s;';
    document.body.appendChild(flash);

    const cdDiv   = document.createElement('div');
    cdDiv.id = 'countdown';
    cdDiv.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:20;';
    const cdTxt  = document.createElement('div');
    cdTxt.id = 'countdown-text';
    cdTxt.style.cssText = `
      font-family:'Bangers',cursive;font-size:clamp(5rem,20vw,12rem);
      color:#ffe034;text-shadow:0 0 40px rgba(255,224,52,.8),4px 4px 0 #000;
      display:none;
    `;
    cdDiv.appendChild(cdTxt);
    gameScr.appendChild(cdDiv);
  }

  // ── Screen helpers ─────────────────────────────
  function showScreen(id) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    if (screens[id]) screens[id].classList.add('active');
    gameState = id === 'game' ? 'racing' : id;
  }

  function flash() {
    const el = document.getElementById('flash');
    if (!el) return;
    el.style.opacity = '1';
    setTimeout(() => { el.style.opacity = '0'; }, 150);
  }

  // ── Init ───────────────────────────────────────
  function init() {
    queryDom();
    Renderer.init();
    Physics.bindKeys();

    // Buttons
    document.getElementById('btn-start').addEventListener('click', () => goToTutorial(0));
    document.getElementById('btn-credits').addEventListener('click', () => showScreen('credits'));
    document.getElementById('btn-credits-back').addEventListener('click', () => showScreen('main-menu'));
    document.getElementById('btn-go').addEventListener('click', startRace);
    document.getElementById('btn-next').addEventListener('click', () => {
      if (currentLevel < LEVELS.length - 1) { currentLevel++; goToTutorial(currentLevel); }
      else showScreen('main-menu');
    });
    document.getElementById('btn-retry').addEventListener('click', () => goToTutorial(currentLevel));
    document.getElementById('btn-menu').addEventListener('click', () => showScreen('main-menu'));

    Physics.onHit(onCollision);
    showScreen('main-menu');
    requestAnimationFrame(loop);
  }

  // ── Tutorial ───────────────────────────────────
  function goToTutorial(idx) {
    currentLevel = idx;
    const lvl  = LEVELS[idx];
    const tut  = lvl.tutorial;

    document.getElementById('tut-badge').textContent = `LVL ${lvl.id}`;
    document.getElementById('tut-title').textContent  = tut.title;
    document.getElementById('tut-body').textContent   = tut.body;

    const tipsEl = document.getElementById('tut-tips');
    tipsEl.innerHTML = tut.tips.map(t => `<div>${t}</div>`).join('');

    showScreen('tutorial');
  }

  // ── Start race ─────────────────────────────────
  function startRace() {
    flash();
    const lvl = LEVELS[currentLevel];

    // Setup track
    Renderer.setEnv(lvl.environment);
    segments  = Renderer.buildTrack(TRACK_SEGS, lvl);
    trackLen  = TRACK_SEGS * Renderer.SEG_LENGTH;

    // Player
    player = Physics.createCar(true);
    Physics.configPlayer(player, lvl);

    // AI
    aiCars = Physics.createAICars(lvl);

    lap       = 1;
    raceTime  = 0;
    finished  = false;
    raceStarted = false;
    countdownVal   = 3;
    countdownTimer = 0;

    hud.lvl.textContent    = lvl.id;
    hud.lapTot.textContent = lvl.laps;
    hud.target.textContent = lvl.targetTime + 's';

    showScreen('game');
    startCountdown();
  }

  // ── Countdown ──────────────────────────────────
  function startCountdown() {
    countdownVal   = 3;
    countdownTimer = 0;
    showCountdownNum(3);
  }

  function showCountdownNum(n) {
    const el = document.getElementById('countdown-text');
    if (!el) return;
    el.style.display = 'block';
    el.textContent   = n === 0 ? 'GO!' : n;
    el.style.animation = 'none';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.animation = 'countPop .6s ease-out';
      });
    });
    if (n === 0) {
      setTimeout(() => { el.style.display = 'none'; raceStarted = true; }, 700);
    }
  }

  // ── Game loop ──────────────────────────────────
  function loop(ts) {
    animFrameId = requestAnimationFrame(loop);
    const dt   = Math.min((ts - (lastTime || ts)) / 1000, .05);
    lastTime   = ts;

    if (gameState !== 'racing') return;

    const lvl = LEVELS[currentLevel];

    // Countdown logic
    if (!raceStarted) {
      countdownTimer += dt;
      if (countdownTimer >= 1) {
        countdownTimer = 0;
        countdownVal--;
        if (countdownVal >= 0) showCountdownNum(countdownVal);
      }
      // Render static frame during countdown
      Renderer.draw(player.pos, player.x, 0, lvl, aiCars);
      return;
    }

    // Race update
    raceTime += dt;

    Physics.updatePlayer(player, dt, lvl, segments, trackLen);
    Physics.updateAI(aiCars, dt, trackLen, player);

    // Lap check
    const newLap = Physics.getLap(player.pos, trackLen);
    if (newLap > lap && newLap <= lvl.laps) {
      lap = newLap;
    }

    // Finish check
    if (!finished && player.pos >= trackLen * lvl.laps) {
      finished = true;
      setTimeout(showResult, 600);
    }

    // HUD
    const kmh = Math.round(player.speed * 3.6);
    hud.speed.innerHTML   = `${kmh} <span>km/h</span>`;
    hud.timer.innerHTML   = `${raceTime.toFixed(2)}<span>s</span>`;
    hud.lap.textContent   = Math.min(lap, lvl.laps);

    // Speed lines
    updateSpeedLines(player.speed / player.maxSpeed);

    // Render
    Renderer.draw(player.pos, player.x, 0, lvl, aiCars);
  }

  // ── Speed lines ────────────────────────────────
  function updateSpeedLines(ratio) {
    if (!speedLinesEl) return;
    const W = window.innerWidth, H = window.innerHeight;
    if (speedLinesEl.width !== W) { speedLinesEl.width = W; speedLinesEl.height = H; }
    const ctx = speedLinesEl.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    if (ratio < .7) { speedLinesEl.style.opacity = '0'; return; }

    speedLinesEl.style.opacity = String(Math.min((ratio - .7) / .3, 1) * .4);
    ctx.strokeStyle = 'rgba(255,255,255,.6)';
    const cx = W/2, cy = H/2;
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const r1 = Math.min(W,H) * .35;
      const r2 = Math.min(W,H) * .7;
      ctx.lineWidth = 1 + Math.sin(i * 5.3) * .5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle)*r1, cy + Math.sin(angle)*r1);
      ctx.lineTo(cx + Math.cos(angle)*r2, cy + Math.sin(angle)*r2);
      ctx.stroke();
    }
  }

  // ── Collision flash ────────────────────────────
  function onCollision() {
    flash();
    // Screen shake
    const canvas = document.getElementById('gameCanvas');
    canvas.style.transition = 'transform .05s';
    canvas.style.transform  = `translate(${(Math.random()-0.5)*10}px,${(Math.random()-0.5)*10}px)`;
    setTimeout(() => { canvas.style.transform = 'none'; }, 100);
  }

  // ── Result screen ──────────────────────────────
  function showResult() {
    const lvl      = LEVELS[currentLevel];
    const time     = raceTime;
    const target   = lvl.targetTime;
    const diff     = time - target;
    const stars    = diff < -5 ? 3 : diff < 5 ? 2 : diff < 15 ? 1 : 0;
    const passed   = stars >= 1;

    document.getElementById('result-icon').textContent  = passed ? '🏆' : '💨';
    document.getElementById('result-title').textContent = passed ? 'LEVEL CLEAR!' : 'TRY AGAIN!';

    document.getElementById('result-stars').textContent =
      '★'.repeat(stars) + '☆'.repeat(3 - stars);

    document.getElementById('result-stats').innerHTML = `
      <div>Your time: <strong>${time.toFixed(2)}s</strong></div>
      <div>Target:     <strong>${target}s</strong></div>
      <div>${diff < 0 ? `🏁 ${Math.abs(diff).toFixed(2)}s UNDER target!` : `⏱ ${diff.toFixed(2)}s over target`}</div>
      <div>Level: <strong>${lvl.id} / ${LEVELS.length}</strong></div>
    `;

    const nextBtn = document.getElementById('btn-next');
    if (currentLevel >= LEVELS.length - 1) {
      nextBtn.textContent = '🏆 CHAMPION!';
    } else {
      nextBtn.textContent = 'NEXT LEVEL ▶';
    }

    showScreen('result');
  }

  // ── Expose ─────────────────────────────────────
  return { init };
})();

window.addEventListener('DOMContentLoaded', () => Game.init());
