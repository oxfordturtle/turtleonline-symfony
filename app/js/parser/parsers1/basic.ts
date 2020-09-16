/**
 * Parser for Turtle BASIC - lexemes go in, array of routines comes out the
 * first element in the array is the main PROGRAM object.
 *
 * This analyses the structure of the program, and builds up lists of all the
 * variables and subroutines (with their variables and parameters); lexemes for
 * the program (and any subroutine) code themselves are just stored for
 * subsequent handling by the pcoder.
 */
import { Routine, Program, Subroutine, SubroutineType } from '../routine'
import { Variable } from '../variable'
import { Type } from '../type'
import { Constant } from '../constant'
import evaluate from '../evaluate'
import { Lexeme } from '../../lexer/lexeme'
import { CompilerError } from '../../tools/error'

/** fsm states */
type State =
  | 'start'
  | 'constant'
  | 'dim'
  | 'program'
  | 'end'
  | 'def'
  | 'parameters'
  | 'crossroads'
  | 'private'
  | 'local'
  | 'subroutine'
  | 'result'

/** working variables modified by the fsm's subroutines */
type WIP = {
  program: Program // the program
  routine: Routine // reference to the current routine
  lex: number // index of the current lexeme
  state: State // the current fsm state
  context: 'program'|'procedure'|'function'|'end' // the current context
}

/** parses lexemes as a BASIC program */
export default function basic (lexemes: Lexeme[]): Program {
  // initialise the working variables
  let wip: WIP = {
    program: null,
    routine: null,
    lex: 0,
    state: 'start',
    context: 'program'
  }

  // setup the program and set it as the current routine
  wip.program = new Program('BASIC', '!')
  wip.routine = wip.program

  // loop through the lexemes
  while (wip.lex < lexemes.length) {
    switch (wip.state) {
      case 'start':
        start(wip, lexemes)
        break

      case 'constant':
        constant(wip, lexemes)
        break

      case 'dim':
        dim(wip, lexemes)
        break

      case 'program':
        program(wip, lexemes)
        break

      case 'end':
        end(wip, lexemes)
        break

      case 'def':
        def(wip, lexemes)
        break

      case 'parameters':
        parameters(wip, lexemes)
        break

      case 'crossroads':
        crossroads(wip, lexemes)
        break

      case 'private': // fallthrough
      case 'local':
        local(wip, lexemes)
        break

      case 'subroutine':
        subroutine(wip, lexemes)
        break

      case 'result':
        result(wip, lexemes)
        break
    }
  }

  // final error checking
  switch (wip.context) {
    case 'program':
      throw new CompilerError('Program must finish with "END".', lexemes[wip.lex - 1])

    case 'procedure':
      throw new CompilerError('Procedure must finish with "ENDPROC".', lexemes[wip.lex - 1])

    case 'function':
      throw new CompilerError('Function must finish with "=expression".', lexemes[wip.lex - 1])
  }

  // return the program
  return wip.program
}

/** parses lexemes at start */
function start (wip: WIP, lexemes: Lexeme[]): void {
  // expecting either constant definitions, global array declarations, or program commands
  if (lexemes[wip.lex].content === 'DEF') {
    throw new CompilerError('Subroutines must be defined after program "END".', lexemes[wip.lex])
  }
  if (lexemes[wip.lex].content === 'CONST') {
    wip.lex += 1
    wip.state = 'constant'
  } else if (lexemes[wip.lex].content === 'DIM') {
    wip.lex += 1
    wip.state = 'dim'
  } else {
    wip.state = 'program'
  }
}

