/**
 * Coder for Turtle Python.
 *
 * This function compiles a "command structure" for Turtle Python. A command
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
import * as molecules from '../_old/molecules'
import { Options } from '../options'
import * as pcoder from '../../pcoder/misc'
import { PCode } from '../../constants/pcodes'
import { CompilerError } from '../../tools/error'
import { Routine, Variable } from '../../parser/routine'

type Result = { lex: number, pcode: number[][] }

// the coder is the default export, but it needs to be named so it can call itself recursively
export default function coder (routine: Routine, lex: number, startLine: number, options: Options): Result {
  let result: Result

  switch (routine.lexemes[lex].type) {
    // identifiers (variable declaration, variable assignment, or procedure call)
    case 'identifier':
      if (routine.lexemes[lex + 1] && [':', '=', '=='].includes(routine.lexemes[lex + 1].content)) {
        // looks like variable declaration and/or assignment
        let varName = routine.lexemes[lex].content
        lex += 1
        // assignment with declaration
        if (routine.lexemes[lex].content === ':') {
          // N.B. relevant error checking has already been handled by the parser
          result = { lex: lex + 2, pcode: [] }
          lex = result.lex
        }
        // wrong assignment operator
        if (routine.lexemes[lex].content === '==') {
          throw new CompilerError('Variable assignment in Python uses "=", not "==".', routine.lexemes[lex])
        }

        // right assignment operator
        if (routine.lexemes[lex].content === '=') {
          result = molecules.variableAssignment(routine, varName, lex + 1, options)
          lex = result.lex
        }
      } else {
        // should be a procedure call
        result = molecules.procedureCall(routine, lex, options)
      }

      // end of statement check
      if (routine.lexemes[result.lex]) {
        if (routine.lexemes[result.lex].content === ';') {
          result.lex += 1
          if (routine.lexemes[result.lex].type === 'newline') result.lex += 1
        } else if (routine.lexemes[result.lex].type === 'newline') {
          result.lex += 1
        } else {
          throw new CompilerError('Statement must be separated by a semicolon or placed on a new line.', routine.lexemes[result.lex])
        }
      }
      break

    // keywords
    default:
      switch (routine.lexemes[lex].content) {
        // return (assign return variable of a function)
        case 'return':
          result = molecules.variableAssignment(routine, 'return', lex + 1, options)
          break

        // start of IF structure
        case 'if':
          result = compileIf(routine, lex + 1, startLine, options)
          break

        // else is an error
        case 'else':
          throw new CompilerError('Statement cannot begin with "else". If you have an "if" above, this line may need to be indented more.', routine.lexemes[lex])

        // start of FOR structure
        case 'for':
          result = compileFor(routine, lex + 1, startLine, options)
          break

        // start of WHILE structure
        case 'while':
          result = compileWhile(routine, lex + 1, startLine, options)
          break

        // PASS
        case 'pass':
          result = compilePass(routine, lex + 1, options)
          break

        // anything else is an error
        default:
          throw new CompilerError('Statement cannot begin with {lex}.', routine.lexemes[lex])
      }
      break
  }

  // all good
  return result
}

// generate the pcode for an IF structure
function compileIf (routine: Routine, lex: number, startLine: number, options: Options): Result {
  // values we need to generate the IF code
  let test: number[][]
  let ifCode: number[][]
  let elseCode: number[][]

  // working variable
  let result: Result

  // expecting a boolean expression
  if (!routine.lexemes[lex]) {
    throw new CompilerError('"if" must be followed by a Boolean expression.', routine.lexemes[lex - 1])
  }
  result = molecules.expression(routine, lex, null, 'boolean', options)
  lex = result.lex
  test = result.pcode

  // expecting a colon
  if (!routine.lexemes[lex]) {
    throw new CompilerError('"if <expression>" must be followed by a colon.', routine.lexemes[lex - 1])
  }
  lex += 1

  // expecting newline
  if (!routine.lexemes[lex]) {
    throw new CompilerError('No statements found after "if <expression>:".', routine.lexemes[lex - 1])
  }
  if (routine.lexemes[lex].type !== 'newline') {
    throw new CompilerError('Statements following "if <expression>:" must be on a new line.', routine.lexemes[lex])
  }
  lex += 1

  // expecting index
  if (!routine.lexemes[lex]) {
    throw new CompilerError('No statements found after "if <expression>:".', routine.lexemes[lex - 1])
  }
  if (routine.lexemes[lex].type !== 'indent') {
    throw new CompilerError('Statements following "if <expression>:" must be indented.', routine.lexemes[lex])
  }
  lex += 1

  // expecting some statements
  if (!routine.lexemes[lex]) {
    throw new CompilerError('No statements found after "if <expression>:".', routine.lexemes[lex - 1])
  }
  result = block(routine, lex, startLine + 1, options)
  lex = result.lex
  ifCode = result.pcode

  // happy with an "else" here (but it's optional)
  if (routine.lexemes[lex] && (routine.lexemes[lex].content === 'else')) {
    lex += 1

    // expecting a colon
    if (!routine.lexemes[lex]) {
      throw new CompilerError('"else" must be followed by a colon.', routine.lexemes[lex - 1])
    }
    if (routine.lexemes[lex].content !== ':') {
      throw new CompilerError('"else" must be followed by a colon.', routine.lexemes[lex])
    }
    lex += 1

    // expecting newline
    if (!routine.lexemes[lex]) {
      throw new CompilerError('No statements found after "else:".', routine.lexemes[lex - 1])
    }
    if (routine.lexemes[lex].type !== 'newline') {
      throw new CompilerError('Statements following "else:" must be on a new line.', routine.lexemes[lex])
    }
    lex += 1

    // expecting indent
    if (!routine.lexemes[lex]) {
      throw new CompilerError('No statements found after "else:".', routine.lexemes[lex - 1])
    }
    if (routine.lexemes[lex].type !== 'indent') {
      throw new CompilerError('Statements following "else:" must be indented.', routine.lexemes[lex])
    }
    lex += 1

    // expecting some statements
    if (!routine.lexemes[lex]) {
      throw new CompilerError('No statements found after "else:".', routine.lexemes[lex - 1])
    }
    result = block(routine, lex, startLine + ifCode.length + 2, options)
    lex = result.lex
    elseCode = result.pcode
  } else {
    elseCode = []
  }

  // now we have everything we need
  return { lex, pcode: pcoder.conditional(startLine, test, ifCode, elseCode, options) }
}

// generate the pcode for a FOR structure
function compileFor (routine: Routine, lex: number, startLine: number, options: Options): Result {
  // values we need to generate the FOR code
  let variable: Variable
  let initial: number[]
  let final: number[]
  let compare: PCode
  let change: PCode
  let innerCode: number[][]

  // working variable
  let result: Result

  // expecting an integer variable
  if (!routine.lexemes[lex]) {
    throw new CompilerError('"for" must be followed by an integer variable.', routine.lexemes[lex - 1])
  }
  if (routine.lexemes[lex].type !== 'identifier') {
    throw new CompilerError('{lex} is not a valid variable name.', routine.lexemes[lex])
  }
  variable = routine.findVariable(routine.lexemes[lex].content)
  if (!variable) {
    throw new CompilerError('Variable {lex} could not be found.', routine.lexemes[lex])
  }
  if (variable.type !== 'integer') {
    throw new CompilerError('Loop variable must be an integer.', routine.lexemes[lex])
  }
  lex += 1

  // expecting 'in'
  if (!routine.lexemes[lex]) {
    throw new CompilerError('"for <variable>" must be followed by "in".', routine.lexemes[lex - 1])
  }
  if (routine.lexemes[lex].content !== 'in') {
    throw new CompilerError('"for <variable>" must be followed by "in".', routine.lexemes[lex])
  }
  lex += 1

  // expecting 'range'
  if (!routine.lexemes[lex]) {
    throw new CompilerError('"for <variable> in" must be followed by a range specification.', routine.lexemes[lex - 1])
  }
  if (routine.lexemes[lex].content !== 'range') {
    throw new CompilerError('"for <variable> in" must be followed by a range specification.', routine.lexemes[lex])
  }
  lex += 1

  // expecting a left bracket
  if (!routine.lexemes[lex]) {
    throw new CompilerError('"range" must be followed by an opening bracket.', routine.lexemes[lex - 1])
  }
  if (routine.lexemes[lex].content !== '(') {
    throw new CompilerError('"range" must be followed by an opening bracket.', routine.lexemes[lex])
  }
  lex += 1

  // expecting an integer expression (for the initial value)
  if (!routine.lexemes[lex]) {
    throw new CompilerError('Missing first argument to the "range" function.', routine.lexemes[lex - 1])
  }
  result = molecules.expression(routine, lex, null, 'integer', options)
  lex = result.lex
  initial = result.pcode[0]

  // expecting a comma
  if (!routine.lexemes[lex]) {
    throw new CompilerError('Argument must be followed by a comma.', routine.lexemes[lex - 1])
  }
  if (routine.lexemes[lex].content === ')') {
    throw new CompilerError('Too few arguments for "range" function.', routine.lexemes[lex])
  }
  if (routine.lexemes[lex].content !== ',') {
    throw new CompilerError('Argument must be followed by a comma.', routine.lexemes[lex])
  }
  lex += 1

  // expecting an integer expression (for the final value)
  if (!routine.lexemes[lex]) {
    throw new CompilerError('Too few arguments for "range" function.', routine.lexemes[lex - 1])
  }
  result = molecules.expression(routine, lex, null, 'integer', options)
  lex = result.lex
  final = result.pcode[0]

  // now expecting another comma
  if (!routine.lexemes[lex]) {
    throw new CompilerError('Argument must be followed by a comma.', routine.lexemes[lex - 1])
  }
  if (routine.lexemes[lex].content === ')') {
    throw new CompilerError('Too few arguments for "range" function.', routine.lexemes[lex])
  }
  if (routine.lexemes[lex].content !== ',') {
    throw new CompilerError('Argument must be followed by a comma.', routine.lexemes[lex])
  }
  lex += 1

  // expecting either '1' or '-1'
  if (!routine.lexemes[lex]) {
    throw new CompilerError('Too few arguments for "range" function.', routine.lexemes[lex - 1])
  }
  if (routine.lexemes[lex].type === 'integer') {
    // only 1 is allowed
    if (routine.lexemes[lex].value !== 1) {
      throw new CompilerError('Step value for "range" function must be 1 or -1.', routine.lexemes[lex])
    }
    // otherwise ok
    compare = PCode.more
    change = PCode.incr
  } else if (routine.lexemes[lex].content === '-') {
    lex += 1
    // now expecting '1'
    if (!routine.lexemes[lex]) {
      throw new CompilerError('Step value for "range" function must be 1 or -1.', routine.lexemes[lex - 1])
    }
    if (routine.lexemes[lex].type !== 'integer') {
      throw new CompilerError('Step value for "range" function must be 1 or -1.', routine.lexemes[lex])
    }
    if (routine.lexemes[lex].value !== 1) {
      throw new CompilerError('Step value for "range" function must be 1 or -1.', routine.lexemes[lex])
    }
    compare = PCode.less
    change = PCode.decr
  } else {
    throw new CompilerError('Step value for "range" function must be 1 or -1.', routine.lexemes[lex])
  }
  lex += 1

  // expecting a right bracket
  if (!routine.lexemes[lex]) {
    throw new CompilerError('Closing bracket needed after "range" function arguments.', routine.lexemes[lex - 1])
  }
  if (routine.lexemes[lex].content === ',') {
    throw new CompilerError('Too many arguments for "range" function.', routine.lexemes[lex])
  }
  if (routine.lexemes[lex].content !== ')') {
    throw new CompilerError('Closing bracket needed after "range" function arguments.', routine.lexemes[lex])
  }
  lex += 1

  // expecting a colon
  if (!routine.lexemes[lex]) {
    throw new CompilerError('"for <variable> in range(...)" must be followed by a colon.', routine.lexemes[lex - 1])
  }
  if (routine.lexemes[lex].content !== ':') {
    throw new CompilerError('"for <variable> in range(...)" must be followed by a colon.', routine.lexemes[lex])
  }
  lex += 1

  // expecting newline
  if (!routine.lexemes[lex]) {
    throw new CompilerError('No statements found after "for <variable> in range(...):".', routine.lexemes[lex - 1])
  }
  if (routine.lexemes[lex].type !== 'newline') {
    throw new CompilerError('Statements following "for <variable> in range(...):" must be on a new line.', routine.lexemes[lex])
  }
  lex += 1

  // expecting indent
  if (!routine.lexemes[lex]) {
    throw new CompilerError('No statements found after "for <variable> in range(...):".', routine.lexemes[lex - 1])
  }
  if (routine.lexemes[lex].type !== 'indent') {
    throw new CompilerError('Statements following "for <variable> in range(...):" must be indented.', routine.lexemes[lex])
  }
  lex += 1

  // now expecting a block of statements
  if (!routine.lexemes[lex]) {
    throw new CompilerError('No statements found after "for <variable> in range(...):', routine.lexemes[lex - 1])
  }
  result = block(routine, lex, startLine + 3, options)
  lex = result.lex
  innerCode = result.pcode

  // now we have everything we need
  return {
    lex,
    pcode: pcoder.forLoop(startLine, variable, initial, final, compare, change, innerCode, options)
  }
}

// generate the pcode for a WHILE structure
function compileWhile (routine: Routine, lex: number, startLine: number, options: Options): Result {
  // values we need to generate the WHILE code
  let test: number[][]
  let innerCode: number[][]

  // working variable
  let result: Result

  // expecting a boolean expression
  if (!routine.lexemes[lex]) {
    throw new CompilerError('"while" must be followed by a Boolean expression.', routine.lexemes[lex - 1])
  }
  result = molecules.expression(routine, lex, null, 'boolean', options)
  lex = result.lex
  test = result.pcode

  // expecting a colon
  if (!routine.lexemes[lex]) {
    throw new CompilerError('"while <expression>" must be followed by a colon.', routine.lexemes[lex - 1])
  }
  if (routine.lexemes[lex].content !== ':') {
    throw new CompilerError('"while <expression>" must be followed by a colon.', routine.lexemes[lex])
  }
  lex += 1

  // expecting newline
  if (!routine.lexemes[lex]) {
    throw new CompilerError('No statements found after "while <expression>:".', routine.lexemes[lex - 1])
  }
  if (routine.lexemes[lex].type !== 'newline') {
    throw new CompilerError('Statements following "while <expression>:" must be on a new line.', routine.lexemes[lex])
  }
  lex += 1

  // expecting indent
  if (!routine.lexemes[lex]) {
    throw new CompilerError('No statements found after "while <expression>:".', routine.lexemes[lex - 1])
  }
  if (routine.lexemes[lex].type !== 'indent') {
    throw new CompilerError('Statements following "while <expression>:" must be indented.', routine.lexemes[lex])
  }
  lex += 1

  // expecting a block of statements
  if (!routine.lexemes[lex]) {
    throw new CompilerError('No statements found after "while <expression>:".', routine.lexemes[lex - 1])
  }
  result = block(routine, lex, startLine + 1, options)
  lex = result.lex
  innerCode = result.pcode

  // now we have everything we need
  return { lex, pcode: pcoder.whileLoop(startLine, test, innerCode, options) }
}

// generate the pcode for a PASS statement
function compilePass (routine: Routine, lex: number, options: Options): Result {
  // check for newline
  if (routine.lexemes[lex] && routine.lexemes[lex].type !== 'newline') {
    throw new CompilerError('Statement must be on a new line.', routine.lexemes[lex])
  }
  // PASS is a dummy command, no pcode is necessary; just move past the newline lexeme
  return { lex: lex + 1, pcode: [] }
}

// generate the pcode for a block (i.e. a sequence of commands/structures)
function block (routine: Routine, lex: number, startLine: number, options: Options): Result {
  let pcode: number[][] = []
  let result: Result

  // loop through until the end of the block (or we run out of lexemes)
  while (routine.lexemes[lex] && routine.lexemes[lex].type !== 'dedent') {
    result = coder(routine, lex, startLine + pcode.length, options)
    pcode = pcode.concat(result.pcode)
    lex = result.lex
  }

  // move past dedent lexeme
  if (routine.lexemes[lex]) lex += 1

  return { lex, pcode }
}
