import identifier from './identifier'
import type from './type'
import Lexemes from '../definitions/lexemes'
import Program from '../definitions/program'
import { Subroutine } from '../definitions/subroutine'
import Variable from '../definitions/variable'
import { CompilerError } from '../../tools/error'

/** parses lexemes as a variable declaration */
export default function variable (lexemes: Lexemes, routine: Program|Subroutine, duplicateCheck: boolean): Variable {
  // expecting identifier
  const name = identifier(lexemes, routine, duplicateCheck)

  // expecting type specification
  const [variableType, stringLength, arrayDimensions] = type(lexemes, routine)

  // "void" not allowed for variables
  if (variableType === null) {
    throw new CompilerError('Variable cannot be void (expected "boolean", "number", or "string").', lexemes.get())
  }

  // create the variable
  const variable = new Variable(name, routine)
  variable.type = variableType
  variable.stringLength = stringLength
  variable.arrayDimensions = arrayDimensions

  // return the variable
  return variable
}
