import { expression, typeCheck } from '../expression'
import evaluate from '../evaluate'
import { Program } from '../definitions/program'
import { Subroutine } from '../definitions/subroutine'
import { Type } from '../definitions/type'
import { CompilerError } from '../../tools/error'

/** parses lexemes at a type specification */
export default function type (routine: Program|Subroutine): [Type|null, [number, number][]] {
  const typeLexeme = routine.lex()

  // expecting type
  if (!typeLexeme) {
    throw new CompilerError('Expected type definition ("boolean", "char", "int", "String", or "void").', routine.lex(-1))
  }
  if (typeLexeme?.subtype !== 'type') {
    throw new CompilerError('{lex} is not a valid type definition (expected "boolean", "char", "int", "String", or "void").', routine.lex(-1))
  }
  const type = typeLexeme?.value as Type|null
  routine.lexemeIndex += 1

  // possibly expecting brackets (for arrays)
  let arrayDimensions: [number, number][] = []
  while (routine.lex()?.content === '[') {
    routine.lexemeIndex += 1

    // expecting array dimension size
    if (!routine.lex()) {
      throw new CompilerError('Opening bracket "[" must be followed by an array size.', routine.lex(-1))
    }
    const exp = expression(routine)
    typeCheck(exp, 'integer', routine.lex())
    const value = evaluate(exp, 'Java', 'array', routine.lex())
    if (typeof value === 'string') {
      throw new CompilerError('Array size must be an integer.', routine.lex())
    }
    if (value <= 0) {
      throw new CompilerError('Array size must be positive.', routine.lex())
    }
    arrayDimensions.push([0, value])

    // expecting closing bracket
    if (!routine.lex()) {
      throw new CompilerError('Array size specification must be followed by closing bracket "]".', routine.lex(-1))
    }
    if (routine.lex()?.content !== ']') {
      throw new CompilerError('Array size specification must be followed by closing bracket "]".', routine.lex())
    }
    routine.lexemeIndex += 1
  }

  // sanity check
  if (type === null && arrayDimensions.length > 0) {
    throw new CompilerError('Array of void is not allowed.', typeLexeme)
  }

  // return type and array dimensions
  return [type, arrayDimensions]
}
