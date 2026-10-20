# Release Notes - v1.19.0

> **Status:** FINAL - released 2026-10-20 (tag `v1.19.0`, deployed live at
> https://aby-little-lab.ansyar-world.top/). Desktop smoke passed; the
> device-class pass is recorded as pending in
> `docs/device-testing-checklist.md`.
>
> **Tag:** `v1.19.0`
>
> **Deployment:** https://aby-little-lab.ansyar-world.top

This release adds the twenty-first game and then rebuilds the floor under the
whole suite: Feelings Faces brings social-emotional learning to the Hub, and the
thirteen choice games, every spoken prompt and the background music now run on
one shared shell instead of thirteen copies.

## What's New

- **Game 21 - Feelings Faces (social-emotional learning).** Each round speaks a
  short everyday scenario about Aby ("Aby gets a big hug.", "The vacuum roars in
  the next room.") and the child taps the face showing how Aby feels. Six rounds
  from a sixteen-scenario pool, three face cards per round, easy-first contrast
  ladder: maximally distinct pairs (happy/angry) first, then the confusable pair
  (sad/scared). Wrong taps get a gentle wiggle and re-speak, never a lock-out.
  First completion earns the heart sticker. With SFX off or no TTS voice the
  scenario appears as a caption so the round stays completable.
- **A voice, not just a prompt.** Every one of the twenty-one games now speaks
  either its round target or a one-line rule, each with a replay glyph; the
  written rule line is the only instruction text a child ever sees.

## Improvements

- **One choice-round shell (13 games).** `ChoiceRoundScene` owns the
  prompt-plus-card loop and `GroupMathScene` the equation row, so Add It Up and
  Take Away share one implementation. Same pacing (700 ms advance), same
  reduced-motion wiggle, same chime/wiggle order.
- **One narrator.** `RoundNarrator` is the single place a speaker glyph is
  built, serving eleven per-round prompts and twelve rule lines. The caption
  fallback for a voice-less device lives there too, so it decides once, the same
  way, in every game that needs it.
- **Narration leads the music.** The background loop ducks to 8 % while a prompt
  or rule speaks and comes back when it ends, so a sentence is never buried
  under the music. A watchdog restores it if the speech engine never reports
  finishing; the ducked level is never saved.
- **A backgrounded tablet is quiet and free.** Hiding the tab pauses the music,
  cancels any speech mid-sentence, and stops the play clock - so leaving the app
  in the background no longer talks to an empty room or spends a child's daily
  budget.
- **Small visible unification.** The 250 ms success flash now appears on every
  choice game; six of them previously skipped it and jumped straight to the
  next round.
- Suite 2,092 -> 2,149 tests; shell bundle 192.4 kB of the 200 kB budget.

## Bug Fixes

- **Feelings Faces voice-settle state machine** (found in that track's review,
  all shipped here): a cold voice list no longer mutes the whole session, a
  device that settles with no voices now re-speaks the displayed round instead
  of leaving it silent, and the opening speech timer is cancelled when voices
  arrive mid-wait so a scenario is never spoken twice.
- Number Order's numeral tap reads the settings snapshot instead of re-parsing
  the save blob on every tap.

## Known Issues

- Learning progress, stickers, profiles and play-time budgets are stored per
  device per profile - they do not sync across devices (accepted; out of scope).
- The 8 % duck level and 120 ms ramp were not judged by ear before release; the
  device pass should confirm narration sits clearly above the music.
- `conductor/product.md` still carries two duplicate "Changelog - Game 20"
  sections and an "18 mini-games" header line, both pre-existing. `docs/PRD.md`
  and `docs/TDD.md` still describe twenty games and do not mention Feelings
  Faces; both docs are candidates for a documentation truth pass.

## Installation

The game is a PWA - update by reopening the app or using the update prompt. All
progress, stickers, profiles and play-time settings stay local. No storage
migration is required by this release: the save schema is unchanged from
v1.18.0.

## Release Verification

- **Tag:** `v1.19.0` -> merge of PR #46 on `master`.
- **CI:** Quality Gates on PR #46 green (`14f...` run) then the tag push runs
  Quality Gates + Deploy to Coolify.
- **Live check:** `HTTP 200`, title `Aby's Little Lab`, live entry hash matches
  the local `dist/` build, `v1.19.0` string present in the live bundle.
- **Device matrix:** pending - see the v1.19.0 execution record in
  `docs/device-testing-checklist.md`.

## Feedback

Report issues via [GitHub Issues](https://github.com/mansyar/aby-little-lab/issues).
