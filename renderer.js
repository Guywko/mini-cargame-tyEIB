/* ═══════════════════════════════════════════════
   renderer.js – Pseudo-3D track renderer
   Based on sprite-scaling technique (like OutRun)
   ═══════════════════════════════════════════════ */

const Renderer = (() => {

  // ── Constants ──────────────────────────────────
  const SCREEN_H    = 600;
  const SCREEN_W    = 800;
  const CAMERA_D    = 0.84;      // camera depth
  const SEG_LENGTH  = 200;       // length of each road segment
  const DRAW_DIST   = 200;       // segments visible
  const ROAD_W_BASE = 2000;      // base road width at horizon

  // ── State ──────────────────────────────────────
  let canvas, ctx, minimap, mctx;
  let palette = ENV_PALETTES.meadow;
  let segments = [];
  let envName   = 'meadow';

  // ── Init ───────────────────────────────────────
  function init() {
    canvas  = document.getElementById('gameCanvas');
    ctx     = canvas.getContext('2d');
    minimap = document.getElementById('minimapCanvas');
    mctx    = minimap.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  // ── Build track segments ────────────────────────
  function buildTrack(numSegments, levelCfg) {
    segments = [];
    const curves = generateCurves(numSegments, levelCfg.id);
    for (let i = 0; i < numSegments; i++) {
      const seg = {
        index:  i,
        curve:  curves[i],
        y:      0,
        color:  i % 2 === 0 ? 'dark' : 'light',
        hazard: null
      };
      // Place obstacles
      if (levelCfg.obstacles.length && i > 20 && i % 18 === 0) {
        const type = levelCfg.obstacles[Math.floor(Math.random() * levelCfg.obstacles.length)];
        seg.hazard = { type, offset: (Math.random() - .5) * .6 };
      }
      // Oil slick
      if (levelCfg.oilSlicks && i > 30 && i % 22 === 0) {
        seg.hazard = { type: 'oil', offset: (Math.random() - .5) * .5 };
      }
      // Ice patch
      if (levelCfg.icePatches && i > 40 && i % 15 === 0) {
        seg.hazard = { type: 'ice', offset: (Math.random() - .5) * .4 };
      }
      segments.push(seg);
    }
    return segments;
  }

  function generateCurves(n, seed) {
    const curves = new Array(n).fill(0);
    const rng = mulberry32(seed * 1337);
    let sections = Math.floor(n / 30);
    for (let s = 0; s < sections; s++) {
      const start  = Math.floor(rng() * n);
      const length = 20 + Math.floor(rng() * 30);
      const amount = (rng() - .5) * 3;
      for (let i = start; i < start + length && i < n; i++) {
        curves[i] += amount;
      }
    }
    return curves;
  }

  function mulberry32(a) {
    return function() {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // ── Main draw ──────────────────────────────────
  function draw(playerPos, playerX, cameraHeight, levelCfg, cars) {
    const W = canvas.width;
    const H = canvas.height;

    palette = ENV_PALETTES[envName] || ENV_PALETTES.meadow;

    ctx.clearRect(0, 0, W, H);

    // Sky gradient
    const skyGrd = ctx.createLinearGradient(0, 0, 0, H * .52);
    skyGrd.addColorStop(0, palette.sky[0]);
    skyGrd.addColorStop(1, palette.sky[1]);
    ctx.fillStyle = skyGrd;
    ctx.fillRect(0, 0, W, H * .52);

    // Environment decorations (clouds, stars, etc.)
    drawEnvDecorations(ctx, W, H, envName, playerPos);

    // Ground
    const groundGrd = ctx.createLinearGradient(0, H * .48, 0, H);
    groundGrd.addColorStop(0, palette.ground);
    groundGrd.addColorStop(1, darken(palette.ground, .7));
    ctx.fillStyle = groundGrd;
    ctx.fillRect(0, H * .48, W, H * .52);

    // Road projection
    const horizonY = H * .5;
    const segN     = segments.length;
    const trackW   = levelCfg.trackWidth * (W / 800);

    let camX       = 0;
    let x          = 0;
    let dx         = 0;
    const startSeg = Math.floor(playerPos / SEG_LENGTH) % segN;

    // Collect sprites for back-to-front rendering
    const sprites = [];

    for (let n = 0; n < DRAW_DIST; n++) {
      const segIdx = (startSeg + n) % segN;
      const seg    = segments[segIdx];

      const t      = n / DRAW_DIST;
      const scale  = CAMERA_D / (t + CAMERA_D);
      const roadW  = scale * trackW;
      const y      = horizonY + (scale - CAMERA_D / (DRAW_DIST + CAMERA_D)) * (H * .5);
      const segY   = horizonY + (1 - scale) * (H * .5) / DRAW_DIST;

      const centreX = (W / 2) + x * scale * W * .5 - playerX * roadW * 2;

      // Save projection data for this segment
      seg._projY     = y;
      seg._projW     = roadW;
      seg._projX     = centreX;
      seg._projScale = scale;

      if (n === 0) { seg._prevY = H; seg._prevW = roadW * 1.05; seg._prevX = centreX; }
      else {
        const ps = segments[(startSeg + n - 1) % segN];
        seg._prevY = ps._projY || H;
        seg._prevW = ps._projW || roadW;
        seg._prevX = ps._projX || centreX;
      }

      // Draw road segment strip
      if (y < H) {
        drawSegment(ctx, W, H, seg, n, levelCfg.fog, n / DRAW_DIST);
      }

      // Collect hazard sprites
      if (seg.hazard && n > 2) {
        sprites.push({
          type:   seg.hazard.type,
          offset: seg.hazard.offset,
          x:      centreX + seg.hazard.offset * roadW * 2,
          y:      y,
          scale:  scale,
          seg
        });
      }

      x  += seg.curve;
      dx += seg.curve;
    }

    // Collect car sprites
    for (const car of (cars || [])) {
      const dist = Math.abs(car.pos - playerPos);
      if (dist < DRAW_DIST * SEG_LENGTH) {
        const n = Math.floor(dist / SEG_LENGTH);
        if (n < DRAW_DIST && n > 0) {
          const t     = n / DRAW_DIST;
          const scale = CAMERA_D / (t + CAMERA_D);
          const seg   = segments[(startSeg + n) % segN];
          if (seg && seg._projX !== undefined) {
            const ahead = car.pos > playerPos;
            sprites.push({
              type:   'car',
              color:  car.color || '#e74c3c',
              x:      seg._projX + car.lane * seg._projW * 2,
              y:      seg._projY,
              scale,
              ahead
            });
          }
        }
      }
    }

    // Sort sprites far-to-near and draw
    sprites.sort((a, b) => a.scale - b.scale);
    for (const sp of sprites) drawSprite(ctx, sp, envName);

    // Player car (always centered bottom)
    drawPlayerCar(ctx, W, H, playerX);

    // Rain overlay
    if (levelCfg.rain) drawRain(ctx, W, H, playerPos);

    // Fog overlay
    if (levelCfg.fog) drawFogOverlay(ctx, W, H, envName);

    // Minimap
    drawMinimap(mctx, playerPos, cars, segments, levelCfg.laps);
  }

  // ── Road segment strip ─────────────────────────
  function drawSegment(ctx, W, H, seg, n, fog, fogT) {
    const isDark = seg.color === 'dark';
    const y1 = seg._projY, y2 = seg._prevY;
    const w1 = seg._projW, w2 = seg._prevW;
    const x1 = seg._projX, x2 = seg._prevX;

    // Grass strips far
    if (y1 < H && y2 > y1) {
      ctx.fillStyle = isDark ? darken(palette.ground, .88) : palette.ground;
      ctx.beginPath();
      ctx.moveTo(0, y1); ctx.lineTo(W, y1);
      ctx.lineTo(W, y2); ctx.lineTo(0, y2);
      ctx.fill();
    }

    // Road surface
    const fogFactor = fog ? Math.max(0, 1 - fogT * 2) : 1;
    const alpha     = fogFactor;
    ctx.globalAlpha = alpha;

    ctx.fillStyle = isDark ? darken(palette.road, .85) : palette.road;
    ctx.beginPath();
    ctx.moveTo(x1 - w1, y1); ctx.lineTo(x1 + w1, y1);
    ctx.lineTo(x2 + w2, y2); ctx.lineTo(x2 - w2, y2);
    ctx.fill();

    // Road edge / kerb stripes
    const kW1 = w1 * .12, kW2 = w2 * .12;
    ctx.fillStyle = isDark ? '#e74c3c' : '#fff';
    // left kerb
    ctx.beginPath();
    ctx.moveTo(x1 - w1, y1); ctx.lineTo(x1 - w1 + kW1, y1);
    ctx.lineTo(x2 - w2 + kW2, y2); ctx.lineTo(x2 - w2, y2);
    ctx.fill();
    // right kerb
    ctx.beginPath();
    ctx.moveTo(x1 + w1 - kW1, y1); ctx.lineTo(x1 + w1, y1);
    ctx.lineTo(x2 + w2, y2); ctx.lineTo(x2 + w2 - kW2, y2);
    ctx.fill();

    // Centre dashes
    if (isDark && n % 2 === 0) {
      const dw1 = w1 * .05, dw2 = w2 * .05;
      ctx.fillStyle = palette.stripe;
      ctx.beginPath();
      ctx.moveTo(x1 - dw1, y1); ctx.lineTo(x1 + dw1, y1);
      ctx.lineTo(x2 + dw2, y2); ctx.lineTo(x2 - dw2, y2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  // ── Sprites ────────────────────────────────────
  function drawSprite(ctx, sp, env) {
    const s = sp.scale * 1.5;
    const w = 40 * s;
    const h = 40 * s;
    const cx = sp.x;
    const cy = sp.y;

    if (sp.type === 'rock') {
      ctx.save();
      ctx.translate(cx, cy - h * .3);
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,.3)';
      ctx.beginPath(); ctx.ellipse(0, h*.35, w*.6, h*.15, 0, 0, Math.PI*2); ctx.fill();
      // rock body
      ctx.fillStyle = '#888';
      ctx.beginPath();
      ctx.moveTo(-w*.5, h*.3);
      ctx.lineTo(-w*.3, -h*.4);
      ctx.lineTo(0, -h*.5);
      ctx.lineTo(w*.4, -h*.35);
      ctx.lineTo(w*.5, h*.3);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#aaa';
      ctx.beginPath();
      ctx.moveTo(-w*.2, -h*.3); ctx.lineTo(0, -h*.5); ctx.lineTo(w*.2, -h*.3);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    else if (sp.type === 'log') {
      ctx.save();
      ctx.translate(cx, cy - h * .15);
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.beginPath(); ctx.ellipse(0, h*.25, w*.8, h*.12, 0, 0, Math.PI*2); ctx.fill();
      // log body
      ctx.fillStyle = '#8B5E3C';
      ctx.beginPath();
      ctx.roundRect(-w*.9, -h*.2, w*1.8, h*.45, 6);
      ctx.fill();
      // rings
      ctx.strokeStyle = '#6B4423'; ctx.lineWidth = 2*s;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.ellipse(i*w*.35, 0, w*.12, h*.22, 0, 0, Math.PI*2);
        ctx.stroke();
      }
      // end grain
      ctx.fillStyle = '#6B4423';
      ctx.beginPath(); ctx.ellipse(-w*.9, 0, w*.12, h*.22, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(w*.9, 0, w*.12, h*.22, 0, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }

    else if (sp.type === 'oil') {
      ctx.save();
      ctx.globalAlpha = .7 * sp.scale;
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, w*.9);
      grd.addColorStop(0, '#ff80ff');
      grd.addColorStop(.3, '#80ffff');
      grd.addColorStop(.6, '#ffff80');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.ellipse(cx, cy, w*.9, h*.3, 0, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    else if (sp.type === 'ice') {
      ctx.save();
      ctx.globalAlpha = .6 * sp.scale;
      ctx.fillStyle = 'rgba(180,230,255,.7)';
      ctx.beginPath(); ctx.ellipse(cx, cy, w*1.2, h*.3, 0, 0, Math.PI*2); ctx.fill();
      // shine
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.beginPath(); ctx.ellipse(cx - w*.2, cy - h*.05, w*.3, h*.08, -0.3, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    else if (sp.type === 'car') {
      drawAICar(ctx, cx, cy, sp.scale, sp.color);
    }
  }

  function drawAICar(ctx, x, y, scale, color) {
    const s  = scale * 1.6;
    const cw = 34 * s, ch = 20 * s;
    ctx.save();
    ctx.translate(x, y - ch * .4);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(0, ch*.6, cw*.7, ch*.25, 0, 0, Math.PI*2); ctx.fill();

    // Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-cw/2, -ch/2, cw, ch, 4);
    ctx.fill();

    // Roof
    ctx.fillStyle = lighten(color, 1.2);
    ctx.beginPath();
    ctx.roundRect(-cw*.3, -ch*.9, cw*.6, ch*.5, 3);
    ctx.fill();

    // Windows
    ctx.fillStyle = 'rgba(150,220,255,.8)';
    ctx.fillRect(-cw*.25, -ch*.85, cw*.22, ch*.35);
    ctx.fillRect(cw*.03, -ch*.85, cw*.22, ch*.35);

    // Wheels
    ctx.fillStyle = '#222';
    [[-cw*.38, -ch*.5],[cw*.28,-ch*.5],[-cw*.38,ch*.35],[cw*.28,ch*.35]].forEach(([wx,wy]) => {
      ctx.beginPath(); ctx.ellipse(wx, wy, cw*.1, ch*.18, 0, 0, Math.PI*2); ctx.fill();
    });

    ctx.restore();
  }

  function drawPlayerCar(ctx, W, H, playerX) {
    const cx = W / 2 - playerX * W * .15;
    const cy = H * .78;
    const cw = W * .14, ch = H * .1;

    ctx.save();
    ctx.translate(cx, cy);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.beginPath(); ctx.ellipse(0, ch*.55, cw*.65, ch*.2, 0, 0, Math.PI*2); ctx.fill();

    // Body – Fortnite-style bright teal
    ctx.fillStyle = '#00c8d4';
    ctx.beginPath(); ctx.roundRect(-cw/2, -ch*.4, cw, ch*.9, 6); ctx.fill();

    // Roof
    ctx.fillStyle = '#007a82';
    ctx.beginPath(); ctx.roundRect(-cw*.32, -ch*.85, cw*.64, ch*.5, 5); ctx.fill();

    // Front window
    ctx.fillStyle = 'rgba(180,240,255,.85)';
    ctx.beginPath(); ctx.roundRect(-cw*.27, -ch*.8, cw*.54, ch*.38, 3); ctx.fill();

    // Headlights
    ctx.fillStyle = '#ffe8a0';
    ctx.beginPath(); ctx.ellipse(-cw*.32, -ch*.3, cw*.07, ch*.07, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( cw*.32, -ch*.3, cw*.07, ch*.07, 0, 0, Math.PI*2); ctx.fill();

    // Wheels
    ctx.fillStyle = '#111';
    const wy = ch * .38;
    [[-cw*.4, -wy],[ cw*.3, -wy],[-cw*.4, wy],[ cw*.3, wy]].forEach(([wx,wwy]) => {
      ctx.beginPath(); ctx.ellipse(wx, wwy, cw*.12, ch*.22, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#555';
      ctx.beginPath(); ctx.ellipse(wx, wwy, cw*.06, ch*.1, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#111';
    });

    // Speed glow
    ctx.fillStyle = 'rgba(0,200,212,.15)';
    ctx.beginPath(); ctx.ellipse(0, 0, cw*.6, ch*.5, 0, 0, Math.PI*2); ctx.fill();

    ctx.restore();
  }

  // ── Environment decorations ────────────────────
  function drawEnvDecorations(ctx, W, H, env, pos) {
    const horizon = H * .5;
    const scroll  = (pos * .0005) % 1;

    // Trees for forest/jungle/night
    if (['forest','jungle','night_forest'].includes(env)) {
      drawTrees(ctx, W, horizon, scroll, env);
    }
    // Mountains
    if (['mountain','glacier','arctic','blizzard'].includes(env)) {
      drawMountains(ctx, W, horizon, scroll, env);
    }
    // Clouds
    if (['meadow','hills','rain','storm','thunder'].includes(env) || env.includes('rain')) {
      drawClouds(ctx, W, horizon, scroll, env);
    }
    // Stars / neon for night/cyber
    if (['night_forest','cyber','desert_night','finale','storm'].includes(env)) {
      drawStars(ctx, W, horizon, scroll);
    }
    // Sun/moon
    drawSunMoon(ctx, W, horizon, env);
    // Lava glow
    if (env === 'volcano') drawLavaGlow(ctx, W, horizon);
    // Rainbow
    if (env === 'rainbow') drawRainbow(ctx, W, horizon);
    // Cyber neon grid
    if (env === 'cyber') drawNeonGrid(ctx, W, H, pos);
  }

  function drawTrees(ctx, W, horizon, scroll, env) {
    const dark = env === 'night_forest';
    for (let i = 0; i < 14; i++) {
      const t  = ((i / 14) + scroll) % 1;
      const x  = t * W;
      const sz = 40 + Math.sin(i * 7.3) * 20;
      const y  = horizon - sz * .1;
      // trunk
      ctx.fillStyle = dark ? '#1a0f08' : '#6B4423';
      ctx.fillRect(x - sz * .06, y, sz * .12, sz * .4);
      // canopy
      const c = dark ? '#0d1f0a' : (env === 'jungle' ? '#1a6b15' : '#2d8a20');
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(x, y - sz); ctx.lineTo(x - sz*.45, y + sz*.05); ctx.lineTo(x + sz*.45, y + sz*.05);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, y - sz*.7); ctx.lineTo(x - sz*.55, y + sz*.3); ctx.lineTo(x + sz*.55, y + sz*.3);
      ctx.closePath(); ctx.fill();
    }
  }

  function drawMountains(ctx, W, horizon, scroll, env) {
    const snow = ['arctic','glacier','blizzard'].includes(env);
    for (let i = 0; i < 6; i++) {
      const t  = ((i / 6) + scroll * .2) % 1;
      const x  = t * W * 1.3 - W*.15;
      const h  = 80 + Math.sin(i * 5.1) * 40;
      ctx.fillStyle = snow ? '#8ab0c8' : '#6a7a6a';
      ctx.beginPath();
      ctx.moveTo(x - h*.9, horizon); ctx.lineTo(x, horizon - h); ctx.lineTo(x + h*.9, horizon);
      ctx.closePath(); ctx.fill();
      if (snow) {
        ctx.fillStyle = '#e8f4ff';
        ctx.beginPath();
        ctx.moveTo(x - h*.25, horizon - h*.6); ctx.lineTo(x, horizon - h); ctx.lineTo(x + h*.25, horizon - h*.6);
        ctx.closePath(); ctx.fill();
      }
    }
  }

  function drawClouds(ctx, W, horizon, scroll, env) {
    const dark = ['rain','storm'].includes(env);
    const col  = dark ? 'rgba(80,80,90,0.7)' : 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 6; i++) {
      const t = ((i / 6) + scroll * .3) % 1;
      const x = t * W * 1.4 - W*.2;
      const y = horizon * (.2 + Math.sin(i * 3.7) * .15);
      const r = 30 + Math.sin(i * 6.1) * 15;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(x, y, r*1.8, r*.7, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x - r*.6, y, r, r*.6, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + r*.7, y, r*1.1, r*.6, 0, 0, Math.PI*2); ctx.fill();
    }
  }

  function drawStars(ctx, W, horizon) {
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    for (let i = 0; i < 60; i++) {
      const x = (Math.sin(i * 127.3) * .5 + .5) * W;
      const y = (Math.sin(i * 89.7)  * .5 + .5) * horizon;
      const r = Math.sin(i * 43.1) * .5 + .8;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
    }
  }

  function drawSunMoon(ctx, W, horizon, env) {
    const night = ['night_forest','cyber','desert_night','finale','storm','blizzard'].includes(env);
    if (night) {
      ctx.fillStyle = 'rgba(220,220,180,.9)';
      ctx.beginPath(); ctx.arc(W*.8, horizon*.25, 22, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = ENV_PALETTES[env]?.sky[0] || '#0a0a1a';
      ctx.beginPath(); ctx.arc(W*.8 + 14, horizon*.25 - 10, 17, 0, Math.PI*2); ctx.fill();
    } else {
      const col = ['desert','canyon','hills'].includes(env) ? '#ffa040' : '#ffe060';
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(W*.15, horizon*.2, 28, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,200,80,.3)';
      ctx.lineWidth = 8;
      ctx.beginPath(); ctx.arc(W*.15, horizon*.2, 38, 0, Math.PI*2); ctx.stroke();
    }
  }

  function drawLavaGlow(ctx, W, horizon) {
    const grd = ctx.createLinearGradient(0, horizon, 0, horizon + 40);
    grd.addColorStop(0, 'rgba(255,80,0,.4)');
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, horizon, W, 40);
  }

  function drawRainbow(ctx, W, horizon) {
    const colours = ['rgba(255,0,0,.3)','rgba(255,140,0,.3)','rgba(255,255,0,.3)',
                     'rgba(0,200,0,.3)','rgba(0,150,255,.3)','rgba(140,0,255,.3)'];
    for (let i = 0; i < colours.length; i++) {
      ctx.strokeStyle = colours[i];
      ctx.lineWidth   = 12;
      ctx.beginPath();
      ctx.arc(W/2, horizon * 1.5, W * (.3 + i*.04), Math.PI, 0);
      ctx.stroke();
    }
  }

  function drawNeonGrid(ctx, W, H, pos) {
    const scroll = (pos * .002) % 1;
    ctx.strokeStyle = 'rgba(160,32,255,.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      const y = H * .5 + (((i / 20) + scroll) % 1) * H * .5;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  // ── Weather overlays ───────────────────────────
  function drawRain(ctx, W, H, pos) {
    ctx.save();
    ctx.strokeStyle = 'rgba(180,210,255,.35)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 80; i++) {
      const rx = (((Math.sin(i * 137.5) * .5 + .5) + (pos * .0003)) % 1) * W;
      const ry = (((Math.cos(i * 73.1)  * .5 + .5) + (pos * .0005)) % 1) * H;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 2, ry + 14);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFogOverlay(ctx, W, H, env) {
    const col = env === 'desert' || env === 'desert_night'
      ? 'rgba(200,170,80,.18)'
      : 'rgba(200,210,220,.22)';
    const grd = ctx.createLinearGradient(0, H * .45, 0, H * .72);
    grd.addColorStop(0, col);
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
    // full fog veil top
    ctx.fillStyle = col.replace('.22', '.1').replace('.18', '.08');
    ctx.fillRect(0, 0, W, H * .7);
  }

  // ── Minimap ────────────────────────────────────
  function drawMinimap(mctx, playerPos, cars, segs, laps) {
    const W = 100, H = 100;
    mctx.clearRect(0, 0, W, H);
    mctx.fillStyle = 'rgba(0,0,0,.6)';
    mctx.fillRect(0, 0, W, H);

    const total = segs.length * SEG_LENGTH * laps;
    const prog  = (playerPos / total) % 1;

    // Track ring
    mctx.strokeStyle = '#555';
    mctx.lineWidth = 6;
    mctx.beginPath(); mctx.arc(50, 50, 34, 0, Math.PI*2); mctx.stroke();

    // AI cars
    if (cars) {
      mctx.fillStyle = '#e74c3c';
      for (const c of cars) {
        const a = (c.pos / (segs.length * SEG_LENGTH)) * Math.PI * 2 - Math.PI/2;
        const cx = 50 + Math.cos(a) * 34, cy = 50 + Math.sin(a) * 34;
        mctx.beginPath(); mctx.arc(cx, cy, 3.5, 0, Math.PI*2); mctx.fill();
      }
    }

    // Player dot
    const angle = prog * Math.PI * 2 - Math.PI/2;
    const px = 50 + Math.cos(angle) * 34;
    const py = 50 + Math.sin(angle) * 34;
    mctx.fillStyle = '#00c8d4';
    mctx.beginPath(); mctx.arc(px, py, 5, 0, Math.PI*2); mctx.fill();
    mctx.strokeStyle = '#fff';
    mctx.lineWidth = 1.5;
    mctx.stroke();
  }

  // ── Helpers ────────────────────────────────────
  function darken(hex, f) {
    const [r,g,b] = hexToRgb(hex);
    return `rgb(${Math.round(r*f)},${Math.round(g*f)},${Math.round(b*f)})`;
  }
  function lighten(hex, f) { return darken(hex, f); }

  function hexToRgb(hex) {
    hex = hex.replace('#','');
    if (hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
    const n = parseInt(hex, 16);
    return [(n>>16)&255, (n>>8)&255, n&255];
  }

  function setEnv(name) { envName = name; }

  return { init, buildTrack, draw, setEnv, SEG_LENGTH, DRAW_DIST };
})();
