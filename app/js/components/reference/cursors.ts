/**
 * Cursors reference table.
 */
import type { Cursor } from '../../constants/cursors'
import { cursors } from '../../constants/cursors'
import { fill, tr } from '../../tools/elements'
import { on } from '../../tools/hub'

// get relevant elements
const cursorsTableBody = document.querySelector('[data-component="cursorsTableBody"]') as HTMLElement

if (cursorsTableBody) {
  on('languageChanged', updateTable)
}

function updateTable (): void {
  if (cursorsTableBody) {
    fill(cursorsTableBody, [
      tr({ content: cursors.slice(0, 4).map(cursorTableCells).join('') }),
      tr({ content: cursors.slice(4, 8).map(cursorTableCells).join('') }),
      tr({ content: cursors.slice(8, 12).map(cursorTableCells).join('') }),
      tr({ content: cursors.slice(12, 16).map(cursorTableCells).join('') })
    ])
  }
}

function cursorTableCells (cursor: Cursor): string {
  return `<td>${cursor.index}</td><td style="cursor:${cursor.css}">${cursor.name}</td>`
}
