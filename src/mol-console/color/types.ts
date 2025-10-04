/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author mol* contributors
 *
 * Color types for console commands
 */

export namespace ConsoleColor {
    export type Spec =
        | { kind: 'name', name: string }
        | { kind: 'hex', hex: string }
        | { kind: 'rgb', r: number, g: number, b: number }
        | { kind: 'scheme', scheme: ColorSchemeName };

    export type ColorSchemeName =
        | 'byelement' | 'byatom'
        | 'bychain'
        | 'byhet'
        | 'bynucleotide'
        | 'bymodel'
        | 'byidentity' | 'bypolymer'
        | 'random';

    export function isColorScheme(name: string): boolean {
        const schemes: ColorSchemeName[] = [
            'byelement', 'byatom',
            'byhet',
            'bychain',
            'bynucleotide',
            'bymodel',
            'byidentity', 'bypolymer',
            'random'
        ];
        return schemes.includes(name.toLowerCase() as ColorSchemeName);
    }
}
