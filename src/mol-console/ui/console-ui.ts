/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author mol* contributors
 *
 * Console UI - Visual terminal interface for mol-console
 */

import { PluginContext } from '../../mol-plugin/context';

export interface ConsoleUIOptions {
    maxLines?: number;
    position?: 'bottom' | 'top';
    height?: string;
    initiallyVisible?: boolean;
    prompt?: string;
}

export interface ConsoleOutputLine {
    type: 'command' | 'result' | 'error';
    text: string;
    timestamp: Date;
}

/**
 * Visual console UI that can be attached to the plugin
 */
export class ConsoleUI {
    private container: HTMLDivElement | null = null;
    private outputDiv: HTMLDivElement | null = null;
    private inputElement: HTMLInputElement | null = null;
    private historyIndex: number = -1;
    private currentInput: string = '';
    private outputLines: ConsoleOutputLine[] = [];
    private globalKeyHandler: ((e: KeyboardEvent) => void) | null = null;

    readonly options: Required<ConsoleUIOptions>;
    readonly commandHistory: string[] = [];

    constructor(
        private plugin: PluginContext,
        options: ConsoleUIOptions = {}
    ) {
        this.options = {
            maxLines: options.maxLines ?? 100,
            position: options.position ?? 'bottom',
            height: options.height ?? '200px',
            initiallyVisible: options.initiallyVisible ?? false,
            prompt: options.prompt ?? 'molstar>'
        };

        this.loadHistory();
    }

    /**
     * Create and attach the console UI to a parent element
     */
    attach(parent: HTMLElement): void {
        if (this.container) {
            console.warn('Console UI already attached');
            return;
        }

        this.container = document.createElement('div');
        this.container.className = 'molstar-console-ui';
        this.container.style.cssText = `
            position: absolute;
            ${this.options.position}: 0;
            left: 0;
            right: 0;
            height: ${this.options.height};
            background-color: rgba(0, 0, 0, 0.85);
            color: #00ff00;
            font-family: 'Courier New', 'Consolas', monospace;
            font-size: 12px;
            line-height: 1.5;
            display: ${this.options.initiallyVisible ? 'flex' : 'none'};
            flex-direction: column;
            z-index: 10000;
            border-top: 1px solid rgba(0, 255, 0, 0.3);
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.5);
        `;

        // Create output area
        this.outputDiv = document.createElement('div');
        this.outputDiv.className = 'molstar-console-output';
        this.outputDiv.style.cssText = `
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 10px;
            white-space: pre-wrap;
            word-wrap: break-word;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
        `;

        // Create input area
        const inputLine = document.createElement('div');
        inputLine.className = 'molstar-console-input-line';
        inputLine.style.cssText = `
            display: flex;
            align-items: center;
            padding: 5px 10px;
            border-top: 1px solid rgba(0, 255, 0, 0.2);
            background-color: rgba(0, 0, 0, 0.3);
        `;

        const prompt = document.createElement('span');
        prompt.className = 'molstar-console-prompt';
        prompt.textContent = this.options.prompt;
        prompt.style.cssText = `
            margin-right: 8px;
            color: #00ff00;
            font-weight: bold;
        `;

        this.inputElement = document.createElement('input');
        this.inputElement.className = 'molstar-console-input';
        this.inputElement.type = 'text';
        this.inputElement.autocomplete = 'off';
        this.inputElement.spellcheck = false;
        this.inputElement.style.cssText = `
            flex: 1;
            background: transparent;
            border: none;
            color: #00ff00;
            font-family: 'Courier New', 'Consolas', monospace;
            font-size: 12px;
            outline: none;
        `;

        inputLine.appendChild(prompt);
        inputLine.appendChild(this.inputElement);

        this.container.appendChild(this.outputDiv);
        this.container.appendChild(inputLine);

        parent.appendChild(this.container);

        this.attachEventHandlers();
        this.attachGlobalKeyHandler();
        this.printWelcome();
    }

    /**
     * Show the console
     */
    show(): void {
        if (this.container) {
            this.container.style.display = 'flex';
            this.inputElement?.focus();
        }
    }

