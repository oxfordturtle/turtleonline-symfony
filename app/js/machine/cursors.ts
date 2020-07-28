/*
 * Cursors.
 */
export class Cursor {
  index: number
  name: string
  css: string

  constructor (index: number, name: string, css: string) {
    this.index = index
    this.name = name
    this.css = css
  }
}

export const cursors: Cursor[] = [
  new Cursor(0x0, 'None', 'none'),
  new Cursor(0x1, 'Default', 'default'),
  new Cursor(0x2, 'Pointer', 'pointer'),
  new Cursor(0x3, 'Crosshair', 'crosshair'),
  new Cursor(0x4, 'Text', 'text'),
  new Cursor(0x5, 'Move', 'move'),
  new Cursor(0x6, 'Resize NESW', 'nesw-resize'),
  new Cursor(0x7, 'Resize NS', 'ns-resize'),
  new Cursor(0x8, 'Resize NWSE', 'nwse-resize'),
  new Cursor(0x9, 'Resize EW', 'ew-resize'),
  new Cursor(0xA, 'Resize N', 'n-resize'),
  new Cursor(0xB, 'Wait', 'wait'),
  new Cursor(0xC, 'Progress', 'progress'),
  new Cursor(0xD, 'No Drop', 'no-drop'),
  new Cursor(0xE, 'Forbidden', 'not-allowed'),
  new Cursor(0xF, 'Help', 'help')
]
