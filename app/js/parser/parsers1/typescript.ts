/**
 * Parser for Turtle TypeScript - lexemes go in, array of routines comes out the
 * first element in the array is the main PROGRAM object.
 *
 * This analyses the structure of the program, and builds up lists of all the
 * variables and subroutines (with their variables and parameters); lexemes for
 * the program (and any subroutine) code themselves are just stored for
 * subsequent handling by the pcoder.
 */
import evaluate from '../evaluate'
import { Program, Subroutine } from '../routine'
import { Constant } from '../constant'
import { Type } from '../type'
import { Variable } from '../variable'
import { Lexeme } from '../../lexer/lexeme'
import { CompilerError } from '../../tools/error'
import { expression, typeCheck } from '../parsers2/common'

/** fsm states */
type State =
  | 'crossroads'
  | 'function'
  | 'var'
  | 'const'

/** working variables modified by the fsm's subroutines */
type WIP = {
  program: Program // the main program
  routineStack: (Program|Subroutine)[] // stack of routines
  routine: Program|Subroutine // reference to the current routine
  lex: number // index of the current lexeme
  state: State // the current fsm state
  brackets: number // the number of unclosed curly brackets
}

/** parses lexemes as a TypeScript program */
export default function typescript (lexemes: Lexeme[]): Program {
  // create the program
  const program = new Program('TypeScript', '!')

  // initialise the working variables
  let wip: WIP = {
    program: program,
    routineStack: [program],
    routine: program,
    lex: 0,
    state: 'crossroads',
    brackets: 0
  }

  // loop through the lexemes
  while (wip.lex < lexemes.length) {
    switch (wip.state) {
      case 'crossroads':
        crossroads(wip, lexemes)
        break

      case 'function':
        parseFunction(wip, lexemes)
        break

      case 'var':
        parseVar(wip, lexemes)
        break

      case 'const':
        parseConst(wip, lexemes)
        break
    }
  }

  // return the program
  return wip.program
}

/** parses lexemes at crossroads */
function crossroads (wip: WIP, lexemes: Lexeme[]): void {
  switch (lexemes[wip.lex].content) {
    case 'function':
      wip.state = lexemes[wip.lex].content as State
      wip.lex += 1
      break

    case 'var':
    case 'const':
      wip.routine.lexemes.push(lexemes[wip.lex])
      wip.state = lexemes[wip.lex].content as State
      wip.lex += 1
      break

    default:
      if (lexemes[wip.lex].content === '{') {
        wip.routine.lexemes.push(lexemes[wip.lex])
        wip.brackets += 1
      } else if (lexemes[wip.lex].content === '}') {
        if (wip.brackets === 0 && wip.routine instanceof Subroutine) {
          // end of subroutine
          // pop the routine off the stack and set current routine to the previous one
          wip.routineStack.pop()
          wip.routine = wip.routineStack[wip.routineStack.length - 1]
        } else {
          wip.routine.lexemes.push(lexemes[wip.lex])
          wip.brackets -= 1
        }
      } else {
        wip.routine.lexemes.push(lexemes[wip.lex])
      }
      wip.lex += 1
      break
  }
}

