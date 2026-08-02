# Device Testing Checklist for Aby's Little Lab

## Overview

This checklist ensures comprehensive testing across target devices before release.

## Target Devices

### Primary Target Devices
- **iPad** (any recent model, iPadOS 15+)
- **Android Tablet** (Samsung Galaxy Tab, Android 10+)
- **iPhone** (any recent model, iOS 15+)
- **Android Phone** (any recent model, Android 10+)

### Secondary/Test Devices
- Older devices with limited resources
- Different screen sizes (7" to 12.9")
- Both WiFi and cellular connections

## Pre-Test Setup

### 1. Build and Deploy
```bash
# Build production version
pnpm run build

# Start a local server for same-device smoke tests
pnpm exec serve dist -l 3000
```

> **Secure-context requirement:** Use `http://localhost:3000` only for same-device smoke tests. For phone/tablet installation, service-worker, offline, and update checks, use an HTTPS private static host or HTTPS tunnel. A LAN `http://[your-ip]:3000` URL cannot register the service worker.

### 2. Device Preparation
- [ ] Clear browser cache and site data
- [ ] Ensure device is in landscape orientation
- [ ] Disable any ad blockers or content blockers
- [ ] Ensure stable internet connection for initial load

## Test Categories

### A. Installation and PWA Behavior

#### iOS (iPad/iPhone Safari)
- [ ] Open the HTTPS private-host or HTTPS-tunnel URL in Safari
- [ ] Open Settings (parental lock) and verify the install row shows "How to Install"
- [ ] Tap "How to Install" and verify the overlay shows Share → Add to Home Screen steps
- [ ] Follow the steps to add to home screen
- [ ] Verify app name appears as "Aby's Little Lab"
- [ ] Launch app from home screen
- [ ] Verify standalone mode (no browser UI)
- [ ] Verify fullscreen display where the platform supports it
- [ ] Record any remaining OS home/back/navigation bars as platform-controlled limitations
- [ ] Verify landscape orientation
- [ ] Close and reopen app
- [ ] Verify app loads from cache (offline ready)

#### Android/Chrome
- [ ] Open the HTTPS private-host or HTTPS-tunnel URL in Chrome
- [ ] Open Settings (parental lock) and verify the context-aware install row shows "Install App"
- [ ] Tap "Install App" and verify the browser install prompt appears
- [ ] Confirm the install and verify the app installs successfully
- [ ] After install, open Settings again and verify the install row is hidden (already installed)
- [ ] Launch app from home screen
- [ ] Verify standalone mode
- [ ] Verify fullscreen display where the platform supports it
- [ ] Record any remaining OS home/back/navigation bars as platform-controlled limitations
- [ ] Verify landscape orientation
- [ ] Close and reopen app
- [ ] Verify app loads from cache

### B. Core Functionality Testing

#### Boot Sequence
- [ ] App starts in landscape orientation
- [ ] Loading screen appears with progress bar
- [ ] Transitions smoothly to Hub screen
- [ ] No crashes or freezes during boot

#### Hub Screen
- [ ] All 7 game tiles are visible
- [ ] Tiles, labels, and stickers enter with a staggered wave (40ms apart), not all at once
- [ ] Tiles gently bob on an idle loop after entering
- [ ] Sticker shelf shows seven 56px thumbnails: earned at full color with shimmer, unearned dimmed (~30% opacity, smaller)
- [ ] Just-earned sticker bounces in larger with a sparkle burst after auto-return; replaying an earned game shows no highlight
- [ ] Press and hold a game tile: it squishes and stays; release on the tile springs it back and starts the game; release off the tile does not navigate
- [ ] After ~25s idle, tiles wiggle and a soft two-tone chime plays, repeating every ~10s; any touch resets the timer
- [ ] Settings icon is accessible
- [ ] Touch targets are adequate (64×64px minimum)
- [ ] Protected controls (Settings, all seven game Back buttons, Musical Memory Replay) respond to taps near the visible label (96×96px hit areas — no precision tapping)
- [ ] Professor Hoot mascot sits in the bottom-right corner: waves on load, cheers on a just-earned sticker, then bobs/blinks on the idle loop
- [ ] Mascot is touch-inert — tapping where Hoot stands still reaches the tile/control underneath

