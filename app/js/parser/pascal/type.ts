import { expression, typeCheck } from '../expression'
import evaluate from '../evaluate'
import type Lexemes from '../definitions/lexemes'
import type Program from '../definitions/program'
import type { Subroutine } from '../definitions/subroutine'
import type { Type } from '../../lexer/lexeme'
import { CompilerError } from '../../tools/error'

/** parses lexemes at a type specification */
export default function type (lexemes: Lexemes, routine: Program|Subroutine, isParameter: boolean): [Type, number, [number, number][]] {
  // expecting ":"
  if (!lexemes.get()) {
    throw new CompilerError('Expected type specification (": <type>").', lexemes.get(-1))
  }
  if (lexemes.get()?.content !== ':') {
    throw new CompilerError('Expected type specification (": <type>").', lexemes.get())
  }
  lexemes.next()

  // possibly expecting array dimensions
  const arrayDimensions: [number, number][] = []
  if (lexemes.get()?.content === 'array') {
    if (isParameter) {
      while (lexemes.get()?.content === 'array') {
        // give dummy array dimensions
        arrayDimensions.push([0, 0])
        lexemes.next()
        // expecting "of"
        if (!lexemes.get() || lexemes.get()?.content !== 'of') {
          throw new CompilerError('Keyword "array" must be followed by "of".', lexemes.get(-1))
        }
        lexemes.next()
      }
    } else {
      lexemes.next()
      // expecting opening bracket "["
      if (!lexemes.get() && lexemes.get()?.content !== '[') {
        throw new CompilerError('Keyword "array" must be followed by array dimensions.', lexemes.get(-1))
      }
      lexemes.next()
      // expecting comma separated list of dimensions
      while (lexemes.get() && lexemes.get()?.content !== ']') {
        // expecting start index
        const startExp = expression(lexemes, routine)
        typeCheck(startExp, 'integer')
        const start = evaluate(startExp, 'Pascal', 'array') as number
        // expecting ".."
        if (!lexemes.get() || lexemes.get()?.content !== '..') {
          throw new CompilerError('Array start index must be followed by ".." then the end index.', lexemes.get(-1))
        }
        lexemes.next()
        // expecting end index
        const endExp = expression(lexemes, routine)
        typeCheck(endExp, 'integer')
        const end = evaluate(endExp, 'Pascal', 'array') as number
        // push the dimensions and move on
        arrayDimensions.push([start, end])
        if (lexemes.get()?.content === ',') {
          lexemes.next()
        } else if (lexemes.get()?.content !== ']') {
          throw new CompilerError('Comma missing between array dimensions.', lexemes.get(-1))
        }
      }
      // check we came out of the previous loop for the right reason
      if (!lexemes.get()) {
        throw new CompilerError('Closing bracket "]" missing after array dimensions specification.', lexemes.get(-1))
      }
      lexemes.next() // move past the closing bracket
      // expecting "of"
      if (!lexemes.get() || lexemes.get()?.content?.toLowerCase() !== 'of') {
        throw new CompilerError('"array[...]" must be followed by "of".', lexemes.get(-1))
      }
      lexemes.next()
    }
  }

  // expecting type
  const typeLexeme = lexemes.get()
  if (!typeLexeme) {
    throw new CompilerError('Expected type definition ("array", "boolean", "char", "integer", or "string").', lexemes.get(-1))
  }
  if (typeLexeme.type !== 'type') {
    throw new CompilerError('{lex} is not a valid type definition (expected "array", "boolean", "char", "integer", or "string").', lexemes.get())
  }
  const type = typeLexeme.subtype as Type
  lexemes.next()

  // possibly expecting string size specification
  let stringLength = 32
  if (type === 'string') {
    if (lexemes.get()?.content === '[') {
      lexemes.next()
      // expecting positive integer
      const stringLengthExp = expression(lexemes, routine)
      typeCheck(stringLengthExp, 'integer')
      stringLength = evaluate(stringLengthExp, 'Pascal', 'string') as number
      // expecting closing bracket
      if (!lexemes.get()) {
        throw new CompilerError('Closing bracket "]" missing after string size specification.', lexemes.get(-1))
      }
      if (lexemes.get()?.content !== ']') {
        throw new CompilerError('Closing bracket "]" missing after string size specification.', lexemes.get())
      }
      lexemes.next()
    }
  }

  // return type and array dimensions
  return [type, stringLength, arrayDimensions]
}
