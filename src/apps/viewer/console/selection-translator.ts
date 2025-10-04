/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Translate ChimeraX-style selections to MolQL
 */

import { MolScriptBuilder as MS } from '../../../mol-script/language/builder';
import { compile } from '../../../mol-script/runtime/query/compiler';
import { StructureSelection, StructureQuery } from '../../../mol-model/structure';

export interface SelectionSpec {
    chains?: string[];
    residues?: ResidueSpec[];
    atoms?: string[];
    secondaryStructure?: 'helix' | 'sheet' | 'coil';
    modelId?: string;
    polymer?: boolean;
    protein?: boolean;
    nucleic?: boolean;
    ligand?: boolean;
    water?: boolean;
}

export interface ResidueSpec {
    start?: number;
    end?: number;
    individual?: number[];
}

/**
 * Parse ChimeraX-style selection string
 * Examples:
 *   /A         -> chain A
 *   /A,B       -> chains A and B
 *   :12        -> residue 12
 *   :12-50     -> residues 12 to 50
 *   /A:12-50   -> chain A residues 12-50
 *   & helix    -> helix secondary structure
 *   #1         -> model 1
 *   & protein  -> protein atoms
 */
export function parseSelection(selectionStr: string): SelectionSpec {
    const spec: SelectionSpec = {};

    // Split by & for secondary structure and other filters
    const parts = selectionStr.split('&').map(p => p.trim());

    for (const part of parts) {
        if (!part) continue;

        // Model ID (#1, #2, etc.)
        if (part.startsWith('#')) {
            spec.modelId = part.slice(1);
            continue;
        }

        // Secondary structure
        if (part === 'helix' || part === 'sheet' || part === 'coil') {
            spec.secondaryStructure = part;
            continue;
        }

        // Molecule type filters
        if (part === 'protein') {
            spec.protein = true;
            continue;
        }
        if (part === 'nucleic') {
            spec.nucleic = true;
            continue;
        }
        if (part === 'ligand') {
            spec.ligand = true;
            continue;
        }
        if (part === 'water') {
            spec.water = true;
            continue;
        }

        // Chain and/or residue specification
        // Format: /A:12-50 or /A or :12-50
        const chainMatch = part.match(/\/([A-Za-z0-9,]+)/);
        const residueMatch = part.match(/:([0-9,\-]+)/);

        if (chainMatch) {
            spec.chains = chainMatch[1].split(',').map(c => c.trim());
        }

        if (residueMatch) {
            spec.residues = parseResidueSpec(residueMatch[1]);
        }
    }

    return spec;
}

/**
 * Parse residue specification like "12", "12-50", or "12,15,20-30"
 */
function parseResidueSpec(residueStr: string): ResidueSpec[] {
    const specs: ResidueSpec[] = [];
    const parts = residueStr.split(',');

    for (const part of parts) {
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(s => parseInt(s.trim(), 10));
            if (!isNaN(start) && !isNaN(end)) {
                specs.push({ start, end });
            }
        } else {
            const num = parseInt(part.trim(), 10);
            if (!isNaN(num)) {
                specs.push({ individual: [num] });
            }
        }
    }

    return specs;
}

/**
 * Convert SelectionSpec to MolQL query
 */
export function selectionToQuery(spec: SelectionSpec): StructureQuery {
    let query = MS.struct.generator.all();

    // Apply chain filter
    if (spec.chains && spec.chains.length > 0) {
        const chainTests = spec.chains.map(chain =>
            MS.core.rel.eq([MS.struct.atomProperty.macromolecular.label_asym_id(), chain])
        );
        const chainFilter = chainTests.length === 1
            ? chainTests[0]
            : MS.core.logic.or(chainTests);
        query = MS.struct.filter.pick({ '0': query, test: chainFilter });
    }

    // Apply residue filter
    if (spec.residues && spec.residues.length > 0) {
        const residueTests: any[] = [];

        for (const resSpec of spec.residues) {
            if (resSpec.start !== undefined && resSpec.end !== undefined) {
                // Range
                residueTests.push(
                    MS.core.logic.and([
                        MS.core.rel.gre([MS.struct.atomProperty.macromolecular.label_seq_id(), resSpec.start]),
                        MS.core.rel.lse([MS.struct.atomProperty.macromolecular.label_seq_id(), resSpec.end])
                    ])
                );
            } else if (resSpec.individual) {
                // Individual residues
                for (const resId of resSpec.individual) {
                    residueTests.push(
                        MS.core.rel.eq([MS.struct.atomProperty.macromolecular.label_seq_id(), resId])
                    );
                }
            }
        }

        if (residueTests.length > 0) {
            const residueFilter = residueTests.length === 1
                ? residueTests[0]
                : MS.core.logic.or(residueTests);
            query = MS.struct.filter.pick({ '0': query, test: residueFilter });
        }
    }

    // Apply secondary structure filter
    if (spec.secondaryStructure) {
        const ssFlags: number[] = [];
        if (spec.secondaryStructure === 'helix') {
            ssFlags.push(1, 2, 3); // Helix types
        } else if (spec.secondaryStructure === 'sheet') {
            ssFlags.push(4, 5); // Sheet types
        } else if (spec.secondaryStructure === 'coil') {
            ssFlags.push(0); // Coil
        }

        if (ssFlags.length > 0) {
            const ssTests = ssFlags.map(flag =>
                MS.core.rel.eq([MS.struct.atomProperty.macromolecular.secondaryStructureFlags(), flag])
            );
            const ssFilter = ssTests.length === 1 ? ssTests[0] : MS.core.logic.or(ssTests);
            query = MS.struct.filter.pick({ '0': query, test: ssFilter });
        }
    }

    // Apply protein filter
    if (spec.protein) {
        query = MS.struct.filter.pick({
            '0': query,
            test: MS.core.rel.eq([
                MS.struct.atomProperty.macromolecular.entityType(),
                'polymer'
            ])
        });
    }

    return compile<StructureSelection>(query);
}

/**
 * Get a human-readable description of the selection
 */
export function describeSelection(spec: SelectionSpec): string {
    const parts: string[] = [];

    if (spec.chains) {
        parts.push(`chain${spec.chains.length > 1 ? 's' : ''} ${spec.chains.join(', ')}`);
    }

    if (spec.residues) {
        const residueDesc = spec.residues.map(r => {
            if (r.start !== undefined && r.end !== undefined) {
                return `${r.start}-${r.end}`;
            } else if (r.individual) {
                return r.individual.join(',');
            }
            return '';
        }).filter(s => s).join(', ');
        parts.push(`residue${spec.residues.length > 1 ? 's' : ''} ${residueDesc}`);
    }

    if (spec.secondaryStructure) {
        parts.push(spec.secondaryStructure);
    }

    if (spec.protein) {
        parts.push('protein');
    }

    if (parts.length === 0) {
        return 'all atoms';
    }

    return parts.join(' ');
}
