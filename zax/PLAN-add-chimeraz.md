# Integration Plan: ChimeraZ Application

## Overview
This plan details the full integration of the new `chimeraz` application into the Mol* project. ChimeraZ is based on the viewer app with custom additions and needs to be properly integrated into the build system, deployment pipeline, and project documentation.

## Current State Analysis

### Existing Structure
- **Location**: `src/apps/chimeraz/`
- **Files**:
  - `app.ts` - Main application logic (modified from viewer)
  - `index.ts` - Entry point
  - `index.html` - Main HTML page
  - `embedded.html` - Embedded version
  - `favicon.ico` - App icon
  - `console/` - Console integration directory

### Key Differences from Viewer
Based on the modified `app.ts`:
- `layoutShowControls: false` (line 94) - Controls hidden by default
- Console command system exports at end of file (lines 637-643)
- Integration with `mol-console` module for ChimeraX-style commands

## Integration Tasks

### 1. Build System Integration

#### 1.1 Update `scripts/build.mjs`
**Location**: `scripts/build.mjs:14-31`

**Action**: Add chimeraz to the Apps array

```javascript
const Apps = [
    // Apps
    { kind: 'app', name: 'viewer' },
    { kind: 'app', name: 'chimeraz' },  // ADD THIS LINE
    { kind: 'app', name: 'docking-viewer' },
    { kind: 'app', name: 'mesoscale-explorer' },
    { kind: 'app', name: 'mvs-stories', globalName: 'mvsStories', filename: 'mvs-stories.js' },
    // ... examples
];
```

**Why**: This registers chimeraz as a buildable application in the esbuild configuration.

#### 1.2 Verify Build Output
**Expected Output**: `build/chimeraz/` directory containing:
- `molstar.js` - Bundled JavaScript
- `molstar.css` - Compiled styles
- `index.html` - Main page
- `embedded.html` - Embedded version
- `favicon.ico` - Icon

### 2. Package.json Integration

#### 2.1 Add Build Scripts
**Location**: `package.json:16-33`

**Action**: Add chimeraz-specific development scripts

```json
{
  "scripts": {
    "dev:chimeraz": "node ./scripts/build.mjs -a chimeraz",
    "dev:chimeraz-viewer": "node ./scripts/build.mjs -a chimeraz viewer",
    "watch-chimeraz": "npm run dev:chimeraz"
  }
}
```

**Why**: Provides convenient commands for developing chimeraz independently.

**Note**: Like `watch-viewer`, users can run with DEBUG mode:
```bash
DEBUG=molstar npm run dev:chimeraz
# or
DEBUG=molstar npm run watch-chimeraz
```

#### 2.2 Update NPM Package Files (Optional)
**Location**: `package.json:45-49`

**Current**:
```json
"files": [
  "lib/",
  "build/viewer/",
  "build/mvs-stories/"
]
```

**Consideration**: Decide if chimeraz should be included in NPM package distribution:
- **Include**: Add `"build/chimeraz/"` if chimeraz is meant for public distribution
- **Exclude**: Leave as-is if chimeraz is development-only or internal use

### 3. Deployment Integration

#### 3.1 Update `scripts/deploy.js`
**Location**: `scripts/deploy.js:65-123`

**Action**: Add chimeraz deployment function

```javascript
function copyChimeraz() {
    console.log('\n###', 'copy chimeraz files');
    const chimerazBuildPath = path.resolve(buildDir, 'chimeraz/');
    const chimerazDeployPath = path.resolve(localPath, 'chimeraz/');
    fse.copySync(chimerazBuildPath, chimerazDeployPath, { overwrite: true });
    addAnalytics(path.resolve(chimerazDeployPath, 'index.html'));
    addManifest(path.resolve(chimerazDeployPath, 'index.html'));
    addPwa(path.resolve(chimerazDeployPath, 'index.html'));

    const pwaDataPath = path.resolve(dataDir, 'pwa/');
    fse.copySync(pwaDataPath, chimerazDeployPath, { overwrite: true });
    addVersion(path.resolve(chimerazDeployPath, 'sw.js'));
}
```

**Location**: `scripts/deploy.js:114-123`

**Action**: Call copyChimeraz in copyFiles function

```javascript
function copyFiles() {
    try {
        copyViewer();
        copyChimeraz();  // ADD THIS LINE
        copyMe();
        copyMVSStories();
        copyDemos();
    } catch (e) {
        console.error(e);
    }
}
```

**Why**: Includes chimeraz in production deployment to molstar.github.io.

**Decision Point**: Should chimeraz be publicly deployed? Options:
- **Yes**: Follow above integration (recommended for visibility)
- **No**: Skip deployment integration, keep chimeraz development-only
- **Separate**: Deploy to different path (e.g., `chimeraz-viewer/` or `experimental/chimeraz/`)

