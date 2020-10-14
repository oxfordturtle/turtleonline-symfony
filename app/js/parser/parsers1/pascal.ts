/**
 * Parser for Turtle Pascal - lexemes go in, array of routines comes out the
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
import evaluate from '../evaluate.old'
import { Lexeme } from '../../lexer/lexeme'
import { CompilerError } from '../../tools/error'

/** fsm states */
type State =
  | 'program'
  | 'crossroads'
  | 'constant'
  | 'variables'
  | 'procedure'
  | 'function'
  | 'begin'
  | 'end'

/** working variables modified by the fsm's subroutines */
type WIP = {
  program: Program // the main program
  routineStack: Routine[] // stack of routines
  routine: Routine // reference to the current routine
  routineCount: number // index of the current routine
  parent: Routine // the parent of the current routine
  begins: number // the number of open BEGINS (with matching END still to come)
  lex: number // index of the current lexeme
  state: State // the current fsm state
}

/** parses lexemes as a pascal program */
export default function pascal (lexemes: Lexeme[]): Program {
  // dummy program to start with (will be overwritten later)
  const prog = new Program('Pascal', 'dummy')

  // initialise the working variables
  let wip: WIP = {
    program: prog,
    routineStack: [],
    routine: prog,
    routineCount: 0,
    parent: prog,
    begins: 0,
    lex: 0,
    state: 'program'
  }

  // check we have at least one lexeme
  if (lexemes.length === 0) {
    throw new CompilerError('Program must start with keyword "PROGRAM".')
  }

  // loop through the lexemes
  while (wip.lex < lexemes.length) {
    switch (wip.state) {
      case 'program':
        program(wip, lexemes)
        break

      case 'crossroads':
        crossroads(wip, lexemes)
        break

      case 'constant':
        constant(wip, lexemes)
        break

      case 'variables':
        variables(wip, lexemes)
        break

      case 'procedure': // fallthrough
      case 'function':
        subroutine(wip, lexemes)
        break

      case 'begin':
        begin(wip, lexemes)
        break

      case 'end':
        end(wip, lexemes)
        break
    }
  }

  // return the main program
  return wip.program
}

/** parses lexemes at program start */
function program (wip: WIP, lexemes: Lexeme[]): void {
  const [keyword, identifier] = lexemes.slice(wip.lex, wip.lex + 2)

  // error checking
  if (!keyword) {
    throw new CompilerError('Program must start with keyword "PROGRAM".')
  }
  if (keyword.content?.toLowerCase() !== 'program') {
    throw new CompilerError('Program must start with keyword "PROGRAM".', keyword)
  }
  if (!identifier) {
    throw new CompilerError('"PROGRAM" must be followed by a legal program name.', keyword)
  }
  if (identifier.type !== 'identifier') {
    throw new CompilerError('{lex} is not a valid program name.', identifier)
  }
  if (identifier.subtype === 'turtle') {
    throw new CompilerError('Program cannot be given the name of a Turtle attribute.', identifier)
  }

  // create the program and move on
  wip.lex += 2
  wip.program = new Program('Pascal', identifier.content as string)
  wip.routine = wip.program
  wip.routineStack.push(wip.routine)

  // semicolon check
  semicolon(wip, lexemes, true, 'program declaration')

  // where next
  wip.state = 'crossroads'
}