/** parses lexemes at "CONST" */
function constant (wip: WIP, lexemes: Lexeme[]): void {
  if (wip.routine.variables.length > 0) {
    throw new CompilerError('Constants must be defined before any DIM statements.', lexemes[wip.lex])
  }
  if (wip.routine instanceof Subroutine) {
    throw new CompilerError('Constants can only be declared in the main program.', lexemes[wip.lex])
  }

  // expecting "<identifier> = <value>"
  const [identifier, assignment, firstValueLexeme] = lexemes.slice(wip.lex, wip.lex + 3)

  // basic error checking
  if (!identifier) {
    throw new CompilerError('"CONST" must be followed by an identifier.', lexemes[wip.lex - 1])
  }
  if (identifier.subtype === 'turtle') {
    throw new CompilerError('{lex} is the name of a Turtle property, and cannot be used as a constant name.', lexemes[wip.lex])
  }
  if (identifier.type !== 'identifier') {
    throw new CompilerError('{lex} is not a valid constant name.', lexemes[wip.lex])
  }
  if (wip.routine.findConstant(identifier.content)) {
    throw new CompilerError('Duplicate constant name {lex}.', lexemes[wip.lex])
  }
  if (!assignment) {
    throw new CompilerError('Constant must be assigned a value.', identifier)
  }
  if (assignment.content !== '=' || !firstValueLexeme) {
    throw new CompilerError('Constant must be assigned a value.', assignment)
  }

  // determine constant type based on name
  const type = identifier.content.slice(-1) === '$' ? 'string' : 'boolint'

  // get all the lexemes up to the first line break
  const valueLexemes = []
  wip.lex += 1
  while (lexemes[wip.lex + 1] && lexemes[wip.lex + 1].type !== 'newline') {
    valueLexemes.push(lexemes[wip.lex + 1])
    wip.lex += 1
  }
  const value = evaluate(identifier, valueLexemes, wip.routine.program)
  switch (typeof value) {
    case 'number':
      if (type === 'string') {
        throw new CompilerError('String constant cannot be assigned an integer value.', identifier)
      }
      break

    case 'string':
      if (type === 'boolint') {
        throw new CompilerError('Integer constant cannot be assigned a string value.', identifier)
      }
      break
  }

  // create the constant and add it to the routine
  const constant = new Constant('BASIC', identifier.content, type, value)
  wip.routine.program.constants.push(constant)

  // newline check
  newline(wip, lexemes)

  // sanity check
  if (!lexemes[wip.lex]) {
    throw new CompilerError('No program text found after constant definition.', lexemes[wip.lex - 1])
  }

  // back to the start
  wip.state = 'start'
}

/** parses lexemes at "DIM" */
function dim (wip: WIP, lexemes: Lexeme[]): void {
  if (wip.routine instanceof Subroutine) {
    throw new CompilerError('"DIM" statements can only occur in the main program.', lexemes[wip.lex])
  }

  // expecting "<identifier>(<dimensions>)"
  if (!lexemes[wip.lex]) {
    throw new CompilerError('"DIM" must be followed by a variable name.', lexemes[wip.lex - 1])
  }
  if (lexemes[wip.lex].type !== 'identifier') {
    throw new CompilerError('{lex} is not a valid identifier.', lexemes[wip.lex])
  }
  if (lexemes[wip.lex].subtype === 'turtle') {
    throw new CompilerError('Turtle variable {lex} cannot be used as the name of an array.', lexemes[wip.lex])
  }

  // create the variable
  const variable = new Variable(lexemes[wip.lex].content, wip.routine)
  variable.type = variableType(lexemes[wip.lex])

  // expecting open bracket
  wip.lex += 1
  if (!lexemes[wip.lex]) {
    throw new CompilerError('"DIM" variable identifier must be followed by dimensions in brackets.', lexemes[wip.lex - 1])
  }
  if (lexemes[wip.lex].content !== '(') {
    throw new CompilerError('"DIM" variable identifier must be followed by dimensions in brackets.', lexemes[wip.lex])
  }
  wip.lex += 1

  // expecting dimensions separated by commas
  while (lexemes[wip.lex] && lexemes[wip.lex].content !== ')') {
    if (lexemes[wip.lex].type === 'identifier') {
      const constant = wip.routine.findConstant(lexemes[wip.lex].content)
      if (!constant) {
        throw new CompilerError('Array dimensions must be an integer or integer constant.', lexemes[wip.lex])
      }
      if (typeof constant.value !== 'number') {
        throw new CompilerError('{lex} is not an integer constant.', lexemes[wip.lex])
      }
      if (constant.value <= 0) {
        throw new CompilerError('Dimension value must be greater than 0.', lexemes[wip.lex])
      }
      variable.arrayDimensions.push([0, constant.value])
    } else if (lexemes[wip.lex].type === 'integer') {
      if (lexemes[wip.lex].value <= 0) {
        throw new CompilerError('Dimension value must be greater than 0.', lexemes[wip.lex])
      }
      variable.arrayDimensions.push([0, lexemes[wip.lex].value as number])
    } else {
      throw new CompilerError('Dimension value must be an integer or integer constant.', lexemes[wip.lex])
    }

    // move on
    wip.lex += 1
    if (lexemes[wip.lex].content === ',') wip.lex += 1
  }

  // now check the previous loop exited for the right reason
  if (!lexemes[wip.lex]) {
    throw new CompilerError('Integer or integer constant expected.', lexemes[wip.lex - 1])
  }
  wip.lex += 1 // move past the closing bracket

  // add the variable
  wip.routine.variables.push(variable)

  // newline check
  newline(wip, lexemes)

  // sanity check
  if (!lexemes[wip.lex]) {
    throw new CompilerError('No program text found after "DIM" statement.', lexemes[wip.lex - 1])
  }

  // back to the start
  wip.state = 'start'
}