### 4. Documentation Updates

#### 4.1 Update CLAUDE.md
**Location**: `CLAUDE.md:98-99`

**Action**: Add chimeraz to Applications list

```markdown
### Applications (`src/apps/`)
- `viewer` - Main Mol* viewer application
- `chimeraz` - ChimeraX-compatible viewer with command console
- `docking-viewer` - Specialized docking visualization
- `mesoscale-explorer` - Mesoscale structure explorer
- `mvs-stories` - Molecular Visualization Stories
```

**Location**: `CLAUDE.md:25,93`

**Action**: Add chimeraz to build command examples

```markdown
npm run dev:chimeraz        # Watch mode for chimeraz only
npm run dev -- -a chimeraz viewer  # Watch chimeraz and viewer
```

#### 4.2 Update README.md
**Location**: `README.md` (needs to be checked for relevant sections)

**Action**: Add chimeraz to list of applications if applications are documented

#### 4.3 Create ChimeraZ-Specific Documentation

**New File**: `src/apps/chimeraz/README.md`

```markdown
# ChimeraZ Viewer

ChimeraZ is a variant of the Mol* viewer with ChimeraX-compatible command console integration.

## Features

- Full Mol* visualization capabilities
- ChimeraX-style command console
- PyMOL-compatible color commands
- Selection language support

## Development

```bash
npm run dev:chimeraz
# Navigate to http://localhost:1338/build/chimeraz/
```

## Console Commands

See [console/README.md](console/README.md) for command documentation.

## Differences from Standard Viewer

- Controls panel hidden by default (`layoutShowControls: false`)
- Console command system integrated
- Exports console API for programmatic access
```

### 5. Testing Integration

#### 5.1 Add to Test Matrix
**Consideration**: Should chimeraz have dedicated tests?

Options:
- Use existing viewer tests (chimeraz inherits viewer functionality)
- Add chimeraz-specific console command tests
- Add browser tests for console UI integration

**Recommended**: At minimum, add smoke test to verify chimeraz builds and loads

#### 5.2 Create Browser Test (Optional)
**New File**: `src/tests/browser/chimeraz.ts`

```typescript
// Basic smoke test for chimeraz
import { Viewer } from '../../apps/chimeraz/app';

async function testChimeraz() {
    const viewer = await Viewer.create('app');
    console.log('ChimeraZ initialized:', viewer);
    await viewer.loadPdb('1cbs');
    console.log('Structure loaded successfully');
}

testChimeraz().catch(console.error);
```

### 6. Git and Version Control

#### 6.1 Verify .gitignore
**Location**: `.gitignore`

**Current**:
```
build/
deploy/
lib/
```

**Status**: ✅ Build output already ignored, no changes needed

#### 6.2 Review .serena Directory
**Location**: `.serena/` (untracked)

**Note**: This appears to be a new directory. Determine if it should be:
- Ignored (add to `.gitignore`)
- Committed (part of project)
- Documented (explain its purpose)

### 7. Development Workflow

#### 7.1 Quick Start Guide
Add to chimeraz README.md:

```markdown
## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev:chimeraz
   # or with debug mode (recommended for development):
   DEBUG=molstar npm run dev:chimeraz
   ```

3. Open browser to:
   ```
   http://localhost:1338/build/chimeraz/
   ```

4. Enable debug mode in browser console (if DEBUG=molstar was used):
   ```javascript
   setMolStarDebugMode(true, true)
   ```

5. Try console commands:
   - `color red` - Color all atoms red
   - `color @CA blue` - Color alpha carbons blue
   - See console/README.md for more
```

#### 7.2 Production Build
Add to documentation:

```bash
# Build for production
npm run build:apps

# Output: build/chimeraz/molstar.js (minified)
```

### 8. Configuration Management

#### 8.1 ChimeraZ-Specific Options
**Location**: `src/apps/chimeraz/app.ts:89-131`

**Current Custom Options**:
- `layoutShowControls: false` (line 94)

**Consider**: Should chimeraz have additional default options?
- Different color schemes?
- Different default representations?
- Console-specific configurations?

#### 8.2 Extensibility
**Question**: Should chimeraz support disabling console features?

**Possible Enhancement**:
```typescript
const DefaultViewerOptions = {
    // ... existing options
    enableConsole: true,  // NEW: Allow disabling console
    consoleHistorySize: 100,  // NEW: Console history
};
```

### 9. Integration Checklist

#### Must Have (Blocking Release)
- [ ] Add chimeraz to `scripts/build.mjs` Apps array
- [ ] Test build: `npm run dev:chimeraz` works
- [ ] Verify output in `build/chimeraz/`
- [ ] Update `CLAUDE.md` with chimeraz references
- [ ] Create `src/apps/chimeraz/README.md`

#### Should Have (For Complete Integration)
- [ ] Add `dev:chimeraz` script to `package.json`
- [ ] Update deployment script (if deploying publicly)
- [ ] Document console commands
- [ ] Add examples to documentation

#### Nice to Have (Future Enhancements)
- [ ] Browser tests for chimeraz
- [ ] ChimeraZ-specific examples
- [ ] Performance comparisons with viewer
- [ ] PWA support for chimeraz
- [ ] Decide on .serena directory handling

### 10. Testing Plan

#### Phase 1: Local Development
```bash
# 1. Clean build
npm run clean
npm run dev:chimeraz

