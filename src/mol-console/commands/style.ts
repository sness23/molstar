/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author mol* contributors
 *
 * Style command - Change representation style
 */

import { PluginContext } from '../../mol-plugin/context';
import { StateSelection } from '../../mol-state';
import { PluginStateObject as PSO } from '../../mol-plugin-state/objects';

export interface StyleCommandParams {
    style: string;
    selection?: string;
}

export interface StyleResult {
    success: boolean;
    message: string;
}

// Map command style names to Mol* representation types
const STYLE_MAP: Record<string, string> = {
    'cartoon': 'cartoon',
    'spacefill': 'spacefill',
    'ball-and-stick': 'ball-and-stick',
    'sticks': 'ball-and-stick',  // Alias
    'lines': 'line',
    'surface': 'molecular-surface',
    'ribbons': 'cartoon',  // Alias for cartoon
};

/**
 * Execute style command to change representation
 *
 * For now, this changes the representation type for ALL structures.
 * Selection-based styling would require creating new components, which is more complex.
 */
export async function executeStyle(
    plugin: PluginContext,
    params: StyleCommandParams
): Promise<StyleResult> {
    const { style, selection = 'all' } = params;

    // Validate style
    const molstarType = STYLE_MAP[style];
    if (!molstarType) {
        const validStyles = Object.keys(STYLE_MAP).join(', ');
        return {
            success: false,
            message: `Invalid style '${style}'. Valid styles: ${validStyles}`
        };
    }

    // For now, selection is ignored - we change all representations
    if (selection !== 'all') {
        return {
            success: false,
            message: 'Selection-based styling is not yet implemented. Use "style <style>" to apply to all structures.'
        };
    }

    try {
        // Get structure hierarchy
        const structureHierarchy = plugin.managers.structure.hierarchy.current;

        if (structureHierarchy.structures.length === 0) {
            return {
                success: false,
                message: 'No structure loaded. Load a structure first.'
            };
        }

        // Get all structure representations
        const representationQuery = StateSelection.Generators.rootsOfType(PSO.Molecule.Structure.Representation3D);
        const representations = Array.from(plugin.state.data.select(representationQuery));

        if (!representations || representations.length === 0) {
            return {
                success: false,
                message: 'No structure representations found. Load a structure first.'
            };
        }

        // Update representation type for each representation
        for (const repr of representations) {
            if (!repr || !repr.transform) continue;

            const update = plugin.state.data.build().to(repr.transform.ref);

            // Update the representation type
            update.update({
                ...repr.transform.params,
                type: { name: molstarType }
            });

            await update.commit();
        }

        return {
            success: true,
            message: `Applied ${style} style to all structures`
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to apply style: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}
