/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author mol* contributors
 *
 * Command parser for console commands
 */

import { ParsedCommand } from './types';
import { isColorName as checkColorName } from '../color/names';

// Re-export ParsedCommand for convenience
export type { ParsedCommand };

/**
 * Parse a command string into command, args, and options
 */
export function parseCommand(input: string): ParsedCommand {
    const tokens = tokenize(input);
    if (tokens.length === 0) {
        return { command: '', args: [], options: {} };
    }

    const command = tokens[0];
    const args: string[] = [];
    const options: Record<string, string | boolean> = {};

    let i = 1;
    while (i < tokens.length) {
        const token = tokens[i];

        // Check if it's an option (starts with keyword like 'targets', 'transparency', etc.)
        if (isOptionKeyword(token) && i + 1 < tokens.length) {
            const value = tokens[i + 1];
            options[token] = value;
            i += 2;
        } else {
            args.push(token);
            i++;
        }
    }

    return { command, args, options };
}

/**
 * Tokenize input string, respecting quotes
 */
function tokenize(input: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inQuote = false;

    for (let i = 0; i < input.length; i++) {
        const char = input[i];

        if (char === '"' || char === "'") {
            inQuote = !inQuote;
        } else if (char === ' ' && !inQuote) {
            if (current) {
                tokens.push(current);
                current = '';
            }
        } else {
            current += char;
        }
    }

    if (current) {
        tokens.push(current);
    }

    return tokens;
}

/**
 * Check if a token is an option keyword
 */
function isOptionKeyword(token: string): boolean {
    const keywords = ['targets', 'transparency', 'palette', 'range', 'average'];
    return keywords.includes(token.toLowerCase());
}

/**
 * Color command interface
 */
export interface ColorCommand {
    mode: 'simple' | 'rainbow' | 'byattribute' | 'unknown';
    colorSpec?: string;
    selection?: string;
    targets?: string[];
    transparency?: number;
    palette?: string;
    attribute?: string;
    range?: { low?: number; high?: number };
}

/**
 * Parse a color command specifically
 */
export function parseColorCommand(input: string): ColorCommand {
    const parsed = parseCommand(input);

    if (parsed.command !== 'color') {
        return { mode: 'unknown' };
    }

    const result: ColorCommand = {
        mode: 'simple'
    };

    // Determine mode
    if (parsed.args.includes('rainbow') || parsed.args.includes('seq') || parsed.args.includes('sequential')) {
        result.mode = 'rainbow';
    } else if (parsed.args.includes('byattribute') || parsed.args.includes('attribute')) {
        result.mode = 'byattribute';
    }

    // Extract color spec and selection
    // Try to identify what's a color, what's a selection, what's a scheme
    const schemes = ['byelement', 'byatom', 'byhet', 'bychain', 'bynucleotide', 'bymodel', 'byidentity', 'bypolymer', 'random'];
    const moleculeTypes = ['protein', 'nucleic', 'ligand', 'water'];
    const secondaryStructure = ['helix', 'sheet', 'coil'];

    // Combine selection parts that are separated by &
    const combinedArgs: string[] = [];
    let currentSelection = '';

    for (let i = 0; i < parsed.args.length; i++) {
        const arg = parsed.args[i];

        // Check if this is part of a selection
        if (isSelection(arg) || arg === '&' || moleculeTypes.includes(arg.toLowerCase()) || secondaryStructure.includes(arg.toLowerCase())) {
            if (currentSelection) {
                currentSelection += ' ' + arg;
            } else {
                currentSelection = arg;
            }

            // Look ahead to see if next token is also selection-related
            const nextArg = i + 1 < parsed.args.length ? parsed.args[i + 1] : null;
            if (!nextArg || (!isSelection(nextArg) && nextArg !== '&' && !moleculeTypes.includes(nextArg.toLowerCase()) && !secondaryStructure.includes(nextArg.toLowerCase()))) {
                // End of selection
                combinedArgs.push(currentSelection);
                currentSelection = '';
            }
        } else {
            if (currentSelection) {
                combinedArgs.push(currentSelection);
                currentSelection = '';
            }
            combinedArgs.push(arg);
        }
    }

    if (currentSelection) {
        combinedArgs.push(currentSelection);
    }

    for (const arg of combinedArgs) {
        if (schemes.includes(arg.toLowerCase())) {
            result.colorSpec = arg.toLowerCase();
        } else if (isColorName(arg) || isHexColor(arg)) {
            result.colorSpec = arg;
        } else if (isSelection(arg) || moleculeTypes.includes(arg.toLowerCase()) || secondaryStructure.includes(arg.toLowerCase())) {
            result.selection = arg;
        } else if (arg === 'rainbow' || arg === 'seq' || arg === 'sequential') {
            // Already handled in mode detection
        } else if (arg === 'byattribute' || arg === 'attribute') {
            // Already handled in mode detection
        } else if (result.mode === 'byattribute' && !result.attribute) {
            // After 'byattribute', next arg is the attribute name
            result.attribute = arg;
        }
    }

    // Parse options
    if (parsed.options.targets) {
        const targetStr = parsed.options.targets as string;
        result.targets = targetStr.split(',').map(t => t.trim());
    }

    if (parsed.options.transparency) {
        result.transparency = parseFloat(parsed.options.transparency as string);
    }

    if (parsed.options.palette) {
        result.palette = parsed.options.palette as string;
    }

    if (parsed.options.range) {
        const rangeStr = parsed.options.range as string;
        const parts = rangeStr.split(',');
        result.range = {};
        if (parts.length === 2) {
            result.range.low = parseFloat(parts[0]);
            result.range.high = parseFloat(parts[1]);
        }
    }

    return result;
}

/**
 * Check if a string looks like a color name (simple check)
 */
function isColorName(str: string): boolean {
    return checkColorName(str);
}

/**
 * Check if a string is a hex color
 */
function isHexColor(str: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(str) || /^#[0-9A-Fa-f]{3}$/.test(str);
}

/**
 * Check if a string looks like a selection
 */
function isSelection(str: string): boolean {
    // Selections start with /, :, # or contain &
    return str.startsWith('/') || str.startsWith(':') || str.startsWith('#') || str.includes('&');
}
