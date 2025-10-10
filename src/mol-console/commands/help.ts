/**
 * Copyright (c) 2025 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author mol* contributors
 *
 * Help command implementation
 */

import { PluginContext } from '../../mol-plugin/context';

export interface HelpResult {
    success: boolean;
    message: string;
    helpText?: string;
}

/**
 * Execute help command
 */
export function executeHelp(
    plugin: PluginContext,
    command?: string
): HelpResult {
    // If a specific command is requested
    if (command) {
        const helpText = getCommandHelp(command);
        if (helpText) {
            return {
                success: true,
                message: '',
                helpText
            };
        } else {
            return {
                success: false,
                message: `No help available for command: ${command}`
            };
        }
    }

    // General help
    const generalHelp = `
smol console - PyMOL-style commands for Mol*

AVAILABLE COMMANDS:
  load <id>              Load a PDB structure by ID
  close                  Clear all structures
  color <color> [sel]    Color atoms
  style <style> [sel]    Change visualization style
  focus [sel]            Focus camera on selection
  reset                  Reset view
  help [command]         Show this help or help for a specific command

COLOR COMMANDS:
  color red              Color all atoms red
  color @CA blue         Color alpha carbons blue
  color :A yellow        Color chain A yellow

  Schemes:
  color byelement        Color by element type
  color bychain          Color by chain
  color byhet            Color by molecule type

SELECTION SYNTAX:
  all                    All atoms
  @CA                    Alpha carbons
  :A                     Chain A
  :A@CA                  Alpha carbons in chain A
  /1                     Model 1

STYLES:
  cartoon, spacefill, sticks, lines, surface, ribbons

EXAMPLES:
  load 1cbs
  color cartoon :A blue
  color @CA red
  style :B cartoon
  focus :A

Type 'help <command>' for detailed help on a specific command.
Press F2 or Esc to hide console, Enter to show.
`.trim();

    return {
        success: true,
        message: '',
        helpText: generalHelp
    };
}

/**
 * Get help text for a specific command
 */
function getCommandHelp(command: string): string | null {
    const cmd = command.toLowerCase();

    const helpTexts: Record<string, string> = {
        'load': `
LOAD - Load a PDB structure

SYNTAX:
  load <pdb-id>

EXAMPLES:
  load 1cbs           Load PDB entry 1CBS
  load 7bv2           Load PDB entry 7BV2

DESCRIPTION:
  Downloads and displays a structure from the PDB database.
  The structure is automatically centered and displayed with
  default representation.
`.trim(),

        'close': `
CLOSE - Clear all structures

SYNTAX:
  close

DESCRIPTION:
  Removes all loaded structures from the viewer.
  This clears the entire scene.
`.trim(),

        'color': `
COLOR - Color atoms or apply color schemes

SYNTAX:
  color <color> [selection]
  color <scheme>

COLORS:
  Named colors: red, blue, green, yellow, orange, purple, cyan,
                magenta, white, black, gray, pink, brown, etc.
  Hex colors:   #FF0000, #00FF00, etc.

SCHEMES:
  byelement     Color by element type (C=gray, O=red, N=blue, etc.)
  bychain       Color each chain differently
  byhet         Color by molecule type (protein/nucleic/ligand)

SELECTIONS:
  all           All atoms (default)
  @CA           Alpha carbons
  :A            Chain A
  :A@CA         Alpha carbons in chain A
  /1            Model 1

EXAMPLES:
  color red               Color everything red
  color @CA blue          Color alpha carbons blue
  color :A yellow         Color chain A yellow
  color :A@CA green       Color chain A alpha carbons green
  color byelement         Color by element type
  color bychain           Color each chain differently
`.trim(),

        'style': `
STYLE - Change visualization style

SYNTAX:
  style <style> [selection]

STYLES:
  cartoon       Cartoon/ribbon representation
  spacefill     Space-filling (VDW spheres)
  sticks        Stick representation
  lines         Line representation
  surface       Molecular surface
  ribbons       Ribbon representation

SELECTIONS:
  Same as color command

EXAMPLES:
  style cartoon           Show everything as cartoon
  style :A cartoon        Show chain A as cartoon
  style @CA spacefill     Show alpha carbons as spheres
  style :B sticks         Show chain B as sticks
`.trim(),

        'focus': `
FOCUS - Focus camera on selection

SYNTAX:
  focus [selection]

SELECTIONS:
  Same as color command
  If no selection given, focuses on all atoms

EXAMPLES:
  focus                   Focus on entire structure
  focus :A                Focus on chain A
  focus @CA               Focus on alpha carbons
  focus :A@CA             Focus on chain A alpha carbons
`.trim(),

        'reset': `
RESET - Reset view

SYNTAX:
  reset

DESCRIPTION:
  Resets the camera to show the entire structure.
  Equivalent to 'focus all'.
`.trim(),

        'help': `
HELP - Show help information

SYNTAX:
  help [command]

EXAMPLES:
  help                Show general help
  help color          Show help for color command
  help load           Show help for load command

DESCRIPTION:
  Displays help information. Use without arguments for
  general help, or specify a command name for detailed
  help on that command.
`.trim()
    };

    return helpTexts[cmd] || null;
}
