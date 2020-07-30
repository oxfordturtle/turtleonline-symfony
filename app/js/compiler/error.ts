/*
 * Compiler error object.
 */
import { Lexeme } from './lexer/lexeme'

export default class CompilerError extends Error {
  readonly lexeme: Lexeme|null

  constructor (message: string, lexeme: Lexeme|null = null) {
    if (lexeme) {
      message = message.replace('{lex}', `"${lexeme.content}"`)
    }
    super(message)
    this.lexeme = lexeme
  }
}