/** parses lexemes at crossroads */
function crossroads(wip: WIP, lexemes: Lexeme[]): void {
  // expecting "CONST", "VAR", "PROCEDURE|FUNCTION", or "BEGIN[;]"
  if (!lexemes[wip.lex]) {
    throw new CompilerError('Expected "BEGIN", constant/variable definitions, or subroutine definitions.', lexemes[wip.lex - 1])
  }
  switch (lexemes[wip.lex]?.content?.toLowerCase()) {
    case 'const':
      if (wip.routine.variables.length > 0) {
        throw new CompilerError('Constants must be defined before any variables.', lexemes[wip.lex])
      }
      if (wip.routine.subroutines.length > 0) {
        throw new CompilerError('Constants must be defined before any subroutines.', lexemes[wip.lex])
      }
      wip.lex += 1
      wip.state = 'constant'
      break

    case 'var':
      if (wip.routine.subroutines.length > 0) {
        throw new CompilerError('Variables must be defined before any subroutines.', lexemes[wip.lex])
      }
      wip.lex += 1
      wip.state = 'variables'
      break

    case 'function': // fallthrough
    case 'procedure':
      wip.state = lexemes[wip.lex]?.content?.toLowerCase() as State
      wip.lex += 1
      break

    case 'begin':
      wip.lex += 1
      semicolon(wip, lexemes, false) // move past any semicolons
      wip.state = 'begin'
      break

    default:
      throw new CompilerError('Expected "BEGIN", constant/variable definitions, or subroutine definitions.', lexemes[wip.lex])
  }
}

/** parses lexemes at "CONST" */
function constant (wip: WIP, lexemes: Lexeme[]): void {
  const [identifier, assignment, next] = lexemes.slice(wip.lex, wip.lex + 3)

  // error checking
  if (!identifier) {
    throw new CompilerError('No constant name found.', lexemes[wip.lex - 1])
  }
  if (identifier.type !== 'identifier') {
    throw new CompilerError('{lex} is not a valid constant name.', identifier)
  }
  if (identifier.subtype === 'turtle') {
    throw new CompilerError('{lex} is the name of a predefined Turtle property, and cannot be used as a constant name.', identifier)
  }
  if (identifier.content === wip.routine.program.name) {
    throw new CompilerError('Constant name {lex} is already the name of the program.', identifier)
  }
  if (wip.program.findConstant(identifier.content as string)) {
    throw new CompilerError('{lex} is already the name of a constant.', identifier)
  }
  if (!assignment) {
    throw new CompilerError('Constant must be assigned a value.', identifier)
  }
  if (assignment.content !== '=' || !next) {
    throw new CompilerError('Constant must be assigned a value.', assignment)
  }

  // get all the lexemes up to the first semicolon
  const valueLexemes: Lexeme[] = []
  wip.lex += 2
  while (lexemes[wip.lex] && lexemes[wip.lex].content !== ';') {
    valueLexemes.push(lexemes[wip.lex] as Lexeme)
    wip.lex += 1
  }
  const value = evaluate(identifier, valueLexemes, wip.routine.program)
  const type = (typeof value === 'number') ? 'boolint' : 'string'

  // create the constant and add it to the routine
  const constant = new Constant('Pascal', identifier.content as string, type, value)
  wip.routine.program.constants.push(constant)

  // semicolon check
  semicolon(wip, lexemes, true, 'constant definition')

  // sanity check
  if (!lexemes[wip.lex]) {
    throw new CompilerError('No program text found after constant definition.', lexemes[wip.lex - 1])
  }

  // where next
  if (lexemes[wip.lex].type !== 'identifier') {
    wip.state = 'crossroads'
  } // otherwise stay put to parse more constants
}

