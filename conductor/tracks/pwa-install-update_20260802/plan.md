# Implementation Plan: PWA Install & Update UX

## Phase 1 — PWA Registration & Update/Offline Toasts

- [x] Task: Write failing tests for SW registration bridge (pure logic: update-state tracking, toast-queueing, once-only offline toast) in `src/__tests__/utils/pwaBridge.test.ts` (5c2e0ae)
- [x] Task: Implement `src/utils/pwaBridge.ts` — wraps `virtual:pwa-register`'s `registerSW({ immediate: true })`, exposes `onNeedRefresh`/`onOfflineReady` events and a queue that defers toasts until Hub is active (Red → Green) (5c2e0ae)
- [x] Task: Write tests for Hub toast UI component (render, dismiss, update action fires `updateSW(true)`, reduced-motion behavior) (c07ecb0)
- [x] Task: Implement Hub toast component (app-styled, palette colors, no new audio, dismiss button, "Update now" button) (c07ecb0)
- [x] Task: Wire toasts into HubScene (show on scene create if queued; update prompt shows persistently until resolved) (033e064)
- [x] Task: Change `vite.config.ts` `registerType: "autoUpdate"` → `"prompt"` (033e064)
- [x] Task: Phase Verification & Checkpoint (Refer to workflow.md) [checkpoint: 5357063]

## Phase 2 — Context-Aware Install Control in Settings

- [x] Task: Write failing tests for `src/utils/pwaInstall.ts` (pure logic: state detection — prompt-available vs iOS-Safari vs installed/standalone; label selection; hidden rules) (a9e20aa)
- [x] Task: Implement `src/utils/pwaInstall.ts` (platform detection, `beforeinstallprompt` capture, `appinstalled` tracking) (a9e20aa)
- [~] Task: Write tests for SettingsPanel install row + iOS instructions overlay (button states, tap → `prompt()` called, overlay opens/closes)
- [ ] Task: Implement install row in `SettingsPanel.ts` (context-aware button per state; hide when installed)
- [ ] Task: Implement iOS "How to Install" overlay (Share → Add to Home Screen, app-styled, visual cues)
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Icon & Meta Polish

- [ ] Task: Add 192×192 and maskable 512×512 icons to `public/icons/` (PNG generated from existing 512 asset)
- [ ] Task: Update manifest in `vite.config.ts` (192px icon, maskable purpose entry)
- [ ] Task: Add iOS meta tags + `apple-touch-icon` link to `index.html`
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 4 — Full Verification, Docs & Device Test

- [ ] Task: Update `conductor/tech-stack.md` (registerType change + new PWA UX modules) with dated note
- [ ] Task: Update `docs/PRD.md` / `docs/TDD.md` / `docs/release-checklist.md` (PWA install/update UX section, device checklist items)
- [ ] Task: Full quality gate run — `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js`
- [ ] Task: Manual Android phone verification (install via Settings button, offline play, update flow via new deploy) — documented in checklist
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
