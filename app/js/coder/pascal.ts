/**
 * Coder for Turtle Pascal.
 *
 * This function compiles a "command structure" for Turtle Pascal. A command
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
import { Options } from './options'
import * as pcoder from './pcoder'
import { CompilerError } from '../tools/error'
import { Routine, Variable } from '../parser/routine'
import { Lexeme } from '../lexer/lexeme'
import { PCode } from '../constants/pcodes'

type WIP = { lex: number, pcode: number[][] }

export default function coder (routine: Routine, lex: number, startLine: number, options: Options): WIP {
  const noSemiAfter = ['begin', 'do', '.', 'repeat', ';', 'then']
  const noSemiBefore = ['else', 'end', ';', 'until']
  let wip: WIP

  switch (routine.lexemes[lex].type) {
    // identifiers (variable assignment or procedure call)
    case 'identifier':
      // array index
      if (routine.lexemes[lex + 1] && routine.lexemes[lex + 1].content === '[') {
        throw new CompilerError('The online Turtle System does not yet support arrays. This feature will be added soon. In the meantime, please use the downloadable Turtle System to compile this program.', routine.lexemes[lex])
      }

      // wrong assignment operator
      if (routine.lexemes[lex + 1] && (routine.lexemes[lex + 1].content === '=')) {
        throw new CompilerError('Variable assignment in Pascal uses ":=", not "=".', routine.lexemes[lex + 1])
      }

      // right assignment operator
      if (routine.lexemes[lex + 1] && (routine.lexemes[lex + 1].content === ':=')) {
        wip = molecules.variableAssignment(routine, routine.lexemes[lex].content, lex + 2, options)
        break
      }

      // otherwise it should be a procedure call
      wip = molecules.procedureCall(routine, lex, options)
      break

    // keywords
    case 'keyword':
      switch (routine.lexemes[lex].content) {
        // start of IF structure
        case 'if':
          wip = compileIf(routine, lex + 1, startLine, options)
          break

        // start of FOR structure
        case 'for':
          wip = compileFor(routine, lex + 1, startLine, options)
          break

        // start of REPEAT structure
        case 'repeat':
          wip = compileRepeat(routine, lex + 1, startLine, options)
          break

        // start of WHILE structure
        case 'while':
          wip = compileWhile(routine, lex + 1, startLine, options)
          break

        default:
          throw new CompilerError('Command cannot begin with {lex}.', routine.lexemes[lex])
      }
      break

    // any thing else is a mistake
    default:
      throw new CompilerError('Command cannot begin with {lex}.', routine.lexemes[lex])
  }

  // semicolon check
  if (routine.lexemes[wip.lex]) {
    if (routine.lexemes[wip.lex].content !== ';') {
      if (noSemiAfter.indexOf(routine.lexemes[wip.lex - 1].content) === -1) {
        if (noSemiBefore.indexOf(routine.lexemes[wip.lex].content) === -1) {
          throw new CompilerError('Semicolon needed after command.', routine.lexemes[wip.lex])
        }
      }
    } else {
      while (routine.lexemes[wip.lex] && routine.lexemes[wip.lex].content === ';') {
        wip.lex += 1
      }
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
  if (routine.lexemes[lex].content !== 'then') {
    throw new CompilerError('"IF ..." must be followed by "THEN".', routine.lexemes[lex])
  }
  lex += 1

  // expecting a command or a block of commands
  if (!routine.lexemes[lex]) {
    throw new CompilerError('No commands found after "IF".', routine.lexemes[lex])
  }
  if (routine.lexemes[lex].content === 'begin') {
    wip = block(routine, lex + 1, startLine + 1, 'begin', options)
  } else {
    wip = coder(routine, lex, startLine + 1, options)
  }
  lex = wip.lex
  ifCode = wip.pcode

  // happy with an "else" here (but it's optional)
  if (routine.lexemes[lex] && routine.lexemes[lex].content === 'else') {
    // expecting a command or a block of commands
    lex += 1
    if (!routine.lexemes[lex]) {
      throw new CompilerError('No commands found after "ELSE".', routine.lexemes[lex])
    }
    if (routine.lexemes[lex].content === 'begin') {
      wip = block(routine, lex + 1, startLine + ifCode.length + 2, 'begin', options)
    } else {
      wip = coder(routine, lex, startLine + ifCode.length + 2, options)
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
    throw new CompilerError('Variable {lex} has not been declared.', routine.lexemes[lex])
  }
  if (variable.type !== 'integer') {
    throw new CompilerError('{lex} is not an integer variable.', routine.lexemes[lex])
  }
  lex += 1

  // expecting assignment operator
  if (!routine.lexemes[lex]) {
    throw new CompilerError('"FOR" loop variable must be assigned an initial value.', routine.lexemes[lex - 1])
  }
  if (routine.lexemes[lex].content === '=') {
    throw new CompilerError('Assignment operator is ":=", not "=".', routine.lexemes[lex])
  }
  if (routine.lexemes[lex].content !== ':=') {
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

  // expecting "to" or "downto"
  if (!routine.lexemes[lex]) {
    throw new CompilerError('"FOR ... := ..." must be followed by "TO" or "DOWNTO".', routine.lexemes[lex - 1])
  }
  switch (routine.lexemes[lex].content) {
    case 'to':
      compare = PCode.mreq
      change = PCode.incr
      break
    case 'downto':
      compare = PCode.lseq
      change = PCode.decr
      break
    default:
      throw new CompilerError('"FOR ... := ..." must be followed by "TO" or "DOWNTO".', routine.lexemes[lex])
  }
  lex += 1

  // expecting integer expression (for the final value)
  if (!routine.lexemes[lex]) {
    throw new CompilerError('"TO" or "DOWNTO" must be followed by an integer (or integer constant).', routine.lexemes[lex - 1])
  }
  wip = molecules.expression(routine, lex, null, 'integer', options)
  lex = wip.lex
  final = wip.pcode[0]

  // expecting "do"
  if (!routine.lexemes[lex]) {
    throw new CompilerError('"FOR" loop range must be followed by "DO".', routine.lexemes[lex - 1])
  }
  if (routine.lexemes[lex].content !== 'do') {
    throw new CompilerError('"FOR" loop range must be followed by "DO".', routine.lexemes[lex])
  }
  lex += 1

  // expecting a command or block of commands
  if (!routine.lexemes[lex]) {
    throw new CompilerError('No commands found after "FOR" loop initialisation.', routine.lexemes[lex - 1])
  }
  if (routine.lexemes[lex].content === 'begin') {
    wip = block(routine, lex + 1, startLine + 3, 'begin', options)
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

  // expecting a block of code
  wip = block(routine, lex, startLine, 'repeat', options)
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

  // expecting "DO"
  if (!routine.lexemes[lex]) {
    throw new CompilerError('"WHILE ..." must be followed by "DO".', routine.lexemes[lex - 1])
  }
  if (routine.lexemes[lex].content !== 'do') {
    throw new CompilerError('"WHILE ..." must be followed by "DO".', routine.lexemes[lex])
  }
  lex += 1

  // expecting a block of code
  if (!routine.lexemes[lex]) {
    throw new CompilerError('No commands found after "WHILE" loop initialisation.', routine.lexemes[lex])
  }
  if (routine.lexemes[lex].content === 'begin') {
    wip = block(routine, lex + 1, startLine + 1, 'begin', options)
  } else {
    wip = coder(routine, lex, startLine + 1, options)
  }
  lex = wip.lex
  innerCode = wip.pcode

  // now we have everything we need to generate the pcode
  return { lex, pcode: pcoder.whileLoop(startLine, test, innerCode, options) }
}

// generate the pcode for a block (i.e. a sequence of commands/structures)
function block (routine: Routine, lex: number, startLine: number, startKeyword: string, options: Options): WIP {
  let wip: WIP
  let pcode: number[][] = []
  let end: boolean = false

  // expecting something
  if (!routine.lexemes[lex]) throw new CompilerError('No commands found after "BEGIN".', routine.lexemes[lex - 1])

  // loop through until the end of the block (or we run out of lexemes)
  while (!end && (lex < routine.lexemes.length)) {
    end = blockEndCheck(startKeyword, routine.lexemes[lex], options)
    if (end) {
      // move past the end lexeme
      lex += 1
    } else {
      // compile the structure
      wip = coder(routine, lex, startLine + pcode.length, options)
      pcode = pcode.concat(wip.pcode)
      lex = wip.lex
    }
  }

  // if we've run out of lexemes without reaching the end, this is an error
  if (!end) throw new CompilerError('"BEGIN" does not have any matching "END".', routine.lexemes[lex - 1])

  // otherwise all good
  return { lex, pcode }
}

// check for the ending to a block, and throw an error if it doesn't match the beginning
function blockEndCheck (start: string, lexeme: Lexeme, options: Options): boolean {
  switch (lexeme.content) {
    case 'end':
      if (start !== 'begin') throw new CompilerError('"END" does not have any matching "BEGIN".', lexeme)
      return true

    case 'until':
      if (start !== 'repeat') throw new CompilerError('"UNTIL" does not have any matching "REPEAT".', lexeme)
      return true

    default:
      return false
  }
}
