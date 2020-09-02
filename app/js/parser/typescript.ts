/**
 * Parser for Turtle TypeScript - lexemes go in, array of routines comes out the
 * first element in the array is the main PROGRAM object.
 *
 * This analyses the structure of the program, and builds up lists of all the
 * variables and subroutines (with their variables and parameters); lexemes for
 * the program (and any subroutine) code themselves are just stored for
 * subsequent handling by the pcoder.
 */
import { Routine, Program, Subroutine, Variable, VariableType, Constant, SubroutineType } from './routine'
import { Lexeme } from '../lexer/lexeme'
import { CompilerError } from '../tools/error'

/** fsm states */
type State =
  | 'start'

/** working variables modified by the fsm's subroutines */
type WIP = {
  routines: Routine[] // array of routines to be returned (0 being the main program)
  routine: Routine // reference to the current routine
  lex: number // index of the current lexeme
  state: State // the current fsm state
  context: 'program'|'procedure'|'function'|'end' // the current context
}

/** parses lexemes as a TypeScript program */
export default function typescript (lexemes: Lexeme[]): Routine[] {
  return []
}
