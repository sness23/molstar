# Packaging Your Custom Mol* Viewer for Use in Other Projects

This guide explains how to build, package, and use your customized Mol* viewer (with your PyMOL console additions) in other JavaScript/TypeScript projects instead of using the standard `molstar` npm package.

## Overview

There are several approaches to using your custom Mol* build:

1. **Build as an npm package** - Package your fork as a local or private npm package
2. **Use npm link** - Link your local development version for testing
3. **Build and bundle** - Create standalone bundles to include in other projects
4. **Publish to npm** - Publish your fork under a different name

## Option 1: Build as a Local npm Package (Recommended for Development)

### Step 1: Build the Library

```bash
# In your molstar directory
npm install
npm run build:lib
```

This builds the library in dual format:
- ESM modules: `lib/`
- CommonJS modules: `lib/commonjs/`

### Step 2: Create a Package

The `package.json` already defines the package structure. Key fields:

```json
{
  "name": "molstar",
  "version": "5.0.0",
  "main": "lib/commonjs/index.js",
  "module": "lib/index.js",
  "types": "lib/index.d.ts",
  "exports": {
    ".": {
      "import": "./lib/index.js",
      "require": "./lib/commonjs/index.js"
    }
  }
}
```

### Step 3: Use in Another Project

**Option A: npm link (for active development)**

```bash
# In your molstar directory
npm link

# In your other project
npm link molstar
```

Now your other project uses your local molstar build. Any changes you make require rebuilding:

```bash
# In molstar directory after making changes
npm run build:lib
```

**Option B: Install from local path**

```bash
# In your other project
npm install /path/to/your/molstar
```

**Option C: Install from tarball**

```bash
# In your molstar directory
npm pack
# This creates molstar-5.0.0.tgz

# In your other project
npm install /path/to/molstar-5.0.0.tgz
```

## Option 2: Publish Under a Different Name

If you want to publish your customized version to npm:

### Step 1: Update package.json

```json
{
  "name": "@yourname/molstar-pymol",
  "version": "1.0.0",
  "description": "Mol* viewer with PyMOL console integration",
  "author": "Your Name",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourname/molstar"
  }
}
```

### Step 2: Build and Publish

```bash
npm run build:lib
npm publish --access public
```

### Step 3: Use in Other Projects

```bash
npm install @yourname/molstar-pymol
```

## Option 3: Bundle for Direct Browser Use

If you want to create standalone bundles for direct browser inclusion:

### Build the Viewer App

```bash
npm run build:apps
```

This creates bundled files in `build/viewer/`:
- `molstar.js` - The complete viewer bundle
- `index.html` - HTML wrapper

### Use in Your Project

**Simple Integration:**

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>Custom Mol* Viewer</title>
    <link rel="stylesheet" type="text/css" href="path/to/build/viewer/molstar.css" />
</head>
<body>
    <div id="app"></div>
    <script src="path/to/build/viewer/molstar.js"></script>
    <script>
        // The viewer is now available globally
        molstar.Viewer.create('app').then(viewer => {
            viewer.loadStructureFromUrl('/path/to/structure.pdb', 'pdb');
        });
    </script>
</body>
</html>
```

## Option 4: Using as a Module in Modern Projects

### In React/Next.js/Vite Projects

```bash
# Install your local package
npm install /path/to/your/molstar
```

**React Component Example:**

```tsx
import React, { useEffect, useRef } from 'react';
import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { createPluginUI } from 'molstar/lib/mol-plugin-ui/react18';
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import 'molstar/lib/mol-plugin-ui/skin/light.scss';

export function MolstarViewer() {
    const parent = useRef<HTMLDivElement>(null);
    const plugin = useRef<PluginContext>();

    useEffect(() => {
        if (!parent.current) return;

        createPluginUI({
            target: parent.current,
            spec: DefaultPluginUISpec()
        }).then(p => {
            plugin.current = p;

            // Load a structure
            p.loadStructureFromUrl('/1cbs.cif', 'mmcif');
        });

        return () => {
            plugin.current?.dispose();
        };
    }, []);

    return <div ref={parent} style={{ width: '100%', height: '600px' }} />;
}
```

**Using Your Custom PyMOL Console:**

```tsx
import { executeSimpleColor } from 'molstar/lib/mol-app/viewer/console/commands/color-simple';
import { parseColorCommand } from 'molstar/lib/mol-app/viewer/console/command-parser';

