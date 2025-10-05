/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author mol* contributors
 *
 * Reset command - Reset camera view
 */

import { PluginContext } from '../../mol-plugin/context';
import { PluginCommands } from '../../mol-plugin/commands';

export interface ResetResult {
    success: boolean;
    message: string;
}

/**
 * Execute reset command to reset camera
 */
export async function executeReset(plugin: PluginContext): Promise<ResetResult> {
    try {
        await PluginCommands.Camera.Reset(plugin, {});
        return {
            success: true,
            message: 'Reset camera view'
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to reset camera: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}
