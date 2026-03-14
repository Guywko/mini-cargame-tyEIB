/* ═══════════════════════════════════════════
   levels.js – All 20 level definitions
   ═══════════════════════════════════════════ */

const LEVELS = [
  /* ─── 1 ─── */
  {
    id: 1, name: "ROOKIE RUN",
    environment: "meadow",
    laps: 1,
    targetTime: 40,
    aiCars: 0,
    icePatches: false, oilSlicks: false, fog: false, rain: false,
    trackWidth: 90, trackSpeed: 1.0,
    obstacles: [],
    tutorial: {
      title: "ROOKIE RUN",
      body: "Welcome to Turbo Drift! This is your very first race on a wide, gentle meadow track. The path is straight and forgiving — perfect for learning the controls.",
      tips: ["🕹 Use Arrow Keys or WASD to steer", "⬆ Hold UP to go faster", "⬇ Tap DOWN or SPACE to slow down", "Stay on the road — grass slows you down!"]
    }
  },
  /* ─── 2 ─── */
  {
    id: 2, name: "FOREST CURVES",
    environment: "forest",
    laps: 1,
    targetTime: 45,
    aiCars: 0,
    icePatches: false, oilSlicks: false, fog: false, rain: false,
    trackWidth: 80, trackSpeed: 1.05,
    obstacles: [],
    tutorial: {
      title: "FOREST CURVES",
      body: "You're heading into the forest now. The track has gentle curves — start steering before you reach the bend to stay smooth.",
      tips: ["🌲 Trees line the road — don't drift wide", "🔄 Ease off the gas before bends", "⭐ Hit target time for 3 stars"]
    }
  },
  /* ─── 3 ─── */
  {
    id: 3, name: "SUNSET HILLS",
    environment: "hills",
    laps: 2,
    targetTime: 70,
    aiCars: 1,
    icePatches: false, oilSlicks: false, fog: false, rain: false,
    trackWidth: 76, trackSpeed: 1.1,
    obstacles: [],
    tutorial: {
      title: "SUNSET HILLS",
      body: "The hills are alive — and so is your first opponent! A rival AI car will enter the track. Overtake them to reach the finish line first.",
      tips: ["🚗 Your first AI rival is slow — use it as practice", "🏁 2 laps today — pace yourself", "⚡ Draft close behind to get a speed boost"]
    }
  },
  /* ─── 4 ─── */
  {
    id: 4, name: "DUSTY CANYON",
    environment: "canyon",
    laps: 2,
    targetTime: 65,
    aiCars: 1,
    icePatches: false, oilSlicks: false, fog: false, rain: false,
    trackWidth: 70, trackSpeed: 1.15,
    obstacles: ["rock"],
    tutorial: {
      title: "DUSTY CANYON",
      body: "Welcome to the canyon! Boulders have rolled onto the track. Dodge them or you'll spin out and lose precious time.",
      tips: ["🪨 Rocks cause a spin-out — steer around them", "The track is narrower here — be precise", "Higher speed entering turns → wider exit"]
    }
  },
  /* ─── 5 ─── */
  {
    id: 5, name: "JUNGLE SPRINT",
    environment: "jungle",
    laps: 2,
    targetTime: 60,
    aiCars: 2,
    icePatches: false, oilSlicks: false, fog: false, rain: false,
    trackWidth: 68, trackSpeed: 1.2,
    obstacles: ["log"],
    tutorial: {
      title: "JUNGLE SPRINT",
      body: "Deep in the jungle the track narrows and tree logs block the way. Two AI rivals race with more aggression. You must weave through the obstacles while keeping your lead.",
      tips: ["🌿 Logs are wide — pick a gap early", "2 rival cars — stay ahead from the start", "Try to beat target time for bonus stars ⭐⭐⭐"]
    }
  },
  /* ─── 6 ─── */
  {
    id: 6, name: "RAINY VALLEY",
    environment: "rain",
    laps: 2,
    targetTime: 72,
    aiCars: 2,
    icePatches: false, oilSlicks: false, fog: false, rain: true,
    trackWidth: 72, trackSpeed: 1.2,
    obstacles: [],
    tutorial: {
      title: "RAINY VALLEY",
      body: "Storm clouds have rolled in! Rain makes the road slippery — your car takes longer to slow down and turns feel sluggish. Adjust your driving style.",
      tips: ["🌧 Brake earlier than usual in the wet", "Rain reduces grip — slow down before corners", "Rival cars also slide — don't tailgate!"]
    }
  },
  /* ─── 7 ─── */
  {
    id: 7, name: "OIL SLICK SPEEDWAY",
    environment: "speedway",
    laps: 2,
    targetTime: 55,
    aiCars: 2,
    icePatches: false, oilSlicks: true, fog: false, rain: false,
    trackWidth: 74, trackSpeed: 1.25,
    obstacles: [],
    tutorial: {
      title: "OIL SLICK SPEEDWAY",
      body: "Somebody's engine is leaking! Rainbow oil patches cover the track. Hit one and your steering goes haywire for a few seconds.",
      tips: ["🌈 Rainbow patches = oil slick — avoid them!", "The slick sends you sideways — counteract quickly", "This is a fast track — go for the target time!"]
    }
  },
  /* ─── 8 ─── */
  {
    id: 8, name: "MOUNTAIN PASS",
    environment: "mountain",
    laps: 2,
    targetTime: 80,
    aiCars: 3,
    icePatches: false, oilSlicks: false, fog: true, rain: false,
    trackWidth: 66, trackSpeed: 1.28,
    obstacles: ["rock"],
    tutorial: {
      title: "MOUNTAIN PASS",
      body: "High in the mountains, thick fog rolls in. Visibility drops dramatically — you'll see the road, but obstacles appear suddenly. React fast!",
      tips: ["🌫 Fog hides rocks — drive cautiously", "3 rival cars — jostling for position is common", "Slow and steady wins this one — don't crash!"]
    }
  },
  /* ─── 9 ─── */
  {
    id: 9, name: "ARCTIC DRIFT",
    environment: "arctic",
    laps: 2,
    targetTime: 75,
    aiCars: 3,
    icePatches: true, oilSlicks: false, fog: false, rain: false,
    trackWidth: 72, trackSpeed: 1.3,
    obstacles: [],
    tutorial: {
      title: "ARCTIC DRIFT",
      body: "The track is frozen! Ice patches make your car slide uncontrollably. You must master counter-steering to survive. This is where real drivers are tested.",
      tips: ["🧊 Blue glassy patches = ice — full slide ahead", "Steer INTO the slide to recover (opposite direction)", "Pre-brake well before the icy sections"]
    }
  },
  /* ─── 10 ─── */
  {
    id: 10, name: "DESERT STORM",
    environment: "desert",
    laps: 3,
    targetTime: 90,
    aiCars: 3,
    icePatches: false, oilSlicks: true, fog: true, rain: false,
    trackWidth: 65, trackSpeed: 1.35,
    obstacles: ["rock", "log"],
    tutorial: {
      title: "DESERT STORM",
      body: "Half-way milestone! A brutal desert track with 3 laps, sandstorm fog, oil slicks AND obstacles. This is the first real test of everything you've learned.",
      tips: ["🏜 Sandstorm fog + oil = deadly combo", "3 laps — manage your consistency, not just speed", "Watch for rocks AND logs simultaneously", "⭐ The true pros beat this under target time"]
    }
  },
  /* ─── 11 ─── */
  {
    id: 11, name: "NIGHT FOREST",
    environment: "night_forest",
    laps: 2,
    targetTime: 65,
    aiCars: 3,
    icePatches: false, oilSlicks: false, fog: false, rain: false,
    trackWidth: 64, trackSpeed: 1.38,
    obstacles: ["log"],
    tutorial: {
      title: "NIGHT FOREST",
      body: "Darkness falls over the forest. Only your headlights pierce the shadows. The track is tight and rivals are hungry for the lead.",
      tips: ["🌙 Dark environment — obstacles are harder to see", "Headlight cone shows the road ahead", "Rivals are faster than before — match their pace!"]
    }
  },
  /* ─── 12 ─── */
  {
    id: 12, name: "LAVA CANYON",
    environment: "volcano",
    laps: 2,
    targetTime: 62,
    aiCars: 4,
    icePatches: false, oilSlicks: false, fog: false, rain: false,
    trackWidth: 62, trackSpeed: 1.42,
    obstacles: ["rock"],
    tutorial: {
      title: "LAVA CANYON",
      body: "A volcanic canyon! The track winds around glowing lava flows. 4 rival cars, narrower roads, and scorching temperatures. Don't go off-road — the lava is unforgiving.",
      tips: ["🌋 Going off-road = lava penalty (big slowdown)", "4 rivals — expect more aggressive overtaking", "Tight S-bends ahead — brake early!"]
    }
  },
  /* ─── 13 ─── */
  {
    id: 13, name: "FLOOD DELTA",
    environment: "swamp",
    laps: 3,
    targetTime: 95,
    aiCars: 4,
    icePatches: false, oilSlicks: false, fog: true, rain: true,
    trackWidth: 65, trackSpeed: 1.42,
    obstacles: ["log"],
    tutorial: {
      title: "FLOOD DELTA",
      body: "A flooded swamp track! Driving through puddles slows you massively. The fog is thick. 3 laps in this murky nightmare will test your nerves.",
      tips: ["💧 Avoid large puddle zones — they drain your speed", "Fog + rain = nearly zero visibility at speed", "Use the minimap to predict upcoming turns"]
    }
  },
  /* ─── 14 ─── */
  {
    id: 14, name: "GLACIER PASS",
    environment: "glacier",
    laps: 3,
    targetTime: 85,
    aiCars: 4,
    icePatches: true, oilSlicks: false, fog: true, rain: false,
    trackWidth: 60, trackSpeed: 1.45,
    obstacles: ["rock"],
    tutorial: {
      title: "GLACIER PASS",
      body: "Ice + fog + narrow roads + 4 rivals = pure chaos. Glacier Pass is one of the most technical tracks. Precise steering is everything here.",
      tips: ["🏔 Major icy sections cover most of the track", "Fog hides the ice until it's almost too late", "Ultra-narrow track — one mistake costs the race"]
    }
  },
  /* ─── 15 ─── */
  {
    id: 15, name: "THUNDER CIRCUIT",
    environment: "storm",
    laps: 3,
    targetTime: 80,
    aiCars: 4,
    icePatches: false, oilSlicks: true, fog: false, rain: true,
    trackWidth: 64, trackSpeed: 1.5,
    obstacles: [],
    tutorial: {
      title: "THUNDER CIRCUIT",
      body: "A legendary storm circuit with thundering rain and oil patches everywhere. 4 fast rivals and 3 quick laps — pure speed with heavy weather. This is where champions emerge.",
      tips: ["⚡ Rain + oil = constant sliding", "The fastest track yet — rivals are at full aggression", "Smooth inputs beat jerky steering in the wet"]
    }
  },
  /* ─── 16 ─── */
  {
    id: 16, name: "DEATH VALLEY DASH",
    environment: "desert_night",
    laps: 3,
    targetTime: 78,
    aiCars: 5,
    icePatches: false, oilSlicks: true, fog: true, rain: false,
    trackWidth: 60, trackSpeed: 1.55,
    obstacles: ["rock", "log"],
    tutorial: {
      title: "DEATH VALLEY DASH",
      body: "Night race in the desert. 5 rival cars, fog, oil slicks AND obstacles everywhere. The road crumbles at the edges. Stay sharp — this is a survival race.",
      tips: ["🌵 5 rivals — the tightest pack yet", "Oil slicks appear in the fog — memorize their positions", "Stay in the centre — road edges are damaged"]
    }
  },
  /* ─── 17 ─── */
  {
    id: 17, name: "RAINBOW RIDGE",
    environment: "rainbow",
    laps: 3,
    targetTime: 75,
    aiCars: 5,
    icePatches: true, oilSlicks: true, fog: false, rain: false,
    trackWidth: 58, trackSpeed: 1.6,
    obstacles: ["rock"],
    tutorial: {
      title: "RAINBOW RIDGE",
      body: "A beautiful but deadly track above the clouds. Ice patches AND oil slicks fight you simultaneously. Only the most skilled drivers survive this.",
      tips: ["🌈 Rainbow = beautiful but treacherous!", "Ice + oil at the SAME time — pick your battles", "5 rivals — mid-race positioning matters most"]
    }
  },
  /* ─── 18 ─── */
  {
    id: 18, name: "CYBER CANYON",
    environment: "cyber",
    laps: 3,
    targetTime: 70,
    aiCars: 5,
    icePatches: false, oilSlicks: true, fog: false, rain: true,
    trackWidth: 56, trackSpeed: 1.65,
    obstacles: ["rock", "log"],
    tutorial: {
      title: "CYBER CANYON",
      body: "A high-tech canyon wrapped in neon. The track has the sharpest corners of the game. You need perfect racing line discipline — cut corners too tight and bounce off the barriers.",
      tips: ["💜 Neon barriers = walls — don't touch them!", "Take the wide approach on hairpin turns", "This track rewards smooth, consistent laps over risky speed"]
    }
  },
  /* ─── 19 ─── */
  {
    id: 19, name: "BLIZZARD PEAK",
    environment: "blizzard",
    laps: 4,
    targetTime: 100,
    aiCars: 5,
    icePatches: true, oilSlicks: false, fog: true, rain: true,
    trackWidth: 55, trackSpeed: 1.7,
    obstacles: ["rock"],
    tutorial: {
      title: "BLIZZARD PEAK",
      body: "Near the summit of the world's highest peak. Blinding blizzard conditions, ice everywhere, fog so thick you can barely see your hood. 4 laps. You're almost at the top.",
      tips: ["❄️ Snow + ice = barely any grip at all", "4 laps — the longest race yet", "Trust the minimap — it's your only guide in the fog", "SURVIVE first. Speed comes second."]
    }
  },
  /* ─── 20 ─── */
  {
    id: 20, name: "GRAND PRIX FINALE",
    environment: "finale",
    laps: 5,
    targetTime: 110,
    aiCars: 5,
    icePatches: true, oilSlicks: true, fog: true, rain: true,
    trackWidth: 54, trackSpeed: 1.75,
    obstacles: ["rock", "log"],
    tutorial: {
      title: "GRAND PRIX FINALE",
      body: "This is it. The ultimate race. EVERYTHING is on — ice, oil, fog, rain, rocks, logs, 5 rivals, the narrowest track, maximum speed. You've trained for this. Now finish it.",
      tips: ["🏆 All hazards active simultaneously", "5 laps — stamina and precision over brute speed", "This is the hardest race in the game", "WIN this and you are the TURBO DRIFT CHAMPION! 🥇"]
    }
  }
];

