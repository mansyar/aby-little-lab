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

#### iPad/Safari
- [ ] Open the HTTPS private-host or HTTPS-tunnel URL in Safari
- [ ] Tap Share button → "Add to Home Screen"
- [ ] Verify app name appears as "Aby's Little Lab"
- [ ] Launch app from home screen
- [ ] Verify standalone mode (no browser UI)
- [ ] Verify landscape orientation
- [ ] Close and reopen app
- [ ] Verify app loads from cache (offline ready)

#### Android/Chrome
- [ ] Open the HTTPS private-host or HTTPS-tunnel URL in Chrome
- [ ] Tap "Add to Home Screen" prompt or menu option
- [ ] Verify app installs successfully
- [ ] Launch app from home screen
- [ ] Verify standalone mode
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
- [ ] All 6 game tiles are visible
- [ ] Sticker book icon is accessible
- [ ] Settings icon is accessible
- [ ] Touch targets are adequate (64×64px minimum)

#### Game 1: Shape Sorter
- [ ] Game loads correctly
- [ ] Shapes are visible and recognizable
- [ ] Drag and drop works smoothly
- [ ] Matching detection works correctly
- [ ] Success feedback (chime + particles) works
- [ ] Error feedback (gentle animation) works
- [ ] Sticker awarded on first completion
- [ ] Returns to Hub after completion

#### Game 2: Animal Trace-and-Connect
- [ ] Game loads correctly
- [ ] Dotted paths are visible
- [ ] Touch tracing works smoothly
- [ ] Connection detection works
- [ ] Success/error feedback works
- [ ] Sticker awarded on first completion
- [ ] Returns to Hub after completion

#### Game 3: Pop & Freeze!
- [ ] Game loads correctly
- [ ] Bubbles appear and move
- [ ] Touch to pop works
- [ ] Sleeping animal bubbles cannot be popped
- [ ] Score tracking works
- [ ] Success/error feedback works
- [ ] Sticker awarded on first completion
- [ ] Returns to Hub after completion

#### Game 4: Shadow Match
- [ ] Game loads correctly
- [ ] Objects and shadows are visible
- [ ] Drag and drop works
- [ ] Matching detection works
- [ ] Success/error feedback works
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
- [ ] Sticker awarded on first completion
- [ ] Returns to Hub after completion

#### Game 6: Big vs. Small Cleaner
- [ ] Game loads correctly
- [ ] Toys of different sizes appear
- [ ] Drag and drop works
- [ ] Size sorting works correctly
- [ ] Success/error feedback works
- [ ] Sticker awarded on first completion
- [ ] Returns to Hub after completion

### C. Cross-Game Features

#### Sticker System
- [ ] Stickers persist after app close/reopen
- [ ] Sticker book shows all earned stickers
- [ ] Sticker book updates in real-time
- [ ] No duplicate stickers awarded

#### Settings
- [ ] BGM toggle works (on/off)
- [ ] SFX toggle works (on/off)
- [ ] Settings persist after app close/reopen
- [ ] Settings affect audio playback

#### Parental Lock
- [ ] Hold-for-3-seconds mechanism works
- [ ] Settings/exit menu appears after hold
- [ ] Can exit app via parental lock
- [ ] No accidental triggers during gameplay

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
- [ ] Verify update is applied automatically
- [ ] Verify no data loss during update

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
- [ ] Verify animations are minimized
- [ ] Verify game functionality remains intact
- [ ] Verify no flashing or excessive movement

#### Visual Clarity
- [ ] Test in bright sunlight conditions
- [ ] Test in low-light conditions
- [ ] Verify all elements are clearly visible
- [ ] Verify color contrast is adequate

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
