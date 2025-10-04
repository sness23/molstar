# mol-console Integration Plan

## Overview

This document outlines the plan to move the PyMOL-style console from `src/apps/viewer/console/` into a reusable, first-class module at `src/mol-console/` that can be imported and used in any Mol* project.

## Goals

1. **Modular Design**: Create a standalone `mol-console` module following Mol* architecture patterns
2. **Reusability**: Make it easy to integrate the console into any Mol* plugin instance
3. **Extensibility**: Allow users to add custom commands and parsers
4. **Type Safety**: Provide full TypeScript type definitions
5. **Documentation**: Include comprehensive API documentation and examples
6. **Consistency**: Follow Mol* naming conventions, code style, and module hierarchy

## Current State

### Current Location
```
src/apps/viewer/console/
├── command-parser.ts       # Command tokenization and parsing
├── color-names.ts          # Color name registry
├── selection-translator.ts # ChimeraX selection → MolQL query
├── index.ts               # Exports
└── commands/
    └── color-simple.ts    # Color command implementation
```

### Current Dependencies
- `mol-plugin/context` - PluginContext
- `mol-plugin-state/helpers/structure-overpaint` - setStructureOverpaint
- `mol-plugin-state/objects` - PSO
- `mol-model/structure` - StructureSelection, QueryContext
- `mol-script/language/builder` - MolScriptBuilder
- `mol-util/color` - Color
- `mol-state` - StateSelection
- `mol-theme/color` - ColorTheme

## Proposed Structure

### New Module Location
```
src/mol-console/
├── index.ts                      # Main exports
├── README.md                     # Module documentation
│
├── command/                      # Command system
│   ├── parser.ts                # Core command parser
│   ├── registry.ts              # Command registry/dispatcher
│   ├── types.ts                 # Command interfaces
│   └── index.ts
│
├── selection/                    # Selection system
│   ├── parser.ts                # Selection string parser
│   ├── translator.ts            # Selection → MolQL translator
│   ├── types.ts                 # Selection interfaces
│   ├── language.ts              # Selection language definition
│   └── index.ts
│
├── color/                        # Color utilities
│   ├── names.ts                 # Color name registry
│   ├── parser.ts                # Color string parser
│   ├── types.ts                 # Color interfaces
│   └── index.ts
│
├── commands/                     # Built-in commands
│   ├── color.ts                 # Color command
│   ├── select.ts                # Select command (future)
│   ├── show.ts                  # Show command (future)
│   ├── hide.ts                  # Hide command (future)
│   ├── types.ts                 # Command result types
│   └── index.ts
│
├── ui/                          # Optional UI components
│   ├── console.tsx              # React console component
│   ├── input.tsx                # Command input component
│   ├── history.tsx              # Command history component
│   └── index.ts
│
└── _spec/                       # Tests
    ├── parser.spec.ts
    ├── selection.spec.ts
    └── color.spec.ts
```

## Architecture Design

### 1. Command Registry Pattern

Following Mol* patterns (like `mol-state/transformer`), create a command registry:

```typescript
// src/mol-console/command/registry.ts

export interface ConsoleCommand<P = any, R = any> {
    readonly name: string;
    readonly description: string;
    readonly category: string;
    readonly parse: (args: string[]) => P | undefined;
    readonly execute: (plugin: PluginContext, params: P) => Promise<R>;
}

export namespace ConsoleCommand {
    export function create<P, R>(command: ConsoleCommand<P, R>): ConsoleCommand<P, R> {
        return command;
    }
}

export class CommandRegistry {
    private commands = new Map<string, ConsoleCommand>();

    register(command: ConsoleCommand) {
        this.commands.set(command.name, command);
    }

    get(name: string): ConsoleCommand | undefined {
        return this.commands.get(name);
    }

    async execute(plugin: PluginContext, input: string): Promise<any> {
        const parsed = parseCommandLine(input);
        const command = this.commands.get(parsed.command);
        if (!command) throw new Error(`Unknown command: ${parsed.command}`);

        const params = command.parse(parsed.args);
        if (!params) throw new Error('Invalid command syntax');

        return command.execute(plugin, params);
    }
}
```

### 2. Selection Language

Create a formal selection language specification:

