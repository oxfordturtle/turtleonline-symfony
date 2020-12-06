/**
 * Keycodes reference table.
 */
import type { Input } from '../../constants/inputs'
import { inputs } from '../../constants/inputs'
import { fill, tr, td, code } from '../../tools/elements'
import state from '../../state/index'
import { on } from '../../tools/hub'

// get relevant elements
const keycodesTableBody = document.querySelector('[data-component="keycodesTableBody"]') as HTMLElement

if (keycodesTableBody) {
  on('languageChanged', updateTable)
}

function updateTable (): void {
  if (keycodesTableBody) {
    fill(keycodesTableBody, inputs.filter(x => x.value > 0).map(keycodeTableRow))
  }
}

function keycodeTableRow (keycode: Input): HTMLTableRowElement {
  return tr({ content: [
    td({ content: [code({ content: keycode.names[state.language] })] }),
    td({ content: keycode.value.toString(10) })
  ] })
}
