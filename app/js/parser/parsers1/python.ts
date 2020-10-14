/**
 * Parser for Turtle Python - lexemes go in, array of routines comes out the
 * first element in the array is the main PROGRAM object.
 *
 * This analyses the structure of the program, and builds up lists of all the
 * variables and subroutines (with their variables and parameters); lexemes for
 * the program (and any subroutine) code themselves are just stored for
 * subsequent handling by the pcoder.
 */
import { Routine, Program, Subroutine } from '../routine'
import { Variable } from '../variable'
import { Lexeme } from '../../lexer/lexeme'
import { CompilerError } from '../../tools/error'

/** fsm states */
type State =
  | 'crossroads'
  | 'identifier'
  | 'dedent'
  | 'def'
  | 'global'
  | 'nonlocal'
  | 'end'

/** working variables modified by the fsm's subroutines */
type WIP = {
  program: Program // the main program
  routineStack: Routine[] // stack of routines
  routine: Routine // reference to the current routine
  lex: number // index of the current lexeme
  state: State // the current fsm state
}

/** parses lexemes as a python program */
export default function python (lexemes: Lexeme[]): Program {
  // create the program
  const prog = new Program('Python', '!')

  // initialise the working variables
  let wip: WIP = {
    program: prog,
    routineStack: [prog],
    routine: prog,
    lex: 0,
    state: 'crossroads'
  }

  // loop through the lexemes
  while (wip.lex < lexemes.length) {
    switch (wip.state) {
      case 'crossroads':
        crossroads(wip, lexemes)
        break

      case 'identifier':
        identifier(wip, lexemes)
        break

      case 'dedent':
        dedent(wip, lexemes)
        break

      case 'def':
        def(wip, lexemes)
        break

      case 'global': // fallthrough
      case 'nonlocal':
        global(wip, lexemes)
        break

      case 'end':
        end(wip, lexemes)
        break
    }
  }

  // return the program
  return wip.program
}

/** parses lexemes at crossroads */
function crossroads (wip: WIP, lexemes: Lexeme[]): void {
  // expecting declarations, indent/dedent, or routine statements
  switch (lexemes[wip.lex].type) {
    case 'identifier':
      wip.state = 'identifier'
      break

    case 'dedent':
      wip.state = 'dedent'
      break

    default:
      switch (lexemes[wip.lex].content) {
        case 'def':
          wip.state = 'def'
          break

        case 'global':
          wip.state = 'global'
          break

        case 'nonlocal':
          wip.state = 'nonlocal'
          break

        default:
          // default is just to add the lexeme to the current routine, and stay here
          wip.routine.lexemes.push(lexemes[wip.lex])
          wip.lex += 1
          break
      }
  }
}

/** parses lexemes at identifier */
function identifier (wip: WIP, lexemes: Lexeme[]): void {
  // as at the crossroads, we need to add the lexemes to the current
  // routine; but we might also need to make a note of the variable
  if (lexemes[wip.lex + 1] && lexemes[wip.lex + 1].content === ':' && lexemes[wip.lex + 2] && lexemes[wip.lex + 2].type === 'identifier') {
    // looks like a typed variable assignment ...
    // turtle properties are not allowed
    if (lexemes[wip.lex].subtype === 'turtle') {
      throw new CompilerError('{lex} is the name of a predefined Turtle attribute, and cannot be given a type specification.', lexemes[wip.lex])
    }

    // check for duplicate
    if (wip.routine.isDuplicate(lexemes[wip.lex].content as string)) {
      throw new CompilerError('{lex} is already the name of a variable in the current scope.', lexemes[wip.lex])
    }

    // ok, create the variable, push the lexeme, and move on
    const variable = new Variable(lexemes[wip.lex].content as string, wip.routine)
    wip.routine.lexemes.push(lexemes[wip.lex])
    wip.lex += 1

    // push the colon and move on
    wip.routine.lexemes.push(lexemes[wip.lex])
    wip.lex += 1

    // now we're expecting bool|int|str|List[...] (we already know it's an identifier)
    // last argument TRUE (to add the lexemes to the routine's lexemes)
    variableType(variable, wip, lexemes, true)

    // add the variable to the current routine
    wip.routine.variables.push(variable)
  } else if (lexemes[wip.lex + 1] && lexemes[wip.lex + 1].content === 'in') {
    // range variable (must be an integer)
    if (lexemes[wip.lex].type === 'identifier') { // don't bother for turtle variables
      if (!wip.routine.isDuplicate(lexemes[wip.lex].content as string)) {
        let variable = new Variable(lexemes[wip.lex].content as string, wip.routine)
        variable.type = 'integer'
        wip.routine.variables.push(variable)
      }
    }

    // add the lexeme to the routine as well
    wip.routine.lexemes.push(lexemes[wip.lex])
    wip.lex += 1
  } else {
    // add the lexeme to the routine regardless
    wip.routine.lexemes.push(lexemes[wip.lex])
    wip.lex += 1
  }

  // back to the crossroads
  wip.state = 'crossroads'
}

