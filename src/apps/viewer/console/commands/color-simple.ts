/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Simple color command implementation
 */

import { PluginContext } from '../../../../mol-plugin/context';
import { Color } from '../../../../mol-util/color';
import { ColorCommand } from '../command-parser';
import { parseColorSpec } from '../color-names';
import { parseSelection, selectionToQuery, describeSelection } from '../selection-translator';
import { ColorTheme } from '../../../../mol-theme/color';
import { setStructureOverpaint, StructureComponentRef } from '../../../../mol-plugin-state/helpers/structure-overpaint';
import { StateSelection } from '../../../../mol-state';
import { PluginStateObject as PSO } from '../../../../mol-plugin-state/objects';

export interface SimpleColorResult {
    success: boolean;
    message: string;
    atomCount?: number;
}

/**
 * Execute a simple color command
 */
export async function executeSimpleColor(
    plugin: PluginContext,
    command: ColorCommand
): Promise<SimpleColorResult> {
    // Validate we have either a color spec or a scheme
    if (!command.colorSpec) {
        return {
            success: false,
            message: 'No color specified'
        };
    }

    // Handle color schemes (byelement, bychain, etc.)
    if (isColorScheme(command.colorSpec)) {
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
    const selectionDesc = describeSelection(selectionSpec);

    try {
        // Get all structure components
        const structures = plugin.state.data.select(StateSelection.Generators.rootsOfType(PSO.Molecule.Structure));

        if (structures.length === 0) {
            return {
                success: false,
                message: 'No structure loaded'
            };
        }

        let totalAtoms = 0;

        // Apply color to each structure
        for (const structureRef of structures) {
            const structure = structureRef.obj?.data;
            if (!structure) continue;

            // Build MolQL query from selection
            const query = selectionToQuery(selectionSpec);
            const loci = query(structure);

            if (loci.kind === 'empty-loci') continue;

            // Count atoms
            if (loci.kind === 'element-loci') {
                for (const element of loci.elements) {
                    totalAtoms += element.indices.length;
                }
            }

            // Apply overpaint to selected atoms
            const components: StructureComponentRef[] = [{
                key: structureRef.transform.ref,
                label: 'structure'
            }];

            await setStructureOverpaint(plugin, components, color, loci);
        }

        return {
            success: true,
            message: `Colored ${totalAtoms} atoms in ${selectionDesc} to ${command.colorSpec}`,
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
 * Check if a color spec is actually a scheme name
 */
function isColorScheme(spec: string): boolean {
    const schemes = [
        'byelement', 'byatom',
        'byhet',
        'bychain',
        'bynucleotide',
        'bymodel',
        'byidentity', 'bypolymer',
        'random'
    ];
    return schemes.includes(spec.toLowerCase());
}

/**
 * Execute a color scheme (byelement, bychain, etc.)
 */
async function executeColorScheme(
    plugin: PluginContext,
    command: ColorCommand
): Promise<SimpleColorResult> {
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
        const representations = plugin.state.data.select(StateSelection.Generators.rootsOfType(PSO.Molecule.Structure.Representation3D));

        if (representations.length === 0) {
            return {
                success: false,
                message: 'No structure representations found'
            };
        }

        // Update color theme for each representation
        for (const repr of representations) {
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
            message: `Applied ${scheme} coloring`
        };

    } catch (error) {
        return {
            success: false,
            message: `Error: ${error}`
        };
    }
}
