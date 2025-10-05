/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author mol* contributors
 *
 * Load command - Load PDB structures
 */

import { PluginContext } from '../../mol-plugin/context';
import { Asset } from '../../mol-util/assets';

export interface LoadCommandParams {
    pdbId: string;
}

export interface LoadResult {
    success: boolean;
    message: string;
    pdbId?: string;
}

/**
 * Execute load command to download and display a PDB structure
 */
export async function executeLoad(
    plugin: PluginContext,
    params: LoadCommandParams
): Promise<LoadResult> {
    const { pdbId } = params;

    if (!pdbId || pdbId.trim() === '') {
        return {
            success: false,
            message: 'No PDB ID specified'
        };
    }

    try {
        const url = `https://files.rcsb.org/download/${pdbId}.pdb`;

        // Download and parse structure
        const data = await plugin.builders.data.download(
            { url: Asset.Url(url) },
            { state: { isGhost: true } }
        );

        const trajectory = await plugin.builders.structure.parseTrajectory(data, 'pdb');

        await plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default');

        return {
            success: true,
            message: `Loaded ${pdbId.toUpperCase()}`,
            pdbId: pdbId.toUpperCase()
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to load ${pdbId}: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}