/** parses lexemes at dedent */
function dedent (wip: WIP, lexemes: Lexeme[]): void {
  const indents = wip.routine.lexemes.filter(x => x.type === 'indent').length
  const dedents = wip.routine.lexemes.filter(x => x.type === 'dedent').length
  if (indents === dedents) {
    // end of subroutine
    wip.state = 'end'
  } else {
    // otherwise push the lexeme and go back to the crossroads
    wip.routine.lexemes.push(lexemes[wip.lex])
    wip.state = 'crossroads'
  }
  // either way move past this lexeme
  wip.lex += 1
}
  
/** parses lexemes at "def" */
function def (wip: WIP, lexemes: Lexeme[]): void {
  // if we're here, current lexeme is "def"; start by just moving past it
  wip.lex += 1

  // identifier error checking
  if (!lexemes[wip.lex]) {
    throw new CompilerError('"def" must be followed by an identifier.', lexemes[wip.lex - 1])
  }
  if (lexemes[wip.lex].type !== 'identifier') {
    throw new CompilerError('{lex} is not a valid subroutine name.', lexemes[wip.lex])
  }
  if (lexemes[wip.lex].subtype === 'turtle') {
    throw new CompilerError('Subroutine cannot be given the name of a Turtle attribute.', lexemes[wip.lex])
  }
  if (wip.routine.isDuplicate(lexemes[wip.lex].content as string)) {
    throw new CompilerError('{lex} is already the name of a variable or subroutine in the current scope.', lexemes[wip.lex])
  }

  // define the subroutine
  const subroutine = new Subroutine(wip.routine, lexemes[wip.lex].content as string, 'procedure')
  wip.routine.subroutines.push(subroutine)
  wip.routineStack.push(subroutine)
  wip.routine = subroutine

  // expecting open bracket
  wip.lex += 1
  if (!lexemes[wip.lex]) {
    throw new CompilerError('Subroutine name must be followed by brackets.', lexemes[wip.lex - 1])
  }
  if (lexemes[wip.lex].content !== '(') {
    throw new CompilerError('Subroutine name must be followed by brackets "()".', lexemes[wip.lex])
  }
  wip.lex += 1

  // parse parameters (a separate function just for readability)
  parameters(wip, lexemes)

  // parameters evaluation will stop at closing bracket or when we run out of
  // lexemes; so here we should check it was the former
  if (!lexemes[wip.lex]) {
    throw new CompilerError('Subroutine parameters must be followed by a closing bracket ")".', lexemes[wip.lex - 1])
  }
  if (lexemes[wip.lex].content !== ')') {
    throw new CompilerError('Subroutine parameters must be followed by a closing bracket ")".', lexemes[wip.lex])
  }
  wip.lex += 1

  // check for return type
  if (lexemes[wip.lex] && lexemes[wip.lex].content === '->') {
    subroutine.type = 'function'
    wip.lex += 1
    if (!lexemes[wip.lex]) {
      throw new CompilerError('Function arrow "->" must be followed by a return type specification.', lexemes[wip.lex - 1])
    }
    const variable = new Variable('return', subroutine)
    variableType(variable, wip, lexemes, false)
    subroutine.returns = variable.type
    subroutine.variables.unshift(variable)
  }

  // check for colon
  if (!lexemes[wip.lex]) {
    throw new CompilerError('Subroutine declaration must be followed by a colon ":".', lexemes[wip.lex - 1])
  }
  if (lexemes[wip.lex].content !== ':') {
    throw new CompilerError('Subroutine declaration must be followed by a colon ":".', lexemes[wip.lex])
  }
  wip.lex += 1

  // final checks and moving on
  if (!lexemes[wip.lex]) {
    throw new CompilerError('No statements found after subroutine definition.', lexemes[wip.lex - 1])
  }
  if (lexemes[wip.lex].type !== 'newline') {
    throw new CompilerError('Subroutine definition must be followed by a line break.', lexemes[wip.lex])
  }
  wip.lex += 1
  if (!lexemes[wip.lex]) {
    throw new CompilerError('No statements found after subroutine definition.', lexemes[wip.lex - 1])
  }
  if (lexemes[wip.lex].type !== 'indent') {
    throw new CompilerError('Indent needed after subroutine definition.', lexemes[wip.lex])
  }
  wip.lex += 1
  wip.state = 'crossroads'
}

