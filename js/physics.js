/* ═══════════════════════════════════════════════
   physics.js – Car physics & collision
   ═══════════════════════════════════════════════ */

const Physics = (() => {

  const SEG_LEN = 200;

  /* ── Car state ──────────────────────────────── */
  function createCar(isPlayer) {
    return {
      pos:        0,      // track position (units along track)
      x:          0,      // lateral offset -1 to 1
      speed:      0,
      maxSpeed:   0,
      accel:      0,
      brake:      0,
      friction:   0,
      turnRate:   0,
      sliding:    false,
      slideDX:    0,
      spinTimer:  0,
      offroad:    false,
      isPlayer,
      color:      '#e74c3c',
      lane:       (Math.random() - .5) * .6
    };
  }

  /* ── Player config per level ────────────────── */
  function configPlayer(car, level) {
    const spd = level.trackSpeed;
    car.maxSpeed  = 280 * spd;
    car.accel     = 160 * spd;
    car.brake     = 260 * spd;
    car.friction  = 95  * spd;
    car.turnRate  = 1.4;
    car.speed     = 0;
    car.pos       = 0;
    car.x         = 0;
    car.sliding   = false;
    car.spinTimer = 0;
  }

  const AI_COLORS = ['#e74c3c','#e67e22','#9b59b6','#1abc9c','#e91e63','#f1c40f'];

  /* ── AI cars ────────────────────────────────── */
  function createAICars(level) {
    const cars = [];
    for (let i = 0; i < level.aiCars; i++) {
      const c   = createCar(false);
      const spd = level.trackSpeed;
      c.maxSpeed = (200 + Math.random() * 60) * spd;
      c.accel    = 130 * spd;
      c.brake    = 200 * spd;
      c.friction = 80;
      c.pos      = -(i + 1) * SEG_LEN * 4;
      c.lane     = (i % 2 === 0 ? 1 : -1) * (.2 + Math.random() * .25);
      c.color    = AI_COLORS[i % AI_COLORS.length];
      cars.push(c);
    }
    return cars;
  }

  /* ── Input state ────────────────────────────── */
  const keys = { up:false, down:false, left:false, right:false };

  function bindKeys() {
    window.addEventListener('keydown', e => {
      if (e.key === 'ArrowUp'   || e.key === 'w') keys.up    = true;
      if (e.key === 'ArrowDown' || e.key === 's') keys.down  = true;
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.left  = true;
      if (e.key === 'ArrowRight'|| e.key === 'd') keys.right = true;
      if (e.key === ' ')                           keys.down  = true;
    });
    window.addEventListener('keyup', e => {
      if (e.key === 'ArrowUp'   || e.key === 'w') keys.up    = false;
      if (e.key === 'ArrowDown' || e.key === 's') keys.down  = false;
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.left  = false;
      if (e.key === 'ArrowRight'|| e.key === 'd') keys.right = false;
      if (e.key === ' ')                           keys.down  = false;
    });
    // D-Pad
    ['up','down','left','right'].forEach(dir => {
      const btn = document.getElementById('dpad-' + dir);
      if (!btn) return;
      btn.addEventListener('pointerdown', () => { keys[dir] = true;  btn.classList.add('pressed');    });
      btn.addEventListener('pointerup',   () => { keys[dir] = false; btn.classList.remove('pressed'); });
      btn.addEventListener('pointerleave',() => { keys[dir] = false; btn.classList.remove('pressed'); });
    });
    const brakeBtn = document.getElementById('dpad-brake');
    if (brakeBtn) {
      brakeBtn.addEventListener('pointerdown', () => keys.down = true);
      brakeBtn.addEventListener('pointerup',   () => keys.down = false);
    }
  }

  /* ── Update player ──────────────────────────── */
  function updatePlayer(car, dt, level, segments, trackLen) {
    if (car.spinTimer > 0) {
      car.spinTimer -= dt;
      car.x += car.slideDX * dt;
      car.speed *= .96;
      return;
    }

    // Acceleration / braking
    if (keys.up && !keys.down) {
      car.speed = Math.min(car.speed + car.accel * dt, car.maxSpeed);
    } else if (keys.down) {
      car.speed = Math.max(car.speed - car.brake * dt, 0);
    } else {
      car.speed = Math.max(car.speed - car.friction * dt, 0);
    }

    // Rain grip penalty
    let grip = 1;
    if (level.rain) grip *= .72;

    // Steering
    const speedFactor = car.speed / car.maxSpeed;
    if (keys.left)  car.x -= car.turnRate * speedFactor * grip * dt;
    if (keys.right) car.x += car.turnRate * speedFactor * grip * dt;

    // Off-road
    if (Math.abs(car.x) > 1) {
      car.speed *= (1 - 2.5 * dt);
      car.x     *= .98;
    }

    // Advance position
    car.pos += car.speed * dt;
    if (car.pos < 0) car.pos = 0;

    // Clamp x
    car.x = Math.max(-1.2, Math.min(1.2, car.x));

    // Hazard collision
    checkHazards(car, level, segments, trackLen);
  }

  /* ── Hazard collision ───────────────────────── */
  function checkHazards(car, level, segments, trackLen) {
    const segIdx = Math.floor((car.pos % trackLen) / Renderer.SEG_LENGTH) % segments.length;
    const seg    = segments[segIdx];
    if (!seg || !seg.hazard) return;

    const lateralDiff = Math.abs(car.x - seg.hazard.offset);

    if (seg.hazard.type === 'rock' || seg.hazard.type === 'log') {
      if (lateralDiff < .35) {
        // Spin out
        car.spinTimer = 1.1;
        car.slideDX   = (Math.random() - .5) * 1.8;
        car.speed    *= .3;
        emitHitEffect();
      }
    } else if (seg.hazard.type === 'oil') {
      if (lateralDiff < .55) {
        car.x       += (Math.random() - .5) * .8 * car.speed / car.maxSpeed;
        car.sliding  = true;
        setTimeout(()=>{ car.sliding = false; }, 1200);
      }
    } else if (seg.hazard.type === 'ice') {
      if (lateralDiff < .65) {
        // Slide momentum
        if (car.x < seg.hazard.offset) car.x -= .012 * car.speed / car.maxSpeed;
        else                           car.x += .012 * car.speed / car.maxSpeed;
      }
    }
  }

  let _hitCb = null;
  function onHit(cb) { _hitCb = cb; }
  function emitHitEffect() { if (_hitCb) _hitCb(); }

  /* ── Update AI ──────────────────────────────── */
  function updateAI(cars, dt, trackLen, player) {
    for (const car of cars) {
      // Simple rubber-band AI
      const gap = player.pos - car.pos;
      let targetSpeed = car.maxSpeed;
      if (gap > 2000)  targetSpeed *= 1.08; // catch up
      if (gap < 500)   targetSpeed *= .9;   // back off a bit
      targetSpeed = Math.min(targetSpeed, car.maxSpeed * 1.1);

      if (car.speed < targetSpeed) car.speed = Math.min(car.speed + car.accel * dt, targetSpeed);
      else                         car.speed = Math.max(car.speed - car.brake  * dt, 0);

      car.pos += car.speed * dt;
      if (car.pos < 0) car.pos = 0;

      // Gentle lane weave
      car.lane += (Math.sin(car.pos * .001 + car.lane) * .015);
      car.lane   = Math.max(-.7, Math.min(.7, car.lane));
    }
  }

  /* ── Lap counting ───────────────────────────── */
  function getLap(pos, trackLen) {
    return Math.floor(pos / trackLen) + 1;
  }
  function getLapProgress(pos, trackLen) {
    return (pos % trackLen) / trackLen;
  }

  return {
    createCar, configPlayer, createAICars,
    updatePlayer, updateAI,
    bindKeys, keys, onHit,
    getLap, getLapProgress
  };
})();
