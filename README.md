# PackSpike — packaging spike (throwaway)

**Question:** can our Vite + Three.js stack ship as a no-install Windows `.exe` before the 3 December
game jam?

**Answer:** yes. A Windows zip cross-builds cleanly from Linux in ~1 minute, and the same Electron
shell runs the WebGL cube in a Linux AppImage on this machine. The only open item is the mandatory
smoke test on a clean Windows 10 machine (revelcev). This branch is a spike: nothing merges, no
binaries are committed, nothing is signed.

## ThreatScope desktop build (moved here)

The real Electron shell for ThreatScope now lives in [`threatscope-electron/`](threatscope-electron/).
It consumes the built frontend from `0xDimash/threatscope` (no source is duplicated) and packages a
Linux AppImage or Windows zip. See [its README](threatscope-electron/README.md) for commands.

The rest of this document is the original throwaway cube spike, kept as evidence for the decision.

## Versions used

| Component | Version |
|---|---|
| Node | `v18.19.1` |
| npm / npx | `9.2.0` / `9.2.0` |
| create-vite (fallback) | `5.5.5` |
| electron | `45.4.1` |
| electron-builder | `26.18.0` |
| three / @types/three | `0.187.0` / `0.187.0` |
| typescript | `5.6.3` |
| vite | `5.4.21` |
| Host | Linux, kernel `6.8.0-151-generic`, X11 `DISPLAY=:0`, 1366×768 screen |

## Results

| Target | Command | Built? | Ran? | Where | Artefact size |
|---|---|---|---|---|---|
| Linux AppImage | `npx electron-builder --linux AppImage` | ✅ | ✅ — cube spins, no menu bar, clean close | Dimash, Linux Mint | `128,264,090` B (~122 MiB) |
| Windows zip | `npx electron-builder --win zip` | ✅ | ⏳ zip verified; **needs revelcev on clean Windows 10** | cross-built on Linux | `155,563,565` B (~148 MiB) |
| Windows NSIS | `npx electron-builder --win nsis` | ❌ | — | blocked: `wine` missing | no installer produced |
| macOS zip | `npx electron-builder --mac zip` | ✅ (unsigned) | ⏳ not runnable on Linux — Pazun to verify | built on Linux as a curiosity | `123,756,448` B (~118 MiB) |

Local artefacts (never committed): `release/PackSpike-0.0.0.AppImage`,
`release/PackSpike-0.0.0-win.zip`, `release/PackSpike-0.0.0-mac.zip`.

## Copy-pasteable commands

```bash
# Scaffold — Node 18 cannot run create-vite@latest (see pitfalls)
npm create vite@5 . -- --template vanilla-ts   # choose vanilla-ts when prompted
npm install
npm install three
npm install -D electron electron-builder @types/three
```

Then write the four important files (already in this branch):

- `vite.config.ts` → `base: './'` — otherwise `file://` loading gives a blank white window.
- `electron/main.cjs` → `BrowserWindow({ width: 1280, height: 720, autoHideMenuBar: true })`,
  `loadFile(path.join(__dirname, '../dist/index.html'))`, `contextIsolation: true`,
  `nodeIntegration: false`.
- `package.json` → `"main": "electron/main.cjs"`, `"productName": "PackSpike"`, builder
  `appId: dev.dimash.packspike`; scripts `dist:*` wrap build + target.
- `src/main.ts` → Three.js `WebGLRenderer`, rotating `BoxGeometry`/`MeshNormalMaterial`, plus a
  status line showing the GL version, frame counter and rotation angle.

```bash
npm run build

# Targets
npx electron-builder --linux AppImage
npx electron-builder --win zip          # the priority target; no wine needed
npx electron-builder --win nsis         # needs wine on Linux; expected to fail here
npx electron-builder --mac zip          # succeeds unsigned on Linux; not runnable here

# Run / inspect
DISPLAY=:0 ./release/PackSpike-0.0.0.AppImage
unzip -l release/PackSpike-0.0.0-win.zip | grep PackSpike.exe
npx asar list release/win-unpacked/resources/app.asar | grep -E 'dist/index.html|electron/main.cjs'
```

Equivalent npm scripts: `npm run dist:linux`, `npm run dist:win-zip`, `npm run dist:win-nsis`,
`npm run dist:mac-zip`.

## Verification evidence

**Linux AppImage** — launched with `DISPLAY=:0 ./release/PackSpike-0.0.0.AppImage`:

