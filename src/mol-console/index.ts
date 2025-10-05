/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author mol* contributors
 *
 * mol-console: A PyMOL/ChimeraX-style command console for Mol*
 */

export * from './command';
export * from './selection';
export * from './color';
export * from './commands';
export * from './ui';

// Convenience re-exports
export { CommandRegistry } from './command/registry';
export { SelectionLanguage } from './selection/language';
export { parseCommand, parseColorCommand } from './command/parser';
export type { ParsedCommand, ColorCommand } from './command/parser';
export { executeSimpleColor, colorCommandToParams } from './commands/color';
export type { ColorCommandParams, ColorResult } from './commands/color';
export { parseColorSpec, isColorName, isHexColor } from './color/parser';
export { getColorByName } from './color/names';
