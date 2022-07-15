import identifier from './identifier'
import type from './type'
import Lexemes from '../definitions/lexemes'
import Program from '../definitions/program'
import { Subroutine } from '../definitions/subroutine'
import { Constant } from '../definitions/constant'
import Variable from '../definitions/variable'

/** parses lexemes as a variable/parameter declaration */
export default function variable (lexemes: Lexemes, routine: Program|Subroutine): Constant|Variable {
  // expecting identifier
  const name = identifier(lexemes, routine, true)

  // colon followed by type hint is permissible here
  if (lexemes.get() && lexemes.get()?.content === ":") {
    lexemes.next()

    // expecting type specification
    const [isConstant, variableType, stringLength, arrayDimensions] = type(lexemes, routine)
  
    if (isConstant) {
      // return the constant with any value; the value will be set later
      return new Constant('Python', name, 0)
    }
  
    // create and return the variable
    const variable = new Variable(name, routine)
    variable.type = variableType
    variable.typeIsCertain = true
    variable.stringLength = stringLength
    variable.arrayDimensions = arrayDimensions
    return variable
  }

  // if there's no type hint, just return a default (boolint) variable
  return new Variable(name, routine)
}
