/**
 * Coder for Turtle BASIC.
 *
 * This function compiles a "command structure" for Turtle BASIC. A command
 * structure is either a single command (i.e. a variable assignment or a
 * procedure call) or some more complex structure (conditional, loop) containing
 * a series of such commands; in the latter case, the exported function calls
 * itself recusrively, allowing for structures of arbitrary complexity.
 *
 * A program or subroutine is a sequence of command structures; this function
 * comiles a single one, returning the pcode and the index of the next lexeme -
 * the function calling this function (in the main coder module) loops through
 * the lexemes until all command structures have been compiled.
 */
import * as molecules from './molecules'
import * as pcoder from './pcoder'
import { Options } from './options'
import { CompilerError } from '../tools/error'
import { Routine, Variable } from '../parser/routine'
import { Lexeme } from '../lexer/lexeme'
import { PCode } from '../constants/pcodes'

type WIP = { lex: number, pcode: number[][] }

export default function coder (routine: Routine, lex: number, startLine: number, options: Options, oneLine: boolean = false): WIP {
  let wip: WIP

  switch (routine.lexemes[lex].type) {
    // identifiers (variable assignment or procedure call)
    case 'identifier':
      // variable assignment
      if (routine.lexemes[lex + 1] && (routine.lexemes[lex + 1].content === '=')) {
        if (routine.findConstant(routine.lexemes[lex].content)) {
          throw new CompilerError('Constant {lex} cannot be assigned a new value.', routine.lexemes[lex])
        }
        wip = molecules.variableAssignment(routine, routine.lexemes[lex].content, lex + 2, options)
        break
      }

      // otherwise it should be a procedure call
      wip = molecules.procedureCall(routine, lex, options)
      break

    // keywords
    default:
      switch (routine.lexemes[lex].content) {
        // start of IF structure
        case 'IF':
          wip = compileIf(routine, lex + 1, startLine, options)
          break

        // start of FOR structure
        case 'FOR':
          wip = compileFor(routine, lex + 1, startLine, options)
          break

        // start of REPEAT structure
        case 'REPEAT':
          wip = compileRepeat(routine, lex + 1, startLine, options)
          break

        // start of WHILE structure
        case 'WHILE':
          wip = compileWhile(routine, lex + 1, startLine, options)
          break

        // function return value
        case '=':
          wip = molecules.variableAssignment(routine, '!result', lex + 1, options)
          break

        default:
          throw new CompilerError('Statement cannot begin with {lex}.', routine.lexemes[lex])
      }
      break
  }

  // end of statement check
  // bypass within oneLine IF...THEN...ELSE statement (check occurs at the end of the whole statement)
  if (!oneLine && routine.lexemes[wip.lex]) {
    if (routine.lexemes[wip.lex].content === ':' || routine.lexemes[wip.lex].type === 'newline') {
      wip.lex += 1
    } else {
      throw new CompilerError('Statements must be separated by a colon or placed on different lines.', routine.lexemes[wip.lex])
    }
  }

  // all good
  return wip
}

// compile conditional
function compileIf (routine: Routine, lex: number, startLine: number, options: Options): WIP {
  // values we need to generate the IF code
  let test: number[][]
  let ifCode: number[][]
  let elseCode: number[][]
  let oneLine: boolean

  // working variable
  let wip: WIP

  // expecting a boolean expression
  if (!routine.lexemes[lex]) {
    throw new CompilerError('"IF" must be followed by a boolean expression.', routine.lexemes[lex - 1])
  }
  wip = molecules.expression(routine, lex, null, 'boolean', options)
  lex = wip.lex
  test = wip.pcode

  // expecting "then"
  if (!routine.lexemes[lex]) {
    throw new CompilerError('"IF ..." must be followed by "THEN".', routine.lexemes[lex - 1])
  }
  if (routine.lexemes[lex].content !== 'THEN') {
    throw new CompilerError('"IF ..." must be followed by "THEN".', routine.lexemes[lex])
  }
  lex += 1

  // expecting a statement on the same line or a block of statements on a new line
  if (!routine.lexemes[lex]) {
    throw new CompilerError('No statements found after "IF ... THEN".', routine.lexemes[lex])
  }
  if (routine.lexemes[lex].type === 'newline') {
    wip = block(routine, lex + 1, startLine + 1, 'IF', options)
    oneLine = false
  } else {
    oneLine = true
    wip = coder(routine, lex, startLine + 1, options, oneLine)
  }
  lex = wip.lex
  ifCode = wip.pcode

  // happy with an "else" here (but it's optional)
  if (routine.lexemes[lex] && routine.lexemes[lex].content === 'ELSE') {
    lex += 1
    if (!routine.lexemes[lex]) {
      throw new CompilerError('No statements found after "ELSE".', routine.lexemes[lex])
    }
    if (oneLine) {
      if (routine.lexemes[lex].type === 'newline') {
        throw new CompilerError('Statement following "ELSE" cannot be on a new line.', routine.lexemes[lex + 1])
      }
      wip = coder(routine, lex, startLine + ifCode.length + 2, options, oneLine)
    } else {
      if (routine.lexemes[lex].type !== 'newline') {
        throw new CompilerError('Statement following "ELSE" must be on a new line.', routine.lexemes[lex])
      }
      wip = block(routine, lex + 1, startLine + ifCode.length + 2, 'ELSE', options)
    }
    lex = wip.lex
    elseCode = wip.pcode
  } else {
    elseCode = []
  }

  // now we have everything we need
  return { lex, pcode: pcoder.conditional(startLine, test, ifCode, elseCode, options) }
}

