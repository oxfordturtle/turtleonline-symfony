import { Program } from '../definitions/program'
import { Subroutine } from '../definitions/subroutine'
import * as find from '../find'
import { CompilerError } from '../../tools/error'

/** parses lexeme as an identifier (checking for potential errors) */
export default function identifier (routine: Program|Subroutine): string {
  if (!routine.lex()) {
    throw new CompilerError('Type specification must be followed by an identifier.', routine.lex(-1))
  }

  if (routine.lex()?.type !== 'identifier') {
    throw new CompilerError('{lex} is not a valid identifier.', routine.lex())
  }

  if (routine.lex()?.subtype === 'turtle') {
    throw new CompilerError('{lex} is already the name of a predefined Turtle property.', routine.lex())
  }

  if (find.isDuplicate(routine, routine.lex()?.content as string)) {
    throw new CompilerError('{lex} is already defined in the current scope.', routine.lex())
  }

  const name = routine.lex()?.content as string
  routine.lexemeIndex += 1

  return name
}
