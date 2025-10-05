/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author mol* contributors
 *
 * Style command - Change representation style
 */

import { PluginContext } from '../../mol-plugin/context';

export interface StyleCommandParams {
    style: string;
}

export interface StyleResult {
    success: boolean;
    message: string;
}

/**
 * Execute style command to change representation
 */
export async function executeStyle(
    plugin: PluginContext,
    params: StyleCommandParams
): Promise<StyleResult> {
    const { style } = params;

    const validStyles = ['cartoon', 'ball-and-stick', 'spacefill'];

    if (!validStyles.includes(style)) {
        return {
            success: false,
            message: `Invalid style '${style}'. Valid styles: ${validStyles.join(', ')}`
        };
    }

    try {
        // Get current trajectory/structure
        const trajectory = plugin.state.data.select('1.1')[0];

        if (!trajectory) {
            return {
                success: false,
                message: 'No structure loaded. Load a structure first.'
            };
        }

        // Apply representation
        await plugin.builders.structure.representation.addRepresentation(trajectory.transform.ref, {
            type: style as 'cartoon' | 'ball-and-stick' | 'spacefill',
            params: {}
        });

        return {
            success: true,
            message: `Applied ${style} representation`
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to apply style: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}
