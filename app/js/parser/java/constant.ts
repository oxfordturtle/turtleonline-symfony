import type from './type'
import identifier from './identifier'
import Lexemes from '../definitions/lexemes'
import { Constant } from '../definitions/constant'
import Program from '../definitions/program'
import { Subroutine } from '../definitions/subroutine'
import { expression, typeCheck } from '../expression'
import evaluate from '../evaluate'
import { CompilerError } from '../../tools/error'

/** parses lexemes as a constant definition, and returns the constant */
export default function constant (lexemes: Lexemes, routine: Program|Subroutine): Constant {
  // expecting type specification
  const [constantType, , arrayDimensions] = type(lexemes, routine)
  if (constantType === null) {
    throw new CompilerError('Constant type cannot be void (expected "boolean", "char", "int", or "String").', lexemes.get())
  }
  if (arrayDimensions.length > 0) {
    throw new CompilerError('Constant cannot be an array.', lexemes.get())
  }

  // expecting identifier
  const name = identifier(lexemes, routine)

  // expecting "="
  if (!lexemes.get()) {
    throw new CompilerError(`Constant ${name} must be assigned a value.`, lexemes.get(-1))
  }
  if (lexemes.get()?.content !== '=') {
    throw new CompilerError(`Constant ${name} must be assigned a value.`, lexemes.get())
  }
  lexemes.next()

  // expecting value expression
  const exp = expression(lexemes, routine)
  typeCheck(exp, constantType)
  const value = evaluate(exp, 'Java', 'constant')

  // create and return the constant
  return new Constant('Java', name, value)
}
