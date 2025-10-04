/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Command parser for ChimeraX-style color commands
 */

export interface ParsedCommand {
    command: string;
    args: string[];
    options: Record<string, string | boolean>;
}

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
            if (token === 'targets') {
                // Handle comma-separated targets
                options[token] = value;
            } else if (token === 'transparency') {
                options[token] = value;
            } else if (token === 'palette') {
                options[token] = value;
            } else if (token === 'range') {
                options[token] = value;
            } else {
                options[token] = value;
            }
            i += 2;
        } else {
            args.push(token);
            i++;
        }
    }

    return { command, args, options };
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

    for (const arg of parsed.args) {
        if (schemes.includes(arg.toLowerCase())) {
            result.colorSpec = arg.toLowerCase();
        } else if (isColorName(arg) || isHexColor(arg)) {
            result.colorSpec = arg;
        } else if (isSelection(arg)) {
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
 * Check if a string looks like a color name (simple check)
 */
function isColorName(str: string): boolean {
    // Will be enhanced with actual color registry
    const basicColors = ['red', 'blue', 'green', 'yellow', 'white', 'black', 'orange', 'purple', 'pink', 'gray', 'grey', 'cyan', 'magenta', 'brown', 'skyblue', 'hotpink'];
    return basicColors.includes(str.toLowerCase());
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