// compile for loop
function compileFor (routine: Routine, lex: number, startLine: number, options: Options): WIP {
  // values we need to generate the IF code
  let variable: Variable
  let initial: number[]
  let final: number[]
  let compare: PCode
  let change: PCode
  let innerCode: number[][]

  // working variable
  let wip: WIP

  // expecting an integer variable
  if (!routine.lexemes[lex]) {
    throw new CompilerError('"FOR" must be followed by an integer variable.', routine.lexemes[lex - 1])
  }
  if (routine.lexemes[lex].subtype === 'turtle') {
    throw new CompilerError('Turtle attribute cannot be used as a "FOR" variable.', routine.lexemes[lex])
  }
  if (routine.lexemes[lex].type !== 'identifier') {
    throw new CompilerError('"FOR" must be followed by an integer variable.', routine.lexemes[lex])
  }
  variable = routine.findVariable(routine.lexemes[lex].content)
  if (!variable) {
    throw new CompilerError('Variable {lex} not defined.', routine.lexemes[lex])
  }
  if (variable.type !== 'integer' && variable.type !== 'boolint') {
    throw new CompilerError('{lex} is not an integer variable.', routine.lexemes[lex])
  }
  lex += 1

  // expecting assignment operator
  if (!routine.lexemes[lex]) {
    throw new CompilerError('"FOR" loop variable must be assigned an initial value.', routine.lexemes[lex - 1])
  }
  if (routine.lexemes[lex].content !== '=') {
    throw new CompilerError('"FOR" loop variable must be assigned an initial value.', routine.lexemes[lex])
  }
  lex += 1

  // expecting integer expression (for the initial value)
  if (!routine.lexemes[lex]) {
    throw new CompilerError('"FOR" loop variable must be assigned an initial value.', routine.lexemes[lex - 1])
  }
  wip = molecules.expression(routine, lex, null, 'integer', options)
  lex = wip.lex
  initial = wip.pcode[0]

  // expecting "to"
  if (!routine.lexemes[lex]) {
    throw new CompilerError('forToDownTo', routine.lexemes[lex - 1])
  }
  if (routine.lexemes[lex].content !== 'TO') {
    throw new CompilerError('"FOR" loop initialisation must be followed by "TO".', routine.lexemes[lex])
  }
  lex += 1

  // expecting integer expression (for the final value)
  if (!routine.lexemes[lex]) {
    throw new CompilerError('"TO" must be followed by an integer (or integer constant).', routine.lexemes[lex - 1])
  }
  wip = molecules.expression(routine, lex, null, 'integer', options)
  lex = wip.lex
  final = wip.pcode[0]

  // "STEP -1" possible here
  if (routine.lexemes[lex] && routine.lexemes[lex].content === 'STEP') {
    lex += 1
    if (!routine.lexemes[lex]) {
      throw new CompilerError('"STEP" instruction must be of the form "STEP -1".', routine.lexemes[lex - 1])
    }
    if (routine.lexemes[lex].content !== '-') {
      throw new CompilerError('"STEP" instruction must be of the form "STEP -1".', routine.lexemes[lex])
    }
    lex += 1
    if (!routine.lexemes[lex]) {
      throw new CompilerError('"STEP" instruction must be of the form "STEP -1".', routine.lexemes[lex - 1])
    }
    if (routine.lexemes[lex].value !== 1) {
      throw new CompilerError('"STEP" instruction must be of the form "STEP -1".', routine.lexemes[lex])
    }
    lex += 1
    compare = PCode.lseq
    change = PCode.decr
  } else {
    compare = PCode.mreq
    change = PCode.incr
  }

  // expecting a statement on the same line or a block of statements on a new line
  if (!routine.lexemes[lex]) {
    throw new CompilerError('No statements found after "FOR" loop initialisation.', routine.lexemes[lex])
  }
  if (routine.lexemes[lex].type === 'newline') {
    wip = block(routine, lex + 1, startLine + 3, 'FOR', options)
  } else {
    wip = coder(routine, lex, startLine + 3, options)
  }
  lex = wip.lex
  innerCode = wip.pcode

  // now we have everything we need
  return {
    lex,
    pcode: pcoder.forLoop(startLine, variable, initial, final, compare, change, innerCode, options)
  }
}

