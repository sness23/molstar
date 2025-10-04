/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author mol* contributors
 *
 * Command registry for managing and executing console commands
 */

import { PluginContext } from '../../mol-plugin/context';
import { ConsoleCommand } from './types';
import { parseCommand } from './parser';

export class CommandRegistry {
    private commands = new Map<string, ConsoleCommand>();

    register(command: ConsoleCommand) {
        this.commands.set(command.name, command);
    }

    unregister(name: string) {
        this.commands.delete(name);
    }

    get(name: string): ConsoleCommand | undefined {
        return this.commands.get(name);
    }

    has(name: string): boolean {
        return this.commands.has(name);
    }

    list(): ConsoleCommand[] {
        return Array.from(this.commands.values());
    }

    async execute(plugin: PluginContext, input: string): Promise<any> {
        const parsed = parseCommand(input);
        if (!parsed.command) {
            throw new Error('No command specified');
        }

        const command = this.commands.get(parsed.command);
        if (!command) {
            throw new Error(`Unknown command: ${parsed.command}`);
        }

        const params = command.parse(parsed.args);
        if (!params) {
            throw new Error(`Invalid syntax for command: ${parsed.command}`);
        }

        return command.execute(plugin, params);
    }
}
