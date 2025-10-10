/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author mol* contributors
 *
 * Focus command - Focus camera on selection
 */

import { PluginContext } from '../../mol-plugin/context';
import { parseSelection, selectionToQuery } from '../selection/language';
import { QueryContext } from '../../mol-model/structure/query/context';
import { StructureSelection } from '../../mol-model/structure';
import { Loci } from '../../mol-model/loci';

export interface FocusCommandParams {
    selection?: string;
}

export interface FocusResult {
    success: boolean;
    message: string;
}

/**
 * Execute focus command to focus camera on selection
 */
export async function executeFocus(
    plugin: PluginContext,
    params: FocusCommandParams
): Promise<FocusResult> {
    const selection = params.selection || 'all';

    try {
        // Get structure hierarchy
        const structureHierarchy = plugin.managers.structure.hierarchy.current;

        if (structureHierarchy.structures.length === 0) {
            return {
                success: false,
                message: 'No structure loaded'
            };
        }

        // Parse selection
        const selectionSpec = parseSelection(selection);
        const query = selectionToQuery(selectionSpec);

        // Collect all loci from all structures
        const allLoci: Loci[] = [];

        for (const structureRef of structureHierarchy.structures) {
            const structure = structureRef.cell.obj?.data;
            if (!structure) continue;

            try {
                // Build loci from selection
                const ctx = new QueryContext(structure.root);
                const structureSelection = query(ctx);
                const loci = StructureSelection.toLociWithSourceUnits(structureSelection);

                if (loci.kind === 'element-loci' && loci.elements.length > 0) {
                    allLoci.push(loci);
                }
            } catch (err) {
                // Skip structures where query fails
                continue;
            }
        }

        if (allLoci.length === 0) {
            return {
                success: false,
                message: `No atoms found matching selection: ${selection}`
            };
        }

        // Focus on the combined loci
        if (allLoci.length === 1) {
            await plugin.managers.camera.focusLoci(allLoci[0]);
        } else {
            // For multiple loci, focus on all of them
            await plugin.managers.camera.focusLoci(allLoci[0]);
            for (let i = 1; i < allLoci.length; i++) {
                await plugin.managers.camera.focusLoci(allLoci[i], { extraRadius: 0 });
            }
        }

        return {
            success: true,
            message: selection === 'all' ? 'Focused on structure' : `Focused on ${selection}`
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to focus: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}
