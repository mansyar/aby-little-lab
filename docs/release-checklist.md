# Release Checklist for Aby's Little Lab

## Pre-Release Preparation

### 1. Code Quality Gates
- [ ] Run `pnpm run check` (linting/formatting)
- [ ] Run `CI=true pnpm test` (all tests pass)
- [ ] Run `pnpm run build` (production build succeeds)
- [ ] Verify code coverage meets threshold (>80%)
- [ ] Review all changes since last release
- [ ] Ensure no security vulnerabilities introduced

### 2. PWA Validation
- [ ] Run `node scripts/validate-pwa.js`
- [ ] Verify manifest.webmanifest is valid
- [ ] Verify the manifest requests fullscreen where supported and retains standalone as the fallback display mode
- [ ] When system home/back/navigation bars remain visible, record them as platform-controlled limitations rather than app-rendered controls
- [ ] Verify service worker is generated
- [ ] Verify all assets are precached
- [ ] Test offline functionality
- [ ] Test installation on target devices
- [ ] Perform phone/tablet PWA checks from an HTTPS URL

### 3. Asset Verification
- [ ] All SVG assets load correctly
- [ ] The first valid user interaction starts low-volume looping BGM when BGM is enabled, and BGM continues across scene navigation
- [ ] SFX audio works through Web Audio synthesis
- [ ] No requests are made for the removed `/audio/pop.mp3`, `/audio/correct.mp3`, `/audio/incorrect.mp3`, `/audio/wake.mp3`, `/audio/win.mp3`, or `/audio/sticker.mp3` files
- [ ] Icons display correctly
- [ ] No missing or corrupted assets

### 4. Interaction Feedback
- [ ] Every navigation path (boot → hub, hub → game, game → hub) plays the 300ms crossfade transition with a 180ms entrance fade + zoom; no instant scene switches
- [ ] Each game's completion plays the shared win celebration (rays + confetti, ~700ms)
- [ ] The splash/celebration cleans itself up and never clouds the play area
- [ ] Back, Replay, Settings, and Hub game tiles give press feedback (95% squish); Hub tiles spring back with a `Back.out` overshoot and navigate on release (releasing off-tile cancels)
- [ ] With Reduce Motion enabled: transitions, celebration, and gameplay tweens shorten (~40%); celebration renders 6 rays with no confetti; press feedback is disabled; Hub entrances fade without scale, no bob/wiggle/sparkle, and the idle attract plays chime-only; game completion still works

### 4b. Touch UX & Parental Lock
- [ ] Protected controls (Settings, all six game Back buttons, Musical Memory Replay) expose 96×96px hit areas
- [ ] A 3-second hold shows the circular progress ring and triggers the action exactly once
- [ ] Duplicate touches during a hold do not double-trigger the action
- [ ] Early release, pointer leaving the control, and pointer cancel never trigger the action
- [ ] No progress-ring artifacts remain after cancelled holds or scene shutdown

### 4c. Hub Engagement
- [ ] Tiles, labels, and stickers enter with a 40ms stagger wave (fade-only under reduced motion)
- [ ] Tiles bob gently on a 2.5s idle loop
- [ ] Sticker shelf shows six 56px thumbnails: earned shimmer, unearned dimmed (30% alpha)
- [ ] Just-earned sticker bounces in larger with a sparkle burst after auto-return; replays show no highlight
- [ ] After ~25s idle, tiles wiggle + soft two-tone chime plays, repeating every ~10s; any touch resets the timer
- [ ] Reduced-motion: idle chime plays without the wiggle

### 4d. Per-Game Juice
- [ ] Drag scenes (Shape Sorter, Shadow Match, Big vs. Small): pieces lift (1.1× + tilt) on drag start and restore on release
- [ ] Drag scenes: drop zones pulse a soft outline while dragging over; correct drops settle with a 200ms snap tween (no teleport)
- [ ] Incorrect drops bounce back with wobble; dropping on empty floor bounces silently (no incorrect SFX in any drag game)
- [ ] Big vs. Small: toy shrinks into box (150ms), lid wiggles ±3°, box bumps 1.05× — splash still appears
- [ ] Shadow Match: silhouette stamps (pulse + brief white flash, self-cleaning) and matched object dims to 50%
- [ ] Animal Trace: animal hops with arc between waypoints; food wiggles on arrival; progress dots pop 1 → 1.4 → 1
- [ ] Pop & Freeze: pop emits 3 small droplet circles that fade out (self-cleaning); sleeping decoys breathe on a gentle loop
- [ ] Musical Memory: tapped frog emits an expanding ripple ring (self-cleaning); lily pads drift ±3px; progress dots pop on fill
- [ ] Reduced-motion: all juice gentler/shorter (lift 1.05× no tilt, no hop arc, smaller droplets/ripples); breathing and drift loops disabled
- [ ] No new assets or audio files were added by this track (Graphics-only effects)