- window `PackSpike` appeared; Electron requested **1280×720**, the Cinnamon window manager clamped
  the client area to **1280×696** on this 1366×768 desktop (32 px frame extents). On a normal-size
  monitor the full 720 px height applies.
- two captures of the same window 1.2 s apart differed in **75,263 pixels (8.4%)** inside the cube
  region — the cube is visibly rotating, not a static screenshot. The status line reports
  `WebGL OK · ... · frame N · angle X°` with both counters advancing.
- the top 64 rows of the window are a single flat background colour — **no menu bar** drawn
  (`autoHideMenuBar: true`).
- `wmctrl -ic` closed the window; the process exited with no crash log.

Only console noise: `libva error: .../iHD_drv_video.so init failed` — hardware video decode is
absent in this VM; WebGL still rendered (software GL path). Not an app error.

**Windows zip** — `unzip -l release/PackSpike-0.0.0-win.zip` shows:

```
249978368  2026-11-24 17:29   PackSpike.exe
 12420230  2026-11-24 17:29   resources/app.asar
```

`dist/index.html` inside `app.asar` references `./assets/...` (relative), not `/assets/...`.
`electron/main.cjs` and `package.json` are inside the asar too. Zip is ready for handoff.

## Failed commands — exact errors

1. `npm create vite@latest . -- --template vanilla-ts`

   ```
   SyntaxError: The requested module 'node:util' does not provide an export named 'styleText'
   ```

   Latest create-vite requires newer Node; this machine has Node 18. Use `npm create vite@5`.

2. `npx electron-builder --win nsis` (exit code 1)

   ```
   ⨯ wine process failed ENOENT
   Exit code:
   ENOENT
   Output:
   Exit code: ENOENT. spawn wine ENOENT  failedTask=build
   ```

   `wine` is not installed (`command -v wine` → nothing). Per the timebox we stopped here — the
   zip is the submission format anyway. Leftover partial files (`PackSpike Setup 0.0.0.exe`,
   `packaging-spike-0.0.0-x64.nsis.7z`) are unusable and stay local.

3. `npx electron-builder --mac zip` — **expected to fail, did not.** electron-builder 26 produced
   an unsigned zip on Linux, but macOS codesigning is unavailable here
   (`skipped macOS application code signing reason=supported only on macOS`). It has not been run;
   Pazun should build/run his own on macOS.

## Pitfalls

- **Blank white window in the packaged app:** Vite defaults to `base: '/'`; `file://` then looks for
  `/assets/...` at the filesystem root. Set `base: './'` and check `dist/index.html` contains
  `src="./assets/..."`. This was fixed before packaging, so not hit in the final builds.
- **Scaffolding on Node 18:** use `create-vite@5`; `@latest` needs Node 20+ (`styleText`).
- **NSIS needs wine on Linux:** not installed, no installer. The zip target does **not** need wine
  and is the better fit for "no install, clean Windows 10".
- **Signing / SmartScreen:** no certificate configured, all builds logged
  `no code signing certificate configured, signing is skipped`. The exe will trigger Windows
  SmartScreen "unknown publisher"; expected user path is **More info → Run anyway**. Do not sign
  anything in the spike; if the jam demands a signed binary, that is a separate decision.
- **libva on this Linux host:** harmless `init failed` message; WebGL still works.
- **Window height on a small desktop:** WM clamped 1280×720 → 1280×696 here; not an Electron bug.
- **Telegram handoff:** this environment has no Telegram client or bot token. The zip must be sent
  by a human; nothing was uploaded or signed.

## Verdict

**We can ship a Windows .exe on 3 December.** The exact plan: Dimash builds
`npm run dist:win-zip` on Linux (~1 min, no wine, no signing) and hands
`release/PackSpike-0.0.0-win.zip` to revelcev; revelcev unzips it anywhere, double-clicks
`PackSpike.exe`, clicks through SmartScreen with More info → Run anyway, and confirms the 1280×720
window, hidden menu bar and spinning multicolour cube (status line counting frames). Pazun builds
the optional macOS zip on his Mac; do not rely on the Linux-built mac zip. Do not spend the
remaining time on NSIS/installers — the zip is the submission. The only unverified link is the
clean-Windows-10 run; until revelcev reports it, treat the "no-install exe" requirement as
**high confidence, one smoke test away from proven**.