/** parses lexemes at function/procedure definition */
function parseFunction (wip: WIP, lexemes: Lexeme[]): void {
  // expecting identifier
  if (!lexemes[wip.lex]) {
    throw new CompilerError('"function" must be followed by a function name.', lexemes[wip.lex - 1])
  }
  if (lexemes[wip.lex].type !== 'identifier') {
    throw new CompilerError('{lex} is not a valid function name.', lexemes[wip.lex])
  }
  if (lexemes[wip.lex].subtype === 'turtle') {
    throw new CompilerError('{lex} is the name of a predefined Turtle attribute, and cannot be used as a function name.', lexemes[wip.lex])
  }
  if (wip.routine.isDuplicate(lexemes[wip.lex].content as string)) {
    throw new CompilerError('{lex} is already the name of a constant, function, or variable in the current scope.', lexemes[wip.lex])
  }

  // define the subroutine and move on
  const subroutine = new Subroutine(wip.routine, lexemes[wip.lex].content as string, 'procedure')
  wip.routine.subroutines.push(subroutine)
  subroutine.index = wip.program.allSubroutines.length
  wip.routineStack.push(subroutine)
  wip.routine = subroutine
  wip.lex += 1

  // expecting open bracket
  if (!lexemes[wip.lex]) {
    throw new CompilerError('Function name must be followed by an open bracket "(".', lexemes[wip.lex - 1])
  }
  if (lexemes[wip.lex].content !== '(') {
    throw new CompilerError('Function name must be followed by an open bracket "(".', lexemes[wip.lex])
  }
  wip.lex += 1

  // parse parameters (a separate function just for readability)
  parseParameters(wip, lexemes)

  // parameters evaluation will stop at closing bracket or when we run out of
  // lexemes; so here we should check it was the former
  if (!lexemes[wip.lex]) {
    throw new CompilerError('Function parameters must be followed by a closing bracket ")".', lexemes[wip.lex - 1])
  }
  if (lexemes[wip.lex].content !== ')') {
    throw new CompilerError('Function parameters must be followed by a closing bracket ")".', lexemes[wip.lex])
  }
  wip.lex += 1

  // return type specification allowed here (but not required for procedures)
  if (lexemes[wip.lex]?.content === ':') {
    const type = parseType(wip, lexemes, false)
    if (type !== null) {
      const variable = new Variable('return', subroutine)
      variable.type = type
      subroutine.type = 'function'
      subroutine.returns = variable.type
      subroutine.variables.unshift(variable)
    }
  }

  // expecting opening curly bracket
  if (!lexemes[wip.lex]) {
    throw new CompilerError('Function declaration must be followed by an opening bracket "{".', lexemes[wip.lex - 1])
  }
  if (lexemes[wip.lex].content !== '{') {
    throw new CompilerError('Function declaration must be followed by an opening bracket "{".', lexemes[wip.lex])
  }
  wip.lex += 1

  // back to the crossroads
  wip.state = 'crossroads'
}

/** parses lexemes at variable declaration/assignment */
function parseVar (wip: WIP, lexemes: Lexeme[]): void {
  // expecting an identifier
  if (!lexemes[wip.lex] || lexemes[wip.lex].type !== 'identifier') {
    throw new CompilerError('"var" must be followed by an identifier.', lexemes[wip.lex - 1])
  }
  if (lexemes[wip.lex].subtype === 'turtle') {
    throw new CompilerError('{lex} is the name of a predefined Turtle attribute, and cannot be used as the name of a variable.', lexemes[wip.lex])
  }
  if (wip.routine.isDuplicate(lexemes[wip.lex].content as string)) {
    throw new CompilerError('Variable {lex} has already been declared.', lexemes[wip.lex])
  }

  // create the variable and add it to the current routine
  const variable = new Variable(lexemes[wip.lex].content as string, wip.routine)
  wip.routine.variables.push(variable)
  wip.routine.lexemes.push(lexemes[wip.lex])
  wip.lex += 1

  // expecting a type specification
  const type = parseType(wip, lexemes, true)
  if (type === null) {
    throw new CompilerError('Variable type cannot be void.', lexemes[wip.lex - 1])
  }
  variable.type = type

  // back to the crossroads
  wip.state = 'crossroads'
}

