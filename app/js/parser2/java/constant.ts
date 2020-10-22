import type from './type'
import identifier from './identifier'
import { eosCheck } from './statement'
import { Constant } from '../definitions/constant'
import { Program } from '../definitions/program'
import { Subroutine } from '../definitions/subroutine'
import { expression, typeCheck } from '../expression'
import evaluate from '../evaluate'
import { CompilerError } from '../../tools/error'

/** parses lexemes as a constant definition, and returns the constant */
export default function constant (routine: Program|Subroutine): Constant {
  // expecting "final"
  // N.B. this should always be the case, otherwise we wouldn't be here, but it
  // doesn't hurt to cover all bases
  if (!routine.lex()) {
    throw new CompilerError('Constant definition must begin with keyword "final".', routine.lex(-1))
  }
  if (routine.lex()?.content !== 'final') {
    throw new CompilerError('Constant definition must begin with keyword "final".', routine.lex())
  }
  routine.lexemeIndex += 1

  // expecting type specification
  const [constantType, arrayDimensions] = type(routine)
  if (constantType === null) {
    throw new CompilerError('Constant type cannot be void (expected "boolean", "char", "int", or "String").', routine.lex())
  }
  if (arrayDimensions.length > 0) {
    throw new CompilerError('Constant cannot be an array.', routine.lex())
  }

  // expecting identifier
  const name = identifier(routine)

  // expecting "="
  if (!routine.lex()) {
    throw new CompilerError(`Constant ${name} must be assigned a value.`, routine.lex(-1))
  }
  if (routine.lex()?.content !== '=') {
    throw new CompilerError(`Constant ${name} must be assigned a value.`, routine.lex())
  }
  routine.lexemeIndex += 1

  // expecting value expression
  const exp = expression(routine)
  typeCheck(exp, constantType, routine.lex())
  const value = evaluate(exp, 'Java', 'constant', routine.lex())

  // create and return the constant
  return new Constant('Java', name, constantType, value)
}
