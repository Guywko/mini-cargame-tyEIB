/* ═══════════════════════════════════════════════
   game.js – Main controller, game loop, UI
   ═══════════════════════════════════════════════ */

const Game = (() => {

  let currentLevel = 0;
  let gameState    = 'menu';
  let player       = null;
  let aiCars       = [];
  let segments     = [];
  let trackLen     = 0;
  let lap          = 1;
  let raceTime     = 0;
  let lastTime     = 0;
  let raceStarted  = false;
  let countdownVal = 3;
  let countdownTick= 0;
  let finished     = false;

  const TRACK_SEGS = 400;
  const screens    = {};
  const hud        = {};

  function queryDom() {
    ['main-menu','tutorial','game','result','credits'].forEach(id => {
      screens[id] = document.getElementById('screen-'+id);
    });
    hud.speed  = document.getElementById('hud-speed');
    hud.timer  = document.getElementById('hud-timer');
    hud.lap    = document.getElementById('hud-lap-num');
    hud.lapTot = document.getElementById('hud-lap-total');
    hud.lvl    = document.getElementById('hud-lvl-num');
    hud.target = document.getElementById('hud-target-time');

    /* Flash overlay */
    if (!document.getElementById('flash')) {
      const f=document.createElement('div');
      f.id='flash';
      f.style.cssText='position:fixed;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:100;transition:opacity .25s;';
      document.body.appendChild(f);
    }

    /* Countdown overlay inside game screen */
    const gameScr = document.getElementById('screen-game');
    if (!document.getElementById('countdown-text')) {
      const wrap=document.createElement('div');
      wrap.style.cssText='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:20;';
      const t=document.createElement('div');
      t.id='countdown-text';
      t.style.cssText="font-family:'Bangers',cursive;font-size:clamp(5rem,18vw,11rem);color:#ffe034;text-shadow:0 0 40px rgba(255,224,52,.8),4px 4px 0 #000,8px 8px 0 rgba(0,0,0,.4);display:none;";
      wrap.appendChild(t); gameScr.appendChild(wrap);
    }
  }

  function showScreen(id) {
    Object.values(screens).forEach(s => s && s.classList.remove('active'));
    if (screens[id]) screens[id].classList.add('active');
    gameState = id;
  }

  function doFlash() {
    const el=document.getElementById('flash'); if(!el)return;
    el.style.opacity='1'; setTimeout(()=>{el.style.opacity='0';},160);
  }

  function init() {
    queryDom();
    Renderer.init();
    Physics.bindKeys();

    document.getElementById('btn-start').addEventListener('click', ()=>goToTutorial(0));
    document.getElementById('btn-credits').addEventListener('click', ()=>showScreen('credits'));
    document.getElementById('btn-credits-back').addEventListener('click', ()=>showScreen('main-menu'));
    document.getElementById('btn-go').addEventListener('click', startRace);
    document.getElementById('btn-next').addEventListener('click', ()=>{
      if(currentLevel < LEVELS.length-1){ currentLevel++; goToTutorial(currentLevel); }
      else showScreen('main-menu');
    });
    document.getElementById('btn-retry').addEventListener('click', ()=>goToTutorial(currentLevel));
    document.getElementById('btn-menu').addEventListener('click',  ()=>showScreen('main-menu'));

    Physics.onHit(onCollision);
    showScreen('main-menu');
    requestAnimationFrame(loop);
  }

  function goToTutorial(idx) {
    currentLevel = idx;
    const lvl = LEVELS[idx], tut = lvl.tutorial;
    document.getElementById('tut-badge').textContent = 'LVL '+lvl.id;
    document.getElementById('tut-title').textContent = tut.title;
    document.getElementById('tut-body').textContent  = tut.body;
    document.getElementById('tut-tips').innerHTML    = tut.tips.map(t=>'<div>'+t+'</div>').join('');
    showScreen('tutorial');
  }

  function startRace() {
    doFlash();
    const lvl = LEVELS[currentLevel];
    Renderer.setEnv(lvl.environment);
    segments = Renderer.buildTrack(TRACK_SEGS, lvl);
    trackLen = TRACK_SEGS * Renderer.SEG_LENGTH;

    player   = Physics.createCar(true);
    Physics.configPlayer(player, lvl);
    aiCars   = Physics.createAICars(lvl);

    lap          = 1;
    raceTime     = 0;
    lastTime     = 0;
    finished     = false;
    raceStarted  = false;
    countdownVal = 3;
    countdownTick= 0;

    hud.lvl.textContent    = lvl.id;
    hud.lapTot.textContent = lvl.laps;
    hud.target.textContent = lvl.targetTime+'s';

    showScreen('game');
    showCountNum(3);
  }

  function showCountNum(n) {
    const el = document.getElementById('countdown-text'); if(!el)return;
    el.style.display = 'block';
    el.textContent   = n === 0 ? 'GO!' : String(n);
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.cssText += ';animation:countPop .55s ease-out;';
    if (n === 0) {
      setTimeout(()=>{ el.style.display='none'; raceStarted=true; }, 700);
    }
  }

  /* ── Main loop ── */
  let _raf = null;
  function loop(ts) {
    _raf = requestAnimationFrame(loop);
    if (gameState !== 'game') return;

    const dt = Math.min((ts-(lastTime||ts))/1000, .05);
    lastTime = ts;

    const lvl = LEVELS[currentLevel];

    /* Countdown phase */
    if (!raceStarted) {
      countdownTick += dt;
      if (countdownTick >= 1) {
        countdownTick = 0;
        countdownVal--;
        if (countdownVal >= 0) showCountNum(countdownVal);
      }
      Renderer.draw(player.pos, player.x, 0, lvl, aiCars);
      return;
    }

    raceTime += dt;
    Physics.updatePlayer(player, dt, lvl, segments, trackLen);
    Physics.updateAI(aiCars, dt, trackLen, player);

    /* Lap tracking */
    const newLap = Math.min(Physics.getLap(player.pos, trackLen), lvl.laps);
    if (newLap > lap) lap = newLap;

    /* Finish */
    if (!finished && player.pos >= trackLen * lvl.laps) {
      finished = true;
      setTimeout(showResult, 700);
    }

    /* HUD */
    const kmh = Math.round(player.speed * 3.6);
    hud.speed.innerHTML = kmh+' <span>km/h</span>';
    hud.timer.innerHTML = raceTime.toFixed(2)+'<span>s</span>';
    hud.lap.textContent = lap;

    /* Speed lines */
    updateSpeedLines(player.speed / player.maxSpeed);

    Renderer.draw(player.pos, player.x, 0, lvl, aiCars);
  }

  /* Speed lines overlay */
  let slCanvas = null;
  function updateSpeedLines(ratio) {
    if (!slCanvas) {
      slCanvas = document.createElement('canvas');
      slCanvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:5;';
      document.getElementById('screen-game').appendChild(slCanvas);
    }
    const W = window.innerWidth, H = window.innerHeight;
    if (slCanvas.width !== W) { slCanvas.width=W; slCanvas.height=H; }
    const ctx = slCanvas.getContext('2d');
    ctx.clearRect(0,0,W,H);
    if (ratio < .72) return;
    const alpha = Math.min((ratio-.72)/.28, 1)*.38;
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    const cx=W/2,cy=H/2,r1=Math.min(W,H)*.32,r2=Math.min(W,H)*.68;
    for(let i=0;i<22;i++){
      const a=i/22*Math.PI*2;
      ctx.lineWidth=.8+Math.sin(i*5.3)*.4;
      ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);ctx.lineTo(cx+Math.cos(a)*r2,cy+Math.sin(a)*r2);ctx.stroke();
    }
  }

  function onCollision() {
    doFlash();
    const cvs = document.getElementById('gameCanvas');
    if (!cvs) return;
    cvs.style.transition='transform .04s';
    cvs.style.transform=`translate(${(Math.random()-.5)*9}px,${(Math.random()-.5)*9}px)`;
    setTimeout(()=>{cvs.style.transform='none';},90);
  }

  function showResult() {
    const lvl  = LEVELS[currentLevel];
    const diff = raceTime - lvl.targetTime;
    const stars = diff < -5 ? 3 : diff < 5 ? 2 : diff < 15 ? 1 : 0;
    const passed = stars >= 1;

    document.getElementById('result-icon').textContent  = passed ? '🏆' : '💨';
    document.getElementById('result-title').textContent = passed ? 'LEVEL CLEAR!' : 'TRY AGAIN!';
    document.getElementById('result-stars').textContent = '★'.repeat(stars)+'☆'.repeat(3-stars);
    document.getElementById('result-stats').innerHTML   = `
      <div>Your time: <strong>${raceTime.toFixed(2)}s</strong></div>
      <div>Target: <strong>${lvl.targetTime}s</strong></div>
      <div>${diff<0?'🏁 '+Math.abs(diff).toFixed(2)+'s UNDER target!':'⏱ '+diff.toFixed(2)+'s over target'}</div>
      <div>Level: <strong>${lvl.id} / ${LEVELS.length}</strong></div>
    `;
    const nextBtn = document.getElementById('btn-next');
    nextBtn.textContent = currentLevel >= LEVELS.length-1 ? '🏆 CHAMPION!' : 'NEXT LEVEL ▶';
    showScreen('result');
  }

  return { init };
})();

window.addEventListener('DOMContentLoaded', ()=>Game.init());
})();

window.addEventListener('DOMContentLoaded', () => Game.init());
