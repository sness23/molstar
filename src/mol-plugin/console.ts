/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author mol* contributors
 *
 * Plugin Console - Unified API for command execution
 */

import { PluginContext } from './context';
import { CommandRegistry } from '../mol-console/command/registry';
import { parseColorCommand, ColorCommand } from '../mol-console/command/parser';
import { executeSimpleColor, colorCommandToParams } from '../mol-console/commands/color';
import { executeLoad } from '../mol-console/commands/load';
import { executeClose } from '../mol-console/commands/close';
import { executeReset } from '../mol-console/commands/reset';
import { executeStyle } from '../mol-console/commands/style';
import { executeFocus } from '../mol-console/commands/focus';
import { executeHelp } from '../mol-console/commands/help';
import { ConsoleUI, ConsoleUIOptions } from '../mol-console/ui/console-ui';

export interface CommandResult {
    success: boolean;
    message: string;
    data?: any;
}

/**
 * Console API attached to the plugin
 */
export class PluginConsole {
    private registry: CommandRegistry;
    private ui: ConsoleUI | null = null;

    constructor(private plugin: PluginContext) {
        this.registry = new CommandRegistry();
        this.registerBuiltInCommands();
    }

    /**
     * Execute a command string
     */
    async execute(commandString: string): Promise<CommandResult> {
        const trimmed = commandString.trim();
        if (!trimmed) {
            return {
                success: false,
                message: 'Empty command'
            };
        }

        // Get the command name
        const commandName = trimmed.split(/\s+/)[0].toLowerCase();

        // Check if command is registered
        if (this.registry.has(commandName)) {
            try {
                const result = await this.registry.execute(this.plugin, trimmed);
                return result;
            } catch (error) {
                return {
                    success: false,
                    message: error instanceof Error ? error.message : String(error)
                };
            }
        }

        return {
            success: false,
            message: `Unknown command: ${commandName}`
        };
    }

    /**
     * Register a custom command
     */
    registerCommand(command: any) {
        this.registry.register(command);
    }

    /**
     * Get list of available commands
     */
    listCommands(): string[] {
        return this.registry.list().map(cmd => cmd.name);
    }

    /**
     * Create and attach the visual console UI
     */
    createUI(parent: HTMLElement, options?: ConsoleUIOptions): ConsoleUI {
        if (this.ui) {
            console.warn('Console UI already created');
            return this.ui;
        }

        this.ui = new ConsoleUI(this.plugin, options);
        this.ui.attach(parent);
        return this.ui;
    }

    /**
     * Get the console UI (if created)
     */
    getUI(): ConsoleUI | null {
        return this.ui;
    }

    /**
     * Show the console UI
     */
    showUI(): void {
        this.ui?.show();
    }

    /**
     * Hide the console UI
     */
    hideUI(): void {
        this.ui?.hide();
    }

    /**
     * Toggle the console UI visibility
     */
    toggleUI(): void {
        this.ui?.toggle();
    }

    /**
     * Register built-in commands
     */
    private registerBuiltInCommands() {
        // Register color command
        this.registry.register({
            name: 'color',
            category: 'structure',
            description: 'Color structures by selection',
            parse: (args: string[]) => {
                // Reconstruct command string from args
                const commandStr = 'color ' + args.join(' ');
                const colorCmd = parseColorCommand(commandStr);
                return colorCmd;
            },
            execute: async (plugin: PluginContext, params: ColorCommand): Promise<CommandResult> => {
                if (params.mode === 'unknown') {
                    return {
                        success: false,
                        message: 'Invalid color command syntax'
                    };
                }

                // Convert ColorCommand to ColorCommandParams
                const colorParams = colorCommandToParams(params);
                if (!colorParams) {
                    return {
                        success: false,
                        message: 'No color specified'
                    };
                }

                const result = await executeSimpleColor(plugin, colorParams);

                return {
                    success: result.success,
                    message: result.message || (result.success ?
                        `Colored ${result.atomCount || 0} atoms` :
                        'Color command failed'),
                    data: { atomCount: result.atomCount }
                };
            }
        });

        // Register load command
        this.registry.register({
            name: 'load',
            category: 'structure',
            description: 'Load a PDB structure',
            parse: (args: string[]) => {
                if (args.length < 1) {
                    return null;
                }
                return { pdbId: args[0].toLowerCase() };
            },
            execute: executeLoad
        });

        // Register close command
        this.registry.register({
            name: 'close',
            category: 'structure',
            description: 'Clear all structures',
            parse: () => ({}),
            execute: executeClose
        });

        // Register reset command
        this.registry.register({
            name: 'reset',
            category: 'camera',
            description: 'Reset camera view',
            parse: () => ({}),
            execute: executeReset
        });

        // Register style command
        this.registry.register({
            name: 'style',
            category: 'structure',
            description: 'Change representation style',
            parse: (args: string[]) => {
                if (args.length < 1) {
                    return null;
                }
                const style = args[0].toLowerCase();
                const selection = args.slice(1).join(' ') || 'all';
                return { style, selection };
            },
            execute: executeStyle
        });

        // Register focus command
        this.registry.register({
            name: 'focus',
            category: 'camera',
            description: 'Focus camera on selection',
            parse: (args: string[]) => {
                return {
                    selection: args.join(' ') || 'all'
                };
            },
            execute: executeFocus
        });

        // Register help command
        this.registry.register({
            name: 'help',
            category: 'general',
            description: 'Show help for commands',
            parse: (args: string[]) => {
                return {
                    command: args.join(' ')
                };
            },
            execute: async (plugin: PluginContext, params: { command?: string }): Promise<CommandResult> => {
                const result = executeHelp(plugin, params.command);
                return {
                    success: result.success,
                    message: result.helpText || result.message
                };
            }
        });
    }
}

/**
 * Create and attach console to plugin
 */
export function createPluginConsole(plugin: PluginContext): PluginConsole {
    return new PluginConsole(plugin);
}
