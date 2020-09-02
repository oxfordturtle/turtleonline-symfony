/**
 * Compile the basic 'atoms' of a program, i.e. literal values, variable calls,
 * function calls, etc.
 *
 * These functions are called by the molecules module - they are where the
 * recursions in that module ultimately bottom out.
 */
import check from './check'
import * as pcoder from './pcoder'
import { Options } from './options'
import { CompilerError } from '../tools/error'
import { Routine, VariableType } from '../parser/routine'

type Result = { type: VariableType, lex: number, pcode: number[][] }

// literal value
export function literal (routine: Routine, lex: number, needed: VariableType|null, type: VariableType, options: Options): Result {
  // check this type is ok (will throw an error if not)
  check(needed, type, routine.lexemes[lex], options)

  // get the pcode
  const pcode = [pcoder.loadLiteralValue(needed, routine.lexemes[lex].type as VariableType, routine.lexemes[lex].value, options)]

  // return the stuff
  return { type, lex: lex + 1, pcode }
}

// input keycode or query
export function input (routine: Routine, lex: number, needed: VariableType|null, options: Options): Result {
  const hit = routine.findInput(routine.lexemes[lex].content)

  if (hit) {
    // check the type is ok (will throw an error if not)
    check(needed, 'integer', routine.lexemes[lex], options)

    // return the stuff
    return { type: 'integer', lex: lex + 1, pcode: [pcoder.loadInputValue(hit, options)] }
  }
}

// constant
export function constant (routine: Routine, lex: number, needed: VariableType|null, options: Options): Result {
  const { lexemes } = routine
  const hit = routine.findConstant(lexemes[lex].content)

  if (hit) {
    // check the type is ok (will throw an error if not)
    check(needed, hit.type, lexemes[lex], options)

    // return the stuff
    return { type: hit.type, lex: lex + 1, pcode: [pcoder.loadLiteralValue(needed, hit.type, hit.value, options)] }
  }
}

// variable
export function variable (routine: Routine, lex: number, needed: VariableType|null, options: Options): Result {
  const { lexemes } = routine
  const hit = routine.findVariable(lexemes[lex].content)

  if (hit) {
    // check for array element reference and throw new CompilerError for now
    if (lexemes[lex + 1] && lexemes[lex + 1].content === '[') {
      throw new CompilerError('The online Turtle System does not yet support arrays. This feature will be added soon. In the meantime, please use the downloadable Turtle System to compile this program.', lexemes[lex])
    }

    // check the type is okay (will throw an error if not)
    check(needed, hit.type, lexemes[lex], options)

    // return the stuff
    return { type: hit.type, lex: lex + 1, pcode: [pcoder.loadVariableValue(hit, options)] }
  }
}

// native colour constant
export function colour (routine: Routine, lex: number, needed: VariableType|null, options: Options): Result {
  const { lexemes } = routine
  const hit = routine.findColour(lexemes[lex].content)

  if (hit) {
    // check the type is ok (will throw an error if not)
    check(needed, 'integer', lexemes[lex], options)

    // return the stuff
    return { type: 'integer', lex: lex + 1, pcode: [pcoder.loadLiteralValue(needed, hit.type, hit.value, options)] }
  }
}
