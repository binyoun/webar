# Elemental WebAR

Photographs that open when you look at them.

A data-driven WebAR kit: a printed photograph becomes an image-tracking AR
marker, and a video, second image, or 3D model appears on top of it in the
visitor's phone browser. No app, no account, no payment wall. Built on
A-Frame + MindAR, hosted free on GitHub Pages.

One codebase serves every work. Adding a work = one entry in `config.json`
plus two asset files. This is the same architecture as SELECT PERCEPTION
ENGINE: the config is the artwork registry, the code never changes.

## Files

| File | Role |
|---|---|
| `index.html` | Gallery landing: scanner-frame cards, per-work QR label generator for exhibition print |
| `ar.html` + `js/ar-app.js` | The AR viewer. `ar.html?work=<slug>` builds the scene from config. Desktop and non-https visitors get a graceful fallback that shows the overlay directly |
| `config.json` | The registry. Seven example entries cover video, image, glb, lenses, sonified, GPS-gated, and compass-gated works |
| `GUIDE.md` | Part 1: core workshop (photo to exhibited AR work). Part 2: six experiments with lineage, config hooks, and assessable exercises |
| `experiments/` | Six standalone teaching pages, each under 150 commented lines: 01 NFC writer (Sacred Tree), 02 GPS fence (Mycelium Network), 03 compass (geloracompass), 04 sonify (Vanishing Waters), 05 lenses (SELECT PERCEPTION ENGINE), 06 lookup (mansion-finder) |
| `assets/targets/` | Compiled `.mind` files + target jpgs |
| `assets/overlays/` | Videos, images, glb models |

## Deploy (once)

1. Create a repo, push these files
2. Settings > Pages > Deploy from branch > main, root
3. The site is live at `https://<user>.github.io/<repo>/`

AR requires https and a camera, so always test on the deployed URL from a
phone, never from file://.

## Two lives of this repo

**Now: class material.** Each student adds one config entry and two assets;
the gallery page becomes the cohort's exhibition index, and the QR labels go
on the wall next to the prints. Fits the exhibition-centered assessment flow:
the deployed gallery is the deliverable.

**Later: studio service.** The same structure is the productized offering
(one config entry per client work, fixed price tiers by overlay type). A
payment and intake layer can be added in front without touching the AR core.
Deliberately out of scope for now.

## House style

Design tokens match binyoun.com: #0b0b0b ground, Space Grotesk,
JetBrains Mono, terracotta #c1440e. The scanner-frame corner brackets on
gallery cards echo the specimen-HUD treatment on binyoun.com. No em-dashes
anywhere in this repo.
