/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author mol* contributors
 *
 * Color parser
 */

import { Color } from '../../mol-util/color';
import { getColorByName, isColorName } from './names';

/**
 * Parse a color specification (name, hex, or rgb)
 */
export function parseColorSpec(spec: string): Color | undefined {
    // Try name lookup
    const namedColor = getColorByName(spec);
    if (namedColor !== undefined) {
        return namedColor;
    }

    // Try hex color
    if (spec.startsWith('#')) {
        return parseHexColor(spec);
    }

    // Try rgb() format
    if (spec.startsWith('rgb(') && spec.endsWith(')')) {
        return parseRgbColor(spec);
    }

    return undefined;
}

/**
 * Parse hex color (#RRGGBB or #RGB)
 */
export function parseHexColor(hex: string): Color | undefined {
    let cleanHex = hex.slice(1); // Remove #

    // Expand short form (#RGB -> #RRGGBB)
    if (cleanHex.length === 3) {
        cleanHex = cleanHex.split('').map(c => c + c).join('');
    }

    if (cleanHex.length !== 6) {
        return undefined;
    }

    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);

    if (isNaN(r) || isNaN(g) || isNaN(b)) {
        return undefined;
    }

    return Color.fromRgb(r, g, b);
}

/**
 * Parse rgb(r, g, b) format
 */
export function parseRgbColor(rgb: string): Color | undefined {
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) {
        return undefined;
    }

    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);

    if (isNaN(r) || isNaN(g) || isNaN(b)) {
        return undefined;
    }

    return Color.fromRgb(r, g, b);
}

/**
 * Check if a string is a hex color
 */
export function isHexColor(str: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(str) || /^#[0-9A-Fa-f]{3}$/.test(str);
}

// Re-export for convenience
export { isColorName, getColorByName };