/** parses lexemes in program */
function program (wip: WIP, lexemes: Lexeme[]): void {
  // definitions are not allowed
  if (lexemes[wip.lex].content === 'DIM') {
    throw new CompilerError('"DIM" commands must occur at the top of the program.', lexemes[wip.lex])
  }
  if (lexemes[wip.lex].content === 'PRIVATE') {
    throw new CompilerError('Private variables cannot be defined in the main program.', lexemes[wip.lex])
  }
  if (lexemes[wip.lex].content === 'LOCAL') {
    throw new CompilerError('Local variables cannot be defined in the main program.', lexemes[wip.lex])
  }
  if (lexemes[wip.lex].content === 'DEF') {
    throw new CompilerError('Subroutines must be defined after program "END".', lexemes[wip.lex])
  }

  // 'END' indicates the end of the main program
  if (lexemes[wip.lex].content === 'END') {
    wip.context = 'end'
    newline(wip, lexemes)
    wip.state = 'end'
  } else {
    // otherwise make a note of any variables ...
    if (lexemes[wip.lex].type === 'identifier' && lexemes[wip.lex].subtype !== 'turtle') {
      if (lexemes[wip.lex + 1] && lexemes[wip.lex + 1].content === '=') {
        if (!wip.program.isDuplicate(lexemes[wip.lex].content)) {
          const variable = new Variable(lexemes[wip.lex].content, wip.program)
          variable.type = variableType(lexemes[wip.lex])
          wip.program.variables.push(variable)
        }
      }
    }
    // ... and add the lexeme to the main program and move on
    wip.program.lexemes.push(lexemes[wip.lex])
    wip.lex += 1
  }
}

/** parses lexemes at end */
function end (wip: WIP, lexemes: Lexeme[]): void {
  // expecting nothing, or the start of a new subroutine
  if (lexemes[wip.lex]) {
    // if there's something, it must be 'DEF'
    if (lexemes[wip.lex].content === 'DEF') {
      wip.lex += 1
      wip.state = 'def'
    } else {
      // anything else is an error
      if (wip.routine instanceof Program) {
        throw new CompilerError('No program text can appear after program "END" (except subroutine definitions).', lexemes[wip.lex])
      }
      throw new CompilerError('No program text can appear after subroutine "END" (except further subroutine definitions).', lexemes[wip.lex])
    }
  }
}

/** parses lexemes at "DEF" */
function def (wip: WIP, lexemes: Lexeme[]): void {
  // expecting subroutine name
  if (!lexemes[wip.lex]) {
    throw new CompilerError('"DEF" must be followed by a valid procedure or function name. (Procedure names must begin with "PROC", and function names must begin with "FN".)', lexemes[wip.lex - 1])
  }

  // create the subroutine and add it to the routine arrays
  wip.routine = new Subroutine(wip.program, lexemes[wip.lex].content, subroutineType(wip, lexemes))
  wip.program.subroutines.push(wip.routine as Subroutine)
  wip.routine.index = wip.program.subroutines.length

  // set flags
  if ((wip.routine as Subroutine).type === 'procedure') {
    wip.context = 'procedure'
  } else {
    wip.context = 'function'
    // add function return variable
    const variable = new Variable('!result', wip.routine)
    variable.type = functionReturnType(lexemes[wip.lex])
    wip.routine.variables.push(variable);
    (wip.routine as Subroutine).returns = variable.type
  }

  // expecting parameters, variables, or the start of the subroutine statements
  if (!lexemes[wip.lex + 1]) {
    throw new CompilerError('No statements found after subroutine declaration.', lexemes[wip.lex])
  }
  if (lexemes[wip.lex + 1].content === '(') {
    // expecting parameters
    wip.lex += 2
    wip.state = 'parameters'
  } else {
    // expecting variables or subroutine statements on a new line
    newline(wip, lexemes)
    wip.state = 'crossroads'
  }
}

