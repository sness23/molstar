/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author mol* contributors
 *
 * Viewer console - Bridge to mol-console module
 *
 * This file provides backward compatibility by re-exporting from mol-console
 */

// Re-export everything from mol-console
export * from '../../../mol-console';

// Re-export specific items for convenience
export { executeSimpleColor } from '../../../mol-console/commands/color';
export type { ColorCommandParams } from '../../../mol-console/commands/color';
export { SelectionLanguage, parseSelection, selectionToQuery, describeSelection } from '../../../mol-console/selection/language';
export { parseColorSpec } from '../../../mol-console/color/parser';
export { getColorByName } from '../../../mol-console/color/names';
export { parseCommand } from '../../../mol-console/command/parser';
