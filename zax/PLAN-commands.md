# mol-console Commands Status and Implementation Plan

## Overview

This document tracks the implementation status of all mol-console commands and outlines the work needed to complete the broken/incomplete commands.

---

## Command Status Summary

**Working: 5/7 commands**
- ✅ load
- ✅ color (with full selection support)
- ✅ close
- ✅ reset
- ✅ help

**Broken/Incomplete: 2/7 commands**
- ❌ style - Exists but broken, needs reimplementation
- ❌ focus - Stub only, needs full implementation

---

## ✅ Working Commands

### 1. `load <pdb-id>` - COMPLETE

**Status**: Fully functional

**Implementation**: `src/mol-console/commands/load.ts:25`

**What it does**:
- Downloads PDB structures from RCSB
- Displays them with default preset
- Example: `load 1cbs`

**No issues found**

---

### 2. `color <color> [selection]` - COMPLETE

**Status**: Fully functional with comprehensive features

**Implementation**: `src/mol-console/commands/color.ts:48`

**Features**:
- Named colors (red, blue, green, yellow, orange, purple, cyan, magenta, white, black, gray, pink, brown, etc.)
- Hex colors (#FF0000, #00FF00, etc.)
- Color schemes:
  - `byelement` / `byatom` - Color by element type
  - `bychain` - Color by chain
  - `byhet` - Color by molecule type
  - `bymodel` - Color by model
  - `bypolymer` / `byidentity` - Color by polymer/entity
- Full selection syntax support

**Selection examples**:
```
color red                    # Color everything red
color :A yellow             # Color chain A yellow
color :A:12-50 blue         # Color residues 12-50 in chain A
color & protein green       # Color all protein atoms green
color byelement             # Apply element coloring scheme
```

**No issues found**

---

### 3. `close` - COMPLETE

**Status**: Fully functional

**Implementation**: `src/mol-console/commands/close.ts:19`

**What it does**:
- Clears all structures from the viewer using `plugin.clear()`

**No issues found**

---

### 4. `reset` - COMPLETE

**Status**: Fully functional

**Implementation**: `src/mol-console/commands/reset.ts:20`

**What it does**:
- Resets camera view to show entire structure
- Uses `PluginCommands.Camera.Reset`

**No issues found**

---

### 5. `help [command]` - COMPLETE

**Status**: Fully functional

**Implementation**: `src/mol-console/commands/help.ts:20`

**Features**:
- General help listing all available commands
- Detailed help for specific commands when requested
- Comprehensive documentation for each command
- Examples for each command

**Examples**:
```
help                        # Show all commands
help color                  # Show detailed help for color command
help load                   # Show detailed help for load command
```

**No issues found**

---

## ❌ Broken/Incomplete Commands

### 6. `style <style> [selection]` - INCOMPLETE/BROKEN

**Status**: Implementation exists but is broken

**Implementation**: `src/mol-console/commands/style.ts:23`

**Current Problems**:

1. **Hardcoded state reference** (line 40)
   - Uses `plugin.state.data.select('1.1')[0]`
   - Assumes a specific state structure that may not exist
   - Will fail if structure is loaded differently

2. **No selection support**
   - Parser accepts selection parameter but execute function ignores it completely
   - Should support same selection syntax as color command

3. **Limited styles**
   - Only supports 3 styles: `cartoon`, `ball-and-stick`, `spacefill`
   - Help text advertises 6 styles: cartoon, spacefill, sticks, lines, surface, ribbons
   - Missing: sticks, lines, surface, ribbons

4. **Adds instead of replaces**
   - Uses `addRepresentation` which creates new representations
   - Should update or replace existing representations
   - Leads to duplicate representations stacking up

5. **Poor error handling**
   - No proper handling when structure doesn't exist
   - Doesn't validate style names properly

**What needs to be done**:

- [ ] **Rewrite structure traversal** (use color command as template)
  - Use `plugin.managers.structure.hierarchy.current` to get structures
  - Iterate through all structures properly
  - Don't rely on hardcoded state paths

- [ ] **Implement selection parsing**
  - Import and use `parseSelection` and `selectionToQuery` from `mol-console/selection/language.ts`
  - Apply selection filtering like the color command does
  - Support optional selection (default to 'all')

- [ ] **Support all advertised styles**
  - Add missing styles: sticks, lines, surface, ribbons
  - Map style names to proper Mol* representation types
  - Validate style names and provide helpful error messages

- [ ] **Fix representation handling**
  - Instead of adding new representations, update existing ones
  - Or clear old representations before adding new ones
  - Consider using the structure component manager

- [ ] **Improve error handling**
  - Check if structures are loaded before attempting to style
  - Provide clear error messages for invalid styles
  - Handle edge cases gracefully

**Reference implementation**: The color command (`src/mol-console/commands/color.ts`) shows the correct pattern for:
- Structure traversal
- Selection parsing and query building
- Proper error handling

---

### 7. `focus [selection]` - NOT IMPLEMENTED

**Status**: Stub implementation only

**Implementation**: `src/mol-console/commands/focus.ts:28`

**Current Problems**:

1. **Not actually implemented**
   - Lines 26-27: TODO comment admits it's not implemented
   - Line 38: Just calls `PluginCommands.Camera.Reset` (identical to `reset` command)
   - No actual selection-based focusing occurs

2. **Parser expects wrong format**
   - Parser in `src/mol-plugin/console.ts:224` expects `focus <type> <target>` (2+ args required)
   - Help text says `focus [selection]` (0 or 1 args, optional)
   - Parser will reject valid commands like `focus` or `focus :A`

3. **Ignores all parameters**
   - Accepts `type` and `target` parameters but doesn't use them
   - Should accept a selection string instead

4. **No selection system integration**
   - Doesn't use the selection parser at all
   - Doesn't build queries or loci

**What needs to be done**:

- [ ] **Fix command parser** (in `src/mol-plugin/console.ts:218-233`)
  ```typescript
  // Current (broken):
  parse: (args: string[]) => {
      if (args.length < 2) return null;
      return { type: args[0].toLowerCase(), target: args[1] };
  }

  // Should be:
  parse: (args: string[]) => {
      return { selection: args.join(' ') || 'all' };
  }
  ```

- [ ] **Update function signature** (in `src/mol-console/commands/focus.ts`)
  ```typescript
  // Current:
  export interface FocusCommandParams {
      type: string;
      target: string;
  }

  // Should be:
  export interface FocusCommandParams {
      selection?: string;
  }
  ```

- [ ] **Implement actual focus logic**
  1. Import selection parser:
     ```typescript
     import { parseSelection, selectionToQuery } from '../selection/language';
     import { QueryContext } from '../../mol-model/structure/query/context';
     import { StructureSelection } from '../../mol-model/structure';
     ```

  2. Parse the selection:
     ```typescript
     const selectionStr = params.selection || 'all';
     const selectionSpec = parseSelection(selectionStr);
     const query = selectionToQuery(selectionSpec);
     ```

  3. Get structures and build loci (similar to color command):
     ```typescript
     const structureHierarchy = plugin.managers.structure.hierarchy.current;
     if (structureHierarchy.structures.length === 0) {
         return { success: false, message: 'No structure loaded' };
     }

     // Build loci from selection
     const structure = structureHierarchy.structures[0].cell.obj?.data;
     const ctx = new QueryContext(structure.root);
     const selection = query(ctx);
     const loci = StructureSelection.toLociWithSourceUnits(selection);
     ```

  4. Focus camera on the loci:
     ```typescript
     // Option A: Use camera manager
     await plugin.managers.camera.focusLoci(loci);

     // Option B: Use structure focus manager
     await plugin.managers.structure.focus.setFromLoci(loci);
     ```

- [ ] **Add proper error handling**
  - Check if structures exist
  - Handle invalid selections
  - Provide meaningful error messages

- [ ] **Support focusing on multiple structures**
  - If selection spans multiple structures, combine loci
  - Or focus on bounding sphere of all selected atoms

**Reference implementation**:
- The color command shows how to parse selections and build loci
- Check `src/mol-plugin/managers/structure/focus.ts` for focus manager API
- Check `src/mol-plugin/managers/camera.ts` for camera manager API

---

## Selection System Status

### ✅ Selection Parser - COMPLETE

**Implementation**: `src/mol-console/selection/language.ts`

**Supported syntax**:
- Chain selection: `/A`, `/A,B,C`
- Residue selection: `:12`, `:12-50`, `:12,15,20`
- Combined: `/A:12-50`
- Molecule types: `& protein`, `& nucleic`, `& ligand`, `& water`
- Secondary structure: `& helix`, `& sheet`, `& coil`
- Model selection: `#1`, `#2`

**Key functions**:
- `parseSelection(selectionStr: string): SelectionSpec` - Parses selection syntax
- `selectionToQuery(spec: SelectionSpec): StructureQuery` - Converts to MolQL query
- `describeSelection(spec: SelectionSpec): string` - Human-readable description

**Currently used by**: color command (successfully)

**Missing feature**:
- `@CA` syntax for atom names (mentioned in README.md but not implemented)
- Would need to add atom name matching to the parser

---

## Implementation Priority

### High Priority (Core functionality broken)
1. **Fix `focus` command** - Currently doesn't work at all, just a stub
2. **Fix `style` command** - Exists but broken, causes errors

### Medium Priority (Enhancement)
3. Add atom name selection support (`@CA`, `@N`, etc.) to selection parser
4. Add more representation styles (sticks, lines, surface, ribbons)

### Low Priority (Nice to have)
5. Add command aliases (e.g., `colour` for `color`, `centre` for `focus`)
6. Add undo/redo support for commands
7. Add batch command support (run multiple commands)

---

## Testing Checklist

Once fixes are implemented, test the following scenarios:

### Style Command Tests
- [ ] `style cartoon` - Apply to all
- [ ] `style :A cartoon` - Apply to chain A
- [ ] `style :A:10-20 spacefill` - Apply to residue range
- [ ] `style & protein sticks` - Apply to protein only
- [ ] Multiple style changes in sequence (ensure old ones are replaced)
- [ ] Invalid style name (should show error)
- [ ] Style when no structure loaded (should show error)

### Focus Command Tests
- [ ] `focus` - Focus on entire structure
- [ ] `focus :A` - Focus on chain A
- [ ] `focus :A:10-20` - Focus on residue range
- [ ] `focus & ligand` - Focus on ligands
- [ ] `focus @CA` - Focus on alpha carbons (once atom selection is implemented)
- [ ] Focus when no structure loaded (should show error)
- [ ] Focus with invalid selection (should show error)

---

## Code Style Notes

When implementing fixes:
- Follow the pattern used by the color command
- Use async/await consistently
- Provide clear error messages
- Return proper `CommandResult` objects
- Add TypeScript type safety
- Include JSDoc comments
- Handle edge cases (no structure, invalid selection, etc.)

---

## Questions/Decisions Needed

1. **Style command behavior**: Should it replace all representations or update existing ones?
2. **Focus command camera animation**: Should focus have animation duration parameter?
3. **Atom name syntax**: Should we add `@CA` syntax to selection parser? (Yes, according to README)
4. **Multiple structures**: How should style/focus behave with multiple loaded structures?

---

## Related Files

- `src/mol-console/commands/` - All command implementations
- `src/mol-console/selection/language.ts` - Selection parser
- `src/mol-plugin/console.ts` - Command registry and parser registration
- `src/mol-plugin/managers/camera.ts` - Camera management
- `src/mol-plugin/managers/structure/focus.ts` - Structure focus management
- `src/mol-plugin-state/helpers/structure-overpaint.ts` - Reference for structure manipulation

---

Last updated: 2025-10-09
