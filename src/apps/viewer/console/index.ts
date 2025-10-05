/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author mol* contributors
 *
 * Viewer console - Bridge to mol-console module
 *
 * This file provides backward compatibility by re-exporting from mol-console.
 * All console functionality now lives in the mol-console module.
 */

// Re-export everything from mol-console
export * from '../../../mol-console';

// Specific re-exports for backward compatibility
export { executeSimpleColor } from '../../../mol-console/commands/color';
export type { ColorCommandParams, ColorResult } from '../../../mol-console/commands/color';
export { SelectionLanguage, parseSelection, selectionToQuery, describeSelection } from '../../../mol-console/selection/language';
export { parseColorSpec, isColorName, isHexColor } from '../../../mol-console/color/parser';
export { getColorByName } from '../../../mol-console/color/names';
export { parseCommand, parseColorCommand } from '../../../mol-console/command/parser';
export type { ParsedCommand, ColorCommand } from '../../../mol-console/command/parser';
