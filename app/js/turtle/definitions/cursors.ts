/*
 * Cursors.
 */
let index = 0

export class Cursor {
  index: number
  name: string
  css: string
  constructor (name: string, css: string) {
    this.index = index++
    this.name = name
    this.css = css
  }
}

export const cursors: Cursor[] = [
  new Cursor('None', 'none'),
  new Cursor('Default', 'default'),
  new Cursor('Pointer', 'pointer'),
  new Cursor('Crosshair', 'crosshair'),
  new Cursor('Text', 'text'),
  new Cursor('Move', 'move'),
  new Cursor('Resize NESW', 'nesw-resize'),
  new Cursor('Resize NS', 'ns-resize'),
  new Cursor('Resize NWSE', 'nwse-resize'),
  new Cursor('Resize EW', 'ew-resize'),
  new Cursor('Resize N', 'n-resize'),
  new Cursor('Wait', 'wait'),
  new Cursor('Progress', 'progress'),
  new Cursor('No Drop', 'no-drop'),
  new Cursor('Forbidden', 'not-allowed'),
  new Cursor('Help', 'help')
]
