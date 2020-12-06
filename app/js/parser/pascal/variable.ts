import identifier from './identifier'
import { semicolon } from './statement'
import type from './type'
import type Lexemes from '../definitions/lexemes'
import type Program from '../definitions/program'
import type { Subroutine } from '../definitions/subroutine'
import Variable from '../definitions/variable'
import { CompilerError } from '../../tools/error'

/** parses lexemes as a declaration of variables (after "var") */
export function variables (lexemes: Lexemes, routine: Program|Subroutine): Variable[] {
  const vars: Variable[] = []

  // expecting comma separated list of variables
  while (lexemes.get() && lexemes.get()?.content !== ':') {
    const name = identifier(lexemes, routine)
    vars.push(new Variable(name, routine))
    if (lexemes.get()?.content === ',') {
      lexemes.next()
    } else if (lexemes.get()?.type === 'identifier') {
      throw new CompilerError('Comma missing between variable names.', lexemes.get())
    }
  }

  // expecting type specification
  const [variableType, stringLength, arrayDimensions] = type(lexemes, routine, false)
  for (const foo of vars) {
    foo.type = variableType
    foo.stringLength = stringLength
    foo.arrayDimensions = arrayDimensions
  }

  // expecting a semicolon
  semicolon(lexemes, true, 'variable declaration')

  // an identifier next means more variable declarations
  if (lexemes.get() && lexemes.get()?.type === 'identifier') {
    vars.push(...variables(lexemes, routine))
  }

  // return the variables
  return vars
}
