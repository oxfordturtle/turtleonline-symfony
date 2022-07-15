import { expression, typeCheck } from '../expression'
import evaluate from '../evaluate'
import Lexemes from '../definitions/lexemes'
import Program from '../definitions/program'
import { Subroutine } from '../definitions/subroutine'
import { Type } from '../../lexer/lexeme'
import { CompilerError } from '../../tools/error'

/** parses lexemes as a variable/parameter type specification */
export default function type (lexemes: Lexemes, routine: Program|Subroutine): [boolean, Type, number, [number, number][]] {
  const lexeme = lexemes.get()
  let stringLength = 32

  // expecting type
  if (!lexeme) {
    throw new CompilerError('Expecting type specification.', lexemes.get(-1))
  }
  switch (lexeme.content) {
    case 'bool':
      lexemes.next()
      return [false, 'boolean', stringLength, []]

    case 'int':
      lexemes.next()
      return [false, 'integer', stringLength, []]

    case 'str':
      lexemes.next()
      // possibly expecting string size specification
      if (lexemes.get()?.content === '[') {
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
          throw new CompilerError('String size must be greater than zero.', integer)
        }
        stringLength = integer.value
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
      return [false, 'string', stringLength, []]

    case 'final':
      throw new CompilerError('"Final" must be written with a capital "F".', lexeme)

    case 'Final':
      lexemes.next()
      return [true, 'boolint', stringLength, []]

    case 'list':
      throw new CompilerError('"List" must be written with a capital "L".', lexeme)

    case 'List': {
      lexemes.next()

      // expecting opening square bracket
      if (!lexemes.get()) {
        throw new CompilerError('"List" must be followed by a type in square brackets.', lexeme)
      }
      if (lexemes.get()?.content !== '[') {
        throw new CompilerError('"List" must be followed by a type in square brackets.', lexemes.get())
      }
      lexemes.next()

      // expecting sub-type
      const arrayType = type(lexemes, routine)

      // constants are not allowed
      if (arrayType[0]) {
        throw new CompilerError('List type cannot be constant.', lexemes.get())
      }

      // expecting comma
      if (!lexemes.get()) {
        throw new CompilerError('List type must be followed by a length specification.', lexemes.get(-1))
      }
      if (lexemes.get()?.content !== ',') {
        throw new CompilerError('List type must be followed by a comma, then a length specification.', lexemes.get())
      }
      lexemes.next()

      // expecting integer expression (size of array)
      const exp = expression(lexemes, routine)
      typeCheck(exp, 'integer')
      const value = evaluate(exp, 'Python', 'array')
      if (typeof value === 'string') {
        throw new CompilerError('List length must be an integer.', exp.lexeme)
      }
      if (value <= 0) {
        throw new CompilerError('List length must be positive.', exp.lexeme)
      }
      arrayType[3].push([0, value - 1]) // -1 because arrays are indexed from zero
  
      // expecting closing square bracket
      if (!lexemes.get()) {
        throw new CompilerError('List type must be followed by closing square brackets.', lexemes.get(-1))
      }
      if (lexemes.get()?.content !== ']') {
        throw new CompilerError('List type must be followed by closing square brackets.', lexemes.get())
      }
      lexemes.next()
      
      // return the full type
      return arrayType
    }

    default:
      throw new CompilerError('{lex} is not a valid type specification (expected "bool", "int", or "str")', lexemes.get())
  }
}
