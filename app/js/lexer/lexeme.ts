/**
 * Type definitions for lexemes and their components.
 */
import { Token, TokenType, TokenSubtype } from './token'

/** lexeme class definition */
export class Lexeme {
  readonly type: TokenType
  readonly subtype: TokenSubtype|null
  readonly ok: boolean
  readonly content: string|null
  readonly value: string|number|null
  readonly line: number
  readonly character: number

  constructor (token: Token|TokenType, line: number, character: number) {
    if (token instanceof Token) {
      this.type = token.type
      this.subtype = token.subtype
      this.ok = token.ok
      this.content = token.content
      this.value = token.value
    } else {
      this.type = token
      this.subtype = null
      this.ok = true
      this.content = null
      this.value = null
    }
    this.line = line
    this.character = character
  }
}
