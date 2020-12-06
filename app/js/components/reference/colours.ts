/**
 * Colour constants reference table.
 */
import type { Colour } from '../../constants/colours'
import { colours } from '../../constants/colours'
import type { Language } from '../../constants/languages'
import state from '../../state/index'
import { on } from '../../tools/hub'

// get relevant elements
const coloursTableBody = document.querySelector('[data-component="coloursTableBody"]') as HTMLElement

if (coloursTableBody) {
  on('languageChanged', updateTable)
}

function updateTable (): void {
  if (coloursTableBody) {
    coloursTableBody.innerHTML = ''
    for (let i = 0; i < 10; i += 1) {
      coloursTableBody.innerHTML += `<tr>${colours.slice(i * 5, i * 5 + 5).map(colourTableCells).join('')}</tr>`
    }
  }
}

function colourTableCells (colour: Colour): string {
  return `
    <th>${colour.index}</th>
    <td style="background:#${colour.hex};color:${colour.text}">
      ${colour.names[state.language]}<br>${hex(state.language, colour.hex)}
    </td>`
}

function hex (language: Language, hex: string) {
  switch (language) {
    case 'BASIC':
      return `&${hex}`
    case 'Pascal':
      return `$${hex}`
    case 'Python':
      return `0x${hex}`
  }
}
