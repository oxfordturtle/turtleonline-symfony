import type from './type'
import identifier from './identifier'
import { eosCheck } from './statement'
import { Constant } from '../definitions/constant'
import { Program } from '../definitions/program'
import { Subroutine } from '../definitions/subroutine'
import { expression, typeCheck } from '../expression'
import evaluate from '../evaluate'
import { Lex } from '../lex'
import { CompilerError } from '../../tools/error'

/** parses lexemes as a constant definition, and returns the constant */
export default function constant (routine: Program|Subroutine, lex: Lex): Constant {
  // expecting "final"
  // N.B. this should always be the case, otherwise we wouldn't be here, but it
  // doesn't hurt to cover all bases
  if (!lex.get()) {
    throw new CompilerError('Constant definition must begin with keyword "final".', lex.get(-1))
  }
  if (lex.content() !== 'final') {
    throw new CompilerError('Constant definition must begin with keyword "final".', lex.get())
  }

  // expecting type specification
  const [constantType, arrayDimensions] = type(lex)
  if (constantType === null) {
    throw new CompilerError('Constant type cannot be void (expected "boolean", "char", "int", or "String").', lex.get())
  }
  if (arrayDimensions > 0) {
    throw new CompilerError('Constant cannot be an array.', lex.get())
  }

  // expecting identifier
  const name = identifier(lex)

  // expecting "="
  if (!lex.get()) {
    throw new CompilerError(`Constant ${name} must be assigned a value.`, lex.get(-1))
  }
  if (lex.content() !== '=') {
    throw new CompilerError(`Constant ${name} must be assigned a value.`, lex.get())
  }
  lex.step()

  // expecting value expression
  const exp = expression(routine, lex)
  typeCheck(exp, constantType, lex.get())
  const value = evaluate(exp, 'Java', lex.get())

  // end of statement check
  eosCheck(lex)

  // create and return the constant
  return new Constant('Java', name, constantType, value)
}
