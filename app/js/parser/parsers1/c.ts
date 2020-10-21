/**
 * Parser for Turtle C - lexemes go in, array of routines comes out the first
 * element in the array is the main PROGRAM object.
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
  | 'constant'
  | 'type'
  | 'parameters'

/** working variables modified by the fsm's subroutines */
type WIP = {
  program: Program // the main program
  routine: Program|Subroutine // reference to the current routine
  lex: number // index of the current lexeme
  state: State // the current fsm state
  brackets: number // number of unclosed curly brackets
}

/** parses lexemes as a C program */
export default function c (lexemes: Lexeme[]): Program {
  // initialise the main program
  const program = new Program('C', '!')

  // initialise the working variables
  let wip: WIP = {
    program,
    routine: program,
    lex: 0,
    state: 'crossroads',
    brackets: 0
  }

  // check we have at least one lexeme
  if (lexemes.length === 0) {
    throw new CompilerError('No program lexemes found.')
  }

  // loop through the lexemes
  while (wip.lex < lexemes.length) {
    switch (wip.state) {
      case 'crossroads':
        crossroads(wip, lexemes)
        break

      case 'constant':
        constant(wip, lexemes)
        break

      case 'type':
        type(wip, lexemes)
        break

      case 'parameters':
        parameters(wip, lexemes)
        break
    }
  }

  // check for a main routine
  if (!wip.program.subroutines.some(x => x.name === 'main')) {
    throw new CompilerError('Program does not contain any "main" routine.')
  }

  // return the program
  return wip.program
}

/** parses lexemes at crossroads */
function crossroads (wip: WIP, lexemes: Lexeme[]): void {
  // constant declaration
  if (lexemes[wip.lex].content === 'const') {
    wip.routine.lexemes.push(lexemes[wip.lex])
    wip.lex += 1
    wip.state = 'constant'
  }

  // variable/routine declaration
  else if ((lexemes[wip.lex].subtype === 'type') && (
    (lexemes[wip.lex + 1]?.type === 'identifier') ||
    (lexemes[wip.lex + 1]?.content === '*' && lexemes[wip.lex + 2]?.type === 'identifier')
  )) {
    wip.state = 'type'
  }

  // opening bracket
  else if (lexemes[wip.lex].content === '{') {
    wip.routine.lexemes.push(lexemes[wip.lex])
    wip.brackets += 1
    wip.lex += 1
  }

  // closing bracket
  else if (lexemes[wip.lex].content === '}') {
    wip.brackets -= 1
    if (wip.brackets === 0) {
      // end of a subroutine
      wip.lex += 1
      wip.routine = wip.program
    } else {
      // still within a subroutine
      wip.routine.lexemes.push(lexemes[wip.lex])
      wip.lex += 1
    }
  }

  // otherwise just add the lexeme to the current routine and move on
  else {
    wip.routine.lexemes.push(lexemes[wip.lex])
    wip.lex += 1
  }
}

/** parses lexemes at constant definition */
function constant (wip: WIP, lexemes: Lexeme[]): void {
  // expecting type
  if (!lexemes[wip.lex] || lexemes[wip.lex].subtype !== 'type') {
    throw new CompilerError('"const" must be followed by a type ("bool", "char", "int", or "string").', lexemes[wip.lex - 1])
  }
  if (lexemes[wip.lex].value === null) {
    throw new CompilerError('Constant cannot be void.', lexemes[wip.lex])
  }
  const type = lexemes[wip.lex].value as Type
  wip.routine.lexemes.push(lexemes[wip.lex])
  wip.lex += 1

  // expecting constant name
  if (!lexemes[wip.lex]) {
    throw new CompilerError('"const <type>" must be followed by an identifier.', lexemes[wip.lex - 1])
  }
  if (lexemes[wip.lex].type !== 'identifier') {
    throw new CompilerError('{lex} is not a valid identifier.', lexemes[wip.lex])
  }
  if (lexemes[wip.lex].subtype === 'turtle') {
    throw new CompilerError('{lex} is the name of a predefined Turtle attribute, and cannot be the name of a constant.', lexemes[wip.lex])
  }
  if (wip.routine.isDuplicate(lexemes[wip.lex].content as string)) {
    throw new CompilerError('{lex} is already defined in the current scope.', lexemes[wip.lex])
  }
  const name = lexemes[wip.lex].content as string
  wip.routine.lexemes.push(lexemes[wip.lex])
  wip.lex += 1

  // expecting '='
  if (!lexemes[wip.lex] || lexemes[wip.lex].content !== '=') {
    throw new CompilerError(`Constant ${name} must be assigned a value.`, lexemes[wip.lex - 1])
  }
  wip.routine.lexemes.push(lexemes[wip.lex])
  wip.lex += 1

  // expecting an expression
  const dummyRoutine = (wip.routine instanceof Program)
    ? new Program('C', wip.routine.name)
    : new Subroutine(wip.routine.parent, wip.routine.name)
  dummyRoutine.lexemes = lexemes.slice(wip.lex)
  dummyRoutine.constants = wip.routine.constants
  let exp = expression(dummyRoutine)
  const value = evaluate(lexemes[wip.lex - 1], 'C', exp)
  exp = typeCheck(exp, type, lexemes[wip.lex - 1])

  // create the constant and add it to the current routine
  const constant = new Constant('C', name, type, value)
  wip.routine.constants.push(constant)

  // push the lexemes and move on
  wip.routine.lexemes.push(...dummyRoutine.lexemes.slice(0, dummyRoutine.lex))
  wip.lex += dummyRoutine.lex
  wip.state = 'crossroads'
}

