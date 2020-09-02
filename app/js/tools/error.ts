/*
 * Custom error objects.
 */
import { Lexeme } from '../lexer/lexeme'

/** system error */
export class SystemError extends Error {
  constructor (message: string) {
    super(message)
  }
}

/** machine runtime error */
export class MachineError extends Error {
  constructor (message: string) {
    super(message)
  }
}

/** compiler error */
export class CompilerError extends Error {
  readonly lexeme: Lexeme|null

  constructor (message: string, lexeme: Lexeme|null = null) {
    if (lexeme) {
      message = message.replace('{lex}', `"${lexeme.content}"`)
      message += ` ("${lexeme.content}", line ${lexeme.line}.${lexeme.character})`
    }
    super(message)
    this.lexeme = lexeme
  }
}
