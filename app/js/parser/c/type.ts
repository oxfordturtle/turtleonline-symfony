import Lexemes from '../definitions/lexemes'
import { Type } from '../../lexer/lexeme'
import { CompilerError } from '../../tools/error'

/** parses lexemes at a type specification */
export default function type (lexemes: Lexemes): [Type|null, number] {
  const typeLexeme = lexemes.get()

  // expecting type
  if (!typeLexeme) {
    throw new CompilerError('Expected type definition ("bool", "char", "int", "string", or "void").', lexemes.get(-1))
  }
  if (typeLexeme.type !== 'type') {
    throw new CompilerError('{lex} is not a valid type definition (expected "bool", "char", "int", "string", or "void").', typeLexeme)
  }
  const type = typeLexeme.subtype
  lexemes.next()

  // string length is allowable here
  let stringLength = 32
  if (lexemes.get()?.content === '[') {
    lexemes.next()
    // expecting integer
    const integerLexeme = lexemes.get()
    if (!integerLexeme) {
      throw new CompilerError('Expecting string size specification.', lexemes.get(-1))
    }
    if (integerLexeme.type !== 'literal' || integerLexeme.subtype !== 'integer') {
      throw new CompilerError('String size must be an integer.', lexemes.get())
    }
    if (integerLexeme.value <= 0) {
      throw new CompilerError('String size must be greater than zero.', lexemes.get())
    }
    stringLength = integerLexeme.value
    lexemes.next()
    // expecting closing bracket
    if (!lexemes.get()) {
      throw new CompilerError('Closing bracket "]" missing after string size specification.', lexemes.get(-1))
    }
    if (lexemes.get()?.content !== ']') {
      throw new CompilerError('Closing bracket "]" missing after string size specification.', lexemes.get())
    }
    lexemes.next()
  }

  // return type and string length
  return [type, stringLength]
}