```typescript
// src/mol-console/selection/language.ts

export namespace SelectionLanguage {
    export interface Spec {
        chains?: string[];
        residues?: ResidueSpec[];
        atoms?: string[];
        moleculeType?: 'protein' | 'nucleic' | 'ligand' | 'water';
        secondaryStructure?: 'helix' | 'sheet' | 'coil';
        modelId?: string;
    }

    export interface ResidueSpec {
        start?: number;
        end?: number;
        individual?: number[];
    }

    /**
     * Parse ChimeraX/PyMOL-style selection syntax
     *
     * @example
     * parse('/A')           // → { chains: ['A'] }
     * parse(':10-20')       // → { residues: [{ start: 10, end: 20 }] }
     * parse('/A:10-20')     // → { chains: ['A'], residues: [...] }
     * parse('& protein')    // → { moleculeType: 'protein' }
     */
    export function parse(selection: string): Spec;

    /**
     * Convert selection spec to MolQL StructureQuery
     */
    export function toQuery(spec: Spec): StructureQuery;

    /**
     * Get human-readable description
     */
    export function describe(spec: Spec): string;
}
```

### 3. Color System

Extend the color system to be more flexible:

```typescript
// src/mol-console/color/types.ts

export namespace ConsoleColor {
    export type Spec =
        | { kind: 'name', name: string }
        | { kind: 'hex', hex: string }
        | { kind: 'rgb', r: number, g: number, b: number }
        | { kind: 'scheme', scheme: ColorSchemeName };

    export type ColorSchemeName =
        | 'byelement' | 'byatom'
        | 'bychain'
        | 'byhet'
        | 'bynucleotide'
        | 'bymodel'
        | 'byidentity' | 'bypolymer'
        | 'random';

    export function parse(colorSpec: string): Spec;
    export function toColor(spec: Spec): Color;
}
```

### 4. Command Implementation

Refactor commands to be self-contained:

```typescript
// src/mol-console/commands/color.ts

import { ConsoleCommand } from '../command/registry';
import { SelectionLanguage } from '../selection/language';
import { ConsoleColor } from '../color/types';

interface ColorParams {
    selection?: string;
    color: string;
}

interface ColorResult {
    success: boolean;
    message: string;
    atomCount?: number;
}

export const ColorCommand = ConsoleCommand.create<ColorParams, ColorResult>({
    name: 'color',
    description: 'Color atoms by selection',
    category: 'Appearance',

    parse(args: string[]): ColorParams | undefined {
        // Parse command arguments
        // Handles: color red, color /A red, color /A:10-20 & protein green
        const parsed = parseColorCommand(args);
        return parsed.mode === 'simple' ? {
            selection: parsed.selection,
            color: parsed.colorSpec!
        } : undefined;
    },

    async execute(plugin: PluginContext, params: ColorParams): Promise<ColorResult> {
        // Implementation
        const colorSpec = ConsoleColor.parse(params.color);

        if (colorSpec.kind === 'scheme') {
            return executeColorScheme(plugin, colorSpec.scheme, params.selection);
        } else {
            const color = ConsoleColor.toColor(colorSpec);
            const selection = SelectionLanguage.parse(params.selection || 'all');
            return executeColorOverpaint(plugin, selection, color);
        }
    }
});
```

## Module Hierarchy & Dependencies

Following Mol* conventions, ensure proper dependency ordering:

```
mol-util          ← Low-level utilities
  ↓
mol-data          ← Data structures
  ↓
mol-math          ← Math utilities
  ↓
mol-model         ← Molecular data
  ↓
mol-script        ← Query language
  ↓
mol-console       ← Console system (NEW)
  ↓
mol-plugin-state  ← Plugin state management
  ↓
mol-plugin        ← Plugin core
  ↓
mol-plugin-ui     ← UI components
```

### Allowed Dependencies for mol-console

**Direct dependencies:**
- `mol-util/*` - Color, utilities
- `mol-model/structure` - Structure, StructureSelection
- `mol-script/*` - MolQL query building
- `mol-plugin/context` - PluginContext
- `mol-plugin-state/helpers/*` - Structure helpers
- `mol-plugin-state/objects` - Plugin state objects
- `mol-state` - State management
- `mol-theme` - Theming

**NOT allowed:**
- `mol-plugin-ui/*` - Keep UI components in `mol-console/ui/` as optional
- Application-specific code from `apps/`
- Extension-specific code from `extensions/`

## Integration Points

### 1. Plugin Integration

Add console support to the plugin:

```typescript
// src/mol-plugin/features/console.ts

import { PluginFeature } from '../features';
import { CommandRegistry } from '../../mol-console/command/registry';
import { ColorCommand } from '../../mol-console/commands/color';

export const Console = PluginFeature({
    name: 'console',

    create(plugin: PluginContext) {
        const registry = new CommandRegistry();

        // Register built-in commands
        registry.register(ColorCommand);
        // registry.register(SelectCommand);
        // registry.register(ShowCommand);

        return {
            registry,
            execute: (input: string) => registry.execute(plugin, input)
        };
    }
});
```

### 2. UI Integration (Optional)

Create a React component in `mol-console/ui/`:

