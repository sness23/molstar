/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author mol* contributors
 *
 * Command system types and interfaces
 */

import { PluginContext } from '../../mol-plugin/context';

export interface ConsoleCommand<P = any, R = any> {
    readonly name: string;
    readonly description: string;
    readonly category: string;
    readonly parse: (args: string[]) => P | undefined;
    readonly execute: (plugin: PluginContext, params: P) => Promise<R>;
}

export namespace ConsoleCommand {
    export function create<P, R>(command: ConsoleCommand<P, R>): ConsoleCommand<P, R> {
        return command;
    }
}

export interface ParsedCommand {
    command: string;
    args: string[];
    options: Record<string, string | boolean>;
}
