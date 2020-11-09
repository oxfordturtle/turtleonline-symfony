import { expression, typeCheck } from '../expression'
import evaluate from '../evaluate'
import Lexemes from '../definitions/lexemes'
import Program from '../definitions/program'
import { Subroutine } from '../definitions/subroutine'
import { Type } from '../../lexer/lexeme'
import { CompilerError } from '../../tools/error'

/** parses lexemes at a type specification */
export default function type (lexemes: Lexemes, routine: Program|Subroutine): [Type|null, number, [number, number][]] {
  // expecting ":"
  if (!lexemes.get()) {
    throw new CompilerError('Expected type specification (": <type>").', lexemes.get(-1))
  }
  if (lexemes.get()?.content !== ':') {
    throw new CompilerError('Expected type specification (": <type>").', lexemes.get())
  }
  lexemes.next()

  // expecting type
  const typeLexeme = lexemes.get()
  if (!typeLexeme) {
    throw new CompilerError('Expected type definition ("boolean", "number", "string", or "void").', lexemes.get(-1))
  }
  if (typeLexeme.type !== 'type') {
    throw new CompilerError('{lex} is not a valid type definition (expected "boolean", "number", "string", or "void").', typeLexeme)
  }
  const type = typeLexeme.subtype
  lexemes.next()

  // possibly expecting string size specification
  let stringLength = 32
  if (type === 'string') {
    if (lexemes.get()?.content === '(') {
      lexemes.next()
      // expecting positive integer literal
      const integer = lexemes.get()
      if (!integer) {
        throw new CompilerError('Expected string size specification.', lexemes.get(-1))
      }
      if (integer.type !== 'literal' || integer.subtype !== 'integer') {
        throw new CompilerError('String size must be an integer.', integer)
      }
      if (integer.value <= 0) {
        throw new CompilerError('String size must be greater than zero.', lexemes.get())
      }
      stringLength = integer.value
      lexemes.next()
      // expecting closing bracket
      if (!lexemes.get()) {
        throw new CompilerError('Closing bracket ")" missing after string size specification.', lexemes.get(-1))
      }
      if (lexemes.get()?.content !== ')') {
        throw new CompilerError('Closing bracket ")" missing after string size specification.', lexemes.get())
      }
      lexemes.next()
    }
  }

  // possibly expecting brackets (for arrays)
  let arrayDimensions: [number, number][] = []
  while (lexemes.get()?.content === '[') {
    lexemes.next()

    // expecting array dimension size
    if (!lexemes.get()) {
      throw new CompilerError('Opening bracket "[" must be followed by an array size.', lexemes.get(-1))
    }
    const exp = expression(lexemes, routine)
    typeCheck(exp, 'integer')
    const value = evaluate(exp, 'TypeScript', 'array')
    if (typeof value === 'string') {
      throw new CompilerError('Array size must be an integer.', lexemes.get())
    }
    if (value <= 0) {
      throw new CompilerError('Array size must be positive.', lexemes.get())
    }
    arrayDimensions.push([0, value - 1]) // -1 because arrays are indexed from zero

    // expecting closing bracket
    if (!lexemes.get()) {
      throw new CompilerError('Array size specification must be followed by closing bracket "]".', lexemes.get(-1))
    }
    if (lexemes.get()?.content !== ']') {
      throw new CompilerError('Array size specification must be followed by closing bracket "]".', lexemes.get())
    }
    lexemes.next()
  }

  // sanity check
  if (type === null && arrayDimensions.length > 0) {
    throw new CompilerError('Array of void is not allowed.', typeLexeme)
  }

  // return type and array dimensions
  return [type, stringLength, arrayDimensions]
}
