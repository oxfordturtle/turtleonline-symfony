/*
 * An array of fonts.
 */
export class Font {
  readonly index: number
  readonly name: string
  readonly css: string

  constructor (index: number, name: string, css: string) {
    this.index = index
    this.name = name
    this.css = css
  }
}

export const fonts: Font[] = [
  new Font(0x0, 'Arial', 'Arial, sans-serif'),
  new Font(0x1, 'Arial Black', '"Arial Black", sans-serif'),
  new Font(0x2, 'Arial Narrow', '"Arial Narrow", sans-serif'),
  new Font(0x3, 'Bookman Old Style', '"Bookman Old Style", serif'),
  new Font(0x4, 'Comic Sans MS', '"Comic Sans MS", cursive, sans-serif'),
  new Font(0x5, 'Courier New', '"Courier New", Courier, monospace'),
  new Font(0x6, 'Georgia', 'Georgia, serif'),
  new Font(0x7, 'Lucida Bright', '"Lucida Bright", serif'),
  new Font(0x8, 'Lucida Calligraphy', '"Lucida Calligraphy", cursive, serif'),
  new Font(0x9, 'Lucida Handwriting', '"Lucida Handwriting", cursive, serif'),
  new Font(0xA, 'Lucida Sans', '"Lucida Sans Unicode", sans-serif'),
  new Font(0xB, 'Lucida Sans Typewriter', '"Lucida Sans Typewriter", sans-serif'),
  new Font(0xC, 'Old English Text MT', '"Old English Text MT", serif'),
  new Font(0xD, 'Symbol', 'Symbol'),
  new Font(0xE, 'Times New Roman', '"Times New Roman", Times, serif'),
  new Font(0xF, 'Verdana', 'Verdana, Geneva, sans-serif')
]
