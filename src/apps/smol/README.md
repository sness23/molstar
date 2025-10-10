# smol - Mol* with Console

**smol** is a variant of the Mol* viewer with an integrated PyMOL-style command console for interactive molecular visualization.

## Features

- 🧬 Full Mol* visualization capabilities
- 💻 PyMOL-style command console
- 🎨 ChimeraX-compatible color commands
- 🔍 Advanced selection language
- ⌨️ Command history with persistence
- ⚡ Fast development with hot reload

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev:smol

# With debug mode (recommended)
DEBUG=molstar npm run dev:smol
```

Navigate to: `http://localhost:1338/build/smol/`

### Production Build

```bash
# Build for production
npm run build:apps

# Output: build/smol/molstar.js (minified)
```

## Console Usage

### Opening the Console

- Press **Enter** to show the console
- Press **F2** to toggle console visibility
- Press **Escape** to hide the console

### Command History

- **Up Arrow**: Navigate to previous commands
- **Down Arrow**: Navigate to next commands
- History is automatically saved and persists across sessions

### Available Commands

#### Load Structures
```
load 1cbs              # Load PDB entry
```

#### Color Commands

Simple coloring:
```
color red              # Color all atoms red
color blue             # Color all atoms blue
color @CA green        # Color alpha carbons green
color :A yellow        # Color chain A yellow
```

Supported color names: red, blue, green, yellow, orange, purple, cyan, magenta, white, black, gray, and more (see `console/README.md` for full list)

#### Clear
```
close                  # Clear all structures
```

### Console Integration

The console integrates with the `mol-console` module, which provides:
- Command parsing
- Color name registry
- Selection translation
- Command execution

See [console/README.md](console/README.md) for detailed console documentation.

## Differences from Standard Viewer

| Feature | Viewer | smol |
|---------|--------|------|
| Controls Panel | Visible | Hidden by default |
| Console | No | Yes |
| Command API | Limited | Full console API |
| Background | White | Black |
| Target Audience | General use | Power users |

## Configuration

### Default Options

The `layoutShowControls: false` setting hides the standard controls panel to provide more space for the 3D view and console.

To enable controls, modify `src/apps/smol/app.ts`:

```typescript
const DefaultViewerOptions = {
    // ...
    layoutShowControls: true,  // Change to true
    // ...
};
```

### Debug Mode

When running with `DEBUG=molstar`, you can enable debug mode in the browser console:

```javascript
setMolStarDebugMode(true, true)
```

This provides additional logging and debugging information.

## Programmatic Usage

### From NPM Package

```typescript
import { Viewer } from 'molstar/build/smol/molstar';

const viewer = await Viewer.create('app', {
    layoutShowControls: false,
});

viewer.loadPdb('1cbs');
```

### Console Commands

The smol viewer exports console command utilities:

```typescript
import {
    parseColorCommand,
    executeSimpleColor
} from 'molstar/build/smol/molstar';

const viewer = await Viewer.create('app');
const colorCmd = parseColorCommand('color red');
await executeSimpleColor(viewer.plugin, colorCmd);
```

## Examples

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="node_modules/molstar/build/smol/molstar.css" />
</head>
<body>
    <div id="app"></div>
    <script src="node_modules/molstar/build/smol/molstar.js"></script>
    <script>
        molstar.Viewer.create('app', {
            layoutShowControls: false
        }).then(viewer => {
            viewer.loadPdb('1cbs');
        });
    </script>
</body>
</html>
```

### With Custom Settings

```javascript
molstar.Viewer.create('app', {
    layoutShowControls: false,
    layoutShowLeftPanel: true,
    collapseLeftPanel: false,
    pdbProvider: 'rcsb',
    emdbProvider: 'rcsb',
}).then(viewer => {
    // Black background is set by default in index.html
    viewer.loadPdb('1cbs');
});
```

## URL Parameters

Like the standard viewer, smol supports URL parameters:

```
http://localhost:1338/build/smol/?pdb=1cbs
http://localhost:1338/build/smol/?pdb=1cbs&hide-controls=1
http://localhost:1338/build/smol/?debug-mode=1
```

Supported parameters:
- `pdb=<id>` - Load PDB entry
- `emdb=<id>` - Load EMDB entry
- `afdb=<id>` - Load AlphaFold DB entry
- `debug-mode=1` - Enable debug mode
- `hide-controls=1` - Hide controls (default in smol)
- `collapse-left-panel=1` - Collapse left panel
- Many more (see viewer documentation)

## Development Workflow

### Hot Reload Development

```bash
# Terminal 1: Start dev server
DEBUG=molstar npm run dev:smol

# Terminal 2: Watch for changes (optional)
# Changes trigger automatic rebuild
```

### Testing Changes

1. Make changes to source files
2. Wait for rebuild to complete
3. Refresh browser (Cmd+R or Ctrl+R)
4. Test in console

### Debugging

1. Run with `DEBUG=molstar npm run dev:smol`
2. Open browser console (F12)
3. Enable debug mode: `setMolStarDebugMode(true, true)`
4. Check console output for detailed logs

## Architecture

### File Structure

```
src/apps/smol/
├── app.ts              # Main viewer class and configuration
├── index.ts            # Entry point
├── index.html          # Main HTML with console UI
├── embedded.html       # Embedded version
├── favicon.ico         # Icon
└── console/
    ├── README.md       # Console documentation
    └── index.ts        # Console exports
```

### Build Output

```
build/smol/
├── molstar.js          # Bundled JavaScript
├── molstar.css         # Compiled styles
├── index.html          # Main page
├── embedded.html       # Embedded version
└── favicon.ico         # Icon
```

### Dependencies

smol depends on the `mol-console` module for console functionality:
- Command parsing
- Color registry
- Selection translation
- Command execution

See `src/mol-console/` for module source code.

## Deployment

smol is included in:
- Production builds (`npm run build:apps`)
- NPM package distribution
- Public deployment to molstar.github.io/smol/

To deploy:

```bash
# Local deployment test
npm run deploy:local

# Remote deployment
npm run deploy:remote
```

Deployed at: `https://molstar.org/smol/`

## Contributing

When contributing to smol:

1. Keep in sync with viewer app changes
2. Test console functionality thoroughly
3. Update console documentation in `console/README.md`
4. Ensure mol-console module is stable
5. Test both development and production builds

## Roadmap

Future enhancements planned:
- [ ] Additional PyMOL commands
- [ ] Command autocomplete
- [ ] Console UI improvements
- [ ] Save/load command scripts
- [ ] Multi-line command support
- [ ] Command aliases

## Support

- Issues: https://github.com/molstar/molstar/issues
- Documentation: https://molstar.org/docs
- Console commands: See `console/README.md`

## License

MIT - See LICENSE file for details

## Citation

When using smol, please cite Mol*:

Sehnal et al., *Nucleic Acids Research*, 2021; https://doi.org/10.1093/nar/gkab314
