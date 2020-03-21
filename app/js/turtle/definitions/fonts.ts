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
  new Font('Comic Sans MS', '"Comic Sans MS", cursive, sans-serif'),
  new Font('Courier New', '"Courier New", Courier, monospace'),
  new Font('Georgia', 'Georgia, serif'),
  new Font('Impact', 'Impact, Charcoal, sans-serif'),
  new Font('Lucida Console', '"Lucida Console", monospace'),
  new Font('Lucida Sans Unicode', '"Lucida Sans Unicode", sans-serif'),
  new Font('Palatino Linotype', '"Palatino Linotype", "Book Antiqua", Palatino, serif'),
  new Font('Symbol', 'Symbol'),
  new Font('Tahoma', 'Tahoma, Geneva, sans-serif'),
  new Font('Times New Roman', '"Times New Roman", Times, serif'),
  new Font('Trebuchet MS', '"Trebuchet MS", helvetica, sans-serif'),
  new Font('Verdana', 'Verdana, Geneva, sans-serif'),
  new Font('Webdings', 'Webdings'),
  new Font('Wingdings', 'Wingdings')
]
