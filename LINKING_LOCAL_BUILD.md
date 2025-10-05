# Linking Your Local Mol* Build to Other Projects

This guide shows how to use your custom Mol* build (with the PyMOL console) in your `ai0` project.

## Quick Start (Recommended)

### Option 1: Using npm link (Best for active development)

This creates a symlink so your ai0 project always uses your latest local build.

**Step 1: Build and link molstar**
```bash
# In ~/github/sness23/molstar
npm run build:lib
npm link
```

**Step 2: Link in your ai0 project**
```bash
# In ~/github/sness23/ai0
npm link molstar
```

**Step 3: Rebuild molstar when you make changes**
```bash
# In ~/github/sness23/molstar
# After making changes to mol-console or other code:
npm run build:lib

# Your ai0 project will automatically use the new build!
# Just restart your dev server or refresh the page
```

### Option 2: Using Local Path (One-time install)

If you don't need frequent updates:

```bash
# In ~/github/sness23/ai0
npm install ~/github/sness23/molstar
```

This copies the current state. You'll need to reinstall after changes.

### Option 3: Using npm pack (For testing specific versions)

Create a tarball to install:

```bash
# In ~/github/sness23/molstar
npm run build:lib
npm pack
# This creates molstar-5.0.0.tgz

# In ~/github/sness23/ai0
npm install ~/github/sness23/molstar/molstar-5.0.0.tgz
```

## Recommended Workflow for Active Development

Since you're actively developing the console, use **npm link**:

```bash
# Terminal 1: In molstar directory
cd ~/github/sness23/molstar

# Initial setup (once)
npm run build:lib
npm link

# Keep this terminal open for rebuilding
# When you make changes:
npm run build:lib

# OR use watch mode for auto-rebuild:
npm run watch
```

```bash
# Terminal 2: In ai0 directory
cd ~/github/sness23/ai0

# Initial setup (once)
npm link molstar

# Start your dev server
npm run dev
```

Now whenever you rebuild molstar, your ai0 project automatically uses the new version!

## Using mol-console in Your MolecularViewer.tsx

Once linked, you can import and use mol-console:

```tsx
// ~/github/sness23/ai0/src/components/MolecularViewer.tsx

import React, { useEffect, useRef, useState } from 'react';
import { createPluginUI } from 'molstar/lib/mol-plugin-ui/react18';
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { PluginContext } from 'molstar/lib/mol-plugin/context';

// Import your custom console!
import {
    executeSimpleColor,
    parseColorSpec,
    SelectionLanguage
} from 'molstar/lib/mol-console';

import 'molstar/lib/mol-plugin-ui/skin/light.scss';

export function MolecularViewer() {
    const parent = useRef<HTMLDivElement>(null);
    const plugin = useRef<PluginContext>();
    const [command, setCommand] = useState('');
    const [history, setHistory] = useState<string[]>([]);

    useEffect(() => {
        if (!parent.current) return;

        createPluginUI({
            target: parent.current,
            spec: DefaultPluginUISpec()
        }).then(p => {
            plugin.current = p;

            // Load a default structure
            p.loadStructureFromUrl(
                'https://files.rcsb.org/download/1cbs.cif',
                'mmcif'
            );
        });

        return () => plugin.current?.dispose();
    }, []);

    const handleCommand = async (cmd: string) => {
        if (!plugin.current || !cmd.trim()) return;

        try {
            // Parse the command
            if (cmd.startsWith('color ')) {
                const colorPart = cmd.substring(6).trim();

                // Execute color command using your mol-console
                const result = await executeSimpleColor(plugin.current, {
                    mode: 'simple',
                    colorSpec: colorPart,
                    selection: undefined
                });

                if (result.success) {
                    setHistory([...history, `✓ ${cmd}`]);
                } else {
                    setHistory([...history, `✗ ${cmd}: ${result.message}`]);
                }
            } else {
                setHistory([...history, `✗ Unknown command: ${cmd}`]);
            }
        } catch (error) {
            setHistory([...history, `✗ Error: ${error}`]);
        }

        setCommand('');
    };

    return (
        <div className="molecular-viewer">
            <div
                ref={parent}
                style={{ width: '100%', height: '600px' }}
            />

            {/* PyMOL-style console */}
            <div className="console">
                <div className="console-history">
                    {history.map((line, i) => (
                        <div key={i}>{line}</div>
                    ))}
                </div>
                <div className="console-input">
                    <span>PyMOL&gt; </span>
                    <input
                        type="text"
                        value={command}
                        onChange={e => setCommand(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                handleCommand(command);
                            }
                        }}
                        placeholder="Enter command (e.g., color red)"
                    />
                </div>
            </div>
        </div>
    );
}
```

