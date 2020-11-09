import type { Lexeme } from '../../lexer/lexeme'

/** collection of lexemes for iterating over */
export default class Lexemes {
  lexemes: Lexeme[]
  index: number

  /** constructor */
  constructor (lexemes: Lexeme[]) {
    this.lexemes = lexemes.filter(x => x.type !== 'comment')
    this.index = 0
  }

  /** get a lexeme (offset by the current index) */
  get (offset: number = 0): Lexeme|undefined {
    return this.lexemes[this.index + offset]
  }

  /** move to the next lexeme */
  next (): void {
    this.index += 1
  }
}