// compile repeat loop
function compileRepeat (routine: Routine, lex: number, startLine: number, options: Options): WIP {
  // values we need to generate the REPEAT code
  let test: number[][]
  let innerCode: number[][]

  // working variable
  let wip: WIP

  // expecting a statement on the same line or a block of statements on a new line
  if (!routine.lexemes[lex]) {
    throw new CompilerError('No statements found after "REPEAT".', routine.lexemes[lex])
  }
  if (routine.lexemes[lex].type === 'newline') {
    wip = block(routine, lex + 1, startLine, 'REPEAT', options)
  } else {
    wip = coder(routine, lex, startLine, options)
  }
  lex = wip.lex
  innerCode = wip.pcode

  // expecting a boolean expression
  if (!routine.lexemes[lex]) {
    throw new CompilerError('"UNTIL" must be followed by a boolean expression.', routine.lexemes[lex - 1])
  }
  wip = molecules.expression(routine, lex, null, 'boolean', options)
  lex = wip.lex
  test = wip.pcode

  // now we have everything we need
  return { lex, pcode: pcoder.repeatLoop(startLine, test, innerCode, options) }
}

// compile while loop
function compileWhile (routine: Routine, lex: number, startLine: number, options: Options): WIP {
  // values we need to generate the WHILE code
  let test: number[][]
  let innerCode: number[][]

  // working variable
  let wip: WIP

  // expecting a boolean expression
  if (!routine.lexemes[lex]) {
    throw new CompilerError('"WHILE" must be followed by a boolean expression.', routine.lexemes[lex - 1])
  }
  wip = molecules.expression(routine, lex, null, 'boolean', options)
  lex = wip.lex
  test = wip.pcode

  // expecting a statement on the same line or a block of statements on a new line
  if (!routine.lexemes[lex]) {
    throw new CompilerError('No commands found after "WHILE ... DO".', routine.lexemes[lex])
  }
  if (routine.lexemes[lex].type === 'newline') {
    wip = block(routine, lex + 1, startLine + 1, 'WHILE', options)
  } else {
    wip = coder(routine, lex, startLine + 1, options)
  }
  lex = wip.lex
  innerCode = wip.pcode

  // now we have everything we need to generate the pcode
  return { lex, pcode: pcoder.whileLoop(startLine, test, innerCode, options) }
}

// generate the pcode for a block of commands
function block (routine: Routine, lex: number, startLine: number, startKeyword: string, options: Options): WIP {
  let pcode: number[][] = []
  let end: boolean = false
  let wip: WIP

  // expecting something
  if (!routine.lexemes[lex]) {
    throw new CompilerError(`No commands found after "${startKeyword}".`, routine.lexemes[lex - 1])
  }

  // loop through until the end of the block (or we run out of lexemes)
  while (!end && (lex < routine.lexemes.length)) {
    end = blockEndCheck(startKeyword, routine.lexemes[lex], options)
    if (end) {
      // move past the next lexeme, unless it's "else"
      if (routine.lexemes[lex].content !== 'ELSE') lex += 1
    } else {
      // compile the structure
      wip = coder(routine, lex, startLine + pcode.length, options)
      pcode = pcode.concat(wip.pcode)
      lex = wip.lex
    }
  }

  // final checks
  if (!end) throw new CompilerError(`Unterminated "${startKeyword}" statement.`, routine.lexemes[lex - 1])

  // otherwise all good
  return { lex, pcode }
}

// check for the ending to a block, and throw an error if it doesn't match the beginning
function blockEndCheck (start: string, lexeme: Lexeme, options: Options): boolean {
  switch (lexeme.content) {
    case 'ELSE':
      if (start !== 'IF') {
        throw new CompilerError('"ELSE" does not have any matching "IF".', lexeme)
      }
      return true

    case 'ENDIF':
      if ((start !== 'IF') && (start !== 'ELSE')) {
        throw new CompilerError('"ENDIF" does not have any matching "IF".', lexeme)
      }
      return true

    case 'NEXT':
      if (start !== 'FOR') {
        throw new CompilerError('"NEXT" does not have any matching "FOR".', lexeme)
      }
      return true

    case 'UNTIL':
      if (start !== 'REPEAT') {
        throw new CompilerError('"UNTIL" does not have any matching "REPEAT".', lexeme)
      }
      return true

    case 'ENDWHILE':
      if (start !== 'WHILE') {
        throw new CompilerError('"ENDWHILE" does not have any matching "WHILE".', lexeme)
      }
      return true

    default:
      return false
  }
}