### 5. Documentation
- [ ] README.md is up to date
- [ ] Release notes prepared
- [ ] Deployment guide complete
- [ ] Device testing checklist complete

## Release Process

### Step 1: Create Release Branch
```bash
git checkout -b release/v1.0.0
```

### Step 2: Final Testing
```bash
# Run all quality checks
pnpm run check
CI=true pnpm test
pnpm run build

# Validate PWA
node scripts/validate-pwa.js
```

### Step 3: Version Update
```bash
# Update version in package.json
npm version 1.0.0 --no-git-tag-version

# Commit version change
git add package.json
git commit -m "chore(release): Bump version to 1.0.0"
```

### Step 4: Create Release Tag
```bash
git tag -a v1.0.0 -m "Release v1.0.0: Initial PWA release"
```

### Step 5: Build Production Bundle
```bash
pnpm run build
```

### Step 6: Deploy to Static Host
```bash
# Option 1: Same-device local smoke test (HTTP localhost only)
pnpm exec serve dist -l 3000
# For phone/tablet PWA, offline, and update testing, use an HTTPS private static host or tunnel.

# Option 2: Deploy to static host
# Upload dist/ directory to your static host
```

### Step 7: Verify Deployment
- [ ] App loads correctly
- [ ] PWA installation works
- [ ] Offline functionality works
- [ ] All games function properly
- [ ] Audio works correctly

### Step 8: Merge and Push
```bash
git checkout main
git merge release/v1.0.0
git push origin main
git push origin v1.0.0
```

## Post-Release Verification

### Immediate Checks (within 1 hour)
- [ ] App accessible via URL
- [ ] PWA can be installed (browser prompt or manual "Add to Home Screen")
- [ ] Basic functionality works
- [ ] No critical errors in console

### Extended Checks (within 24 hours)
- [ ] Monitor for error reports
- [ ] Check performance metrics
- [ ] Verify offline functionality
- [ ] Test on multiple devices

### Long-term Monitoring (1 week)
- [ ] User feedback collection
- [ ] Performance trend analysis
- [ ] Error rate monitoring
- [ ] Usage analytics (if implemented)

## Rollback Procedure

### If Critical Issues Found

#### Immediate Rollback
```bash
# Revert to previous version
git revert HEAD

# Rebuild and redeploy
pnpm run build
# Deploy dist/ directory
```

#### Tag-based Rollback
```bash
# Checkout previous release
git checkout v0.9.0

# Rebuild and redeploy
pnpm run build
# Deploy dist/ directory
```

### Communication Plan
1. Notify users of known issues
2. Provide timeline for fix
3. Document workaround if available
4. Release hotfix as needed

## Release Notes Template

```markdown
# Release v1.0.0

## What's New
- Feature 1
- Feature 2
- Feature 3

## Improvements
- Improvement 1
- Improvement 2

## Bug Fixes
- Fix 1
- Fix 2

## Known Issues
- Issue 1 (workaround available)
- Issue 2 (fix in progress)

## Installation
1. Visit [URL]
2. Click "Add to Home Screen"
3. Enjoy!

## Feedback
Please report issues at [GitHub Issues URL]
```

## Security Checklist

### Pre-Release Security Review
- [ ] No hardcoded secrets or API keys
- [ ] Input validation present
- [ ] XSS protection in place
- [ ] No SQL injection vulnerabilities
- [ ] Secure data storage (localStorage)
- [ ] No sensitive data in logs

### Dependencies
- [ ] All dependencies up to date
- [ ] No known vulnerabilities
- [ ] License compatibility verified

## Performance Benchmarks

### Target Metrics
- Boot time: < 3 seconds
- Frame rate: 60fps (min 30fps)
- Memory: < 150MB
- Touch latency: < 16ms
- Audio latency: < 50ms

### Actual Metrics (to be filled during testing)
- Boot time: _____
- Frame rate: _____
- Memory: _____
- Touch latency: _____
- Audio latency: _____

## Final Sign-Off

**Release Manager:** ________________
**Date:** ________________
**Version:** ________________
**Status:** ________________

**Approval:**
- [ ] Code quality meets standards
- [ ] All tests pass
- [ ] Documentation complete
- [ ] Security review passed
- [ ] Performance targets met
- [ ] Ready for release
