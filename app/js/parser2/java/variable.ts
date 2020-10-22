import identifier from './identifier'
import type from './type'
import { Program } from '../definitions/program'
import { Subroutine } from '../definitions/subroutine'
import { Variable } from '../definitions/variable'
import { CompilerError } from '../../tools/error'

/** parses lexemes as a variable declaration */
export default function variable (routine: Program|Subroutine, subroutine?: Subroutine): Variable {
  // expecting type specification
  const [variableType, arrayDimensions] = type(routine)

  // "void" not allowed for variables
  if (variableType === null) {
    throw new CompilerError('Variable cannot be void (expected "boolean", "char", "int", or "String").', routine.lex())
  }

  // expecting identifier
  const name = identifier(routine)

  // create the variable
  const variable = new Variable(name, subroutine || routine)
  variable.type = variableType
  variable.arrayDimensions = arrayDimensions

  // return the variable
  return variable
}
