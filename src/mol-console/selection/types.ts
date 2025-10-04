/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author mol* contributors
 *
 * Selection language types
 */

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
