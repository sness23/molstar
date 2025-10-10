# Implementation Plan: ChimeraX-style Color Commands in Mol*

## Overview
This plan breaks down implementing ChimeraX-style coloring commands (from SPEC-chimerax-color.md) into Mol*'s architecture. We'll build incrementally, starting with console integration and simple coloring.

---

## Architecture Analysis

### Mol* Color System Components
1. **Color Themes** (`src/mol-theme/color/`) - Define how colors are computed per location/atom/residue
2. **Overpaint** (`src/mol-theme/overpaint.ts`) - Allows custom per-location color overrides
3. **Representations** (`src/mol-repr/`) - Visual representations that use themes
4. **Plugin State** (`src/mol-plugin-state/`) - Manages structure state and selections
5. **MolQL** (`src/mol-script/`) - Query language for selections

### Key Existing Capabilities
- Color themes already exist: element-symbol, chain-id, sequence-id, secondary-structure, etc.
- Selection system via MolQL
- Overpaint system for custom colors
- Plugin commands for state manipulation

---

## Phase 1: Foundation (Week 1-2)

### 1.1 Console Command Parser
**Goal:** Extend the PyMOL-style console to parse ChimeraX color commands

**Tasks:**
- [ ] Create `src/apps/viewer/console/command-parser.ts`
  - Parse command structure: `color <mode> <selection> [options]`
  - Handle selection syntax: `/A`, `:12-50`, `#1 & protein`
  - Extract color specs: named colors, hex, rgb
  - Extract targets: atoms, bonds, cartoons, surfaces

- [ ] Create `src/apps/viewer/console/color-names.ts`
  - Define built-in color name registry
  - Map common names to Color values
  - Support hex and rgb() parsing

**Integration:**
- Hook parser into console input handler in `index.html`
- Call color command handlers based on parsed mode

### 1.2 Selection Translation Layer
**Goal:** Convert ChimeraX-style selection syntax to MolQL

**Tasks:**
- [ ] Create `src/apps/viewer/console/selection-translator.ts`
  - `/A,B` → chain A or B
  - `:12-50` → residue range
  - `& helix` → secondary structure filter
  - `#1` → model reference
  - Combine operators (`,` for OR, `&` for AND)

- [ ] Add selection validator
  - Return atom/residue count for feedback
  - Handle invalid selections gracefully

**Integration:**
- Use `mol-script` to build MolQL expressions
- Use plugin's selection manager (`src/mol-plugin-state/manager/structure/selection.ts`)

### 1.3 Simple Coloring (Mode A)
**Goal:** Implement `color simple <colorSpec> <selection> [targets]`

**Tasks:**
- [ ] Create `src/apps/viewer/console/commands/color-simple.ts`
  - Parse: `color <colorname> <selection>` or `color <selection> <colorname>`
  - Parse targets: `atoms`, `cartoons`, `surfaces`
  - Parse transparency: `transparency 50`

- [ ] Implement coloring strategies:
  - **Single color:** Use overpaint system to apply uniform color to selection
  - **By element:** Use existing `element-symbol` color theme
  - **By chain:** Use existing `chain-id` color theme
  - **By hetero:** Create new scheme using `mol-model` metadata

- [ ] Handle representation filtering
  - If targets=`atoms`, only affect ball-and-stick/spacefill
  - If targets=`cartoons`, only affect cartoon representation
  - Use `mol-plugin-state/transforms/representation.ts` to update specific representations

**Example Commands:**
```
color red /A          # Color chain A red
color /A red atoms    # Color chain A atoms red (not cartoon)
color skyblue :12-50  # Color residues 12-50 sky blue
color byelement       # Color all by element
```

---

## Phase 2: Sequential Coloring (Week 3-4)

### 2.1 Palette System
**Goal:** Create flexible palette infrastructure

**Tasks:**
- [ ] Create `src/apps/viewer/console/palettes.ts`
  - Define built-in palettes: rainbow, redwhiteblue, grayscale
  - Support palette reversal (`^rainbow`)
  - Interpolate colors for arbitrary positions [0-1]
  - Support explicit lists: `red:white:blue`
  - Support anchored: `"0,blue:0.5,white:1,red"`

- [ ] Create palette picker helper
  - Resolve named palettes
  - Parse custom palette strings
  - Generate gradient functions

### 2.2 Rainbow/Sequential Mode (Mode B)
**Goal:** Implement `color rainbow <level> <selection>`

**Tasks:**
- [ ] Create `src/apps/viewer/console/commands/color-rainbow.ts`
  - Parse level: `residues` (default), `chains`, `polymers`, `structures`
  - Map palette across ordered sequence

- [ ] Implement gradient mappers:
  - **residues:** Order residues within chain by sequence ID, assign colors 0→1
  - **chains:** One color per chain from palette
  - **polymers:** Same sequence → same color across models
  - **structures:** One color per model

- [ ] Create `src/mol-theme/color/rainbow-sequence.ts`
  - New color theme that takes level + palette params
  - Compute position in sequence for each location
  - Return interpolated color from palette

**Example Commands:**
```
color rainbow                      # Rainbow by residues
color rainbow chains               # One color per chain
color rainbow :1-50                # Rainbow subset
color rainbow palette bluered     # Custom palette
```

---

## Phase 3: Attribute Coloring (Week 5-6)

### 3.1 Attribute System
**Goal:** Color by numerical attributes like B-factor

**Tasks:**
- [ ] Create `src/apps/viewer/console/commands/color-attribute.ts`
  - Parse: `color byattribute <attr> <selection>`
  - Handle range: `range 0,100` or `range full`
  - Handle averaging: `average residue` for cartoons
  - Handle missing values: `novalue gray`

