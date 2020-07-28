/*
 * Compiler error object.
 */
export default class CompilerError extends Error {
  readonly lexeme: any|null

  constructor (message: string, lexeme: any|null = null) {
    if (lexeme) {
      message = message.replace('{lex}', `"${lexeme.content}"`)
    }
    super(message)
    this.lexeme = lexeme
  }
}
