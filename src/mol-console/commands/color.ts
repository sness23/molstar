/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author mol* contributors
 *
 * Color command implementation
 */

import { PluginContext } from '../../mol-plugin/context';
import { parseColorSpec } from '../color/parser';
import { parseSelection, selectionToQuery } from '../selection/language';
import { setStructureOverpaint } from '../../mol-plugin-state/helpers/structure-overpaint';
import { StateSelection } from '../../mol-state';
import { PluginStateObject as PSO } from '../../mol-plugin-state/objects';
import { StructureSelection } from '../../mol-model/structure';
import { QueryContext } from '../../mol-model/structure/query/context';
import { ColorResult } from './types';
import { ConsoleColor } from '../color/types';

// Re-export ColorResult type
export type { ColorResult };

export interface ColorCommandParams {
    mode: 'simple' | 'scheme';
    colorSpec: string;
    selection?: string;
}

/**
 * Execute a simple color command
 */
export async function executeSimpleColor(
    plugin: PluginContext,
    command: ColorCommandParams
): Promise<ColorResult> {

    // Validate we have either a color spec or a scheme
    if (!command.colorSpec) {
        return {
            success: false,
            message: 'No color specified'
        };
    }

    // Handle color schemes (byelement, bychain, etc.)
    const isScheme = ConsoleColor.isColorScheme(command.colorSpec);

    if (isScheme) {
        return executeColorScheme(plugin, command);
    }

    // Parse the color
    const color = parseColorSpec(command.colorSpec);
    if (color === undefined) {
        return {
            success: false,
            message: `Unknown color: ${command.colorSpec}`
        };
    }

    // Get the selection
    const selection = command.selection || 'all';
    const selectionSpec = parseSelection(selection);

    try {
        // Get structure hierarchy to access components properly
        const structureHierarchy = plugin.managers.structure.hierarchy.current;

        if (structureHierarchy.structures.length === 0) {
            return {
                success: false,
                message: 'No structure loaded'
            };
        }

        let totalAtoms = 0;

        // Apply color to each structure
        for (const structureRef of structureHierarchy.structures) {
            const structure = structureRef.cell.obj?.data;
            if (!structure) {
                continue;
            }


            // Build MolQL query from selection
            const query = selectionToQuery(selectionSpec);

            // Create a loci getter function as expected by setStructureOverpaint
            const lociGetter = async (s: any) => {
                const selection = query(new QueryContext(s));
                const loci = StructureSelection.toLociWithSourceUnits(selection);
                return loci;
            };

            // Count atoms for the message - use root structure like setStructureOverpaint does
            let loci;
            try {
                const ctx = new QueryContext(structure.root);
                const selection = query(ctx);
                loci = StructureSelection.toLociWithSourceUnits(selection);
            } catch (err) {
                throw err;
            }

            // Count atoms
            if (loci.kind === 'element-loci') {
                for (const element of loci.elements) {
                    totalAtoms += element.indices.length;
                }
            }

            if (totalAtoms === 0) {
                continue;
            }

            // Use the actual structure components from hierarchy
            await setStructureOverpaint(plugin, structureRef.components, color, lociGetter);
        }

        return {
            success: true,
            message: '',
            atomCount: totalAtoms
        };

    } catch (error) {
        return {
            success: false,
            message: `Error: ${error}`
        };
    }
}


/**
 * Execute a color scheme (byelement, bychain, etc.)
 */
async function executeColorScheme(
    plugin: PluginContext,
    command: ColorCommandParams
): Promise<ColorResult> {
    const scheme = command.colorSpec!.toLowerCase();

    // Map schemes to Mol* color theme names
    const themeMap: Record<string, string> = {
        'byelement': 'element-symbol',
        'byatom': 'element-symbol',
        'bychain': 'chain-id',
        'byhet': 'molecule-type',
        'bymodel': 'model-index',
        'bypolymer': 'polymer-id',
        'byidentity': 'polymer-id',
    };

    const themeName = themeMap[scheme];
    if (!themeName) {
        return {
            success: false,
            message: `Color scheme '${scheme}' not yet implemented`
        };
    }

    try {
        // Get all structure representations
        const representationQuery = StateSelection.Generators.rootsOfType(PSO.Molecule.Structure.Representation3D);

        const queryResult = plugin.state.data.select(representationQuery);

        const representations = Array.from(queryResult);

        if (!representations || representations.length === 0) {
            return {
                success: false,
                message: 'No structure representations found. Load a structure first.'
            };
        }

        // Update color theme for each representation
        for (const repr of representations) {

            if (!repr || !repr.transform) {
                continue;
            }

            const update = plugin.state.data.build().to(repr.transform.ref);

            // Set the color theme
            update.update({
                ...repr.transform.params,
                colorTheme: { name: themeName }
            });

            await update.commit();
        }

        return {
            success: true,
            message: ''
        };

    } catch (error) {
        return {
            success: false,
            message: `Error: ${error instanceof Error ? error.message : error}`
        };
    }
}