- [ ] Leverage existing attribute access
  - B-factor already available via `mol-model`
  - Use `Occupancy` color theme as reference
  - Access custom properties via property system

- [ ] Create value-to-color mapper
  - Normalize attribute values to [0-1] within range
  - Apply palette interpolation
  - Handle outliers and missing data

**Example Commands:**
```
color byattribute bfactor range 10,50 palette bluewhitered
color byattribute bfactor :260-275 average residue
```

---

## Phase 4: Integration & UX (Week 7-8)

### 4.1 Command Registration & Help
**Tasks:**
- [ ] Create command registry in console
- [ ] Add `help color` command showing syntax
- [ ] Add tab completion for:
  - Color names
  - Selection keywords (`helix`, `sheet`, `protein`)
  - Palette names
  - Attribute names

### 4.2 Console Enhancements
**Tasks:**
- [ ] Add color feedback: show command success/failure
- [ ] Add selection preview: "Coloring 45 atoms in chain A"
- [ ] Add command history (up/down arrows)
- [ ] Show applied colors in console output (colored text?)

### 4.3 Viewer Integration
**Tasks:**
- [ ] Store global viewer reference on page load
- [ ] Access viewer.plugin for state manipulation
- [ ] Use viewer.plugin.state.data for structure queries
- [ ] Use viewer.plugin.managers.structure for selections

---

## Phase 5: Advanced Modes (Week 9-12)

### 5.1 Zone Coloring (Mode G)
**Goal:** Transfer atom colors to nearby surface regions

**Tasks:**
- [ ] Access surface geometry from representations
- [ ] Compute nearest atoms within cutoff for each surface vertex
- [ ] Transfer atom colors to surface vertices
- [ ] Handle `sharpEdges` via subdivision

### 5.2 Transparency & Halfbonds
**Tasks:**
- [ ] Implement transparency override using `mol-theme/transparency.ts`
- [ ] Implement halfbond coloring for bond representations
- [ ] Allow independent bond colors

---

## Implementation Strategy

### Step-by-Step Approach

**Week 1:**
1. Set up command parser skeleton
2. Parse basic color commands: `color red /A`
3. Implement color name registry
4. Test in console

**Week 2:**
1. Implement selection translator for chains
2. Implement simple uniform coloring via overpaint
3. Add `byelement` and `bychain` schemes
4. Test multiple selections

**Week 3:**
1. Build palette system
2. Implement rainbow coloring by residues
3. Create rainbow color theme
4. Test on real structures

**Week 4:**
1. Add rainbow by chains/polymers
2. Add palette customization
3. Add transparency support
4. Test edge cases

**Week 5-6:**
1. Implement attribute coloring
2. Support B-factor, occupancy
3. Add range clamping
4. Add residue averaging

**Week 7-8:**
1. Polish console UX
2. Add help system
3. Add command history
4. Add visual feedback

---

## File Structure

```
src/apps/viewer/console/
├── command-parser.ts          # Main parser
├── color-names.ts             # Color registry
├── selection-translator.ts    # ChimeraX → MolQL
├── palettes.ts                # Palette definitions
├── commands/
│   ├── color-simple.ts        # Simple mode
│   ├── color-rainbow.ts       # Sequential mode
│   ├── color-attribute.ts     # Attribute mode
│   └── color-zone.ts          # Zone mode (future)
└── utils.ts                   # Shared utilities

src/mol-theme/color/
├── rainbow-sequence.ts        # Rainbow color theme
└── attribute-value.ts         # Attribute-based theme (if needed)
```

---

## Testing Plan

### Unit Tests
- Command parser with various syntaxes
- Selection translator edge cases
- Palette interpolation accuracy
- Color name resolution

### Integration Tests
- Load 1ERM, color chain A red → verify
- Rainbow coloring → verify gradient
- B-factor coloring → verify value mapping
- Multiple overlapping commands → verify precedence

### User Acceptance Tests
- All examples from SPEC section 11
- Edge cases: empty selections, invalid colors, missing attributes

---

## Dependencies & APIs

### Mol* APIs to Use
1. **Selection**: `mol-script` for MolQL expressions
2. **Coloring**: `mol-theme/color` for themes, `overpaint` for custom colors
3. **State**: `mol-plugin-state` for accessing structures
4. **Representations**: `mol-repr` for visual updates

### External Dependencies
- None initially (all built-in Mol* capabilities)
- ColorBrewer palettes in Phase 3

---

## Success Criteria

**Phase 1 Complete:**
- ✓ Can execute: `color red /A`
- ✓ Can execute: `color byelement`
- ✓ Can execute: `color /A:12-50 skyblue`
- ✓ Console shows feedback

**Phase 2 Complete:**
- ✓ Can execute: `color rainbow`
- ✓ Can execute: `color rainbow chains palette redblue`
- ✓ Gradients are smooth and correct

**Phase 3 Complete:**
- ✓ Can execute: `color byattribute bfactor range 0,50`
- ✓ B-factor mapped correctly to palette
- ✓ Works with cartoon averaging

---

## Notes

- **Start minimal:** Get `color red /A` working first, then expand
- **Use existing systems:** Leverage Mol*'s theme and overpaint systems rather than reimplementing
- **Incremental testing:** Test each command as it's built
- **Console-first:** Build commands in console before considering GUI panels
- **Reference implementations:** Study existing color themes in `mol-theme/color/` for patterns

---

## Questions to Resolve

1. **Overpaint vs Theme?**
   - Simple colors → overpaint
   - Complex schemes (rainbow, attributes) → custom themes

2. **Multi-representation handling?**
   - Query all representations for selection
   - Update color theme params per representation

3. **State persistence?**
   - Store command history in session?
   - Allow undo of color operations?

---

This plan provides a clear roadmap from console command parsing through full ChimeraX color parity, broken into manageable weekly milestones.