## Advanced Usage: Using Selection Language Directly

```tsx
import { SelectionLanguage } from 'molstar/lib/mol-console';

// Parse selections
const spec = SelectionLanguage.parse('/A:10-20 & protein');
console.log(spec);
// { chains: ['A'], residues: [{ start: 10, end: 20 }], protein: true }

// Get description
const desc = SelectionLanguage.describe(spec);
console.log(desc);
// "chain A residue 10-20 protein"

// Convert to MolQL query
const query = SelectionLanguage.toQuery(spec);
// Use query with structure...
```

## Troubleshooting

### Issue: "Cannot find module 'molstar'"

**Solution:** Make sure you've linked correctly:
```bash
# In molstar directory
npm link

# In ai0 directory
npm link molstar

# Verify the link
ls -la node_modules/molstar
# Should show a symlink to your local molstar
```

### Issue: "Module not found: Can't resolve 'molstar/lib/mol-console'"

**Solution:** Rebuild the library:
```bash
cd ~/github/sness23/molstar
npm run build:lib
```

The `lib/` directory must exist for imports to work.

### Issue: Changes not appearing in ai0

**Solution:**
1. Make sure you rebuilt molstar: `npm run build:lib`
2. Restart your ai0 dev server
3. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: TypeScript errors about missing types

**Solution:** Make sure TypeScript can find the types:

```json
// In ai0/tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "paths": {
      "molstar/*": ["./node_modules/molstar/lib/*"]
    }
  }
}
```

### Issue: Build errors in ai0

If you get webpack/vite build errors:

1. **Clear build cache:**
   ```bash
   # In ai0
   rm -rf node_modules/.vite  # for Vite
   rm -rf node_modules/.cache # for webpack
   ```

2. **Reinstall:**
   ```bash
   npm unlink molstar
   npm link molstar
   ```

## Verifying the Link

Check if the link is working:

```bash
# In ai0 directory
ls -la node_modules/molstar

# Should show:
# lrwxrwxrwx ... node_modules/molstar -> /home/sness/github/sness23/molstar
```

Or in Node:
```bash
node -p "require('molstar/package.json').version"
# Should show: 5.0.0 (or your version)
```

## Development Workflow

Here's the recommended workflow:

```bash
# Terminal 1: Molstar - Watch mode (auto-rebuild on changes)
cd ~/github/sness23/molstar
npm run watch

# Terminal 2: AI0 - Dev server
cd ~/github/sness23/ai0
npm run dev
```

Now:
1. Edit molstar code (e.g., `src/mol-console/commands/color.ts`)
2. Watch terminal 1 - build happens automatically
3. Refresh browser in terminal 2 - see changes!

## Unlinking (When Done)

To remove the link and go back to npm molstar:

```bash
# In ai0 directory
npm unlink molstar
npm install molstar@latest
```

## Alternative: Git Submodules (Advanced)

If you want ai0 to always use your molstar fork:

```bash
# In ai0 directory
git submodule add https://github.com/sness23/molstar.git vendor/molstar

# Then use:
npm install ./vendor/molstar
```

## Summary

**For active development (RECOMMENDED):**
```bash
# Setup (once)
cd ~/github/sness23/molstar && npm run build:lib && npm link
cd ~/github/sness23/ai0 && npm link molstar

# Development loop:
# 1. Edit molstar code
# 2. Run: npm run build:lib (or npm run watch)
# 3. Refresh browser
```

**For one-time use:**
```bash
cd ~/github/sness23/ai0
npm install ~/github/sness23/molstar
```

That's it! Your ai0 project now uses your custom molstar with the PyMOL console! 🎉
