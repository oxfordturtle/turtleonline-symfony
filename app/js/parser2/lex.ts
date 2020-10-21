import { Lexeme } from '../lexer/lexeme'
import { TokenSubtype, TokenType } from '../lexer/token'

/** lexemes iterator object */
export class Lex {
  lexemes: Lexeme[]
  index: number = 0

  /** constructor */
  constructor (lexemes: Lexeme[]) {
    this.lexemes = lexemes
  }

  /** gets a lexeme relative to the current lexeme */
  get (offset: number = 0): Lexeme|undefined {
    return this.lexemes[this.index + offset]
  }

  /** moves to a different lexeme */
  step (step: number = 1): void {
    this.index += step
  }

  /** gets the content of a lexeme */
  content (offset: number = 0): string|null|undefined {
    return this.get(offset)?.content
  }

  /** gets the type of a lexeme */
  type (offset: number = 0): TokenType|undefined {
    return this.get(offset)?.type
  }

  /** gets the subtype of a lexeme */
  subtype (offset: number = 0): TokenSubtype|null|undefined {
    return this.get(offset)?.subtype
  }

  /** gets the value of a lexeme */
  value (offset: number = 0): string|number|null|undefined {
    return this.get(offset)?.value
  }
}