#### Game 1: Shape Sorter
- [ ] Game loads correctly
- [ ] Shapes are visible and recognizable
- [ ] Drag and drop works smoothly
- [ ] Matching detection works correctly
- [ ] Success feedback (chime + bounded splash/ray) works and disappears promptly
- [ ] Error feedback (gentle animation) works
- [ ] Juice: shape lifts (1.1× + slight tilt) on drag start and restores on release
- [ ] Juice: drop zone pulses a soft outline while dragging over it
- [ ] Juice: correct drop snaps to slot with a settle tween (no teleport)
- [ ] Juice: dropping on empty floor bounces back silently (no incorrect SFX)
- [ ] Sticker awarded on first completion
- [ ] Returns to Hub after completion

#### Game 2: Animal Trace-and-Connect
- [ ] Game loads correctly
- [ ] Dotted paths are visible
- [ ] Touch tracing works smoothly
- [ ] Connection detection works
- [ ] Success/error feedback works
- [ ] Juice: animal hops with a small arc between waypoints
- [ ] Juice: food wiggles when the path is completed
- [ ] Juice: progress dot pops with a scale bounce on completion
- [ ] Sticker awarded on first completion
- [ ] Returns to Hub after completion

#### Game 3: Pop & Freeze!
- [ ] Game loads correctly
- [ ] Bubbles appear and move
- [ ] Touch to pop works
- [ ] Sleeping animal bubbles cannot be popped
- [ ] Score tracking works
- [ ] Success/error feedback works
- [ ] Juice: popping emits small droplet circles that fade out and disappear
- [ ] Juice: sleeping-animal decoys breathe gently (scale pulse loop)
- [ ] Sticker awarded on first completion
- [ ] Returns to Hub after completion

#### Game 4: Shadow Match
- [ ] Game loads correctly
- [ ] Objects and shadows are visible
- [ ] Drag and drop works
- [ ] Matching detection works
- [ ] Success/error feedback works
- [ ] Juice: object lifts (1.1× + slight tilt) on drag start and restores on release
- [ ] Juice: shadow slot pulses while dragging over it
- [ ] Juice: on correct drop the silhouette stamps (pulse + brief flash) and the object dims
- [ ] Sticker awarded on first completion
- [ ] Returns to Hub after completion

#### Game 5: Musical Memory Simon
- [ ] Game loads correctly
- [ ] Frog notes are visible
- [ ] Sequence playback works
- [ ] Touch input works
- [ ] Sequence length increases correctly
- [ ] Audio plays correctly
- [ ] Success/error feedback works
- [ ] Juice: tapped frog emits an expanding ripple ring that fades out
- [ ] Juice: lily pads drift gently up and down
- [ ] Juice: progress dot pops with a scale bounce on round success
- [ ] Sticker awarded on first completion
- [ ] Returns to Hub after completion

#### Game 6: Big vs. Small Cleaner
- [ ] Game loads correctly
- [ ] Toys of different sizes appear
- [ ] Drag and drop works
- [ ] Size sorting works correctly
- [ ] Success/error feedback works
- [ ] Juice: toy lifts (1.1× + slight tilt) on drag start and restores on release
- [ ] Juice: box drop zone pulses while dragging over it
- [ ] Juice: on correct drop the toy shrinks into the box and the lid wiggles
- [ ] Sticker awarded on first completion
- [ ] Returns to Hub after completion

