/*
 * An array of fonts.
 */
let index = 0

export class Font {
  readonly index: number
  readonly name: string
  readonly css: string
  constructor (name: string, css: string) {
    this.index = index++
    this.name = name
    this.css = css
  }
}

export const fonts: Font[] = [
  new Font('Arial', 'Arial, sans-serif'),
  new Font('Arial Black', '"Arial Black", sans-serif'),
  new Font('Arial Narrow', '"Arial Narrow", sans-serif'),
  new Font('Bookman Old Style', '"Bookman Old Style", serif'),
  new Font('Comic Sans MS', '"Comic Sans MS", cursive, sans-serif'),
  new Font('Courier New', '"Courier New", Courier, monospace'),
  new Font('Georgia', 'Georgia, serif'),
  new Font('Lucida Bright', '"Lucida Bright", serif'),
  new Font('Lucida Calligraphy', '"Lucida Calligraphy", cursive, serif'),
  new Font('Lucida Handwriting', '"Lucida Handwriting", cursive, serif'),
  new Font('Lucida Sans', '"Lucida Sans Unicode", sans-serif'),
  new Font('Lucida Sans Typewriter', '"Lucida Sans Typewriter", sans-serif'),
  new Font('Old English Text MT', '"Old English Text MT", serif'),
  new Font('Symbol', 'Symbol'),
  new Font('Times New Roman', '"Times New Roman", Times, serif'),
  new Font('Verdana', 'Verdana, Geneva, sans-serif')
]
