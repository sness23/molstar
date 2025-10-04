/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author mol* contributors
 *
 * Command parser for console commands
 */

import { ParsedCommand } from './types';

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