    /**
     * Hide the console
     */
    hide(): void {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    /**
     * Toggle console visibility
     */
    toggle(): void {
        if (this.container) {
            if (this.container.style.display === 'none') {
                this.show();
            } else {
                this.hide();
            }
        }
    }

    /**
     * Check if console is visible
     */
    isVisible(): boolean {
        return this.container?.style.display !== 'none';
    }

    /**
     * Print text to console output
     */
    print(text: string, type: ConsoleOutputLine['type'] = 'result'): void {
        const line: ConsoleOutputLine = {
            type,
            text,
            timestamp: new Date()
        };

        this.outputLines.push(line);

        // Trim history if needed
        if (this.outputLines.length > this.options.maxLines) {
            this.outputLines = this.outputLines.slice(-this.options.maxLines);
        }

        this.renderOutput();
    }

    /**
     * Clear console output
     */
    clear(): void {
        this.outputLines = [];
        this.renderOutput();
    }

    /**
     * Detach and remove the console UI
     */
    detach(): void {
        this.detachGlobalKeyHandler();
        if (this.container && this.container.parentElement) {
            this.container.parentElement.removeChild(this.container);
            this.container = null;
            this.outputDiv = null;
            this.inputElement = null;
        }
    }

    private attachEventHandlers(): void {
        if (!this.inputElement) return;

        this.inputElement.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                await this.handleEnter();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory('up');
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory('down');
            } else if (e.key === 'Escape') {
                this.hide();
            } else if (e.key === 'l' && e.ctrlKey) {
                e.preventDefault();
                this.clear();
            }
        });

        // Enable mouse wheel scrolling
        if (this.container) {
            console.log('Attaching wheel handler to container', this.container);
            this.container.addEventListener('wheel', (e) => {
                console.log('Wheel event on container:', e.deltaY);
                e.stopPropagation();
            }, { passive: false });
        } else {
            console.warn('No container for wheel handler');
        }

        if (this.outputDiv) {
            console.log('Attaching wheel handler to outputDiv', this.outputDiv);
            this.outputDiv.addEventListener('wheel', (e) => {
                console.log('Wheel event on outputDiv:', e.deltaY, 'scrollTop:', this.outputDiv?.scrollTop);
                e.stopPropagation();
            }, { passive: false });
        } else {
            console.warn('No outputDiv for wheel handler');
        }
    }

    private attachGlobalKeyHandler(): void {
        this.globalKeyHandler = (e: KeyboardEvent) => {
            // F2 toggles console
            if (e.key === 'F2') {
                e.preventDefault();
                this.toggle();
            }
        };
        document.addEventListener('keydown', this.globalKeyHandler);
    }

    private detachGlobalKeyHandler(): void {
        if (this.globalKeyHandler) {
            document.removeEventListener('keydown', this.globalKeyHandler);
            this.globalKeyHandler = null;
        }
    }

    private async handleEnter(): Promise<void> {
        if (!this.inputElement) return;

        const command = this.inputElement.value.trim();
        if (!command) return;

        // Print the command
        this.print(`${this.options.prompt} ${command}`, 'command');

        // Add to history
        this.addToHistory(command);

        // Clear input
        this.inputElement.value = '';
        this.historyIndex = this.commandHistory.length;
        this.currentInput = '';

        // Handle special commands
        if (command === 'clear' || command === 'cls') {
            this.clear();
            return;
        }

        if (command === 'help') {
            this.printHelp();
            return;
        }

        if (command === 'history') {
            this.printHistory();
            return;
        }

        // Execute through plugin console
        try {
            const result = await this.plugin.console.execute(command);

            if (result.success) {
                this.print(result.message, 'result');
                if (result.data) {
                    this.print(JSON.stringify(result.data, null, 2), 'result');
                }
            } else {
                this.print(`Error: ${result.message}`, 'error');
            }
        } catch (error) {
            this.print(`Exception: ${error instanceof Error ? error.message : String(error)}`, 'error');
        }
    }

    private navigateHistory(direction: 'up' | 'down'): void {
        if (!this.inputElement || this.commandHistory.length === 0) return;

        // Save current input when starting to navigate
        if (this.historyIndex === this.commandHistory.length) {
            this.currentInput = this.inputElement.value;
        }

        if (direction === 'up') {
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.inputElement.value = this.commandHistory[this.historyIndex];
            }
        } else {
            if (this.historyIndex < this.commandHistory.length - 1) {
                this.historyIndex++;
                this.inputElement.value = this.commandHistory[this.historyIndex];
            } else {
                // Restore current input
                this.historyIndex = this.commandHistory.length;
                this.inputElement.value = this.currentInput;
            }
        }

        // Move cursor to end
        this.inputElement.setSelectionRange(
            this.inputElement.value.length,
            this.inputElement.value.length
        );
    }

    private renderOutput(): void {
        if (!this.outputDiv) return;

        this.outputDiv.innerHTML = '';

        for (const line of this.outputLines) {
            const lineDiv = document.createElement('div');
            lineDiv.className = `molstar-console-line molstar-console-line-${line.type}`;

            let color = '#00ff00';
            if (line.type === 'error') color = '#ff4444';
            else if (line.type === 'command') color = '#ffff00';

            lineDiv.style.cssText = `
                color: ${color};
                margin-bottom: 2px;
            `;
            lineDiv.textContent = line.text;
            this.outputDiv.appendChild(lineDiv);
        }

        // Scroll to bottom
        this.outputDiv.scrollTop = this.outputDiv.scrollHeight;
    }

    private printWelcome(): void {
        this.print('Mol* Console - Type "help" for available commands', 'result');
        this.print('Press F2 to toggle, Ctrl+L to clear, Escape to hide, Up/Down for history', 'result');
        this.print('', 'result');
    }

    private printHelp(): void {
        const commands = this.plugin.console.listCommands();
        this.print('Available commands:', 'result');
        for (const cmd of commands) {
            this.print(`  ${cmd}`, 'result');
        }
        this.print('', 'result');
        this.print('Special commands:', 'result');
        this.print('  clear/cls - Clear console output', 'result');
        this.print('  help - Show this help', 'result');
        this.print('  history - Show command history', 'result');
    }

    private printHistory(): void {
        this.print('Command history:', 'result');
        this.commandHistory.forEach((cmd, i) => {
            this.print(`  ${i + 1}: ${cmd}`, 'result');
        });
    }

    private addToHistory(command: string): void {
        if (!command || command.trim() === '') return;

        // Don't add duplicate of last command
        if (this.commandHistory.length > 0 &&
            this.commandHistory[this.commandHistory.length - 1] === command) {
            return;
        }

        this.commandHistory.push(command);
        this.saveHistory();
        this.historyIndex = this.commandHistory.length;
    }

    private loadHistory(): void {
        try {
            const saved = localStorage.getItem('molstar-console-history');
            if (saved) {
                const history = JSON.parse(saved);
                this.commandHistory.push(...history);
                this.historyIndex = this.commandHistory.length;
            }
        } catch (e) {
            console.warn('Failed to load console history:', e);
        }
    }

    private saveHistory(): void {
        try {
            // Keep only last 100 commands
            const toSave = this.commandHistory.slice(-100);
            localStorage.setItem('molstar-console-history', JSON.stringify(toSave));
        } catch (e) {
            console.warn('Failed to save console history:', e);
        }
    }
}
