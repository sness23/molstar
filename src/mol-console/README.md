# mol-console

A PyMOL/ChimeraX-style command console for Mol*.

## Overview

`mol-console` provides a command-line interface for controlling Mol* programmatically using familiar PyMOL and ChimeraX syntax. It includes:

- **Command System**: Extensible command registry and parser
- **Selection Language**: PyMOL/ChimeraX-style selection syntax
- **Color Commands**: Color atoms by selection with various color schemes
- **Type Safety**: Full TypeScript support

## Quick Start

```typescript
import { CommandRegistry, ColorCommand } from 'molstar/lib/mol-console';
import { PluginContext } from 'molstar/lib/mol-plugin/context';

// Create a command registry
const registry = new CommandRegistry();

// Register built-in commands
registry.register(ColorCommand);

// Execute commands
await registry.execute(plugin, 'color red');
await registry.execute(plugin, 'color /A red');
await registry.execute(plugin, 'color /A:10-20 & protein green');
```

## Selection Syntax

The selection language supports:

- **Chains**: `/A`, `/B`, `/A,B,C`
- **Residues**: `:10`, `:10-20`, `:10,15,20`
- **Combined**: `/A:10-20`
- **Molecule Types**: `& protein`, `& nucleic`, `& ligand`, `& water`
- **Secondary Structure**: `& helix`, `& sheet`, `& coil`

### Examples

```bash
color red                      # Color everything red
color /A red                   # Color chain A red
color /B:50 green              # Color residue 50 in chain B green
color /A:10-20 blue            # Color residues 10-20 in chain A blue
color /A & protein yellow      # Color only protein atoms in chain A yellow
color ligand magenta           # Color all ligands magenta
```

## Color Schemes

Built-in color schemes:

- `byelement` / `byatom` - Color by element
- `bychain` - Color by chain
- `byhet` - Color by molecule type
- `bymodel` - Color by model
- `bypolymer` / `byidentity` - Color by polymer/entity

```bash
color byelement                # Color by element
color bychain                  # Color by chain
```

## Architecture

```
mol-console/
├── command/        # Command parsing and registry
├── selection/      # Selection language
├── color/          # Color utilities
└── commands/       # Built-in commands
```

## API

See [API documentation](./API.md) for detailed API reference.

## Examples

See [examples](./EXAMPLES.md) for more usage examples.
