# ThreatScope desktop (Electron)

The Electron shell for the real ThreatScope UI. It is a **client**: the Python backend still runs
separately on `localhost:8000`. This repo holds no duplicate frontend source — `npm run build`
builds the frontend from the `threatscope` product repo and copies its `dist/` here.

## Layout

- `electron/main.cjs` — 1280×720 window, hidden menu bar, `contextIsolation: true`,
  `nodeIntegration: false`. Serves `dist/` from a tiny local HTTP server on
  `http://localhost:5173`, then loads that URL. This keeps the backend's existing
  `CORS_ORIGINS=http://localhost:5173` and the frontend's REST/WebSocket URL resolution unchanged.
- `scripts/copy-frontend.mjs` — builds and copies the product frontend (cross-platform).
- `package.json` — electron-builder config: `appId: dev.dimash.threatscope`,
  `productName: ThreatScope`, outputs to `release/`.

## Build

Prerequisites: Node 20+ (Node 18 also worked for the spike), npm, and the product repo checked out
**next to this one**:

```
/home/bebra/Documents/
├── threatscope/          # https://github.com/0xDimash/threatscope
└── packaging-spike/      # this repo
  └── threatscope-electron/
```

If the product repo is somewhere else, set `THREATSCOPE_FRONTEND` to its `frontend/` directory.

```bash
cd threatscope-electron
npm ci                       # installs electron + electron-builder only

npm run electron             # build frontend, then open the desktop app
npm run dist:linux           # AppImage in release/
npm run dist:win-zip         # Windows zip in release/ (cross-builds from Linux)
```

To reuse an already-built `frontend/dist/` without rebuilding:

```bash
SKIP_FRONTEND_BUILD=1 npm run dist:win-zip
```

 artefacts (`dist/`, `release/`, `node_modules/`) are gitignored and are never committed.

## Run

1. Start the backend on `:8000` with `CORS_ORIGINS=http://localhost:5173`. For a self-contained
   demo, `DEMO_FEED=1` and `make simulate` also work.
2. Make sure port **5173 is free** — stop `npm run dev` first, since Vite uses the same port.
3. Unzip `release/ThreatScope-0.1.0-win.zip` anywhere on Windows and run `ThreatScope.exe`.
   The zip is unsigned: expect SmartScreen → **More info → Run anyway**.
4. Open **Minimal Room** and click the HUD rate `5/s` to see live events.

On Linux, run `./release/ThreatScope-0.1.0.AppImage` directly.

## Proven on

- Linux AppImage (built from the product repo with this same shell): `ThreatScope-0.1.0.AppImage`,
  128,317,248 B — opened a `ThreatScope 3D` window at 1280×696 client size (Cinnamon clamped 720 px
  on a 1366×768 desktop), live feed connected, HUD showed real events, canvas animated (22,781 px
  changed between two captures).
- Windows zip (rebuilt from **this** repo): `ThreatScope-0.1.0-win.zip`, 153,361,978 B — contains
  `ThreatScope.exe` (249,978,368 B) and `resources/app.asar` (591,092 B). Clean Windows 10 run is
  still pending from revelcev.

The original throwaway cube spike is documented in the [root README](../README.md) and kept for
reference; nothing from it is used by the desktop build.
