import { Program } from '../definitions/program'
import { Subroutine } from '../definitions/subroutine'
import * as find from '../find'
import { Lex } from '../lex'
import { CompilerError } from '../../tools/error'

/** parses lexeme as an identifier (checking for potential errors) */
export default function identifier (routine: Program|Subroutine, lex: Lex): string {
  if (!lex.get()) {
    throw new CompilerError('Type specification must be followed by an identifier.', lex.get(-1))
  }

  if (lex.type() !== 'identifier') {
    throw new CompilerError('{lex} is not a valid identifier.', lex.get())
  }

  if (lex.subtype() === 'turtle') {
    throw new CompilerError('{lex} is already the name of a predefined Turtle property.', lex.get())
  }

  if (find.isDuplicate(routine, lex.content() as string)) {
    throw new CompilerError('{lex} is already defined in the current scope.', lex.get())
  }

  return lex.content() as string
}