/** parses lexemes at variable declarations */
function variables (wip: WIP, lexemes: Lexeme[], isParameter: boolean = false, isReferenceParameter: boolean = false): void {
  const variables: Variable[] = []

  // gather the variable names
  let more = true
  while (more) {
    // initial error checking
    if (!lexemes[wip.lex]) {
      throw new CompilerError('No variable name found.', lexemes[wip.lex - 1])
    }
    if (lexemes[wip.lex].type !== 'identifier') {
      throw new CompilerError('{lex} is not a valid variable name.', lexemes[wip.lex])
    }
    if (lexemes[wip.lex].subtype === 'turtle') {
      throw new CompilerError('{lex} is the name of a predefined Turtle property, and cannot be used as a variable name.', lexemes[wip.lex])
    }
    if (lexemes[wip.lex]?.content?.toLowerCase() === wip.routine.program.name.toLowerCase()) {
      throw new CompilerError('{lex} is already the name of the program.', lexemes[wip.lex])
    }
    if (wip.routine.isDuplicate(lexemes[wip.lex].content as string)) {
      throw new CompilerError('{lex} is already the name of a constant, variable, or subroutine.', lexemes[wip.lex])
    }

    // create the variable and add it to the array of variables
    variables.push(new Variable(lexemes[wip.lex].content as string, wip.routine, isParameter, isReferenceParameter))

    // check there is something next
    if (!lexemes[wip.lex + 1]) {
      throw new CompilerError('Variable name must be followed by a colon, then the variable type ("array", "boolean", "char", "integer", or "string").', lexemes[wip.lex])
    }

    // expecting a comma or a colon
    if (lexemes[wip.lex + 1].content === ',') {
      wip.lex += 2
    } else if (lexemes[wip.lex + 1].content === ':') {
      wip.lex += 2
      more = false
    } else if (lexemes[wip.lex + 1].type === 'identifier') {
      throw new CompilerError('Comma missing between variable declarations.', lexemes[wip.lex + 1])
    } else {
      throw new CompilerError('Variable name must be followed by a colon, then the variable type ("array", "boolean", "char", "integer", or "string").', lexemes[wip.lex + 1])
    }
  }

  // now expecing type definition for the variables just gathered
  variableType(wip, lexemes, variables)

  // add the variables to the routine
  wip.routine.variables.push(...variables)

  // if these are parameters, we're done (let the parameter calling function
  // handle the rest); but if these are variables...
  if (isParameter === false) {
    // semicolon check
    semicolon(wip, lexemes, true, 'variable declarations')

    // sanity check
    if (!lexemes[wip.lex]) {
      throw new CompilerError('No text found after variable declarations.', lexemes[wip.lex - 1])
    }

    // where next
    if (lexemes[wip.lex].type !== 'identifier') wip.state = 'crossroads' // otherwise stay put
  }
}