/** parses lexemes at "global" */
function global (wip: WIP, lexemes: Lexeme[]): void {
  // main program cannot include global statements
  if (wip.routine instanceof Program) {
    throw new CompilerError(`Main program cannot include any "${wip.state}" statements.`, lexemes[wip.lex])
  }
  wip.lex += 1

  // newline not allowed
  if (lexemes[wip.lex].type === 'newline') {
    throw new CompilerError(`"${wip.state}" statements must be on one line.`, lexemes[wip.lex - 1])
  }

  // add all names to the routine's globals/nonlocals array
  while (lexemes[wip.lex] && lexemes[wip.lex].type !== 'newline') {
    if (lexemes[wip.lex].type !== 'identifier') {
      throw new CompilerError('{lex} is not a valid variable name.', lexemes[wip.lex])
    }
    if (wip.state === 'global') {
      (wip.routine as Subroutine).globals.push(lexemes[wip.lex].content as string)
    } else {
      (wip.routine as Subroutine).nonlocals.push(lexemes[wip.lex].content as string)
    }
    wip.lex += 1
    if (lexemes[wip.lex].content === ',') wip.lex += 1
  }
  // move past new line
  if (lexemes[wip.lex].type === 'newline') wip.lex += 1

  // go back to the crossroads
  wip.state = 'crossroads'
}

/** parses lexemes at end */
function end (wip: WIP, lexemes: Lexeme[]): void {
  // end of a subroutine
  wip.routine.index = wip.program.allSubroutines.length

  // discard newline lexeme at the end of the routine
  if (wip.routine.lexemes[wip.routine.lexemes.length - 1].type === 'newline') {
    wip.routine.lexemes.pop()
  }

  // pop the routine off the stack and set current routine to the previous one
  wip.routineStack.pop()
  wip.routine = wip.routineStack[wip.routineStack.length - 1]

  // and go back to the crossroads
  wip.state = 'crossroads'
}

/** parses subroutine parameters */
function parameters (wip: WIP, lexemes: Lexeme[]): void {
  while (lexemes[wip.lex] && lexemes[wip.lex].content !== ')') {
    // parse the parameter
    parameter(wip, lexemes)

    // check what's next
    if (!lexemes[wip.lex]) {
      throw new CompilerError('Parameter list must be followed by a closing bracket ")".', lexemes[wip.lex - 1])
    }
    if (lexemes[wip.lex].type === 'newline') {
      throw new CompilerError('Parameters must all be on one line.', lexemes[wip.lex])
    }
    if (lexemes[wip.lex].type === 'identifier') {
      throw new CompilerError('Parameters must be separated by commas.', lexemes[wip.lex])
    }
    if (lexemes[wip.lex].content === ',') {
      wip.lex += 1
      if (!lexemes[wip.lex]) {
        throw new CompilerError('Expected parameter name after comma.', lexemes[wip.lex - 1])
      }
      if (lexemes[wip.lex].type === 'newline') {
        throw new CompilerError('Parameters must all be on one line.', lexemes[wip.lex])
      }
    }
  }
}

