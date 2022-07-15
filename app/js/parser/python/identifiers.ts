import identifier from './identifier'
import Lexemes from '../definitions/lexemes'
import Program from '../definitions/program'
import { Subroutine } from '../definitions/subroutine'
import { CompilerError } from '../../tools/error'

/** parses lexemes as a comma-separated list of identifiers, and returns the names */
export default function identifiers (lexemes: Lexemes, routine: Program|Subroutine, context: 'global'|'nonlocal'): string[] {
  const names: string[] = []

  // expecting identifier
  const name = identifier(lexemes, routine, false)
  names.push(name)

  // expecting semicolon or new line, or a comma
  if (lexemes.get()?.content === ',') {
    lexemes.next()
    // push more identifiers recursively
    names.push(...identifiers(lexemes, routine, context))
  } else if (lexemes.get()?.type === 'identifier') {
    throw new CompilerError(`Comma missing between ${context} variable declarations.`, lexemes.get(-1))
  }

  return names
}