/** parses lexemes at type definition */
function variableType(wip: WIP, lexemes: Lexeme[], variables: Variable[]): void {
  // initial error checking
  if (!lexemes[wip.lex]) {
    if (variables.some(x => x.isArray)) {
      throw new CompilerError('Array type definition expected ("boolean", "char", "integer", or "string").', lexemes[wip.lex - 1])
    }
    throw new CompilerError('Type definition expected ("array", "boolean", "char", "integer", or "string").', lexemes[wip.lex - 1])
  }

  // do different things based on content
  switch (lexemes[wip.lex]?.content?.toLowerCase()) {
    case 'boolean': // fallthrough
    case 'integer':
      for (const variable of variables) {
        variable.type = lexemes[wip.lex]?.content?.toLowerCase() as Type
      }
      wip.lex += 1
      break

    case 'char':
      for (const variable of variables) {
        variable.type = 'character'
      }
      wip.lex += 1
      break

    case 'string':
      if (lexemes[wip.lex + 1] && lexemes[wip.lex + 1].content === '[') {
        // string of custom size
        const [size, rbkt] = lexemes.slice(wip.lex + 2, wip.lex + 4)
        if (!size) {
          throw new CompilerError('Opening bracket must be followed by an integer value.', lexemes[wip.lex + 1])
        }
        if (size.type !== 'integer') {
          throw new CompilerError('String size must be an integer.', size)
        }
        if (!rbkt) {
          throw new CompilerError('String size must be followed by a closing square bracket "]".', size)
        }
        if (rbkt.content !== ']') {
          throw new CompilerError('String size must be followed by a closing square bracket "]".', rbkt)
        }
        for (const variable of variables) {
          variable.type = 'string'
          variable.stringLength = size.value as number
        }
        wip.lex += 4
      } else {
        // string of indefinite size
        for (const variable of variables) {
          variable.type = 'string'
        }
        wip.lex += 1
      }
      break

    case 'array':
      if (variables.some(x => x.isArray)) {
        throw new CompilerError('"array[...] of array" makes no sense. Multidimensional arrays are declared using e.g. "array[0..9,0..9] of ...".', lexemes[wip.lex])
      }
      wip.lex += 1

      if (variables.some(x => x.isParameter)) { // array parameters (if one is, they all are) ...
        // expecting "of"
        if (!lexemes[wip.lex]) {
          throw new CompilerError('Array parameter must be followed by "of", and then the type of the elements of the array.', lexemes[wip.lex - 1])
        }
        if (lexemes[wip.lex].content === '[') {
          throw new CompilerError('Array reference parameters cannot be given a size specification.', lexemes[wip.lex])
        }
        if (lexemes[wip.lex].content?.toLowerCase() !== 'of') {
          throw new CompilerError('Array parameter must be followed by "of", and then the type of the elements of the array.', lexemes[wip.lex])
        }
        wip.lex += 1

        // set the variables as arrays
        for (const variable of variables) {
          // TODO: array parameters don't have dimensions specified; how to handle this?
          variable.arrayDimensions.push([0, 0])
        }

        // expecting array type specification
        variableType(wip, lexemes, variables)
      } else { // array variables ...
        // expecting open square bracket
        if (!lexemes[wip.lex]) {
          throw new CompilerError('"aray" must be followed by array dimensions "[n..m]".', lexemes[wip.lex - 1])
        }
        if (lexemes[wip.lex].content !== '[') {
          throw new CompilerError('"aray" must be followed by array dimensions "[n..m]".', lexemes[wip.lex])
        }
        wip.lex += 1

        // expecting array dimensions
        const arrayDimensions: [number, number][] = []
        while (lexemes[wip.lex] && lexemes[wip.lex].content !== ']') {
          const [start, dots, end] = lexemes.slice(wip.lex, wip.lex + 3)
          let startIndex: number
          let endIndex: number

          // expecting integer start value
          switch (start.type) {
            case 'identifier':
              let variable = wip.routine.findVariable(start.content as string)
              if (variable) {
                throw new CompilerError('Array index cannot be a variable.', end)
              }
              let constant = wip.routine.findConstant(start.content as string)
              if (!constant) {
                throw new CompilerError('Constant {lex} has not been defined.', start)
              }
              if (constant.type !== 'boolint') {
                throw new CompilerError('{lex} is not an integer constant.', start)
              }
              if (constant.value < 0) {
                throw new CompilerError('Array start index cannot be negative.', start)
              }
              startIndex = constant.value as number
              break
            case 'integer':
              if (start.value as number < 0) {
                throw new CompilerError('Array start index cannot be negative.', start)
              }
              startIndex = start.value as number
              break
            default:
              throw new CompilerError('Array start index must be an integer or integer constant.', lexemes[wip.lex])
          }

          // expecting dots
          if (!dots) {
            throw new CompilerError('Array declarations take the form "array[n..m]", where "n" and "m" are integer values specifying the start and end index of the array.', start)
          }
          if (dots.content !== '..') {
            throw new CompilerError('Array declarations take the form "array[n..m]", where "n" and "m" are integer values specifying the start and end index of the array.', dots)
          }

          // expecting end value
          switch (end.type) {
            case 'identifier':
              let variable = wip.routine.findVariable(end.content as string)
              if (variable) {
                throw new CompilerError('Array index cannot be a variable.', end)
              }
              let constant = wip.routine.findConstant(end.content as string)
              if (!constant) {
                throw new CompilerError('Constant {lex} has not been defined.', end)
              }
              if (constant.type !== 'boolint') {
                throw new CompilerError('{lex} is not an integer constant.', end)
              }
              if (constant.value < 0) {
                throw new CompilerError('Array start index cannot be negative.', end)
              }
              endIndex = constant.value as number
              break
            case 'integer':
              if (end.value as number < 0) {
                throw new CompilerError('Array start index cannot be negative.', end)
              }
              endIndex = end.value as number
              break
            default:
              throw new CompilerError('Array start index must be an integer or integer constant.', lexemes[wip.lex])
          }

          // check startIndex < endIndex
          if (startIndex >= endIndex) {
            throw new CompilerError('Array end index must be greater than start index.', end)
          }

          // add the dimensions and move on
          arrayDimensions.push([startIndex, endIndex])
          wip.lex += 3

          // maybe move past comma
          if (lexemes[wip.lex] && lexemes[wip.lex].content === ',') wip.lex += 1
        }

        // check we came out of the loop for the right reason
        if (!lexemes[wip.lex]) {
          throw new CompilerError('"array" must be followed by array dimensions "[n..m]".', lexemes[wip.lex - 1])
        }

        // if so, move past the closing bracket
        wip.lex += 1

        // update the variables
        for (const variable of variables) {
          variable.arrayDimensions = arrayDimensions
        }

        // expecting "of"
        if (!lexemes[wip.lex]) {
          throw new CompilerError('"array[n..m]" must be followed by "of".', lexemes[wip.lex - 1])
        }
        if (lexemes[wip.lex].content?.toLowerCase() !== 'of') {
          throw new CompilerError('"array[n..m]" must be followed by "of".', lexemes[wip.lex])
        }
        wip.lex += 1

        // expecting base type (this won't allow "array", because these variables now have isArray === true)
        variableType(wip, lexemes, variables)
      }
      break

    default:
      if (variables.some(x => x.isArray)) {
        throw new CompilerError('{lex} is not a valid array variable type (expected "boolean", "char", "integer", or "string").', lexemes[wip.lex])
      }
      throw new CompilerError('{lex} is not a valid variable type (expected "array", "boolean", "char", "integer", or "string").', lexemes[wip.lex])
  }
}

