# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mol* is a comprehensive macromolecular visualization library for 3D rendering and analysis of biomolecular structures. It's a modern web-based viewer jointly developed by PDBe and RCSB PDB, building on LiteMol and NGL viewers.

## Build Commands

### Standard Development
```bash
npm install                 # Install dependencies
npm run build              # Build entire project (apps + library)
npm run build:lib          # Build library only (dual ESM/CommonJS)
npm run build:apps         # Build applications only
npm run watch              # Auto-rebuild on file changes
npm run watch-viewer       # Faster builds when working only on viewer
npm run clean              # Clean build artifacts (build/, lib/, .tsbuildinfo)
npm run rebuild            # Clean + full rebuild (use after dependency updates)
```

### Fast Development with esbuild
```bash
npm run dev:viewer         # Watch mode for viewer only
npm run dev:smol           # Watch mode for smol (viewer with console)
npm run dev:apps           # Watch mode for all apps
npm run dev:examples       # Watch mode for examples
npm run dev:all            # Watch mode for everything
npm run dev -- -a viewer smol -e basic-wrapper  # Watch specific apps/examples
```

### Testing and Quality
```bash
npm run test               # Run linter + Jest tests
npm run jest               # Run Jest tests only
npm run lint               # Run ESLint
npm run lint-fix           # Auto-fix ESLint issues
```

### Debug Mode
```bash
DEBUG=molstar npm run watch  # Enable debug mode during build
# In browser console: setMolStarDebugMode(true/false, true/false)
```

### Running Locally
```bash
npm install -g http-server
http-server -p 1338        # Or use npm run serve
# Navigate to http://localhost:1338/build/viewer
```

## Architecture

### Core Module Hierarchy

The codebase follows a layered architecture where higher-level modules depend on lower-level ones:

**Foundation Layer:**
- `mol-task` - Async computation with progress tracking and cancellation
- `mol-data` - Core data structures (integer sets, tables, columns)
- `mol-math` - Mathematical algorithms and linear algebra
- `mol-util` - General utilities

**Data Layer:**
- `mol-io` - Format parsers (CIF, PDB, GRO, MOL2, CUBE, DX, etc.)
- `mol-model` - Molecular data structures and query engine
- `mol-model-formats` - Format-specific model builders
- `mol-model-props` - Custom molecular properties

**Visualization Layer:**
- `mol-script` - MolQL query language for selections and representations
- `mol-geo` - Geometry generation for molecular visualization
- `mol-theme` - Theming system for structures, volumes, shapes
- `mol-repr` - Representation builders (cartoon, ball-and-stick, surface, etc.)
- `mol-gl` - WebGL wrapper and rendering primitives
- `mol-canvas3d` - Low-level 3D canvas component

**Application Layer:**
- `mol-state` - State tree with serialization and automatic updates
- `mol-plugin` - Modular plugin system built on mol-state
- `mol-plugin-state` - State transformations and managers
- `mol-plugin-ui` - React-based UI components

### Key Design Patterns

**State Management:** The plugin uses an immutable state tree (`mol-state`) where all changes flow through state transformations. States can be serialized, restored, and shared.

**Task System:** Long-running operations use `mol-task` for cancellation and progress tracking. Tasks are composable and can be paused/resumed.

**Property System:** Custom molecular properties (annotations, computed data) are registered via `mol-model-props` and dynamically attached to structures.

**Representation Pipeline:** Structure → Selection (MolQL) → Visual (geometry) → Theme (colors/sizes) → Renderable

## Project Structure

### Applications (`src/apps/`)
- `viewer` - Main Mol* viewer application
- `smol` - Mol* viewer with PyMOL-style command console
- `docking-viewer` - Specialized docking visualization
- `mesoscale-explorer` - Mesoscale structure explorer
- `mvs-stories` - Molecular Visualization Stories

### Servers (`src/servers/`)
- `model` - Coordinate and annotation data server
- `volume` - Volumetric experimental data server
- `plugin-state` - Plugin state storage server

### Extensions (`src/extensions/`)
Modular extensions for specific functionality (MVS, DNATCO, CCD, etc.)

### Build Output
- `lib/` - Compiled library (ESM + CommonJS)
- `build/` - Built applications and examples
- TypeScript builds both ESM (`lib/`) and CommonJS (`lib/commonjs/`) via dual tsconfig

## Testing

Tests use Jest and are located in `_spec/` directories within each module:
```
src/mol-math/linear-algebra/_spec/vec3.spec.ts
```

Test files follow the pattern `*.spec.ts` and use standard Jest syntax.

## Development Notes

### TypeScript Configuration
- Target: ES2018
- Strict mode enabled (strictNullChecks, noImplicitAny, etc.)
- Dual module output: ESM (default) + CommonJS
- Uses `tsc-alias` for path resolution
- Shader files (`.glsl.ts`, `.vert.ts`, `.frag.ts`) contain GLSL code as TypeScript strings

### Code Generation
The project includes CLI tools for generating schemas and data:
```bash
# After building lib, run:
node lib/commonjs/cli/cifschema -mip ../../../../mol-data -o src/mol-io/reader/cif/schema/mmcif.ts -p mmCIF
node lib/commonjs/cli/lipid-params -o src/mol-model/structure/model/types/lipids.ts
node --max-old-space-size=4096 lib/commonjs/cli/chem-comp-dict/create-ions.js src/mol-model/structure/model/types/ions.ts
```

### Module Dependencies
When adding features:
- Respect the module hierarchy - lower layers cannot depend on higher ones
- `mol-plugin-ui` components can be reused in external projects
- Extensions should be self-contained and register via the plugin system
- New representations require implementing geometry builders in `mol-geo` and visual builders in `mol-repr`

### Performance
- Use `mol-task` for operations >100ms to enable cancellation
- Leverage Web Workers via `mol-task` for CPU-intensive computations
- Geometry updates should be incremental when possible
- WebGL state changes are minimized via `mol-gl` abstraction

### Servers
Model and volume servers can run standalone:
```bash
npm run model-server        # Start model data server
npm run model-server-watch  # Auto-restart on changes
npm run plugin-state        # State storage server
```

## Publishing

```bash
npm version prerelease      # For pre-releases (X.Y.Z-dev.N)
npm publish --tag next

npm version 0.X.0           # For releases (semver)
npm publish
```

## Citation

When using Mol*, cite: Sehnal et al., *Nucleic Acids Research*, 2021; https://doi.org/10.1093/nar/gkab314
