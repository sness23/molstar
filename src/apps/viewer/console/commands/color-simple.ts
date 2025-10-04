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
import { StructureSelection } from '../../../../mol-model/structure';
import { QueryContext } from '../../../../mol-model/structure/query/context';

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
    console.log('[executeSimpleColor] Called with command:', command);
    console.log('[executeSimpleColor] colorSpec:', command.colorSpec);
    console.log('[executeSimpleColor] selection:', command.selection);

    // Validate we have either a color spec or a scheme
    if (!command.colorSpec) {
        console.log('[executeSimpleColor] No color specified, returning error');
        return {
            success: false,
            message: 'No color specified'
        };
    }

    // Handle color schemes (byelement, bychain, etc.)
    const isScheme = isColorScheme(command.colorSpec);
    console.log('[executeSimpleColor] Is color scheme?', isScheme, 'colorSpec:', command.colorSpec);

    if (isScheme) {
        console.log('[executeSimpleColor] Delegating to executeColorScheme');
        return executeColorScheme(plugin, command);
    }

    // Parse the color
    const color = parseColorSpec(command.colorSpec);
    console.log('[executeSimpleColor] Parsed color:', color);
    if (color === undefined) {
        console.log('[executeSimpleColor] Unknown color, returning error');
        return {
            success: false,
            message: `Unknown color: ${command.colorSpec}`
        };
    }

    // Get the selection
    const selection = command.selection || 'all';
    console.log('[executeSimpleColor] Selection:', selection);
    const selectionSpec = parseSelection(selection);
    console.log('[executeSimpleColor] Selection spec:', selectionSpec);
    const selectionDesc = describeSelection(selectionSpec);
    console.log('[executeSimpleColor] Selection description:', selectionDesc);

    try {
        // Get structure hierarchy to access components properly
        console.log('[executeSimpleColor] Getting structure hierarchy...');
        const structureHierarchy = plugin.managers.structure.hierarchy.current;
        console.log('[executeSimpleColor] structureHierarchy:', structureHierarchy);
        console.log('[executeSimpleColor] structures in hierarchy:', structureHierarchy.structures);

        if (structureHierarchy.structures.length === 0) {
            console.log('[executeSimpleColor] No structures found');
            return {
                success: false,
                message: 'No structure loaded'
            };
        }

        let totalAtoms = 0;

        // Apply color to each structure
        console.log('[executeSimpleColor] Processing', structureHierarchy.structures.length, 'structures');
        for (const structureRef of structureHierarchy.structures) {
            console.log('[executeSimpleColor] Processing structureRef:', structureRef);
            const structure = structureRef.cell.obj?.data;
            console.log('[executeSimpleColor] structure data:', structure);
            if (!structure) {
                console.log('[executeSimpleColor] No structure data, skipping');
                continue;
            }

            console.log('[executeSimpleColor] Components:', structureRef.components);

            // Build MolQL query from selection
            const query = selectionToQuery(selectionSpec);
            console.log('[executeSimpleColor] Built query:', query);

            // Create a loci getter function as expected by setStructureOverpaint
            const lociGetter = async (s: any) => {
                console.log('[executeSimpleColor] lociGetter called with structure:', s);
                const selection = query(new QueryContext(s));
                console.log('[executeSimpleColor] Selection from query:', selection);
                const loci = StructureSelection.toLociWithSourceUnits(selection);
                console.log('[executeSimpleColor] lociGetter returning loci:', loci);
                return loci;
            };

            // Count atoms for the message
            const selection = query(new QueryContext(structure));
            console.log('[executeSimpleColor] Selection for counting:', selection);
            const loci = StructureSelection.toLociWithSourceUnits(selection);
            console.log('[executeSimpleColor] Loci for counting:', loci);

            if (loci.kind === 'empty-loci') {
                console.log('[executeSimpleColor] Empty loci, skipping');
                continue;
            }

            // Count atoms
            if (loci.kind === 'element-loci') {
                for (const element of loci.elements) {
                    totalAtoms += element.indices.length;
                }
            }
            console.log('[executeSimpleColor] Total atoms so far:', totalAtoms);

            // Use the actual structure components from hierarchy
            console.log('[executeSimpleColor] Calling setStructureOverpaint with', structureRef.components.length, 'components');
            await setStructureOverpaint(plugin, structureRef.components, color, lociGetter);
            console.log('[executeSimpleColor] setStructureOverpaint completed');
        }

        console.log('[executeSimpleColor] Success! Total atoms colored:', totalAtoms);
        return {
            success: true,
            message: `Colored ${totalAtoms} atoms in ${selectionDesc} to ${command.colorSpec}`,
            atomCount: totalAtoms
        };

    } catch (error) {
        console.error('[executeSimpleColor] Error occurred:', error);
        console.error('[executeSimpleColor] Error stack:', error instanceof Error ? error.stack : 'no stack');
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
        const representationQuery = StateSelection.Generators.rootsOfType(PSO.Molecule.Structure.Representation3D);
        console.log('[ColorScheme] representationQuery:', representationQuery);

        const queryResult = plugin.state.data.select(representationQuery);
        console.log('[ColorScheme] queryResult type:', typeof queryResult);
        console.log('[ColorScheme] queryResult:', queryResult);
        console.log('[ColorScheme] queryResult is iterable?', queryResult != null && typeof queryResult[Symbol.iterator] === 'function');

        const representations = Array.from(queryResult);
        console.log('[ColorScheme] representations array:', representations);
        console.log('[ColorScheme] representations.length:', representations.length);

        if (!representations || representations.length === 0) {
            return {
                success: false,
                message: 'No structure representations found. Load a structure first.'
            };
        }

        // Update color theme for each representation
        for (const repr of representations) {
            console.log('[ColorScheme] Processing repr:', repr);
            console.log('[ColorScheme] repr.transform:', repr?.transform);

            if (!repr || !repr.transform) {
                console.log('[ColorScheme] Skipping repr (no transform)');
                continue;
            }

            const update = plugin.state.data.build().to(repr.transform.ref);

            // Set the color theme
            update.update({
                ...repr.transform.params,
                colorTheme: { name: themeName }
            });

            await update.commit();
            console.log('[ColorScheme] Successfully updated repr with theme:', themeName);
        }

        return {
            success: true,
            message: `Applied ${scheme} coloring`
        };

    } catch (error) {
        console.error('[ColorScheme] Error occurred:', error);
        console.error('[ColorScheme] Error stack:', error instanceof Error ? error.stack : 'no stack');
        return {
            success: false,
            message: `Error: ${error instanceof Error ? error.message : error}`
        };
    }
}
