/**
 * Compile the basic 'atoms' of a program, i.e. literal values, variable calls,
 * function calls, etc.
 *
 * These functions are called by the molecules module - they are where the
 * recursions in that module ultimately bottom out.
 */
import { WIP, ExpressionType, check } from './misc'
import * as pcoder from '../../pcoder/misc'
import { Options } from '../options'
import { CompilerError } from '../../tools/error'
import { Routine, VariableType } from '../../parser/routine'

/** compiles a literal value as part of an expression */
export function literal (routine: Routine, lex: number, needed: ExpressionType, type: ExpressionType, options: Options): WIP {
  // check this type is ok (will throw an error if not)
  check(needed, type, routine.lexemes[lex], options)

  // get the pcode
  const pcode = [pcoder.loadLiteralValue(needed.variableType, routine.lexemes[lex].type as VariableType, routine.lexemes[lex].value, options)]

  // return the stuff
  return { type, lex: lex + 1, pcode }
}

/** compiles an input keycode or query as part of an expression */
export function input (routine: Routine, lex: number, needed: ExpressionType, options: Options): WIP {
  const hit = routine.findInput(routine.lexemes[lex].content)

  if (hit) {
    const type: ExpressionType = { variableType: 'integer', arrayDimensions: 0 }
    // check the type is ok (will throw an error if not)
    check(needed, type, routine.lexemes[lex], options)

    // return the stuff
    return { type, lex: lex + 1, pcode: [pcoder.loadInputValue(hit, options)] }
  }
}

/** compiles a constant as part of an expression */
export function constant (routine: Routine, lex: number, needed: ExpressionType, options: Options): WIP {
  const { lexemes } = routine
  const hit = routine.findConstant(lexemes[lex].content)

  if (hit) {
    const type: ExpressionType = { variableType: hit.type, arrayDimensions: 0 }
    // check the type is ok (will throw an error if not)
    check(needed, type, lexemes[lex], options)

    // return the stuff
    return { type, lex: lex + 1, pcode: [pcoder.loadLiteralValue(needed.variableType, hit.type, hit.value, options)] }
  }
}

/** compiles a variable as part of an expression */
export function variable (routine: Routine, lex: number, needed: ExpressionType, options: Options): WIP {
  const { lexemes } = routine
  const variable = routine.findVariable(lexemes[lex].content)

  if (variable) {
    // check for array element reference and throw new CompilerError for now
    if (lexemes[lex + 1] && lexemes[lex + 1].content === '[') {
      throw new CompilerError('The online Turtle System does not yet support arrays. This feature will be added soon. In the meantime, please use the downloadable Turtle System to compile this program.', lexemes[lex])
    }

    const type = { variableType: variable.type, arrayDimensions: variable.arrayDimensions.length }

    // check the type is okay (will throw an error if not)
    check(needed, type, lexemes[lex], options)

    // return the stuff
    return { type, lex: lex + 1, pcode: [pcoder.loadVariableValue(variable, options)] }
  }
}

/** compiles a native colour constant as part of an expression */
export function colour (routine: Routine, lex: number, needed: ExpressionType, options: Options): WIP {
  const { lexemes } = routine
  const colour = routine.findColour(lexemes[lex].content)

  if (colour) {
    const type: ExpressionType = { variableType: 'integer', arrayDimensions: 0 }

    // check the type is ok (will throw an error if not)
    check(needed, type, lexemes[lex], options)

    // return the stuff
    return { type, lex: lex + 1, pcode: [pcoder.loadLiteralValue(needed.variableType, colour.type, colour.value, options)] }
  }
}