#### Game 7: Pattern Builder
- [ ] Game loads correctly
- [ ] 4 slots (3 filled shapes + clearly marked empty gap) and 3 answer cards are visible
- [ ] Pattern shapes are recognizable (reuses the Shape Sorter shape SVGs)
- [ ] Tapping the correct card snaps the shape into the gap with a settle tween + chime
- [ ] Progress dots fill one per round; 5 rounds complete the game
- [ ] Tapping a wrong card wiggles it gently with no penalty and no progression loss
- [ ] Cards/slots exceed the 64px minimum touch target
- [ ] Sticker awarded on first completion
- [ ] Returns to Hub after completion (auto-return ~3s)

### C. Cross-Game Features

#### Sticker System
- [ ] Stickers persist after app close/reopen
- [ ] Shelf shows all earned stickers at full color and unearned ones dimmed
- [ ] Shelf updates in real-time (just-earned highlight appears on the auto-return visit)
- [ ] No duplicate stickers awarded

#### Settings
- [ ] BGM toggle works (on/off)
- [ ] SFX toggle works (on/off)
- [ ] Settings persist after app close/reopen
- [ ] Settings affect audio playback
- [ ] Version footer shows the deployed version (e.g., `v1.0.0`) at the bottom of the panel and is not tappable
- [ ] "Reset Progress" row opens the "Reset all stickers?" confirm modal; Cancel closes it without changes
- [ ] Reset clears every sticker (Hub shelf dims immediately), preserves BGM/SFX settings, and the row shows "Progress cleared"
- [ ] Reset persists after app close/reopen (stickers stay cleared, settings stay unchanged)

#### Parental Lock
- [ ] Hold-for-3-seconds mechanism works on Hub Settings and every game Back control
- [ ] Circular progress ring fills during the hold and disappears on release/cancel/completion
- [ ] Settings/exit menu appears exactly once after a completed hold (no duplicate triggers)
- [ ] Early release, pointer leaving the control, and pointer cancel never trigger the action
- [ ] No accidental triggers during gameplay
- [ ] No ring artifacts remain after a cancelled hold or after leaving the scene

#### Mascot Companion
- [ ] Hoot appears in the same bottom-right corner on the Hub and in all seven games (consistent placement, behind gameplay z-order)
- [ ] Hoot cheers on correct actions in every game (pose swap + bounce; bigger cheer + sparkle ring on win)
- [ ] Hoot nods on incorrect actions (Shape Sorter, Pop & Freeze, Shadow Match, Musical Memory, Big vs. Small, Pattern Builder)
- [ ] Rapid correct taps: Hoot finishes gracefully — no stuck pose, no runaway bounce (in-flight cheer retired)
- [ ] Hoot disappears when leaving a scene and never lingers into the next scene

### D. Offline Testing

#### After Initial Online Load
- [ ] Turn off WiFi and cellular data
- [ ] Relaunch app from home screen
- [ ] Verify app loads from cache
- [ ] Verify all games are playable
- [ ] Verify audio works offline
- [ ] Verify stickers persist offline
- [ ] Verify settings persist offline

#### Service Worker Updates
- [ ] Make a small code change
- [ ] Rebuild and redeploy
- [ ] Refresh the app while online
- [ ] On the Hub, verify the "New version ready!" toast appears
- [ ] Tap "Update now" and verify the new version loads
- [ ] Tap "Later" and verify the app keeps running on the old version
- [ ] Verify no data loss during update
- [ ] On first successful SW install, verify the "Ready to play offline!" toast appears

### E. Performance Testing

#### Boot Time
- [ ] Measure time from launch to Hub screen
- [ ] Target: < 3 seconds
- [ ] Note any delays or freezes

#### Frame Rate
- [ ] Play each game for 2 minutes
- [ ] Monitor frame rate (target: 60fps, min 30fps)
- [ ] Note any frame drops or stuttering

#### Memory Usage
- [ ] Monitor memory usage during gameplay
- [ ] Target: < 150MB
- [ ] Check for memory leaks after extended play

