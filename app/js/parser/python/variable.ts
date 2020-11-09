import identifier from './identifier'
import type from './type'
import Lexemes from '../definitions/lexemes'
import Program from '../definitions/program'
import { Subroutine } from '../definitions/subroutine'
import { Constant, IntegerConstant, StringConstant } from '../definitions/constant'
import Variable from '../definitions/variable'
import { CompilerError } from '../../tools/error'

/** parses lexemes as a variable/parameter declaration */
export default function variable (lexemes: Lexemes, routine: Program|Subroutine): Constant|Variable {
  // expecting identifier
  const name = identifier(lexemes, routine, true)

  // expecting colon
  if (!lexemes.get()) {
    throw new CompilerError('Expected a colon ":" followed by a type specification.', lexemes.get(-1))
  }
  if (lexemes.get()?.content !== ':') {
    throw new CompilerError('Expected a colon ":" followed by a type specification.', lexemes.get())
  }
  lexemes.next()

  // expecting type specification
  const [isConstant, variableType, stringLength, arrayDimensions] = type(lexemes, routine)

  if (isConstant) {
    // return the constant with any value; the value will be set later
    return (variableType === 'string')
      ? new StringConstant('Python', name, '')
      : new IntegerConstant('Python', name, 0)
  }

  // create and return the variable
  const variable = new Variable(name, routine)
  variable.type = variableType
  variable.stringLength = stringLength
  variable.arrayDimensions = arrayDimensions
  return variable
}