/** parses a subroutine parameter */
function parameter (wip: WIP, lexemes: Lexeme[]): void {
  // expecting parameter name
  if (lexemes[wip.lex].type !== 'identifier') {
    throw new CompilerError('{lex} is not a valid variable name.', lexemes[wip.lex])
  }
  if (lexemes[wip.lex].subtype === 'turtle') {
    throw new CompilerError('{lex} is the name of a Turtle variable, and cannot be used as a custom variable name.', lexemes[wip.lex])
  }
  if (wip.routine.isDuplicate(lexemes[wip.lex].content as string)) {
    throw new CompilerError('{lex} is already the name of a variable or subroutine in the current scope.', lexemes[wip.lex])
  }
  const parameter = new Variable(lexemes[wip.lex].content as string, wip.routine, true)
  wip.lex += 1

  // expecting colon
  if (!lexemes[wip.lex]) {
    throw new CompilerError('Variable must be followed by a colon ":" and a type specification.', lexemes[wip.lex - 1])
  }
  if (lexemes[wip.lex].content !== ':') {
    throw new CompilerError('Variable must be followed by a colon ":" and a type specification.', lexemes[wip.lex])
  }
  wip.lex += 1

  // expecting type definition
  if (!lexemes[wip.lex]) {
    throw new CompilerError('Variable must be given a type specification ("bool", "int", or "str").', lexemes[wip.lex - 1])
  }
  variableType(parameter, wip, lexemes, false)

  // add the parameter to the current routine
  wip.routine.variables.push(parameter)
}

/** sets the type of a variable */
function variableType (variable: Variable, wip: WIP, lexemes: Lexeme[], pushLexemes: boolean): void {
  switch (lexemes[wip.lex].content) {
    case 'bool':
      variable.type = 'boolean'
      if (pushLexemes) {
        wip.routine.lexemes.push(lexemes[wip.lex])
      }
      wip.lex += 1
      break

    case 'int':
      variable.type = 'integer'
      if (pushLexemes) {
        wip.routine.lexemes.push(lexemes[wip.lex])
      }
      wip.lex += 1
      break

    case 'str':
      variable.type = 'string'
      if (pushLexemes) {
        wip.routine.lexemes.push(lexemes[wip.lex])
      }
      wip.lex += 1
      break

    case 'list':
      throw new CompilerError('"List" must be written with a capital "L".', lexemes[wip.lex])

    case 'List':
      if (pushLexemes) {
        wip.routine.lexemes.push(lexemes[wip.lex])
      }
      wip.lex += 1
      if (!lexemes[wip.lex]) {
        throw new CompilerError('"List" must be followed by a type in square brackets.', lexemes[wip.lex - 1])
      }
      if (lexemes[wip.lex].content !== '[') {
        throw new CompilerError('"List" must be followed by a type in square brackets.', lexemes[wip.lex])
      }
      variable.arrayDimensions.push([0, 64])
      if (pushLexemes) {
        wip.routine.lexemes.push(lexemes[wip.lex])
      }
      wip.lex += 1
      if (!lexemes[wip.lex]) {
        throw new CompilerError('"List" must be followed by a type in square brackets.', lexemes[wip.lex - 1])
      }
      variableType(variable, wip, lexemes, pushLexemes)
      if (!lexemes[wip.lex]) {
        throw new CompilerError('List type must be followed by closing square brackets.', lexemes[wip.lex - 1])
      }
      if (lexemes[wip.lex].content !== ']') {
        throw new CompilerError('List type must be followed by closing square brackets.', lexemes[wip.lex])
      }
      if (pushLexemes) {
        wip.routine.lexemes.push(lexemes[wip.lex])
      }
      wip.lex += 1
      break

    default:
      throw new CompilerError('{lex} is not a valid type specification (expected "bool", "int", or "str")', lexemes[wip.lex])
  }
}