/** parses lexemes at parameters */
function parameters (wip: WIP, lexemes: Lexeme[]): void {
  // expecting a parameter name; but check for 'RETURN' first (indicating a reference parameter)
  let isReferenceParameter = false
  if (lexemes[wip.lex] && lexemes[wip.lex].content === 'RETURN') {
    isReferenceParameter = true
    wip.lex += 1
  }

  // now we're definitely expecting a parameter name
  if (!lexemes[wip.lex]) {
    throw new CompilerError('Parameter name expected.', lexemes[wip.lex - 1])
  }

  // error checking
  if (lexemes[wip.lex].type !== 'identifier') {
    throw new CompilerError('{lex} is not a valid parameter name.', lexemes[wip.lex])
  }
  if (lexemes[wip.lex].subtype === 'turtle') {
    throw new CompilerError('{lex} is the name of a Turtle property, and cannot be used as a parameter name.', lexemes[wip.lex])
  }
  if (wip.routine.isDuplicate(lexemes[wip.lex].content)) {
    throw new CompilerError('{lex} is already a parameter for this subroutine.', lexemes[wip.lex])
  }

  // otherwise create the variable and add it to the routine
  const variable = new Variable(lexemes[wip.lex].content, wip.routine, true, isReferenceParameter)
  variable.type = variableType(lexemes[wip.lex])
  wip.routine.variables.push(variable)
  wip.lex += 1

  // now expecting comma or closing bracket
  if (!lexemes[wip.lex]) {
    throw new CompilerError('Closing bracket needed after parameters.', lexemes[wip.lex - 1])
  }
  if (lexemes[wip.lex].type === 'identifier') {
    throw new CompilerError('Comma needed after parameter.', lexemes[wip.lex])
  }
  if (lexemes[wip.lex].content === ')') {
    if (!lexemes[wip.lex + 1]) {
      throw new CompilerError('Subroutine definition must be followed by some commands.', lexemes[wip.lex - 1])
    }
    newline(wip, lexemes)
    wip.state = 'crossroads'
  } else {
    if (lexemes[wip.lex].content !== ',') {
      throw new CompilerError('Closing bracket needed after parameters.', lexemes[wip.lex])
    }
    wip.lex += 1
  }
}

/** parses lexemes at crossroads */
function crossroads (wip: WIP, lexemes: Lexeme[]): void {
  // expecting variable declarations, or the start of the subroutine commands
  if (!lexemes[wip.lex]) {
    throw new CompilerError('Subroutine definition must be followed by some commands.', lexemes[wip.lex - 1])
  }

  switch (lexemes[wip.lex].content) {
    case 'DIM':
      throw new CompilerError('"DIM" statements can only occur within the main program.', lexemes[wip.lex])

    case 'PRIVATE':
      wip.lex += 1
      wip.state = 'private'
      break

    case 'LOCAL':
      wip.lex += 1
      wip.state = 'local'
      break

    default:
      wip.state = 'subroutine'
      break
  }
}

/** parses lexemes at local/private */
function local (wip: WIP, lexemes: Lexeme[]): void {
  // expecting comma separated list of private variables
  if (!lexemes[wip.lex]) {
    throw new CompilerError('Variable name expected.', lexemes[wip.lex - 1])
  }
  if (lexemes[wip.lex].type !== 'identifier') {
    throw new CompilerError('{lex} is not a valid variable name.', lexemes[wip.lex])
  }
  if (lexemes[wip.lex].subtype === 'turtle') {
    throw new CompilerError('{lex} is the name of a Turtle property, and cannot be used as a variable name.', lexemes[wip.lex])
  }
  if (wip.routine.isDuplicate(lexemes[wip.lex].content)) {
    throw new CompilerError('{lex} is already the name of a variable or subroutine in the current scope.', lexemes[wip.lex])
  }

  // create the variable and add it to the routine
  let variable: Variable
  if (wip.state === 'private') {
    variable = new Variable(lexemes[wip.lex].content, wip.program)
    variable.type = variableType(lexemes[wip.lex])
    variable.private = wip.routine as Subroutine // flag the variable as private to this routine
    wip.program.variables.push(variable)
  } else {
    variable = new Variable(lexemes[wip.lex].content, wip.routine)
    variable.type = variableType(lexemes[wip.lex])
    wip.routine.variables.push(variable)
  }

  // expecting a comma, or the rest of the subroutine
  if (lexemes[wip.lex + 1] && lexemes[wip.lex + 1].content === ',') {
    wip.lex += 2 // move past the comma; stay here on the next loop
  } else {
    if (!lexemes[wip.lex + 1]) {
      if (wip.routine instanceof Subroutine && wip.routine.type === 'procedure') {
        throw new CompilerError('Procedure must finish with "ENDPROC".', lexemes[wip.lex])
      }
      throw new CompilerError('Function must finish with "=expression".', lexemes[wip.lex])
    }
    newline(wip, lexemes)
    wip.state = 'crossroads' // move back to crossroads
  }
}

