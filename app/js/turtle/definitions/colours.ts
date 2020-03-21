/*
 * An array of colours.
 */
import { Names } from './languages.ts'
import { Type } from './types.ts'

let index = 1

export class Colour {
  readonly index: number
  readonly names: Names
  readonly type: Type
  readonly value: number
  readonly hex: string
  readonly text: 'white' | 'black'
  constructor (name: string, value: number, dark: boolean) {
    this.index = index++
    this.names = { BASIC: name.toUpperCase(), Pascal: name, Python: name }
    this.type = 'integer'
    this.value = value
    this.hex = value.toString(16)
    this.text = dark ? 'white' : 'black'
  }
}

export const colours: Colour[] = [
  new Colour('green', 0x228B22, true),
  new Colour('red', 0xFF0000, true),
  new Colour('blue', 0x0000FF, true),
  new Colour('yellow', 0xFFFF00, false),
  new Colour('violet', 0x8A2BE2, true),
  new Colour('lime', 0x00FF00, false),
  new Colour('orange', 0xFFAA00, false),
  new Colour('skyblue', 0x00B0FF, true),
  new Colour('brown', 0x964B00, true),
  new Colour('pink', 0xEE1289, true),
  new Colour('darkgreen', 0x006400, true),
  new Colour('darkred', 0xB22222, true),
  new Colour('darkblue', 0x000080, true),
  new Colour('ochre', 0xC0B030, true),
  new Colour('indigo', 0x4B0082, true),
  new Colour('olive', 0x808000, true),
  new Colour('orangered', 0xFF6600, true),
  new Colour('teal', 0x008080, true),
  new Colour('darkbrown', 0x5C4033, true),
  new Colour('magenta', 0xFF00FF, true),
  new Colour('lightgreen', 0x98FB98, false),
  new Colour('lightred', 0xCD5C5C, true),
  new Colour('lightblue', 0x99BBFF, false),
  new Colour('cream', 0xFFFFBB, false),
  new Colour('lilac', 0xB093FF, true),
  new Colour('yellowgreen', 0xAACC33, false),
  new Colour('peach', 0xFFCCB0, false),
  new Colour('cyan', 0x00FFFF, false),
  new Colour('lightbrown', 0xB08050, true),
  new Colour('lightpink', 0xFFB6C1, false),
  new Colour('seagreen', 0x3CB371, true),
  new Colour('maroon', 0x800000, true),
  new Colour('royal', 0x4169E1, true),
  new Colour('gold', 0xFFC800, false),
  new Colour('purple', 0x800080, true),
  new Colour('emerald', 0x00C957, true),
  new Colour('salmon', 0xFA8072, true),
  new Colour('turquoise', 0x00BEC1, true),
  new Colour('coffee', 0x926F3F, true),
  new Colour('rose', 0xFF88AA, true),
  new Colour('greengrey', 0x709070, true),
  new Colour('redgrey', 0xB08080, true),
  new Colour('bluegrey', 0x8080A0, true),
  new Colour('yellowgrey', 0x909070, true),
  new Colour('darkgrey', 0x404040, true),
  new Colour('midgrey', 0x808080, true),
  new Colour('lightgrey', 0xA0A0A0, true),
  new Colour('silver', 0xC0C0C0, false),
  new Colour('white', 0xFFFFFF, false),
  new Colour('black', 0x000000, true)
]