```typescript
// src/mol-console/ui/console.tsx

import * as React from 'react';
import { PluginUIComponent } from '../../mol-plugin-ui/base';

export class ConsoleUI extends PluginUIComponent {
    render() {
        return <div className="msp-console">
            <ConsoleHistory history={this.state.history} />
            <ConsoleInput onExecute={this.handleCommand} />
        </div>;
    }

    private handleCommand = async (input: string) => {
        try {
            const result = await this.plugin.console.execute(input);
            this.addHistory(input, result);
        } catch (e) {
            this.addHistory(input, { error: e.message });
        }
    }
}
```

### 3. Spec Integration

Make console opt-in via plugin spec:

```typescript
// In mol-plugin-ui/spec.ts or custom spec

export function DefaultPluginUISpec(): PluginUISpec {
    return {
        // ... existing config
        features: {
            console: {
                enabled: true,
                commands: ['color', 'select', 'show', 'hide']
            }
        }
    };
}
```

## Migration Plan

### Phase 1: Create Module Structure ✓

1. Create `src/mol-console/` directory
2. Set up subdirectories: `command/`, `selection/`, `color/`, `commands/`
3. Create initial `index.ts` exports
4. Add `README.md` with module documentation

### Phase 2: Move Core Functionality ✓

1. **Command Parser**
   - Move `command-parser.ts` → `command/parser.ts`
   - Refactor to be more modular
   - Add command registry

2. **Selection System**
   - Move `selection-translator.ts` → `selection/translator.ts`
   - Split into `parser.ts` and `translator.ts`
   - Create `language.ts` for formal spec

3. **Color System**
   - Move `color-names.ts` → `color/names.ts`
   - Add `color/parser.ts`
   - Create color type definitions

### Phase 3: Refactor Commands ✓

1. **Color Command**
   - Move `commands/color-simple.ts` → `commands/color.ts`
   - Implement `ConsoleCommand` interface
   - Split into sub-functions (overpaint, scheme)
   - Remove console.log debugging

2. **Add Command Results**
   - Create `commands/types.ts`
   - Define `CommandResult` interface
   - Add success/error handling

### Phase 4: Add Tests ✓

1. Create `_spec/` directory
2. Add unit tests for:
   - Command parser
   - Selection parser
   - Color parser
   - Color command execution

### Phase 5: Documentation ✓

1. **README.md** - Module overview and quick start
2. **API.md** - Detailed API documentation
3. **EXAMPLES.md** - Usage examples
4. **Inline JSDoc** - All public APIs

### Phase 6: Optional UI ✓

1. Create `ui/` subdirectory
2. Add React components:
   - `console.tsx` - Main console
   - `input.tsx` - Command input
   - `history.tsx` - Command history
3. Add styling

### Phase 7: Integration & Testing ✓

1. Update viewer app to use `mol-console`
2. Test with `npm run dev:viewer`
3. Build library with `npm run build:lib`
4. Test in external project
5. Update build scripts if needed

## File Changes Required

### New Files to Create

```
src/mol-console/
├── index.ts                  # Main exports
├── README.md                 # Module docs
├── command/
│   ├── parser.ts            # From command-parser.ts
│   ├── registry.ts          # NEW
│   ├── types.ts             # NEW
│   └── index.ts             # NEW
├── selection/
│   ├── parser.ts            # NEW (split from translator)
│   ├── translator.ts        # From selection-translator.ts
│   ├── language.ts          # NEW
│   ├── types.ts             # NEW
│   └── index.ts             # NEW
├── color/
│   ├── names.ts             # From color-names.ts
│   ├── parser.ts            # NEW
│   ├── types.ts             # NEW
│   └── index.ts             # NEW
├── commands/
│   ├── color.ts             # From commands/color-simple.ts
│   ├── types.ts             # NEW
│   └── index.ts             # NEW
└── _spec/
    ├── parser.spec.ts       # NEW
    ├── selection.spec.ts    # NEW
    └── color.spec.ts        # NEW
```

### Files to Update

```
src/apps/viewer/app.ts
  - Update imports to use mol-console
  - Initialize console from mol-console

src/apps/viewer/index.html
  - Update to use mol-console UI (optional)
```

### Files to Remove (after migration)

```
src/apps/viewer/console/
  - All files (moved to mol-console)
```

## Export Strategy

### Public API (src/mol-console/index.ts)

```typescript
// Main exports
export * from './command';
export * from './selection';
export * from './color';
export * from './commands';

// Convenience re-exports
export { CommandRegistry } from './command/registry';
export { SelectionLanguage } from './selection/language';
export { ConsoleColor } from './color/types';

// Built-in commands
export { ColorCommand } from './commands/color';

// Optional UI
export * from './ui';
```

### Usage in External Projects

After `npm run build:lib`:

