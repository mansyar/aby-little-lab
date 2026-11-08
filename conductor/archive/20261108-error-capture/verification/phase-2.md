# Phase 2 verification — capture, record, recover

Track `20261108-error-capture` · phase 2 of 4 · branch `feat/20261108-error-capture`
Base `cd23a0c7fbd92c4034bfdaa2e582767ef460b312` (confirmed with `git rev-parse HEAD`)
Head `2433c1d9` (six commits, no merges)

**Result: partial.** Everything the phase set out to build is built and green, with one
unresolved item: the guard does not yet watch `window.`, and the capture module cannot be
allowlisted until it does. The reason it was not forced through is in
[Blocked](#blocked) — it needs a decision the brief reserves for the primary.

## Commands

The gate was run as eight separate commands. The harness forbids `&&` chaining and
denies `pnpm exec`, so `pnpm exec biome check --write` and `pnpm exec vitest` are not
available to this phase; `pnpm check` (read-only) plus hand-applied formatting, and
`pnpm test -- --run`, are the same checks by a permitted route.

| Command | Exit | The number that mattered |
|---|---|---|
| `pnpm check` | 0 | 315 files |
| `pnpm typecheck` | 0 | both projects clean (app + e2e) |
| `pnpm test -- --run` | 0 | **144 files / 3,133 tests** (was 141/3,103; +28) |
| `pnpm test:coverage` | 0 | statements 97.38, branches 91.97, functions 96.34, lines 98.32 |
| `pnpm build` | 0 | 371 modules; shell entry `index-CiyU_VOc.js` 175.07 kB raw |
| `node scripts/validate-bundle.js` | 0 | shell entry **171.0 kB** ≤ 200 kB (phase 1: 168.3 kB) |
| `node scripts/validate-pwa.js` | 0 | 16 checks, 47 chunks / 47 precached |
| `node scripts/validate-docs.js` | 0 | 5 checks |

The +28 tests: 8 in `storage.test.ts` (the crash log), 4 in `reload.test.ts`, 10 in
`errorCapture.test.ts`, 6 in `recoverScene.test.ts`.

`pnpm test:e2e` was **not** run: the browser journey is Phase 4 (AC-10).

## What the handler does

`src/game/errorCapture.ts` installs one listener per event, and the handler is
record-then-recover, with recording inside the only `try`:

```ts
const capture = (kind: CrashKind, reason: unknown): void => {
  try {
    recordCrash(toCrashEntry(kind, reason, now()));
  } catch {
    // A recorder that throws must still produce the card (FR-4). Recovery is
    // the reason this handler exists, so the catch falls through to it.
  }
  recover();
};
```

`recover()` decides in this order, and the order is the requirement:

```ts
const key = deps.activeSceneKey?.() ?? null;
if (key === RECOVER_SCENE_KEY) return;
if (key !== null) {
  game.scene.start(RECOVER_SCENE_KEY);
  return;
}
reload();
```

- **A scene is running** → `game.scene.start("Recover")`.
- **The card is already up** → nothing. A crash inside the card does not restart it.
- **No scene at all** → the one guarded `reloadOnce()`.

`scene.start` and not an overlay: starting a scene **replaces** the running one, so a
scene that throws every frame is stopped before its next update. A card floated on top
would leave the broken scene updating underneath it, still throwing, and the child would
be looking at a card drawn by a scene that is about to throw again.

Two smaller decisions worth recording. `deps.target ?? window` means the two listeners
go on the real window in production and on a fake in every test, so no test file
attaches anything to the page. And `handleError` takes `ErrorEvent | Event`, reading
`event.error ?? event.message` only when the event really is an `ErrorEvent`: a plain
`Event` on `"error"` is a lie to read members off, and `toCrashEntry` already knows how
to describe an arbitrary value.

No `preventDefault` anywhere: Phaser's own reporting still reaches the console,
because a parent with devtools open is the last line of diagnosis.

## The guard

`src/__tests__/guard/backupDom.test.ts` now watches seven globals and one network
pattern:

| Pattern | Forbids |
|---|---|
| `\bdocument\b` | any DOM node access |
| `\bBlob\b` | any binary construction |
| `\bURL\.` | any object-URL use |
| `\bcrypto\.` | any hashing/randomness through the platform |
| `\bFileReader\b` | any file reading |
| `\bnavigator\.clipboard\b` | any clipboard access |
| **`\bsessionStorage\.`** | **any session-store access** (new this phase) |
| `\bfetch\(` | any network call |

Allowances, each with its reason in the source:

| Module | Reason |
|---|---|
| `utils/backupFile.ts` (`SEAM`) | the download seam: `Blob`, `URL.`, `document` |
| `audio/AudioManager.ts` | pauses the music while the page is hidden (`visibilitychange`) |
| `game/hub/playTimeUi.ts` | shows and hides the play-time banner (`visibilitychange`) |
| `game/playTimeLogic.ts` | accrues play time only while the page is visible |
| `utils/fonts.ts` | awaits `document.fonts.load` before the first letters are drawn |
| `utils/viewportZoom.ts` | reads the viewport meta tag to size the canvas |
| **`utils/reload.ts`** | **reloads the page once when the canvas never came up** (new) |

The new probe proves the pattern has teeth rather than merely existing:

```ts
expect(domSitesIn('sessionStorage.getItem("x");', "probe.ts")).toEqual([
  { name: "sessionStorage", site: "probe.ts:1" },
]);
```

One read is one site, in a module nobody has allowlisted. An existing probe asserts the
opposite direction on prose (`// no document here` → `[]`), so a comment cannot satisfy
the guard either. The sixth test in that file — *keeps every allowance pointing at a file
that still names its global* — is what makes the `reload.ts` entry real rather than
decorative: if the guard stopped naming `sessionStorage`, or the module stopped using
it, that test fails.

## Acceptance

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| AC-4 | A refused write does not throw, the entry lives in memory for the session, and the next accepted save persists it | `storage.test.ts` → `crash log` → "keeps a refused write in memory and persists it once the store accepts writes" | met |
| AC-5 | An uncaught error while the hub is active shows the card, the card holds no text, its single button reloads | `errorCapture.test.ts` → "replaces the running scene … stops"; `recoverScene.test.ts` → "draws no text at all", "makes exactly one object interactive: the button", "reloads when the button is tapped" | met at unit level; the "reloads to a working hub" half is the Phase 4 journey (AC-10) |
| AC-6 | No active scene reloads exactly once; a second crash in the same session does not reload again and is logged | `errorCapture.test.ts` → "reloads once when no scene ever came up, then only logs the second crash"; `reload.test.ts` → "does not reload a second time once the session has spent it" | met |
| AC-9 | The guard fails if a new module names a watched global, and fails if an allowed module stops naming its global | `backupDom.test.ts` → probe above, plus "keeps every allowance pointing at a file that still names its global" | **partial** — `sessionStorage` done; `window.` not added, see Blocked |

Also covered here but not asked of this phase: the pre-track payload loads an empty log
and saves normally at `SCHEMA_VERSION` 1, and an unknown-version payload is still
refused a write with its bytes intact after a recorded crash (AC-3, `storage.test.ts` →
`crash log` → the last two cases).

## Deviations

1. **`src/__tests__/helpers/phaserMock.ts`** — outside `Touches`. The card's hit area is
   `new Phaser.Geom.Circle(0, 0, 72)` with `Phaser.Geom.Circle.Contains`, exactly as the
   brief specifies, and the mock modelled `Geom.Rectangle` only. Added `MockCircle` and
   wired it into `Geom` beside `Rectangle` (17 lines). The alternative was a square hit
   area for the sake of the mock, which would have meant the test asserting something the
   scene does not do.
2. **`src/__tests__/utils/backupFormat.test.ts`** — one line: `SETTINGS` is typed
   `Settings`, so it needs `diagnostics: []`. Outside `Touches`.
3. **`src/__tests__/utils/storage.test.ts`** — five older full-settings `toEqual`
   assertions (v1 migration, unknown-version defaults, read-blocked defaults,
   storage-global-blocked defaults, import-replace) gained the new field, and
   `INCOMING_SETTINGS` carries it. Without this the assertions would have failed on a
   correct change.
4. **`src/__tests__/game/profileLogic.test.ts`** — `v1Save`'s settings fixture is typed
   `Settings`, so it gained `diagnostics: []`. The *absent-field* case is deliberately
   modelled where it can be raw: `storage.test.ts` writes a pre-track payload as JSON.
5. **`docs/TDD.md`** beyond the three count claims: lines 372, 440, 442 and 450 said the
   scene array carries three scenes and that the entry chunk holds only Boot, Preload and
   Hub constructors. This phase makes both false, so they now name the eager fourth
   scene and why it is eager. The alternative was a document that contradicts the code.
6. **`pnpm exec` is denied** (`biome`, `vitest`). Used `pnpm check` + hand-applied
   formatting, and `pnpm test -- --run`. Recorded because the brief names the `exec` forms.
7. **The gate ran as eight commands**, not one `&&` chain — chaining is denied.
8. **Boot smoke not run.** `main.ts` changed, so `docs/validate-boot.js` would normally
   apply. It needs a preview already serving on 4173 and the harness gives no way to stop
   a background preview, leaving a stale server that would break the primary's own build
   step. The built artifact was exercised by both artifact validators (bundle, PWA); the
   boot *time* measurement is left to the primary, whose environment owns the server.
9. **`errorCapture.ts` also exports `runningSceneKey(game)`.** The `activeSceneKey` dep
   must be built from `game.scene.getScenes(true)[0]?.scene.key`; keeping that two-line
   Phaser detail in the capture module (rather than inline in `main.ts`, which is
   coverage-exempt and therefore would have tested nothing) is what let it be covered.

## Blocked

**The `window.` pattern cannot be added without a decision that is the primary's.**

The brief anticipated one allowance for `errorCapture.ts` and one for `reload.ts`. Two
facts found while implementing make that combination impossible as written:

1. **Ten untouched production modules already name `window.`**, and adding
   `{ name: "window.", pattern: /\bwindow\./g }` fails the suite on all of them. They are
   not accidents — each is a browser API Phaser does not wrap:
   - `src/audio/AudioManager.ts:516,588` — `window.speechSynthesis`
   - `src/components/RoundNarrator.ts:49` — `window.speechSynthesis`
   - `src/components/SettingsPanel.ts:352,374` — `window.speechSynthesis`
   - `src/components/settings/VoiceRow.ts:271` — `window.speechSynthesis`
   - `src/game/playTimeLogic.ts:173,174,187,199` — `window.addEventListener`/`removeEventListener` (visibility, pagehide)
   - `src/game/e2eBridge.ts:315` — `window.__abyE2E = …`
   - `src/utils/backupFile.ts:60` — `window.location.reload()`
   - `src/utils/motion.ts:11,14` — `window.matchMedia`
   - `src/utils/pwaInstall.ts:147,148,173,174,175,176` — `window.addEventListener`/`removeEventListener`/`matchMedia`
   - `src/utils/speech.ts:149` — `window.setTimeout`
2. **The capture module would still not match it.** `installErrorCapture` attaches
   through `deps.target ?? window` and never writes `window.member`, so under a
   member-access pattern `domSitesIn(errorCapture.ts)` is `[]`. Adding it to `ALLOWED`
   would fail the coupling test ("keeps every allowance pointing at a file that still
   names its global") — the guard would correctly refuse an allowance with nothing behind
   it.

So the brief's instruction — stop and report rather than add an allowance to make the
suite pass — is what happened. Two ways out, both one small edit each; the first is the
one I recommend.

**Option A (recommended): narrow the pattern, and give the capture module its own
positive assertion.**

- `{ name: "window.", pattern: /\bwindow\.(addEventListener|location|sessionStorage)\b/g }`
- add to `PRE_EXISTING`: `{ path: "utils/pwaInstall.ts", reason: "catches beforeinstallprompt/appinstalled and reads the standalone display mode, which exist only on window" }` — `pwaInstall.ts` matches on `addEventListener`; `playTimeLogic.ts` matches on `addEventListener` and is already allowed; `backupFile.ts` matches on `location` and is the seam.
- `errorCapture.ts` is *not* allowlisted. Instead, a dedicated test asserts the property
  FR-12 actually wants — that the capture module is where the listeners live:

  ```ts
  it("attaches the crash listeners in the one module allowed to hear them", () => {
    const capture = productionSources().find((file) => file.path === "game/errorCapture.ts");
    expect(capture?.source).toContain('addEventListener("error"');
    expect(capture?.source).toContain('addEventListener("unhandledrejection"');
  });
  ```

  That fails if the module loses its entry or stops naming its global, which is the
  clause in AC-9 that matters; it does not pretend `window` is a member access it is not.

**Option B: watch `window.` wholesale and pay the ten allowances.** Honest, and it makes
the guard say "only these ten modules touch the window object at all", but it turns a
one-module guard into a ten-module one on the strength of a track that needed two.

I implemented neither, because either changes what the guard *means* and the brief gives
that call to the primary. The `sessionStorage` half of Task 4 is done and green; the
`window.` half is the single open item in this phase.

## Notes

- `recordCrash` deliberately has no `try` of its own: `mutate`/`saveV2` are total by
  construction (phase `20261107-storage-resilience`), and a catch no test can reach is an
  uncovered branch. The *handler's* `try` is the belt, and the "recorder that throws"
  test proves the braces.
- The unknown-`schemaVersion` branch of `mutate` is memory-only by design, so a crash
  recorded on such a device stays in memory for the session and is never written: the
  test asserts the stored bytes are untouched. That is the storage layer's write
  protection doing its job, and it is stated here rather than worked around.
- `getDiagnostics()` returns `[...settings.diagnostics]`, not the live array: a caller
  that sorts or truncates what it gets back must not be able to edit the save's log.
- Importing a backup file replaces the whole save, the crash log included
  (`INCOMING_SETTINGS`), because FR-6 says replace means replace. A file written by a
  build without a log therefore clears this device's log — worth knowing before phase 3
  writes the export row, not worth special-casing.
- The card keeps no state: `raise` happens once per page load because the *scene* is
  started once — a second crash while it is up finds `key === "Recover"` and returns.
  There is no module flag to leak between tests, and no way for two cards to stack.
- `RecoverScene` has no press feedback on its button. `attachPressFeedback` is typed to
  `Text | Rectangle | Image`, so fitting it to the hit circle or a container means a cast;
  scale feedback on an invisible hit disc also produces nothing a child can see. The card
  is a single tap anywhere on a 144 px target, which is the affordance that matters.
- Shell entry grew 168.3 kB → 171.0 kB (+2.7 kB): `errorCapture.ts` is now reachable from
  `main.ts`, and `RecoverScene` is eager as NFR-4 requires. Reported, not trimmed.

## Primary verification

Verified 2026-11-08 by the primary, independently of the executor's report.

- Phase base: `cd23a0c7fbd92c4034bfdaa2e582767ef460b312`
- Phase head (executor): `2433c1d9`
- Phase head (with the guard decision below): recorded in the squash commit

| Check | Command | Result |
| --- | --- | --- |
| Tree | `git status --porcelain` | clean except this file (evidence is uncommitted by design) |
| Scope | `git diff --stat cd23a0c7..HEAD` | 18 files, +1,011/−25; three are tests whose fixtures hold a full `Settings` |
| Static | `pnpm check` | 315 files, no findings |
| Types | `pnpm typecheck` | both programs clean |
| Unit | `CI=true pnpm test` | **144 files / 3,134 tests** passed, 19.70 s |
| Coverage | `pnpm test:coverage` | statements 97.38 (6516/6691), branches 91.97 (1959/2130), functions 96.34 (1425/1479), lines 98.32 (6057/6160) |
| Build | `pnpm build` | built in 918 ms, 59 precache entries (1768.45 KiB) |
| Bundle | `node scripts/validate-bundle.js` | phaser 1335.0 kB; shell entry `index-CiyU_VOc.js` **171.0 kB** ≤ 200 kB |
| PWA | `node scripts/validate-pwa.js` | 16 passed, 47 chunks / 47 precached |
| Documents | `node scripts/validate-docs.js` | 5 passed |

The three test-file edits outside Touches are not scope creep: `Settings` gained a required
field, so every fixture typed as a whole `Settings` has to say what it holds. They are
`profileLogic.test.ts`, `backupFormat.test.ts` and five whole-object assertions in
`storage.test.ts`. The other two are `phaserMock.ts` (the card's hit area is a real
`Geom.Circle` and the mock modelled rectangles only — the alternative was changing production
geometry to suit a mock) and `docs/TDD.md`'s tree prose, which said the scene array holds three
scenes and is now false.

### The guard decision the executor escalated

The brief told the executor to add a `window.` pattern and not to allowlist its way out, and it
did the right thing: it stopped and reported that the wholesale pattern fails **ten untouched
modules**, and that `errorCapture.ts` would not even match it, because it attaches through
`deps.target ?? window` and never writes `window.member`.

The census decided it. What those ten modules name is `window.speechSynthesis` (four sites),
`window.matchMedia` (two), `window.__abyE2E`, `window.setTimeout`, and `window.addEventListener`.
Only the last two categories are capabilities that escape the app loop; the rest are browser
feature APIs the guard has never been about, and pinning them would generate ten allowances
whose reasons are all "speech, actually". So the pattern is the capability, not the object:

- `{ name: "window.location", pattern: /\bwindow\.location\b/g }` — leaves the page;
- `{ name: "window.addEventListener", pattern: /\bwindow\.(?:add|remove)EventListener\b/g }` — reaches outside the loop;
- `sessionStorage` was already added by the executor and stays.

Allowances follow the same rule: `utils/reload.ts` (reloads once) is newly allowed, and
`utils/pwaInstall.ts` joined `PRE_EXISTING` ("hears the install-prompt events the browser fires
on the window") because it legitimately names `window.addEventListener` and predates the guard.
`errorCapture.ts` is deliberately **not** allowed: it matches no pattern, so an allowance would
fail the guard's own coupling test. Its coupling is asserted directly instead — a new test
requires the module's source to still contain `addEventListener("error"` and
`addEventListener("unhandledrejection"`, so a crashed shape cannot silently stop being heard.
The seam assertion now lists the four globals `backupFile.ts` really names, including the
`window.location` it reloads through.

That is four edits to `backupDom.test.ts`, all mine, and it is the whole of what the executor
left undone. Everything else in the phase was already green.

### What was read, not trusted

- **The log cannot grow the save uncontrolled.** `normalizeV2` re-runs `normalizeDiagnostics`
  on every read, so a hand-edited array is re-capped at twenty and a payload from before this
  track reads as `[]`. `SCHEMA_VERSION` is still 1 and the unknown-version write protection is
  intact — a crash on such a device is recorded memory-only, which `storage.test.ts` asserts.
- **`recordCrash` has no `try` of its own**, and that is right: `mutate` and `saveV2` are total
  by construction from the storage-resilience track, and a catch no test can reach is exactly
  the kind of branch the coverage gate exists to refuse. The one `try` that matters is in the
  handler, and the "recorder that throws" test proves it falls through to the card.
- **`getDiagnostics` returns a copy.** `getSettings` still hands out the settings block for
  historical reasons; the log is the field where a caller appending behind `recordCrash` would
  bypass both the ring buffer and the write path.
- **`reloadOnce` writes the flag before asking for the reload**, so a blocked `location` costs
  the session its one attempt rather than leaving a caller to try again. A `sessionStorage`
  that throws reads as "nothing spent yet", which is the only behaviour that still gives a
  genuinely broken first load its retry.
- **`RecoverScene` creates no text object** and is registered eagerly in `main.ts`'s scene
  array, imported statically — the one scene that must not depend on the loader working.
  `scene.start` replaces the running scene rather than overlaying it, which is what stops a
  scene that throws every frame from throwing every frame.
- **`installErrorCapture` runs after construction and before `initE2EBridge`.** Phaser starts
  its scenes on the first tick rather than inside the constructor, so the listeners exist before
  any scene runs. A throw synchronously inside `new Phaser.Game()` itself is not captured; there
  is no scene to recover to at that point and no card that could be drawn, and the residual is
  recorded here rather than papered over.

### Acceptance

| Criterion | Verdict | Proof |
| --- | --- | --- |
| AC-4 (memory, then persisted) | met | `storage.test.ts`: refused write leaves the entry readable; the next accepted save lands it |
| AC-5 (no throw reaches the child) | met | `errorCapture.test.ts`: throwing recorder still raises the card |
| AC-6 (no words on the card) | met | `recoverScene.test.ts`: no `add.text` call anywhere in the scene |
| AC-7 (one reload, then stop) | met | `reload.test.ts` plus the second-crash case in `errorCapture.test.ts` |
| AC-9 (works with no scene) | met | active-key `null` → `reload` once, `scene.start` never called |

### Numbers to carry forward

The shell entry grew **168.3 → 171.0 kB** (+2.7), which is what Phase 1 predicted when it
recorded that `diagnostics.ts` was tree-shaken out: `errorCapture.ts` is now reachable from
`main.ts` and `RecoverScene` is eager. 29 kB of the 200 kB gate remain. Phase 3 adds the parent
row and the export; Phase 4 changes no production path and should not move this number.