/** parses lexemes at subroutine definition */
function subroutine (wip: WIP, lexemes: Lexeme[]): void {
  // DIMs only allowed in the main program
  if (lexemes[wip.lex].content === 'DIM') {
    throw new CompilerError('"DIM" commands can only occur within the main program. To declare a local or private array, use "LOCAL" or "PRIVATE" instead.', lexemes[wip.lex])
  }

  // too late for PRIVATE or LOCAL variables to be declared
  if (lexemes[wip.lex].content === 'PRIVATE') {
    throw new CompilerError('Private variables must be declared at the start of the subroutine.', lexemes[wip.lex])
  }
  if (lexemes[wip.lex].content === 'LOCAL') {
    throw new CompilerError('Local variables must be declared at the start of the subroutine.', lexemes[wip.lex])
  }

  // next subroutine DEF must come after this subroutine has finished
  if (lexemes[wip.lex].content === 'DEF') {
    throw new CompilerError('The next subroutine must be defined after subroutine "ENDPROC".', lexemes[wip.lex])
  }

  // check for undefined variables, and add them to the main program
  if (lexemes[wip.lex].type === 'identifier' && lexemes[wip.lex + 1] && lexemes[wip.lex + 1].content === '=') {
    if (!wip.program.isDuplicate(lexemes[wip.lex].content) && !wip.routine.isDuplicate(lexemes[wip.lex].content)) {
      const variable = new Variable(lexemes[wip.lex].content, wip.program)
      variable.type = variableType(lexemes[wip.lex])
      wip.program.variables.push(variable)
    }
  }

  // now expecting "ENDPROC", "=<expression>", or subroutine commands
  if (lexemes[wip.lex].content === 'ENDPROC') {
    // end of procedure
    if (wip.routine instanceof Subroutine && wip.routine.type === 'procedure') {
      newline(wip, lexemes)
      wip.context = 'end'
      wip.state = 'end'
    } else {
      throw new CompilerError('Function must end with "=&lt;expression&gt;", not "ENDPROC".', lexemes[wip.lex])
    }
  } else if (lexemes[wip.lex].content === '=' && lexemes[wip.lex - 1].type === 'newline') {
    // end of function
    if (wip.routine instanceof Subroutine && wip.routine.type === 'function') {
      wip.routine.lexemes.push(lexemes[wip.lex])
      wip.lex += 1
      wip.state = 'result'
    } else {
      throw new CompilerError('Procedure must end with "ENDPROC", not "=&lt;expression&gt;".', lexemes[wip.lex])
    }
  } else {
    // subroutine commands
    wip.routine.lexemes.push(lexemes[wip.lex])
    wip.lex += 1
  }
}

/** parses lexemes at function result */
function result (wip: WIP, lexemes: Lexeme[]): void {
  if (!lexemes[wip.lex]) {
    throw new CompilerError('Function return value must be specified.', lexemes[wip.lex - 1])
  }
  while (lexemes[wip.lex] && lexemes[wip.lex].type !== 'newline') {
    wip.routine.lexemes.push(lexemes[wip.lex])
    wip.lex += 1
  }
  wip.lex -= 1
  newline(wip, lexemes)
  wip.context = 'end'
  wip.state = 'end'
}

/** checks for a new line and moves past it */
function newline (wip: WIP, lexemes: Lexeme[]): void {
  if (lexemes[wip.lex + 1] && lexemes[wip.lex + 1].type !== 'newline') {
    throw new CompilerError('Statement must be on a new line.', lexemes[wip.lex + 1])
  }
  wip.lex += 2
}

/** gets the type of a variable from its name */
function variableType (lexeme: Lexeme): Type {
  switch (lexeme.content.slice(-1)) {
    case '$':
      return 'string'

    case '%':
      return 'boolint'

    default:
      throw new CompilerError('{lex} is not a valid variable name. Variables must end in "%" (boolean and integer variables) or "$" (string variables).', lexeme)
  }
}

/** gets the type of a subroutine from its name */
function subroutineType (wip: WIP, lexemes: Lexeme[]): SubroutineType {
  if (lexemes[wip.lex].content.slice(0, 4) === 'PROC') return 'procedure'
  if (lexemes[wip.lex].content.slice(0, 2) === 'FN') return 'function'
  throw new CompilerError('"DEF" must be followed by a valid procedure or function name. (Procedure names must begin with "PROC", and function names must begin with "FN".)', lexemes[wip.lex])
}

/** gets the return type of a function from its name */
function functionReturnType (lexeme: Lexeme): Type {
  switch (lexeme.content.slice(-1)) {
    case '$':
      return 'string'

    default:
      return 'boolint'
  }
}
