/**
 * Fonts reference table.
 */
import { fonts, Font } from '../../machine/fonts'
import { fill, tr, td } from '../../tools/elements'
import state from '../../state/index'

// get relevant elements
const fontsTableBody = document.querySelector('[data-component="fontsTableBody"]') as HTMLElement

if (fontsTableBody) {
  state.on('languageChanged', updateTable)
}

function updateTable (): void {
  if (fontsTableBody) {
    fill(fontsTableBody, fonts.map(fontTableRow))
  }
}

function fontTableRow (font: Font): HTMLTableRowElement {
  return tr({ style: `font-family: ${font.css};`, content: [
    td({ content: font.name }),
    td({ content: font.index.toString(10) }),
    td({ style: 'font-style: italic;', content: (font.index + 16).toString(10) }),
    td({ style: 'font-weight: bold;', content: (font.index + 32).toString(10) }),
    td({ style: 'font-style: italic; font-weight: bold;', content: (font.index + 48).toString(10) }),
    td({ style: 'text-decoration: underline;', content: (font.index + 64).toString(10) }),
    td({ style: 'text-decoration: line-through;', content: (font.index + 128).toString(10) })
  ] })
}
