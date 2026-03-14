# 🏎️ TURBO DRIFT

A browser-based 3D pseudo-3D car racing game with **20 levels**, Fortnite-inspired visual aesthetic, natural environments, and progressive difficulty.

## 🎮 Play It

Just open `index.html` in any modern browser. Works great on iPad Safari!

**Live demo:** Deploy to GitHub Pages by enabling it in your repo settings → point to the `main` branch root.

---

## 📂 File Structure

```
racing-game/
├── index.html          ← Main HTML, all screens
├── css/
│   └── style.css       ← Full styling (Fortnite-inspired UI)
└── js/
    ├── levels.js       ← All 20 level configs + environment palettes
    ├── renderer.js     ← Pseudo-3D road renderer (OutRun-style)
    ├── physics.js      ← Car physics, AI, hazard collisions
    └── game.js         ← Game loop, screen management, HUD
```

No dependencies. No build step. Pure HTML5 Canvas + CSS + JS.

---

## 🕹 Controls

| Input | Action |
|-------|--------|
| `↑` / `W` | Accelerate |
| `↓` / `S` / `Space` | Brake |
| `←` / `A` | Steer left |
| `→` / `D` | Steer right |
| On-screen D-Pad | Touch / iPad controls |

---

## 🌍 All 20 Levels

| # | Name | Environment | Hazards | AI Cars | Laps |
|---|------|-------------|---------|---------|------|
| 1 | Rookie Run | 🌿 Meadow | — | 0 | 1 |
| 2 | Forest Curves | 🌲 Forest | — | 0 | 1 |
| 3 | Sunset Hills | 🌅 Hills | — | 1 | 2 |
| 4 | Dusty Canyon | 🪨 Canyon | Rocks | 1 | 2 |
| 5 | Jungle Sprint | 🌿 Jungle | Logs | 2 | 2 |
| 6 | Rainy Valley | 🌧 Rain | Wet grip | 2 | 2 |
| 7 | Oil Slick Speedway | 🏎 Speedway | Oil slicks | 2 | 2 |
| 8 | Mountain Pass | 🏔 Mountain | Rocks + Fog | 3 | 2 |
| 9 | Arctic Drift | 🧊 Arctic | Ice patches | 3 | 2 |
| 10 | Desert Storm | 🏜 Desert | All + 3 laps | 3 | 3 |
| 11 | Night Forest | 🌙 Night | Logs (dark) | 3 | 2 |
| 12 | Lava Canyon | 🌋 Volcano | Rocks | 4 | 2 |
| 13 | Flood Delta | 🌊 Swamp | Logs + Rain + Fog | 4 | 3 |
| 14 | Glacier Pass | 🏔 Glacier | Ice + Fog + Rocks | 4 | 3 |
| 15 | Thunder Circuit | ⚡ Storm | Rain + Oil | 4 | 3 |
| 16 | Death Valley Dash | 🌵 Desert Night | All | 5 | 3 |
| 17 | Rainbow Ridge | 🌈 Rainbow | Ice + Oil | 5 | 3 |
| 18 | Cyber Canyon | 💜 Cyber | Rain + Oil + Rocks | 5 | 3 |
| 19 | Blizzard Peak | ❄️ Blizzard | Ice + Fog + Rain | 5 | 4 |
| 20 | Grand Prix Finale | 🏆 Finale | EVERYTHING | 5 | 5 |

---

## ⭐ Star System

Each level has a target time. Beat it by different margins to earn stars:

- ⭐⭐⭐ — Beat target by 5+ seconds
- ⭐⭐ — Within 5 seconds of target
- ⭐ — Up to 15 seconds over target
- 💨 — Retry!

---

## 🎨 Technical Notes

### Rendering
Uses a **pseudo-3D projection** technique (a la OutRun / Road Rash):
- Road segments are projected forward with scaling
- Sprites (obstacles, AI cars, hazards) are depth-sorted and scaled
- Each environment has a unique sky/ground palette
- Dynamic decorations: trees, mountains, clouds, stars, lava glow, neon grid

### Physics
- Acceleration / braking / friction model
- Rain reduces grip (× 0.72)
- Ice causes lateral sliding
- Oil causes directional sliding
- Rock/log collisions trigger a spin-out timer
- Rubber-band AI that scales to track speed

### iPad / Touch
- On-screen D-Pad auto-shows on touch devices (`pointer: coarse` media query)
- No pinch-zoom (viewport locked)
- 60fps canvas rendering

---

## 🚀 Deploy to GitHub Pages

1. Create a new repo and push this folder
2. Go to **Settings → Pages**
3. Source: `Deploy from branch` → `main` → `/ (root)`
4. Visit `https://yourusername.github.io/your-repo-name`

---

## 📝 License

MIT — free to use, modify, and share.