// Environment sky / ground colour palettes
const ENV_PALETTES = {
  meadow:       { sky:['#87CEEB','#b5e8ff'], ground:'#7dc647', road:'#555', stripe:'#fff' },
  forest:       { sky:['#6aab8e','#3d7a5c'], ground:'#3a7a28', road:'#444', stripe:'#ffe034' },
  hills:        { sky:['#f4a261','#e76f51'], ground:'#8ab04e', road:'#555', stripe:'#fff' },
  canyon:       { sky:['#d4a574','#c8732b'], ground:'#c8874a', road:'#5a4030', stripe:'#ffe034' },
  jungle:       { sky:['#2d5a27','#1a3d18'], ground:'#2d6b24', road:'#3d3d2a', stripe:'#ffe034' },
  rain:         { sky:['#4a5568','#2d3748'], ground:'#4a6741', road:'#3a3a3a', stripe:'#aaa' },
  speedway:     { sky:['#1a1a2e','#16213e'], ground:'#2a2a2a', road:'#333', stripe:'#ffe034' },
  mountain:     { sky:['#b0c8d4','#8a9aa8'], ground:'#a0a080', road:'#4a4a4a', stripe:'#fff' },
  arctic:       { sky:['#c8e8f8','#a8d4f0'], ground:'#d0e8f0', road:'#8ab8d0', stripe:'#fff' },
  desert:       { sky:['#f4d06a','#e8a020'], ground:'#d4aa60', road:'#b08040', stripe:'#fff' },
  night_forest: { sky:['#0a0a1a','#0d1528'], ground:'#1a2a14', road:'#2a2a2a', stripe:'#ffe034' },
  volcano:      { sky:['#1a0a00','#3a1000'], ground:'#2a1a0a', road:'#3a2a1a', stripe:'#ff4400' },
  swamp:        { sky:['#3a4a2a','#283820'], ground:'#2a3a1a', road:'#303830', stripe:'#8aaa60' },
  glacier:      { sky:['#c8d8f0','#b0c4e8'], ground:'#c0d0e8', road:'#7090b0', stripe:'#fff' },
  storm:        { sky:['#1a1a2a','#0a0a18'], ground:'#2a3a2a', road:'#2a2a2a', stripe:'#ffe034' },
  desert_night: { sky:['#0a0810','#1a1020'], ground:'#3a2a10', road:'#282018', stripe:'#ff8800' },
  rainbow:      { sky:['#a0c8f8','#f0c0f8'], ground:'#78d878', road:'#606060', stripe:'#ff80ff' },
  cyber:        { sky:['#050510','#0a0520'], ground:'#050515', road:'#181828', stripe:'#a020ff' },
  blizzard:     { sky:['#c0d0e0','#a0b8d0'], ground:'#c8d8e8', road:'#707888', stripe:'#fff' },
  finale:       { sky:['#050510','#100518'], ground:'#0a1a0a', road:'#202028', stripe:'#ffe034' }
};
