/**
 * Type check function (throws an error if check fails, does nothing otherwise).
 */
import { Options } from './options'
import { CompilerError } from '../tools/error'
import { VariableType } from '../parser/routine'
import { Lexeme } from '../lexer/lexeme'

export default function (needed: VariableType|null, found: VariableType, lexeme: Lexeme, options: Options): void {
  // if NULL is needed, everything is ok
  if (needed === null) return

  // found and needed the same is obviously ok
  if (found === needed) return

  // if STRING is needed, CHAR is ok
  if ((needed === 'string') && (found === 'character')) return

  // if CHAR is needed, STRING of length 1 is ok
  if ((needed === 'character') && (found === 'string') && ((lexeme.value as string).length === 1)) return

  // if BOOLINT is needed, either BOOLEAN or INTEGER is ok
  if (needed === 'boolint' && (found === 'boolean' || found === 'integer')) return

  // if BOOLINT is found, either BOOLEAN or INTEGER needed is ok
  if (found === 'boolint' && (needed === 'boolean' || needed === 'integer')) return

  // everything else is an error
  throw new CompilerError(`Type error: '${needed}' expected but '${found}' found.`, lexeme)
}