// In your component
function handlePyMOLCommand(plugin: PluginContext, command: string) {
    const parsed = parseColorCommand(command);
    if (parsed.mode === 'simple') {
        executeSimpleColor(plugin, parsed).then(result => {
            if (!result.success) {
                console.error(result.message);
            }
        });
    }
}
```

## Development Workflow

### Making Changes to Your Custom Viewer

1. **Make your changes** to the source code (e.g., in `src/apps/viewer/console/`)

2. **Test with the dev server:**
   ```bash
   npm run dev:viewer
   # View at http://localhost:1338/build/viewer
   ```

3. **Build the library when ready:**
   ```bash
   npm run build:lib
   ```

4. **If using npm link, your linked projects will use the new build automatically**

5. **For production builds:**
   ```bash
   npm run rebuild  # Clean rebuild
   npm run build    # Build everything
   ```

### Versioning Your Custom Build

Update `package.json` version when you make significant changes:

```json
{
  "version": "5.0.1-custom.1"
}
```

This helps track which version of your customizations you're using.

## Import Paths Reference

After installing your custom molstar, you can import from:

```typescript
// Core plugin
import { PluginContext } from 'molstar/lib/mol-plugin/context';

// UI components
import { createPluginUI } from 'molstar/lib/mol-plugin-ui/react18';
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';

// Your custom PyMOL console exports
import {
    parseColorCommand,
    executeSimpleColor,
    parseColorSpec,
    parseSelection
} from 'molstar/lib/apps/viewer/console';

// Structure utilities
import { Structure } from 'molstar/lib/mol-model/structure';

// State management
import { StateBuilder } from 'molstar/lib/mol-state';
```

## Troubleshooting

### "Cannot find module 'molstar'"

Make sure you've built the library:
```bash
npm run build:lib
```

### Type definitions not found

Ensure TypeScript can find the types:

```json
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "paths": {
      "molstar/*": ["node_modules/molstar/lib/*"]
    }
  }
}
```

### Build errors in your project

If you get build errors related to missing files:

1. Check that you've run `npm run build:lib` in molstar
2. Verify `lib/` directory exists in molstar
3. Try `npm rebuild` in your project

### Styles not loading

Import the CSS:

```typescript
import 'molstar/lib/mol-plugin-ui/skin/light.scss';
// or
import 'molstar/lib/mol-plugin-ui/skin/dark.scss';
```

For plain CSS (no Sass):
```html
<link rel="stylesheet" href="node_modules/molstar/build/viewer/molstar.css" />
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build Custom Molstar

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Build library
        run: npm run build:lib

      - name: Create package
        run: npm pack

      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: molstar-package
          path: '*.tgz'
```

## Best Practices

1. **Keep your fork in sync** with upstream Mol* to get bug fixes:
   ```bash
   git remote add upstream https://github.com/molstar/molstar.git
   git fetch upstream
   git merge upstream/master
   ```

2. **Document your customizations** in a CHANGES.md file

3. **Use feature branches** for new features

4. **Version your builds** appropriately

5. **Test before publishing** your package

6. **Consider contributing** your PyMOL console back to upstream Mol*!

## Example: Complete Integration

Here's a complete example of using your custom molstar in a Vite + React project:

```bash
# Setup
npm create vite@latest my-viewer -- --template react-ts
cd my-viewer
npm install
npm install /path/to/your/molstar
```

**src/App.tsx:**

```tsx
import { useEffect, useRef, useState } from 'react';
import { createPluginUI } from 'molstar/lib/mol-plugin-ui/react18';
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { executeSimpleColor } from 'molstar/lib/apps/viewer/console';
import { parseColorCommand } from 'molstar/lib/apps/viewer/console';
import 'molstar/lib/mol-plugin-ui/skin/light.scss';
import './App.css';

function App() {
  const parent = useRef<HTMLDivElement>(null);
  const plugin = useRef<PluginContext>();
  const [command, setCommand] = useState('');

  useEffect(() => {
    if (!parent.current) return;

    createPluginUI({
      target: parent.current,
      spec: DefaultPluginUISpec()
    }).then(p => {
      plugin.current = p;
      p.loadStructureFromUrl(
        'https://files.rcsb.org/download/1cbs.cif',
        'mmcif'
      );
    });

    return () => plugin.current?.dispose();
  }, []);

  const handleCommand = async () => {
    if (!plugin.current) return;

    const parsed = parseColorCommand(`color ${command}`);
    if (parsed.mode === 'simple') {
      const result = await executeSimpleColor(plugin.current, parsed);
      if (!result.success) {
        alert(result.message);
      }
    }
  };

  return (
    <div className="App">
      <div ref={parent} style={{ width: '100%', height: '600px' }} />
      <div style={{ padding: '10px' }}>
        <input
          type="text"
          value={command}
          onChange={e => setCommand(e.target.value)}
          placeholder="e.g., /A:10-20 & protein green"
          style={{ width: '300px', marginRight: '10px' }}
        />
        <button onClick={handleCommand}>Execute</button>
      </div>
    </div>
  );
}

export default App;
```

That's it! You now have your custom Mol* with PyMOL console running in a React app.
