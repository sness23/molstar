/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author mol* contributors
 *
 * Close command - Clear all structures
 */

import { PluginContext } from '../../mol-plugin/context';

export interface CloseResult {
    success: boolean;
    message: string;
}

/**
 * Execute close command to clear all structures
 */
export async function executeClose(plugin: PluginContext): Promise<CloseResult> {
    try {
        await plugin.clear();
        return {
            success: true,
            message: 'Cleared all structures'
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to clear structures: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}
