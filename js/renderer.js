/* ═══════════════════════════════════════════════
   renderer.js – Proper pseudo-3D track renderer
   OutRun-style segment projection
   ═══════════════════════════════════════════════ */

const Renderer = (() => {

  const SEG_LENGTH    = 200;
  const CAMERA_HEIGHT = 1000;
  const DRAW_DIST     = 150;

  let canvas, ctx, minimap, mctx;
  let segments = [];
  let envName  = 'meadow';

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

  function buildTrack(numSegments, levelCfg) {
    segments = [];
    const curves = generateCurves(numSegments, levelCfg.id);
    for (let i = 0; i < numSegments; i++) {
      segments.push({
        index: i, curve: curves[i],
        color: i % 2 === 0 ? 'dark' : 'light',
        hazard: null
      });
    }
    for (let i = 20; i < numSegments; i++) {
      if (levelCfg.obstacles.length && i % 18 === 0) {
        const t = levelCfg.obstacles[Math.floor(Math.random() * levelCfg.obstacles.length)];
        segments[i].hazard = { type: t, offset: (Math.random() - .5) * .55 };
      }
      if (levelCfg.oilSlicks  && i % 23 === 0 && !segments[i].hazard)
        segments[i].hazard = { type: 'oil', offset: (Math.random()-.5)*.5 };
      if (levelCfg.icePatches && i % 16 === 0 && !segments[i].hazard)
        segments[i].hazard = { type: 'ice', offset: (Math.random()-.5)*.45 };
    }
    return segments;
  }

  function generateCurves(n, seed) {
    const c = new Array(n).fill(0);
    const rng = mulberry32(seed * 1337 + 42);
    for (let s = 0; s < Math.floor(n / 25); s++) {
      const start  = Math.floor(rng() * n);
      const len    = 20 + Math.floor(rng() * 40);
      const amount = (rng() - .5) * 4.5;
      for (let i = start; i < Math.min(start+len, n); i++) c[i] = amount;
    }
    return c;
  }

  function mulberry32(a) {
    return () => {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function draw(playerPos, playerX, _u, levelCfg, aiCars) {
    const W = canvas.width, H = canvas.height;
    const segN     = segments.length;
    const roadWidth = levelCfg.trackWidth * 15;
    const palette  = ENV_PALETTES[envName] || ENV_PALETTES.meadow;

    ctx.clearRect(0, 0, W, H);

    /* Sky */
    const skyG = ctx.createLinearGradient(0, 0, 0, H * .5);
    skyG.addColorStop(0, palette.sky[0]);
    skyG.addColorStop(1, palette.sky[1]);
    ctx.fillStyle = skyG;
    ctx.fillRect(0, 0, W, H * .5);

    drawEnvDecorations(ctx, W, H, envName, playerPos);

    /* Ground */
    const gndG = ctx.createLinearGradient(0, H*.5, 0, H);
    gndG.addColorStop(0, palette.ground);
    gndG.addColorStop(1, shadeColor(palette.ground, -35));
    ctx.fillStyle = gndG;
    ctx.fillRect(0, H * .5, W, H * .5);

    /* ── Road projection ── */
    const startSeg = Math.floor(playerPos / SEG_LENGTH) % segN;
    const proj     = [];
    let   curveAcc = 0;

    for (let i = 0; i < DRAW_DIST; i++) {
      const segIdx = (startSeg + i) % segN;
      const seg    = segments[segIdx];
      const zNear  = (i + 1) * SEG_LENGTH;
      const zFar   = (i + 2) * SEG_LENGTH;

      /* perspective: scale = camHeight / z */
      const sN = CAMERA_HEIGHT / zNear;
      const sF = CAMERA_HEIGHT / zFar;

      /* screen Y: horizon at H*0.5, road converges upward */
      const yN = H * .5 + sN * H * .22;
      const yF = H * .5 + sF * H * .22;

      /* screen X centre with player lateral + curve drift */
      const xN = W * .5 - playerX * sN * roadWidth * 1.8 + curveAcc * sN * W * .004;
      curveAcc += seg.curve;
      const xF = W * .5 - playerX * sF * roadWidth * 1.8 + curveAcc * sF * W * .004;

      const wN = sN * roadWidth;
      const wF = sF * roadWidth;

      proj.push({ seg, segIdx, i, xN, yN, wN, xF, yF, wF, sN });
    }

    /* draw far→near */
    const sprites = [];

    for (let i = DRAW_DIST - 1; i >= 0; i--) {
      const p  = proj[i];
      const yT = Math.max(p.yF, H * .5);
      const yB = Math.min(p.yN, H);
      if (yT >= yB) continue;

      const isDark = p.seg.color === 'dark';
      const fogA   = levelCfg.fog ? Math.max(0, 1 - (i / DRAW_DIST) * 1.5) : 1;

      /* grass alternating strip */
      ctx.fillStyle = isDark ? shadeColor(palette.ground, -14) : palette.ground;
      ctx.fillRect(0, yT, W, yB - yT);

      ctx.globalAlpha = fogA;

      /* road body */
      ctx.fillStyle = isDark ? shadeColor(palette.road, -12) : palette.road;
      ctx.beginPath();
      ctx.moveTo(p.xF - p.wF, yT); ctx.lineTo(p.xF + p.wF, yT);
      ctx.lineTo(p.xN + p.wN, yB); ctx.lineTo(p.xN - p.wN, yB);
      ctx.closePath(); ctx.fill();

      /* kerbs */
      const kw = .09;
      ctx.fillStyle = isDark ? '#dd2020' : '#eeeeee';
      ctx.beginPath();
      ctx.moveTo(p.xF - p.wF,          yT);
      ctx.lineTo(p.xF - p.wF*(1-kw),   yT);
      ctx.lineTo(p.xN - p.wN*(1-kw),   yB);
      ctx.lineTo(p.xN - p.wN,          yB);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(p.xF + p.wF*(1-kw),   yT);
      ctx.lineTo(p.xF + p.wF,          yT);
      ctx.lineTo(p.xN + p.wN,          yB);
      ctx.lineTo(p.xN + p.wN*(1-kw),   yB);
      ctx.closePath(); ctx.fill();

      /* centre dashes */
      if (isDark && i % 3 === 0) {
        const dw = .032;
        ctx.fillStyle = palette.stripe || '#ffffff';
        ctx.beginPath();
        ctx.moveTo(p.xF - p.wF*dw, yT); ctx.lineTo(p.xF + p.wF*dw, yT);
        ctx.lineTo(p.xN + p.wN*dw, yB); ctx.lineTo(p.xN - p.wN*dw, yB);
        ctx.closePath(); ctx.fill();
      }

      ctx.globalAlpha = 1;

      /* collect hazard sprites */
      if (p.seg.hazard && i > 2) {
        sprites.push({
          type:    p.seg.hazard.type,
          offset:  p.seg.hazard.offset,
          screenX: p.xN + p.seg.hazard.offset * p.wN * 2.2,
          screenY: p.yN,
          scale:   p.sN
        });
      }
    }

    /* AI car sprites */
    if (aiCars) {
      for (const car of aiCars) {
        let dist = car.pos - playerPos;
        const fullLen = segN * SEG_LENGTH;
        if (dist < 0) dist += fullLen;
        const si = Math.floor(dist / SEG_LENGTH);
        if (si > 0 && si < DRAW_DIST && proj[si]) {
          const p = proj[si];
          sprites.push({
            type:    'car', color: car.color || '#e74c3c',
            screenX: p.xN + car.lane * p.wN * 2.2,
            screenY: p.yN,
            scale:   p.sN
          });
        }
      }
    }

    /* draw sprites far→near */
    sprites.sort((a, b) => a.scale - b.scale);
    for (const sp of sprites) drawSprite(ctx, sp);

    /* player car */
    drawPlayerCar(ctx, W, H, playerX);

    /* weather */
    if (levelCfg.rain) drawRain(ctx, W, H, playerPos);
    if (levelCfg.fog)  drawFogOverlay(ctx, W, H, envName);

    drawMinimap(mctx, playerPos, aiCars, segments, levelCfg.laps);
  }

  /* ── Sprites ──────────────────────────────────── */
  function drawSprite(ctx, sp) {
    const s  = Math.min(sp.scale * 320, 3.2);
    const cx = sp.screenX, cy = sp.screenY;
    const w  = 40*s, h = 40*s;
    if (cy < 0 || cy > canvas.height+120) return;

    if (sp.type === 'rock') {
      ctx.save(); ctx.translate(cx, cy - h*.12);
      ctx.fillStyle = 'rgba(0,0,0,.22)';
      ctx.beginPath(); ctx.ellipse(0,h*.28,w*.52,h*.1,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#7a7a7a';
      ctx.beginPath();
      ctx.moveTo(-w*.5,h*.28); ctx.lineTo(-w*.25,-h*.5); ctx.lineTo(0,-h*.55);
      ctx.lineTo(w*.35,-h*.4); ctx.lineTo(w*.5,h*.28); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#b0b0b0';
      ctx.beginPath(); ctx.moveTo(-w*.15,-h*.32); ctx.lineTo(0,-h*.55); ctx.lineTo(w*.2,-h*.32); ctx.closePath(); ctx.fill();
      ctx.restore();
    } else if (sp.type === 'log') {
      ctx.save(); ctx.translate(cx, cy);
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      ctx.beginPath(); ctx.ellipse(0,h*.1,w*.88,h*.1,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#8B5E3C';
      ctx.beginPath(); ctx.roundRect(-w*.93,-h*.19,w*1.86,h*.37,5); ctx.fill();
      ctx.strokeStyle = '#5a3010'; ctx.lineWidth = 1.5*s;
      for (let k=-1;k<=1;k++){ctx.beginPath();ctx.ellipse(k*w*.37,0,w*.11,h*.18,0,0,Math.PI*2);ctx.stroke();}
      ctx.fillStyle='#5a3010';
      ctx.beginPath();ctx.ellipse(-w*.93,0,w*.11,h*.18,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(w*.93,0,w*.11,h*.18,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
    } else if (sp.type === 'oil') {
      ctx.save(); ctx.globalAlpha=.62*Math.min(sp.scale*3.5,1);
      const g=ctx.createRadialGradient(cx,cy,0,cx,cy,w);
      g.addColorStop(0,'#ff80ff');g.addColorStop(.35,'#80ffff');g.addColorStop(.7,'#ffff60');g.addColorStop(1,'transparent');
      ctx.fillStyle=g;
      ctx.beginPath();ctx.ellipse(cx,cy,w,h*.25,0,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;ctx.restore();
    } else if (sp.type === 'ice') {
      ctx.save();ctx.globalAlpha=.55*Math.min(sp.scale*3.5,1);
      ctx.fillStyle='rgba(190,235,255,.75)';
      ctx.beginPath();ctx.ellipse(cx,cy,w*1.3,h*.26,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.55)';
      ctx.beginPath();ctx.ellipse(cx-w*.18,cy-h*.06,w*.3,h*.08,-.3,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;ctx.restore();
    } else if (sp.type === 'car') {
      drawAICar(ctx, cx, cy, Math.min(sp.scale*320,3.2), sp.color);
    }
  }

  function drawAICar(ctx,x,y,s,color){
    const cw=34*s,ch=22*s;
    ctx.save();ctx.translate(x,y-ch*.3);
    ctx.fillStyle='rgba(0,0,0,.25)';
    ctx.beginPath();ctx.ellipse(0,ch*.52,cw*.62,ch*.16,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=color;
    ctx.beginPath();ctx.roundRect(-cw/2,-ch/2,cw,ch,4);ctx.fill();
    ctx.fillStyle=shadeColor(color,35);
    ctx.beginPath();ctx.roundRect(-cw*.3,-ch*.9,cw*.6,ch*.5,3);ctx.fill();
    ctx.fillStyle='rgba(160,230,255,.85)';
    ctx.fillRect(-cw*.27,-ch*.85,cw*.22,ch*.38);ctx.fillRect(cw*.05,-ch*.85,cw*.22,ch*.38);
    ctx.fillStyle='#111';
    [[-cw*.38,-ch*.5],[cw*.28,-ch*.5],[-cw*.38,ch*.3],[cw*.28,ch*.3]].forEach(([wx,wy])=>{
      ctx.beginPath();ctx.ellipse(wx,wy,cw*.1,ch*.17,0,0,Math.PI*2);ctx.fill();
    });
    ctx.restore();
  }

  function drawPlayerCar(ctx, W, H, playerX) {
    const cx = W*.5 + playerX * W * .06;
    const cy = H*.82;
    const cw = W*.13, ch = H*.115;
    ctx.save(); ctx.translate(cx, cy);
    ctx.fillStyle='rgba(0,0,0,.32)';
    ctx.beginPath();ctx.ellipse(0,ch*.5,cw*.6,ch*.14,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#00c8d4';
    ctx.beginPath();ctx.roundRect(-cw/2,-ch*.36,cw,ch*.86,7);ctx.fill();
    ctx.fillStyle='#006e78';
    ctx.beginPath();ctx.roundRect(-cw*.31,-ch*.9,cw*.62,ch*.58,6);ctx.fill();
    ctx.fillStyle='rgba(180,245,255,.88)';
    ctx.beginPath();ctx.roundRect(-cw*.26,-ch*.84,cw*.52,ch*.44,4);ctx.fill();
    ctx.fillStyle='#fff8c0';
    ctx.beginPath();ctx.ellipse(-cw*.32,-ch*.27,cw*.065,ch*.065,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(cw*.32,-ch*.27,cw*.065,ch*.065,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#111';
    [[-cw*.38,-ch*.44],[cw*.28,-ch*.44],[-cw*.38,ch*.34],[cw*.28,ch*.34]].forEach(([wx,wy])=>{
      ctx.beginPath();ctx.ellipse(wx,wy,cw*.115,ch*.2,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#444';ctx.beginPath();ctx.ellipse(wx,wy,cw*.055,ch*.09,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#111';
    });
    ctx.restore();
  }

  /* ── Env decorations ──────────────────────────── */
  function drawEnvDecorations(ctx,W,H,env,pos){
    const horizon=H*.5, scroll=(pos*.00025)%1;
    drawCelestial(ctx,W,horizon,env);
    if(['forest','jungle','night_forest'].includes(env)) drawTrees(ctx,W,horizon,scroll,env);
    if(['mountain','glacier','arctic','blizzard','hills'].includes(env)) drawMountains(ctx,W,horizon,scroll,env);
    if(['meadow','hills','rain','storm'].includes(env)) drawClouds(ctx,W,horizon,scroll,env);
    if(['night_forest','cyber','desert_night','finale','storm','speedway'].includes(env)) drawStars(ctx,W,horizon);
    if(env==='volcano')  drawLavaGlow(ctx,W,horizon);
    if(env==='rainbow')  drawRainbow(ctx,W,horizon);
    if(env==='cyber')    drawNeonGrid(ctx,W,H,pos);
    if(['arctic','glacier','blizzard'].includes(env)) { ctx.fillStyle='rgba(230,245,255,.28)'; ctx.fillRect(0,H*.85,W,H*.15); }
  }

  function drawCelestial(ctx,W,H,env){
    const night=['night_forest','cyber','desert_night','finale','storm','speedway','blizzard'].includes(env);
    if(night){
      ctx.fillStyle='rgba(225,225,195,.95)';ctx.beginPath();ctx.arc(W*.78,H*.22,24,0,Math.PI*2);ctx.fill();
      const p=ENV_PALETTES[env];ctx.fillStyle=p?p.sky[0]:'#0a0a1a';
      ctx.beginPath();ctx.arc(W*.78+15,H*.22-10,19,0,Math.PI*2);ctx.fill();
    } else {
      const col=['desert','canyon'].includes(env)?'#ff9020':'#ffe050';
      ctx.save();ctx.fillStyle=col;ctx.beginPath();ctx.arc(W*.12,H*.18,30,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=col;ctx.lineWidth=9;ctx.globalAlpha=.3;ctx.beginPath();ctx.arc(W*.12,H*.18,42,0,Math.PI*2);ctx.stroke();
      ctx.globalAlpha=1;ctx.restore();
    }
  }
  function drawTrees(ctx,W,H,scroll,env){
    const dark=env==='night_forest';
    for(let i=0;i<16;i++){
      const t=((i/16)+scroll)%1,x=t*W,sz=44+Math.sin(i*7.3)*18,y=H;
      ctx.fillStyle=dark?'#2a1a08':'#5a3210';ctx.fillRect(x-sz*.055,y-sz*.02,sz*.11,sz*.38);
      const col=dark?'#0c1c0a':(env==='jungle'?'#1a6012':'#2a8818');ctx.fillStyle=col;
      ctx.beginPath();ctx.moveTo(x,y-sz*.95);ctx.lineTo(x-sz*.42,y+sz*.05);ctx.lineTo(x+sz*.42,y+sz*.05);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.moveTo(x,y-sz*.65);ctx.lineTo(x-sz*.52,y+sz*.28);ctx.lineTo(x+sz*.52,y+sz*.28);ctx.closePath();ctx.fill();
    }
  }
  function drawMountains(ctx,W,H,scroll,env){
    const snow=['arctic','glacier','blizzard'].includes(env);
    for(let i=0;i<7;i++){
      const t=((i/7)+scroll*.15)%1,x=t*W*1.4-W*.2,mh=75+Math.sin(i*5.2)*38;
      ctx.fillStyle=snow?'#7a9ab8':'#606a60';
      ctx.beginPath();ctx.moveTo(x-mh*.95,H);ctx.lineTo(x,H-mh);ctx.lineTo(x+mh*.95,H);ctx.closePath();ctx.fill();
      if(snow){ctx.fillStyle='#eaf4ff';ctx.beginPath();ctx.moveTo(x-mh*.22,H-mh*.62);ctx.lineTo(x,H-mh);ctx.lineTo(x+mh*.22,H-mh*.62);ctx.closePath();ctx.fill();}
    }
  }
  function drawClouds(ctx,W,H,scroll,env){
    const dark=['rain','storm'].includes(env),col=dark?'rgba(70,75,85,.75)':'rgba(255,255,255,.78)';
    for(let i=0;i<7;i++){
      const t=((i/7)+scroll*.25)%1,x=t*W*1.5-W*.25,y=H*(.12+Math.sin(i*3.8)*.12),r=28+Math.sin(i*6.2)*14;
      ctx.fillStyle=col;
      ctx.beginPath();ctx.ellipse(x,y,r*1.9,r*.65,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(x-r*.62,y,r*.95,r*.55,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(x+r*.68,y,r*1.05,r*.55,0,0,Math.PI*2);ctx.fill();
    }
  }
  function drawStars(ctx,W,H){ctx.fillStyle='rgba(255,255,255,.85)';for(let i=0;i<65;i++){const x=(Math.sin(i*127.3)*.5+.5)*W,y=(Math.sin(i*89.7)*.5+.5)*H,r=Math.sin(i*43.1)*.5+.8;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}}
  function drawLavaGlow(ctx,W,H){const g=ctx.createLinearGradient(0,H*.4,0,H*.6);g.addColorStop(0,'rgba(255,70,0,0)');g.addColorStop(.5,'rgba(255,70,0,.35)');g.addColorStop(1,'rgba(255,70,0,0)');ctx.fillStyle=g;ctx.fillRect(0,H*.4,W,H*.2);}
  function drawRainbow(ctx,W,H){const cols=['rgba(255,0,0,.28)','rgba(255,130,0,.28)','rgba(255,255,0,.28)','rgba(0,200,0,.28)','rgba(0,140,255,.28)','rgba(140,0,255,.28)'];for(let i=0;i<cols.length;i++){ctx.strokeStyle=cols[i];ctx.lineWidth=13;ctx.beginPath();ctx.arc(W*.5,H*1.6,W*(.28+i*.04),Math.PI,0);ctx.stroke();}}
  function drawNeonGrid(ctx,W,H,pos){const scroll=(pos*.0018)%1;ctx.strokeStyle='rgba(140,20,240,.22)';ctx.lineWidth=1;for(let i=0;i<18;i++){const y=H*.5+(((i/18)+scroll)%1)*H*.5;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}}
  function drawRain(ctx,W,H,pos){ctx.save();ctx.strokeStyle='rgba(180,215,255,.3)';ctx.lineWidth=1;for(let i=0;i<90;i++){const rx=(((Math.sin(i*137.5)*.5+.5)+(pos*.00025))%1)*W,ry=(((Math.cos(i*73.1)*.5+.5)+(pos*.00045))%1)*H;ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx-1.5,ry+15);ctx.stroke();}ctx.restore();}
  function drawFogOverlay(ctx,W,H,env){const col=env==='desert'||env==='desert_night'?'rgba(210,180,90,.13)':'rgba(200,215,225,.17)';const g=ctx.createLinearGradient(0,H*.42,0,H*.75);g.addColorStop(0,col);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.fillStyle=col.replace('.13','.06').replace('.17','.07');ctx.fillRect(0,0,W,H*.65);}

  function drawMinimap(mctx,playerPos,cars,segs,laps){
    const W=100,H=100,cx=50,cy=50,r=36;
    mctx.clearRect(0,0,W,H);
    mctx.fillStyle='rgba(0,0,0,.65)';mctx.beginPath();mctx.arc(cx,cy,48,0,Math.PI*2);mctx.fill();
    mctx.strokeStyle='#444';mctx.lineWidth=7;mctx.beginPath();mctx.arc(cx,cy,r,0,Math.PI*2);mctx.stroke();
    mctx.strokeStyle='#666';mctx.lineWidth=4;mctx.beginPath();mctx.arc(cx,cy,r,0,Math.PI*2);mctx.stroke();
    const ttl=segs.length*SEG_LENGTH*laps;
    if(cars){mctx.fillStyle='#e74c3c';for(const c of cars){const a=(c.pos%ttl)/ttl*Math.PI*2-Math.PI/2;mctx.beginPath();mctx.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r,3.5,0,Math.PI*2);mctx.fill();}}
    const a=(playerPos%ttl)/ttl*Math.PI*2-Math.PI/2;
    const px=cx+Math.cos(a)*r,py=cy+Math.sin(a)*r;
    mctx.fillStyle='#00c8d4';mctx.beginPath();mctx.arc(px,py,5.5,0,Math.PI*2);mctx.fill();
    mctx.strokeStyle='#fff';mctx.lineWidth=1.5;mctx.stroke();
  }

  function shadeColor(hex,amount){
    hex=hex.replace('#','');
    if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');
    let r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16);
    return`rgb(${Math.max(0,Math.min(255,r+amount))},${Math.max(0,Math.min(255,g+amount))},${Math.max(0,Math.min(255,b+amount))})`;
  }

  function setEnv(name){envName=name;}

  return{init,buildTrack,draw,setEnv,SEG_LENGTH,DRAW_DIST};
})();
