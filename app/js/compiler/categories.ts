/*
 * Command categories.
 */
import { Command, commands } from './commands'

let index = 0

export class Category {
  readonly index: number
  readonly title: string
  readonly expressions: Command[]

  constructor (title: string) {
    this.index = index
    this.title = title
    this.expressions = commands.filter(x => x.category === index)
    index += 1
  }
}

export const categories: Category[] = [
  new Category('Turtle: relative movement'),
  new Category('Turtle: absolute movement'),
  new Category('Turtle: drawing shapes'),
  new Category('Other Turtle commands'),
  new Category('Canvas operations'),
  new Category('General arithmetic functions'),
  new Category('Trig / exp / log functions'),
  new Category('String operations'),
  new Category('Type conversion routines'),
  new Category('Input and timing routines'),
  new Category('File processing'),
  new Category('Turtle Machine monitoring')
]
