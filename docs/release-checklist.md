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
- [ ] Verify manifest.json is valid
- [ ] Verify service worker is generated
- [ ] Verify all assets are precached
- [ ] Test offline functionality
- [ ] Test installation on target devices

### 3. Asset Verification
- [ ] All SVG assets load correctly
- [ ] BGM audio plays and loops
- [ ] SFX audio works
- [ ] Icons display correctly
- [ ] No missing or corrupted assets

### 4. Documentation
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
# Option 1: Local sideload
serve dist -l 3000

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
- [ ] PWA installation prompt appears
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