/**
 * Command and keywords categories (for help tables and usage analysis).
 */
import type { Command } from './commands'
import { commands } from './commands'
import type { Keyword } from './keywords'
import { keywords } from './keywords'
import type { Language } from './languages'
import { Subroutine } from '../parser/definitions/subroutine'

/** expression type definition */
export type Expression = Command|Keyword|Subroutine

/** category class defintiion */
export class Category {
  readonly index: number
  readonly title: string
  readonly expressions: Expression[]

  constructor (index: number, title: string, expressions: Expression[]) {
    this.index = index
    this.title = title
    this.expressions = (expressions[0] && expressions[0] instanceof Subroutine)
      ? expressions
      : expressions.filter(x => (x as Command|Keyword).category === index)
  }
}

/** array of command categories */
export const commandCategories: Category[] = [
  new Category(0, 'Turtle: relative movement', commands),
  new Category(1, 'Turtle: absolute movement', commands),
  new Category(2, 'Turtle: drawing shapes', commands),
  new Category(3, 'Other Turtle commands', commands),
  new Category(4, 'Canvas operations', commands),
  new Category(5, 'General arithmetic functions', commands),
  new Category(6, 'Trig / exp / log functions', commands),
  new Category(7, 'String operations', commands),
  new Category(8, 'Type conversion routines', commands),
  new Category(9, 'Input and timing routines', commands),
  new Category(10, 'File processing', commands),
  new Category(11, 'Turtle Machine monitoring', commands)
]

/** arrays of keyword categories for each language */
export const keywordCategories: Record<Language, Category[]> = {
  BASIC: [
    new Category(20, 'Command structures', keywords.BASIC),
    new Category(21, 'Variable scope modifiers', keywords.BASIC)
  ],
  C: [
    new Category(20, 'Command structures', keywords.C)
  ],
  Java: [
    new Category(20, 'Command structures', keywords.Java)
  ],
  Pascal: [
    new Category(20, 'Command structures', keywords.Pascal)
  ],
  Python: [
    new Category(20, 'Command structures', keywords.Python),
    new Category(21, 'Variable scope modifiers', keywords.Python)
  ],
  TypeScript: [
    new Category(20, 'Command structures', keywords.TypeScript)
  ]
}