#### Touch Responsiveness
- [ ] Test touch latency during gameplay
- [ ] Target: < 16ms
- [ ] Note any delayed responses

#### Audio Latency
- [ ] Test audio response time
- [ ] Target: < 50ms
- [ ] Note any audio delays

### F. Accessibility Testing

#### Reduced Motion
- [ ] Enable "Reduce Motion" in device settings
- [ ] Scene transitions are shortened (~40%) with no harsh flashes
- [ ] Win celebration renders simplified (6 rays, no confetti) and completes normally
- [ ] Gameplay tweens (bounce-backs, bubble pop, wake wobble, frog bounce, sticker pops) are shorter and gentler
- [ ] Juice under reduced motion: drag lift is 1.05× with no tilt; snaps/bounces shorter; stamp/dim/box reactions gentler
- [ ] Juice under reduced motion: animal hops straight and faster; food wiggle and dot pops gentler
- [ ] Juice under reduced motion: pop droplets smaller/faster; sleeping-animal breathing loop is disabled
- [ ] Juice under reduced motion: ripple rings smaller/faster; lily pad drift is disabled
- [ ] Press feedback (squish) on Back/Replay/Settings/Hub tiles is disabled
- [ ] Hub entrances fade without scale; no bob, wiggle, sparkle, or burst; idle attract plays chime only
- [ ] Mascot under reduced motion: no idle bob/blink; reactions are pose swaps / gentle wave-nod without bounce or sparkle
- [ ] Game functionality remains intact — every game still reachable and completable
- [ ] Verify no flashing or excessive movement

#### Visual Clarity
- [ ] Test in bright sunlight conditions
- [ ] Test in low-light conditions
- [ ] Verify all elements are clearly visible
- [ ] Verify color contrast is adequate

### G. Completion and Audio Regression Checks
- [ ] On the first valid Hub interaction, BGM starts when enabled
- [ ] BGM continues when moving between Hub and games
- [ ] BGM and SFX settings persist after closing and reopening the app
- [ ] SFX feedback remains synthesized and no removed SFX MP3 URL is requested
- [ ] Every navigation path (boot → hub, hub → game, game → hub) plays the crossfade transition
- [ ] Each of the seven games shows at most one short splash/ray for a success or completion action
- [ ] All seven games play the shared win celebration (rays + confetti) on completion, which cleans itself up
- [ ] Back, Replay, Settings, and Hub tile controls squish on press and spring back on release
- [ ] No completion effect remains on screen or obscures the next interaction
- [ ] Reduced-motion mode disables or simplifies the splash/ray

## Test Documentation

### For Each Device, Record:

1. **Device Information**
   - Device model
   - Operating system version
   - Browser version
   - Screen size

2. **Test Results**
   - Pass/Fail for each category
   - Any issues encountered
   - Workarounds applied

3. **Performance Metrics**
   - Boot time
   - Frame rate observations
   - Memory usage
   - Touch latency
   - Audio latency

4. **Issues Found**
   - Issue description
   - Steps to reproduce
   - Expected vs actual behavior
   - Severity (Critical/High/Medium/Low)

## Issue Severity Levels

### Critical
- App crashes or freezes
- Core functionality broken
- Data loss or corruption

### High
- Major feature malfunction
- Significant performance issues
- Accessibility barriers

### Medium
- Minor feature issues
- Cosmetic problems
- Non-critical performance issues

### Low
- Typos or minor UI issues
- Edge case problems
- Enhancement requests

## Sign-Off

After completing all tests:

- [ ] All Critical issues resolved
- [ ] All High issues resolved or documented
- [ ] Medium issues documented for future release
- [ ] Low issues documented for future release
- [ ] Performance targets met
- [ ] Accessibility requirements met
- [ ] Release documentation complete

**Tester:** ________________
**Date:** ________________
**Device:** ________________
**Overall Status:** ________________
