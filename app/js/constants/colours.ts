/*
 * An array of colours.
 */
import type { Language } from './languages'

/** colour class definition */
export class Colour {
  readonly index: number
  readonly names: Record<Language, string>
  readonly type: 'integer'
  readonly value: number
  readonly hex: string
  readonly text: 'white' | 'black'

  constructor (index: number, name: string, value: number, dark: boolean) {
    this.index = index
    this.names = { BASIC: name.toUpperCase(), C: name, Java: name, Pascal: name, Python: name, TypeScript: name }
    this.type = 'integer'
    this.value = value
    this.hex = value.toString(16).padStart(6, '0').toUpperCase()
    this.text = dark ? 'white' : 'black'
  }
}

/** array of colours */
export const colours: Colour[] = [
  new Colour(1, 'green', 0x228B22, true),
  new Colour(2, 'red', 0xFF0000, true),
  new Colour(3, 'blue', 0x0000FF, true),
  new Colour(4, 'yellow', 0xFFFF00, false),
  new Colour(5, 'violet', 0x8A2BE2, true),
  new Colour(6, 'lime', 0x00FF00, false),
  new Colour(7, 'orange', 0xFFAA00, false),
  new Colour(8, 'skyblue', 0x00B0FF, true),
  new Colour(9, 'brown', 0x964B00, true),
  new Colour(10, 'pink', 0xEE1289, true),
  new Colour(11, 'darkgreen', 0x006400, true),
  new Colour(12, 'darkred', 0xB22222, true),
  new Colour(13, 'darkblue', 0x000080, true),
  new Colour(14, 'ochre', 0xC0B030, true),
  new Colour(15, 'indigo', 0x4B0082, true),
  new Colour(16, 'olive', 0x808000, true),
  new Colour(17, 'orangered', 0xFF6600, true),
  new Colour(18, 'teal', 0x008080, true),
  new Colour(19, 'darkbrown', 0x5C4033, true),
  new Colour(20, 'magenta', 0xFF00FF, true),
  new Colour(21, 'lightgreen', 0x98FB98, false),
  new Colour(22, 'lightred', 0xCD5C5C, true),
  new Colour(23, 'lightblue', 0x99BBFF, false),
  new Colour(24, 'cream', 0xFFFFBB, false),
  new Colour(25, 'lilac', 0xB093FF, true),
  new Colour(26, 'yellowgreen', 0xAACC33, false),
  new Colour(27, 'peach', 0xFFCCB0, false),
  new Colour(28, 'cyan', 0x00FFFF, false),
  new Colour(29, 'lightbrown', 0xB08050, true),
  new Colour(30, 'lightpink', 0xFFB6C1, false),
  new Colour(31, 'seagreen', 0x3CB371, true),
  new Colour(32, 'maroon', 0x800000, true),
  new Colour(33, 'royal', 0x4169E1, true),
  new Colour(34, 'gold', 0xFFC800, false),
  new Colour(35, 'purple', 0x800080, true),
  new Colour(36, 'emerald', 0x00C957, true),
  new Colour(37, 'salmon', 0xFA8072, true),
  new Colour(38, 'turquoise', 0x00BEC1, true),
  new Colour(39, 'coffee', 0x926F3F, true),
  new Colour(40, 'rose', 0xFF88AA, true),
  new Colour(41, 'greengrey', 0x709070, true),
  new Colour(42, 'redgrey', 0xB08080, true),
  new Colour(43, 'bluegrey', 0x8080A0, true),
  new Colour(44, 'yellowgrey', 0x909070, true),
  new Colour(45, 'darkgrey', 0x404040, true),
  new Colour(46, 'midgrey', 0x808080, true),
  new Colour(47, 'lightgrey', 0xA0A0A0, true),
  new Colour(48, 'silver', 0xC0C0C0, false),
  new Colour(49, 'white', 0xFFFFFF, false),
  new Colour(50, 'black', 0x000000, true)
]