```typescript
// Import the console system
import {
    CommandRegistry,
    SelectionLanguage,
    ColorCommand,
    ConsoleColor
} from 'molstar/lib/mol-console';

import { PluginContext } from 'molstar/lib/mol-plugin/context';

// Create registry
const registry = new CommandRegistry();
registry.register(ColorCommand);

// Execute commands
await registry.execute(plugin, 'color /A red');

// Or use individual components
const selection = SelectionLanguage.parse('/A:10-20 & protein');
const query = SelectionLanguage.toQuery(selection);
const color = ConsoleColor.parse('red');
```

## Testing Strategy

### Unit Tests

```typescript
// src/mol-console/_spec/parser.spec.ts

describe('CommandParser', () => {
    it('parses simple color command', () => {
        const result = parseCommand('color red');
        expect(result.command).toBe('color');
        expect(result.args).toEqual(['red']);
    });

    it('combines selection parts with &', () => {
        const result = parseCommand('color /A & protein green');
        expect(result.args).toEqual(['/A & protein', 'green']);
    });
});
```

### Integration Tests

```typescript
// Test with actual plugin instance
describe('ColorCommand Integration', () => {
    let plugin: PluginContext;

    beforeEach(async () => {
        plugin = await createPlugin();
        await loadTestStructure(plugin);
    });

    it('colors chain A red', async () => {
        const result = await registry.execute(plugin, 'color /A red');
        expect(result.success).toBe(true);
    });
});
```

## Documentation Plan

### README.md

- Overview of mol-console
- Quick start guide
- Basic examples
- Links to detailed docs

### API.md

- Complete API reference
- All interfaces and types
- Function signatures
- Parameters and return values

### EXAMPLES.md

- Common use cases
- Code snippets
- Integration examples
- Advanced usage

## Build Configuration

### Update TypeScript Config

No changes needed - TypeScript will automatically include new `mol-console/` module.

### Update Package Exports

Consider adding explicit exports in `package.json`:

```json
{
  "exports": {
    ".": {
      "import": "./lib/index.js",
      "require": "./lib/commonjs/index.js"
    },
    "./console": {
      "import": "./lib/mol-console/index.js",
      "require": "./lib/commonjs/mol-console/index.js"
    }
  }
}
```

## Benefits of This Approach

1. **Modularity**: Console is a standalone, reusable module
2. **Type Safety**: Full TypeScript support with proper interfaces
3. **Extensibility**: Easy to add new commands
4. **Testing**: Easier to test in isolation
5. **Documentation**: Clear API for external developers
6. **Consistency**: Follows Mol* architecture patterns
7. **Maintainability**: Clear separation of concerns
8. **Reusability**: Can be used in any Mol* project
9. **Future-proof**: Easy to add features like autocomplete, help system, etc.

## Future Enhancements

1. **Command Autocomplete**: Add autocomplete support
2. **Help System**: Built-in help command with documentation
3. **Command History**: Persistent command history
4. **Aliases**: Support for command aliases
5. **Macros**: Record and replay command sequences
6. **Scripting**: Execute command scripts from files
7. **More Commands**: select, show, hide, distance, angle, etc.
8. **Advanced Selection**: Expand selection syntax (within, around, etc.)
9. **Variables**: Support for variables in commands
10. **Plugins**: Allow third-party command plugins

## Success Criteria

- [ ] mol-console module created in src/
- [ ] All code migrated from apps/viewer/console/
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Documentation complete
- [ ] Viewer app uses mol-console
- [ ] `npm run build:lib` includes mol-console
- [ ] Successfully imported in external project
- [ ] No regressions in viewer functionality
- [ ] Code follows Mol* conventions

## Timeline Estimate

- **Phase 1-2**: 2-3 hours (structure + core migration)
- **Phase 3**: 1-2 hours (command refactoring)
- **Phase 4**: 2-3 hours (tests)
- **Phase 5**: 1-2 hours (documentation)
- **Phase 6**: 2-3 hours (UI - optional)
- **Phase 7**: 1-2 hours (integration + testing)

**Total**: 9-15 hours

## Questions to Consider

1. **Naming**: Should it be `mol-console`, `mol-command`, or `mol-scripting`?
2. **UI**: Should UI components be in mol-console or mol-plugin-ui?
3. **Commands**: Which commands should be built-in vs. extensions?
4. **Syntax**: Stick with PyMOL/ChimeraX or create own?
5. **Backwards Compat**: Keep viewer app console working during migration?

## Next Steps

1. Review this plan
2. Make decisions on open questions
3. Create feature branch: `feature/mol-console`
4. Start Phase 1: Create module structure
5. Iterate through phases
6. Submit PR when complete

---

**Note**: This is a living document. Update as implementation progresses and requirements change.
