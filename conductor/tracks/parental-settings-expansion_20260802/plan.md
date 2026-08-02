# Implementation Plan: Parental Settings Expansion — App Version & Progress Reset

## Phase 1 — App Version Display [checkpoint: 70cf1c4]

- [x] Task: Write failing tests for the Settings footer version row (renders `__APP_VERSION__`-sourced text at the footer position; parent-facing; non-interactive) — 47dcdbe
- [x] Task: Expose `__APP_VERSION__` via Vite `define` in `vite.config.ts` (read from `package.json` version) + declare the global in `vite-env.d.ts` — ce2978f
- [x] Task: Implement the footer version row in `SettingsPanel.ts` (Red → Green) — 4ee2ec1
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 2 — Reset Progress (logic + UI) [checkpoint: d296cee]

- [x] Task: Write failing tests for `resetProgress()` in `src/__tests__/utils/storage.test.ts` (clears all 7 stickers, preserves settings, handles empty/corrupt data, persists) — 183314d
- [x] Task: Implement `resetProgress()` in `src/utils/storage.ts` (Red → Green) — 183314d
- [x] Task: Write tests for the confirm modal + reset row (row renders; tap opens modal; Cancel dismisses without change; Reset fires `resetProgress()`; ≥64px touch targets) — 5c0e8e7
- [x] Task: Implement the "Reset Progress" row + confirm modal + confirmation feedback in `SettingsPanel.ts` (Red → Green) — 5c0e8e7
- [~] Task: Phase Verification & Checkpoint (Refer to workflow.md)

## Phase 3 — Integration, Docs & Verification

- [ ] Task: Verify the Hub sticker shelf reflects the reset state (shelf reads storage on scene create; add/adjust test if needed)
- [ ] Task: Update docs — dated note in `conductor/tech-stack.md` (`__APP_VERSION__` define + `resetProgress`), parental-settings section in `docs/PRD.md` / `docs/TDD.md` / `docs/release-checklist.md`
- [ ] Task: Full quality gate run — `pnpm run check`, `CI=true pnpm test`, `pnpm run build`, `node scripts/validate-pwa.js`
- [ ] Task: Manual device verification (version display + reset flow on tablet/phone) — documented in checklist
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