/** parses lexemes at variable/subroutine declaration */
function type (wip: WIP, lexemes: Lexeme[]): void {
  // if we're here, the current lexeme is a type keyword
  const type = lexemes[wip.lex].value as Type|null
  wip.lex += 1

  // check for '*' pointer operator
  let isPointer: boolean = false
  if (lexemes[wip.lex]?.content === '*') {
    isPointer = true
    wip.lex += 1
  }

  // expecting an identifier
  if (!lexemes[wip.lex] || lexemes[wip.lex].type !== 'identifier') {
    throw new CompilerError('{lex} must be followed by a valid identifier.', lexemes[wip.lex - 1])
  }
  if (lexemes[wip.lex].subtype === 'turtle') {
    throw new CompilerError('{lex} is the name of a predefined Turtle attribute, and cannot be used as a variable or subroutine name.', lexemes[wip.lex])
  }
  const name = lexemes[wip.lex].content as string
  wip.lex += 1

  // '(' means this is a subroutine definition
  if (lexemes[wip.lex]?.content === '(') {
    if (isPointer) {
      throw new CompilerError('Routine cannot be a pointer.', lexemes[wip.lex - 1])
    }
    if (wip.routine !== wip.program) {
      throw new CompilerError('Routines cannot contain any subroutines.', lexemes[wip.lex - 1])
    }
    wip.routine = new Subroutine(wip.program, name)
    wip.program.subroutines.push(wip.routine)
    wip.routine.index = wip.program.subroutines.length
    if (type === null) {
      wip.routine.type = 'procedure'
    } else {
      if (name === 'main') {
        throw new CompilerError('Main routine cannot return a value.', lexemes[wip.lex - 2])
      }
      wip.routine.type = 'function'
      wip.routine.returns = type
    }
    wip.state = 'parameters'
  }

  // otherwise it's a variable declaration / assignment
  else {
    const variable = new Variable(name, wip.routine)
    if (type === null) {
      throw new CompilerError('Variable type cannot be void (expected "bool", "char", "int", or "string").', lexemes[wip.lex - 2])
    }
    variable.type = type
    variable.isPointer = isPointer
    wip.routine.variables.push(variable)

    // add the type and identifier lexemes to the routine
    if (isPointer) {
      wip.routine.lexemes.push(lexemes[wip.lex - 3])
    }
    wip.routine.lexemes.push(lexemes[wip.lex - 2])
    wip.routine.lexemes.push(lexemes[wip.lex - 1])

    // open square bracket allowed here for arrays
    if (lexemes[wip.lex]?.content === '[') {
      variable.arrayDimensions = arrayDimensions(wip, lexemes)
    }

    // back to the crossroads
    wip.state = 'crossroads'
  }
}

/** parses lexemes at routine parameter definitions */
function parameters (wip: WIP, lexemes: Lexeme[]): void {
  // expecting open bracket
  if (!lexemes[wip.lex]) {
    throw new CompilerError('Routine name must be followed by an opening bracket "(".', lexemes[wip.lex - 1])
  }
  if (lexemes[wip.lex].content !== '(') {
    throw new CompilerError('Routine name must be followed by an opening bracket "(".', lexemes[wip.lex])
  }
  wip.lex += 1

  // expecting parameter definitions
  let closingBracket = false
  while (lexemes[wip.lex] && (closingBracket === false)) {
    if (lexemes[wip.lex].content === ')') {
      closingBracket = true
      wip.lex += 1
    } else if (wip.routine.name === 'main') {
      throw new CompilerError('Main routine cannot take any parameters.', lexemes[wip.lex])
    } else {
      parameter(wip, lexemes)
      if (lexemes[wip.lex].content === ')') {
        closingBracket = true
        wip.lex += 1
      } else if (lexemes[wip.lex].content === ',') {
        wip.lex += 1
      } else {
        throw new CompilerError('Routine parameters must be separated by commas.', lexemes[wip.lex])
      }
    }
  }

  // check we came out of the previous loop for the right reason
  if (closingBracket === false) {
    throw new CompilerError('Closing bracket missing after parameter definitions.', lexemes[wip.lex - 1])
  }

  // expecting open curly bracket (TODO: allow routine declarations before their bodies are defined)
  if (!lexemes[wip.lex]) {
    throw new CompilerError('Routine name must be followed by an opening bracket "{".', lexemes[wip.lex - 1])
  }
  if (lexemes[wip.lex].content !== '{') {
    throw new CompilerError('Routine name must be followed by an opening bracket "{".', lexemes[wip.lex])
  }
  wip.brackets += 1
  wip.lex += 1

  // move to crossroads
  wip.state = 'crossroads'
}

