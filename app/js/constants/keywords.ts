/**
 * Keywords for the Turtle languages.
 */
import type { Language } from './languages'

/** keyword class definition */
export class Keyword {
  readonly category: number
  readonly level: number
  readonly name: string

  constructor (category: number, level: number, name: string) {
    this.category = category
    this.level = level
    this.name = name
  }
}

/** keywords for Turtle BASIC */
const BASIC = [
  // command structures
  new Keyword(20, 0, 'IF'),
  new Keyword(20, 0, 'ELSE'),
  new Keyword(20, 0, 'FOR'),
  new Keyword(20, 1, 'REPEAT'),
  new Keyword(20, 1, 'WHILE'),
  new Keyword(20, 1, 'DEF'),
  // variable scope modifiers
  new Keyword(21, 1, 'LOCAL'),
  new Keyword(21, 2, 'PRIVATE'),
  // other keywords (not shown in usage tables)
  new Keyword(22, 0, 'RETURN'),
  new Keyword(22, 0, 'CONST'),
  new Keyword(22, 0, 'DIM'),
  new Keyword(22, 0, 'END'),
  new Keyword(22, 0, 'ENDPROC'),
  new Keyword(22, 0, 'THEN'),
  new Keyword(22, 0, 'ENDIF'),
  new Keyword(22, 0, 'TO'),
  new Keyword(22, 0, 'STEP'),
  new Keyword(22, 0, 'NEXT'),
  new Keyword(22, 0, 'UNTIL'),
  new Keyword(22, 0, 'ENDWHILE')
]

/** keywords for Turtle C */
const C = [
  // command structures
  new Keyword(20, 0, 'if'),
  new Keyword(20, 0, 'else'),
  new Keyword(20, 0, 'for'),
  new Keyword(20, 1, 'while'),
  new Keyword(20, 1, 'do'),
  // other keywords (not shown in usage tables)
  new Keyword(22, 0, 'const'),
  new Keyword(22, 0, 'return')
]

/** keywords for Turtle Java */
const Java = [
  // command structures
  new Keyword(20, 0, 'if'),
  new Keyword(20, 0, 'else'),
  new Keyword(20, 0, 'for'),
  new Keyword(20, 1, 'while'),
  new Keyword(20, 1, 'do'),
  // other keywords (not shown in usage tables)
  new Keyword(22, 0, 'class'),
  new Keyword(22, 0, 'final'),
  new Keyword(22, 0, 'return')
]

/** keywords for Turtle Pascal */
const Pascal = [
  // command structures
  new Keyword(20, 0, 'if'),
  new Keyword(20, 0, 'else'),
  new Keyword(20, 0, 'for'),
  new Keyword(20, 1, 'repeat'),
  new Keyword(20, 1, 'while'),
  new Keyword(20, 1, 'procedure'),
  new Keyword(20, 2, 'function'),
  // other keywords (not shown in usage tables)
  new Keyword(22, 0, 'program'),
  new Keyword(22, 0, 'var'),
  new Keyword(22, 0, 'const'),
  new Keyword(22, 0, 'array'),
  new Keyword(22, 0, 'of'),
  new Keyword(22, 0, 'begin'),
  new Keyword(22, 0, 'end'),
  new Keyword(22, 0, 'then'),
  new Keyword(22, 0, 'to'),
  new Keyword(22, 0, 'downto'),
  new Keyword(22, 0, 'do'),
  new Keyword(22, 0, 'until')
]

/** keywords for Turtle Python */
const Python = [
  // command structures
  new Keyword(20, 0, 'if'),
  new Keyword(20, 0, 'else'),
  new Keyword(20, 0, 'elif'),
  new Keyword(20, 0, 'for'),
  new Keyword(20, 1, 'while'),
  new Keyword(20, 1, 'def'),
  // variable scope modifiers
  new Keyword(21, 1, 'global'),
  new Keyword(21, 2, 'nonlocal'),
  // other keywords (not shown in usage tables)
  new Keyword(22, 0, 'in'),
  new Keyword(22, 0, 'pass'),
  new Keyword(22, 0, 'return')
]

/** keywords for Turtle TypeScript */
const TypeScript = [
  // command structures
  new Keyword(20, 0, 'if'),
  new Keyword(20, 0, 'else'),
  new Keyword(20, 0, 'for'),
  new Keyword(20, 1, 'while'),
  new Keyword(20, 1, 'do'),
  new Keyword(20, 1, 'function'),
  // other keywords (not shown in usage tables)
  new Keyword(22, 0, 'var'),
  new Keyword(22, 0, 'const'),
  new Keyword(22, 0, 'return')
]

/** export a record of all keywords */
export const keywords: Record<Language, Keyword[]> = { BASIC, C, Java, Pascal, Python, TypeScript }
