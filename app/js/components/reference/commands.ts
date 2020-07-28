/**
 * Native commands reference table.
 */
import { Command } from '../../compiler/commands'
import { categories } from '../../compiler/categories'
import { fill, tr, td, code } from '../../tools/elements'
import highlight from '../../compiler/highlight'
import state from '../../state/index'

// get relevant elements
const commandsTableBody = document.querySelector('[data-component="commandsTableBody"]') as HTMLElement

if (commandsTableBody) {
  state.on('languageChanged', updateTable)
  state.on('commandsCategoryIndexChanged', updateTable)
  state.on('showSimpleCommandsChanged', updateTable)
  state.on('showIntermediateCommandsChanged', updateTable)
  state.on('showAdvancedCommandsChanged', updateTable)
}

function updateTable (): void {
  if (commandsTableBody) {
    let commands = categories[state.commandsCategoryIndex].expressions
    if (!state.showSimpleCommands) commands = commands.filter(x => x.level !== 0)
    if (!state.showIntermediateCommands) commands = commands.filter(x => x.level !== 1)
    if (!state.showAdvancedCommands) commands = commands.filter(x => x.level !== 2)
    commands = commands.filter(x => x.names[state.language])
    fill(commandsTableBody, commands.map(commandTableRow))
  }
}

function commandTableRow (command: Command): HTMLTableRowElement {
  return tr({ content: [
    td({ content: [
      code({ content: highlight(command.names[state.language], state.language) })
    ] }),
    td({ content: command.parameters.map(x => `<code>${highlight(x.name, state.language)}</code> (${x.type})`).join('<br>') }),
    td({ content: command.returns || '-' }),
    td({ content: command.description })
  ] })
}