/** parses lexemes at subroutine definition */
function subroutine (wip: WIP, lexemes: Lexeme[]): void {
  const parent = wip.routineStack[wip.routineStack.length - 1]
  const identifier = lexemes[wip.lex]

  // initial error checking
  if (!identifier) {
    throw new CompilerError('No subroutine name found.', lexemes[wip.lex - 1])
  }
  if (identifier.type !== 'identifier') {
    throw new CompilerError('{lex} is not a valid subroutine name.', identifier)
  }
  if (identifier.subtype === 'turtle') {
    throw new CompilerError('{lex} is the name of a predefined Turtle property, and cannot be used as a subroutine name.', identifier)
  }
  if (identifier.content?.toLowerCase() === wip.routine.program.name.toLowerCase()) {
    throw new CompilerError('Subroutine name {lex} is already the name of the program.', identifier)
  }
  if (parent.isDuplicate(identifier.content as string)) {
    throw new CompilerError('{lex} is already the name of a constant, variable, or subroutine in the current scope.', identifier)
  }

  // create the routine object
  wip.routine = new Subroutine(parent, identifier.content as string, wip.state as SubroutineType)
  wip.routineCount += 1
  wip.routine.index = wip.routineCount
  parent.subroutines.push(wip.routine as Subroutine)
  wip.routineStack.push(wip.routine)

  // add result variable to functions
  if ((wip.routine as Subroutine).type === 'function') {
    wip.routine.variables.push(new Variable('result', wip.routine))
  }

  // move on
  wip.lex += 1
  if (lexemes[wip.lex]) {
    // check for parameter declarations
    if (lexemes[wip.lex].content === '(') {
      wip.lex += 1
      parameters(wip, lexemes)
    }

    // if it's a function, look for colon and return type
    if ((wip.routine as Subroutine).type === 'function') {
      if (!lexemes[wip.lex]) {
        throw new CompilerError('Function must be followed by a colon, then the return type ("integer", "boolean", "char", or "string").', lexemes[wip.lex - 1])
      }
      if (lexemes[wip.lex].content !== ':') {
        throw new CompilerError('Function must be followed by a colon, then the return type ("integer", "boolean", "char", or "string").', lexemes[wip.lex])
      }
      wip.lex += 1
      variableType(wip, lexemes, [wip.routine.variables[0]])
      if (wip.routine.variables[0].isArray) {
        throw new CompilerError('Functions cannot return arrays.', lexemes[wip.lex])
      }
      (wip.routine as Subroutine).returns = wip.routine.variables[0].type
    }
  }

  // semicolon check
  semicolon(wip, lexemes, true, 'subroutine declaration')

  // where next
  wip.state = 'crossroads'
}

