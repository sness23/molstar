/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Color name registry for ChimeraX-style color commands
 */

import { Color } from '../../../mol-util/color';

export interface ColorRegistry {
    readonly builtIn: ReadonlyMap<string, Color>;
    custom: Map<string, Color>;
}

/**
 * Built-in color names (subset of ChimeraX colors)
 */
const BUILTIN_COLORS: Record<string, Color> = {
    // Basic colors
    'white': Color.fromRgb(255, 255, 255),
    'black': Color.fromRgb(0, 0, 0),
    'red': Color.fromRgb(255, 0, 0),
    'green': Color.fromRgb(0, 255, 0),
    'blue': Color.fromRgb(0, 0, 255),
    'yellow': Color.fromRgb(255, 255, 0),
    'cyan': Color.fromRgb(0, 255, 255),
    'magenta': Color.fromRgb(255, 0, 255),
    'orange': Color.fromRgb(255, 165, 0),
    'purple': Color.fromRgb(128, 0, 128),
    'pink': Color.fromRgb(255, 192, 203),
    'brown': Color.fromRgb(165, 42, 42),
    'gray': Color.fromRgb(128, 128, 128),
    'grey': Color.fromRgb(128, 128, 128),

    // Extended colors
    'skyblue': Color.fromRgb(135, 206, 235),
    'hotpink': Color.fromRgb(255, 105, 180),
    'lime': Color.fromRgb(0, 255, 0),
    'navy': Color.fromRgb(0, 0, 128),
    'olive': Color.fromRgb(128, 128, 0),
    'teal': Color.fromRgb(0, 128, 128),
    'maroon': Color.fromRgb(128, 0, 0),
    'aqua': Color.fromRgb(0, 255, 255),
    'silver': Color.fromRgb(192, 192, 192),
    'gold': Color.fromRgb(255, 215, 0),
    'coral': Color.fromRgb(255, 127, 80),
    'salmon': Color.fromRgb(250, 128, 114),
    'khaki': Color.fromRgb(240, 230, 140),
    'orchid': Color.fromRgb(218, 112, 214),
    'plum': Color.fromRgb(221, 160, 221),
    'tan': Color.fromRgb(210, 180, 140),
    'wheat': Color.fromRgb(245, 222, 179),

    // Molecule-relevant colors
    'cornflowerblue': Color.fromRgb(100, 149, 237),
    'forestgreen': Color.fromRgb(34, 139, 34),
    'firebrick': Color.fromRgb(178, 34, 34),
    'goldenrod': Color.fromRgb(218, 165, 32),
    'dodgerblue': Color.fromRgb(30, 144, 255),
    'mediumblue': Color.fromRgb(0, 0, 205),
    'darkgreen': Color.fromRgb(0, 100, 0),
    'darkred': Color.fromRgb(139, 0, 0),
    'lightblue': Color.fromRgb(173, 216, 230),
    'lightgreen': Color.fromRgb(144, 238, 144),
};

/**
 * Global color registry
 */
export const ColorNames: ColorRegistry = {
    builtIn: new Map(Object.entries(BUILTIN_COLORS)),
    custom: new Map(),
};

/**
 * Get a color by name
 */
export function getColorByName(name: string): Color | undefined {
    const lowerName = name.toLowerCase();
    return ColorNames.custom.get(lowerName) || ColorNames.builtIn.get(lowerName);
}

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
function parseHexColor(hex: string): Color | undefined {
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
function parseRgbColor(rgb: string): Color | undefined {
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
 * Add a custom color name
 */
export function defineCustomColor(name: string, color: Color): void {
    ColorNames.custom.set(name.toLowerCase(), color);
}

/**
 * Remove a custom color name
 */
export function deleteCustomColor(name: string): boolean {
    return ColorNames.custom.delete(name.toLowerCase());
}

/**
 * List all color names
 */
export function listColorNames(filter: 'all' | 'builtin' | 'custom' = 'all'): string[] {
    const names: string[] = [];

    if (filter === 'all' || filter === 'builtin') {
        names.push(...Array.from(ColorNames.builtIn.keys()));
    }

    if (filter === 'all' || filter === 'custom') {
        names.push(...Array.from(ColorNames.custom.keys()));
    }

    return names.sort();
}