/** parses lexemes at constant declaration/assignment */
function parseConst (wip: WIP, lexemes: Lexeme[]): void {
  // expecting an identifier
  if (!lexemes[wip.lex] || lexemes[wip.lex].type !== 'identifier') {
    throw new CompilerError('"const" must be followed by an identifier.', lexemes[wip.lex - 1])
  }
  if (lexemes[wip.lex].subtype === 'turtle') {
    throw new CompilerError('{lex} is the name of a predefined Turtle attribute, and cannot be used as the name of a constant.', lexemes[wip.lex])
  }
  if (wip.routine.isDuplicate(lexemes[wip.lex].content as string)) {
    throw new CompilerError('Constand {lex} has already been defined.', lexemes[wip.lex])
  }
  const name = lexemes[wip.lex].content as string
  wip.routine.lexemes.push(lexemes[wip.lex])
  wip.lex += 1

  // expecting a type specification
  const type = parseType(wip, lexemes, true)
  if (type === null) {
    throw new CompilerError('Constant type cannot be void.', lexemes[wip.lex - 1])
  }

  // expecting '='
  if (!lexemes[wip.lex] || lexemes[wip.lex].content !== '=') {
    throw new CompilerError(`Constant ${name} must be assigned a value.`, lexemes[wip.lex - 1])
  }
  wip.routine.lexemes.push(lexemes[wip.lex])
  wip.lex += 1

  // expecting an expression
  const dummyRoutine = (wip.routine instanceof Program)
    ? new Program('TypeScript', wip.routine.name)
    : new Subroutine(wip.routine.parent, wip.routine.name)
  dummyRoutine.lexemes = lexemes.slice(wip.lex)
  dummyRoutine.constants = wip.routine.constants
  const exp = expression(dummyRoutine)
  const value = evaluate(lexemes[wip.lex - 1], 'TypeScript', exp)

  // check the type
  typeCheck(exp, type, lexemes[wip.lex])

  // create the constant and add it to the current routine
  const constant = new Constant('TypeScript', name, type, value)
  wip.routine.constants.push(constant)

  // push the lexemes and move on
  wip.routine.lexemes.push(...dummyRoutine.lexemes.slice(0, dummyRoutine.lex))
  wip.lex += dummyRoutine.lex

  // back to the crossroads
  wip.state = 'crossroads'
}

/** parses lexemes at a type specification */
function parseType (wip: WIP, lexemes: Lexeme[], pushLexemes: boolean): Type|null {
  // expecting a colon
  if (!lexemes[wip.lex] || lexemes[wip.lex].content !== ':') {
    throw new CompilerError('Expected a colon and a type specification.', lexemes[wip.lex - 1])
  }
  if (pushLexemes) {
    wip.routine.lexemes.push(lexemes[wip.lex])
  }
  wip.lex += 1

  // expecting a type
  if (!lexemes[wip.lex]) {
    throw new CompilerError('Colon must be followed by a type specification.', lexemes[wip.lex - 1])
  }
  if (lexemes[wip.lex].subtype !== 'type') {
    throw new CompilerError('{lex} is not a valid type.', lexemes[wip.lex])
  }
  const type = lexemes[wip.lex].value as Type|null

  if (pushLexemes) {
    wip.routine.lexemes.push(lexemes[wip.lex])
  }
  wip.lex += 1

  return type
}

/** parses lexemes at a function parameter */
function parseParameters (wip: WIP, lexemes: Lexeme[]): void {
  while (lexemes[wip.lex]?.content !== ')') {
    // parse the parameter
    parseParameter(wip, lexemes)

    // check what's next
    if (!lexemes[wip.lex]) {
      throw new CompilerError('Parameter list must be followed by a closing bracket ")".', lexemes[wip.lex - 1])
    }
    if (lexemes[wip.lex].type === 'identifier') {
      throw new CompilerError('Parameters must be separated by commas.', lexemes[wip.lex])
    }
    if (lexemes[wip.lex].content === ',') {
      wip.lex += 1
      if (!lexemes[wip.lex]) {
        throw new CompilerError('Expected parameter name after comma.', lexemes[wip.lex - 1])
      }
    }
  }
}

/** parses lexemes at a function parameter */
function parseParameter (wip: WIP, lexemes: Lexeme[]): void {
  // expecting parameter name
  if (lexemes[wip.lex].type !== 'identifier') {
    throw new CompilerError('{lex} is not a valid parameter name.', lexemes[wip.lex])
  }
  if (lexemes[wip.lex].subtype === 'turtle') {
    throw new CompilerError('{lex} is the name of a Turtle variable, and cannot be used as the name of a parameter.', lexemes[wip.lex])
  }
  if (wip.routine.isDuplicate(lexemes[wip.lex].content as string)) {
    throw new CompilerError('{lex} is already the name of a constant, variable, or function in the current scope.', lexemes[wip.lex])
  }
  const name = lexemes[wip.lex].content as string
  wip.lex += 1

  // create the parameter and add it to the current routine
  const parameter = new Variable(name, wip.routine, true)
  wip.routine.variables.push(parameter)

  // expecting type specification
  const type = parseType(wip, lexemes, false)
  if (type === null) {
    throw new CompilerError('Parameter type cannot be void.', lexemes[wip.lex - 1])
  }
  parameter.type = type
}