/** parses lexemes at subroutine parameters */
function parameters (wip: WIP, lexemes: Lexeme[]): void {
  let more = true
  while (more) {
    let isReferenceParameter = false
    if (lexemes[wip.lex] && lexemes[wip.lex].content === 'var') {
      isReferenceParameter = true
      wip.lex += 1
    }
    variables(wip, lexemes, true, isReferenceParameter)

    switch (lexemes[wip.lex].content) {
      case ';':
        while (lexemes[wip.lex].content === ';') wip.lex += 1
        break

      case ')':
        wip.lex += 1
        more = false
        break

      default:
        // anything else is an error
        throw new CompilerError('Parameter declarations must be followed by a closing bracket ")".', lexemes[wip.lex])
    }
  }
}

/** parses lexemes at "begin" */
function begin (wip: WIP, lexemes: Lexeme[]): void {
  // expecting routine commands
  wip.begins = 1
  while (wip.begins > 0 && lexemes[wip.lex]) {
    if (lexemes[wip.lex].content?.toLowerCase() === 'begin') wip.begins += 1
    if (lexemes[wip.lex].content?.toLowerCase() === 'end') wip.begins -= 1
    wip.routine.lexemes.push(lexemes[wip.lex])
    wip.lex += 1
  }

  // error check
  if (wip.begins > 0) {
    throw new CompilerError('Routine commands must finish with "END".', lexemes[wip.lex])
  }

  // pop off the "end" lexeme
  wip.routine.lexemes.pop()

  // where next
  wip.state = 'end'
}

/** parses lexemes at "end" */
function end (wip: WIP, lexemes: Lexeme[]): void {
  // expecting "." at the end of the main program, or ";" at the end of a subroutine
  if (wip.routine instanceof Program) {
    if (!lexemes[wip.lex]) {
      throw new CompilerError('Program "END" must be followed by a full stop.', lexemes[wip.lex - 1])
    }
    if (lexemes[wip.lex].content !== '.') {
      throw new CompilerError('Program "END" must be followed by a full stop.', lexemes[wip.lex])
    }
    if (lexemes[wip.lex + 1]) {
      throw new CompilerError('No text can appear after program "END".', lexemes[wip.lex + 1])
    }
    wip.lex += 1 // so we exit the main loop
  } else {
    semicolon(wip, lexemes, true, 'subroutine "END"')
    wip.routineStack.pop()
    wip.routine = wip.routineStack[wip.routineStack.length - 1]
    wip.state = 'crossroads'
  }
}

/** parses semicolons */
function semicolon (wip: WIP, lexemes: Lexeme[], compulsory: boolean = false, context: string = 'statement'): void {
  if (compulsory) {
    // there must be a lexeme ...
    if (!lexemes[wip.lex]) {
      throw new CompilerError(`Semicolon needed after ${context}.`, lexemes[wip.lex - 1])
    }

    // ... and it must be a semicolon
    if (lexemes[wip.lex].content !== ';') {
      throw new CompilerError(`Semicolon needed after ${context}.`, lexemes[wip.lex - 1])
    }
  }

  // move past any semicolons
  while (lexemes[wip.lex] && lexemes[wip.lex].content === ';') wip.lex += 1
}