/** parses lexemes at parameter definition */
function parameter (wip: WIP, lexemes: Lexeme[]): void {
  let isReferenceParameter: boolean = false

  // expecting a type
  if (lexemes[wip.lex].subtype !== 'type') {
    throw new CompilerError('{lex} is not a valid parameter type (expected "bool", "char", "int", or "string").', lexemes[wip.lex])
  }
  if (lexemes[wip.lex].value === null) {
    throw new CompilerError('Parameter type cannot be void (expected "bool", "char", "int", or "string").', lexemes[wip.lex])
  }
  const type = lexemes[wip.lex].value as Type
  wip.lex += 1

  // '*' is allowable here, to indicate a reference parameter
  if (lexemes[wip.lex]?.content === '*') {
    isReferenceParameter = true
    wip.lex += 1
  }

  // expecting an identifier
  if (lexemes[wip.lex].type !== 'identifier') {
    throw new CompilerError('{lex} is not a valid parameter name,', lexemes[wip.lex])
  }
  if (lexemes[wip.lex].subtype === 'turtle') {
    throw new CompilerError('{lex} is the name of a predefined Turtle attribute, and cannot be used as a parameter name.', lexemes[wip.lex])
  }
  if (wip.routine.isDuplicate(lexemes[wip.lex].content as string)) {
    throw new CompilerError('{lex} is already the name of a parameter or variable in the current scope.', lexemes[wip.lex])
  }

  // otherwise create the parameter and add it to the current routine
  const parameter = new Variable(lexemes[wip.lex].content as string, wip.routine, true, isReferenceParameter)
  parameter.type = type
  wip.routine.variables.push(parameter)
  wip.lex += 1

  // array dimensions allowed at this point
  if (lexemes[wip.lex]?.content === '[') {
    parameter.arrayDimensions = arrayDimensions(wip, lexemes)
  }
}

/** parses lexemes at specification of array dimensions */
function arrayDimensions (wip: WIP, lexemes: Lexeme[]): [number, number][] {
  const dimensions: [number, number][] =[]

  while (lexemes[wip.lex]?.content === '[') {
    wip.lex += 1
    if (!lexemes[wip.lex]) {
      throw new CompilerError('"[" must be followed by an integer or integer constant.', lexemes[wip.lex - 1])
    }
    switch (lexemes[wip.lex].type) {
      case 'identifier':
        const variable = wip.routine.findVariable(lexemes[wip.lex].content as string)
        if (variable) {
          throw new CompilerError('Array size cannot be a variable.', lexemes[wip.lex])
        }
        const constant = wip.routine.findConstant(lexemes[wip.lex].content as string)
        if (!constant) {
          throw new CompilerError('{lex} is not defined.', lexemes[wip.lex])
        }
        if (constant.type !== 'integer') {
          throw new CompilerError('{lex} is not an integer constant.', lexemes[wip.lex])
        }
        if (constant.value <= 0) {
          throw new CompilerError('Array size must be greater than 0.', lexemes[wip.lex])
        }
        dimensions.push([0, constant.value as number])
        break
      case 'integer':
        if (lexemes[wip.lex].value as number <= 0) {
          throw new CompilerError('Array size must be greater than 0.', lexemes[wip.lex])
        }
        dimensions.push([0, lexemes[wip.lex].value as number])
        break
      default:
        throw new CompilerError('"[" must be followed by an integer or integer constant.', lexemes[wip.lex])
    }
    wip.lex += 1
    if (!lexemes[wip.lex] || lexemes[wip.lex].content !== ']') {
      throw new CompilerError('Array dimensions must be followed by a closing bracket "]".', lexemes[wip.lex - 1])
    }
    wip.lex += 1
  }

  return dimensions
}