# 2. Verify server starts
# Check: http://localhost:1338/build/chimeraz/

# 3. Test basic functionality
- Load structure (1cbs)
- Test console commands
- Verify controls hidden by default
```

#### Phase 2: Production Build
```bash
# 1. Production build
npm run build:apps

# 2. Verify minification
ls -lh build/chimeraz/molstar.js

# 3. Test production build
npm run serve
# Navigate to build/chimeraz/
```

#### Phase 3: Deployment (If Applicable)
```bash
# 1. Local deployment test
npm run deploy:local

# 2. Verify files in deploy/data/chimeraz/
ls -la deploy/data/chimeraz/

# 3. Remote deployment (when ready)
npm run deploy:remote
```

## Implementation Order

### Step 1: Core Integration (1-2 hours)
1. Update `scripts/build.mjs` - Add to Apps array
2. Add package.json scripts (`dev:chimeraz`, `watch-chimeraz`)
3. Test build: `npm run dev:chimeraz`
4. Test debug build: `DEBUG=molstar npm run dev:chimeraz`
5. Verify functionality in browser

### Step 2: Documentation (30 min - 1 hour)
1. Create `src/apps/chimeraz/README.md`
2. Update `CLAUDE.md`
3. Document console commands

### Step 3: Deployment (If needed, 1 hour)
1. Update `scripts/deploy.js`
2. Test local deployment
3. Consider PWA integration

### Step 4: Testing & Polish (1-2 hours)
1. Add smoke tests
2. Verify all features work
3. Documentation review
4. Code review

## Risks and Considerations

### Risk 1: Console Module Dependency
**Issue**: ChimeraZ depends on `mol-console` module
**Mitigation**: Verify `mol-console` is properly built before chimeraz

### Risk 2: Breaking Changes
**Issue**: Changes to viewer app might break chimeraz
**Mitigation**:
- Keep chimeraz in sync with viewer
- Document deviations clearly
- Consider automated diffing

### Risk 3: Deployment Conflicts
**Issue**: ChimeraZ URL might conflict with existing paths
**Mitigation**:
- Use unique path: `/chimeraz/` not `/viewer/`
- Update analytics tags appropriately

### Risk 4: Build System Changes
**Issue**: esbuild config changes might affect chimeraz differently
**Mitigation**: Test both viewer and chimeraz after build changes

## Success Criteria

### Minimum Viable Integration
- ✅ ChimeraZ builds successfully with `npm run dev:chimeraz`
- ✅ Application loads in browser
- ✅ Console commands work
- ✅ No console errors
- ✅ Basic documentation exists

### Complete Integration
- ✅ All above criteria met
- ✅ Included in production build
- ✅ Deployment pipeline configured
- ✅ Comprehensive documentation
- ✅ Tests passing

### Excellent Integration
- ✅ All above criteria met
- ✅ Browser tests for chimeraz
- ✅ Examples and tutorials
- ✅ Performance benchmarks
- ✅ PWA support
- ✅ Public deployment

## Next Steps

After reviewing this plan:

1. **Approve Scope**: Decide which features to include (minimum/complete/excellent)
2. **Set Timeline**: Estimate time for chosen scope
3. **Begin Implementation**: Start with Step 1 (Core Integration)
4. **Iterate**: Test and refine each step
5. **Document**: Keep this plan updated as changes are made

## Questions to Answer

1. **Deployment**: Should chimeraz be publicly deployed to molstar.github.io?
2. **NPM Package**: Should chimeraz be included in npm distribution?
3. **Console Module**: Is `mol-console` complete and stable?
4. **Naming**: Is "chimeraz" the final name or will it change?
5. **Audience**: Who is the target user for chimeraz vs standard viewer?
6. **.serena Directory**: What is this for? Should it be tracked?

---

**Plan Version**: 1.0
**Date**: 2025-10-09
**Author**: Claude Code
**Status**: Draft - Pending Review
