/*
 * Custom error objects.
 */
export class CompilerError extends Error {
  readonly lexeme: any|null

  constructor (message: string, lexeme: any|null = null) {
    if (lexeme) {
      message = message.replace('{lex}', `"${lexeme.content}"`)
    }
    super(message)
    this.lexeme = lexeme
  }

  get type (): ErrorType {
    return 'Compiler'
  }
}

export class MachineError extends Error {
  constructor (message: string) {
    super(message)
  }

  get type (): ErrorType {
    return 'Machine'
  }
}

export class SystemError extends Error {
  constructor (message: string) {
    super(message)
  }

  get type (): ErrorType {
    return 'System'
  }
}

type ErrorType = 'Compiler' | 'Machine' | 'System'
