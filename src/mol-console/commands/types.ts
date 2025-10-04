/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author mol* contributors
 *
 * Command result types
 */

export interface CommandResult {
    success: boolean;
    message: string;
}

export interface ColorResult extends CommandResult {
    atomCount?: number;
}
