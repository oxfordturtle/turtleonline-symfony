// type imports
import type { Token } from '../lexer/token'
import type { Lexeme } from '../lexer/lexeme'

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
  readonly token: Token|Lexeme|null

  constructor (message: string, token: Token|Lexeme|null = null) {
    if (token) {
      message = message.replace('{lex}', `"${token.content}"`)
      message += ` ("${token.content}", line ${token.line}, index ${token.character})`
    }
    super(message)
    this.token = token
  }
}
