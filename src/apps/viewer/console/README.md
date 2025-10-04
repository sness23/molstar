# Console Command System

ChimeraX-style color commands for Mol* viewer console.

## Phase 1 Implementation (Current)

### Available Commands

#### Load Structure
```
load <pdbid>
```
Example: `load 1erm`

#### Close/Clear Structure
```
close
```

#### Color Commands

**Simple coloring with named colors:**
```
color <colorname> <selection>
color <selection> <colorname>
```
Examples:
- `color red /A` - Color chain A red
- `color /A red` - Same as above
- `color skyblue :12-50` - Color residues 12-50 sky blue
- `color #ff0000 /A` - Color chain A using hex color

**Color by scheme:**
```
color <scheme>
```
Schemes:
- `byelement` or `byatom` - Color by element type
- `bychain` - Color by chain ID
- `byhet` - Color by molecule type
- `bymodel` - Color by model index
- `bypolymer` - Color by polymer identity

Examples:
- `color byelement` - Color all atoms by element
- `color bychain` - Color by chain

### Selection Syntax

**Chain selection:**
- `/A` - Chain A
- `/A,B` - Chains A and B

**Residue selection:**
- `:12` - Residue 12
- `:12-50` - Residues 12 to 50
- `:12,15,20-30` - Residues 12, 15, and 20-30

**Combined:**
- `/A:12-50` - Chain A, residues 12-50

**Filters:**
- `& helix` - Helix secondary structure
- `& sheet` - Sheet secondary structure
- `& protein` - Protein atoms only

**Examples:**
- `/D & helix` - Chain D helices
- `/A,B:12,260-275` - Residue ranges in chains A and B

### Color Names

Supported colors: white, black, red, green, blue, yellow, cyan, magenta, orange, purple, pink, brown, gray/grey, skyblue, hotpink, lime, navy, olive, teal, maroon, aqua, silver, gold, coral, salmon, and many more.

Also supports:
- Hex colors: `#FF0000`, `#f00`
- RGB: `rgb(255, 0, 0)`

## Implementation Status

### ✅ Completed (Phase 1)
- Command parser
- Color name registry (40+ colors)
- Selection translator (ChimeraX → MolQL)
- Simple color commands
- Color schemes (byelement, bychain, etc.)
- Console integration

### 🔄 Next (Phase 2)
- Rainbow/sequential coloring
- Palette system
- Color by residues/chains/polymers

### 📋 Future (Phase 3+)
- Color by attribute (B-factor, etc.)
- Transparency control
- Target filtering (atoms, cartoons, surfaces)
- Zone coloring
- Advanced palettes

## Testing

Try these commands:
1. `load 1erm`
2. `color red /A`
3. `color skyblue /B`
4. `color byelement`
5. `color bychain`
6. `close`

## Architecture

- `command-parser.ts` - Parse command strings
- `color-names.ts` - Color name registry and parsing
- `selection-translator.ts` - Convert selections to MolQL
- `commands/color-simple.ts` - Simple color implementation
