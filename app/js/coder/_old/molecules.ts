/*
compile the basic 'atoms' of a program, i.e. expressions, variable assignments, and procedure calls
*/
import { WIP, ExpressionType, unambiguousOperator, check } from './misc'
import { Options } from '../options'
import * as pcoder from '../../pcoder/misc'
import { Command } from '../../constants/commands'
import { PCode } from '../../constants/pcodes'
import { CompilerError } from '../../tools/error'
import { Routine, Subroutine, Variable, VariableType } from '../../parser/routine'

/** compiles an expression */
export function expression (routine: Routine, lex: number, type: ExpressionType, needed: ExpressionType, options: Options): WIP {
  const expTypes = [PCode.eqal, PCode.less, PCode.lseq, PCode.more, PCode.mreq, PCode.noeq]

  // expressions are boolean anyway
  if (needed.arrayDimensions === 0 && needed.variableType === 'boolean') {
    needed.variableType = null
  }

  // evaluate the first bit
  let result = simple(routine, lex, type, needed, options)

  // evaluate the expression operator and next bit (if any), and merge the results
  while (routine.lexemes[result.lex] && (expTypes.indexOf(routine.lexemes[result.lex].value as PCode) > -1)) {
    const operator = unambiguousOperator(routine.lexemes[result.lex].value as PCode, result.type as VariableType, options)
    const next = simple(routine, result.lex + 1, result.type, needed, options)
    const makeAbsolute = (routine.program.language === 'Python')
    result = pcoder.mergeWithOperator(result.pcode, next, operator, makeAbsolute)
  }

  // return the whole thing (and force boolean type)
  return Object.assign(result, { type: 'boolean' })
}

/** compiles a statement beginning with an identifier (variable assignment or procedure call) */
export function assignmentOrProcedureCall (routine: Routine, lex: number, options: Options): WIP {
  const command = routine.findCommand(routine.lexemes[lex].content)
  const variable = routine.findVariable(name)
  if (command) {
    return procedureCall(routine, command, lex + 1, options)
  } else if (variable) {
    return variableAssignment(routine, variable, lex + 1, options)
  } else {
    throw new CompilerError('Identifier {lex} is not defined.', routine.lexemes[lex])
  }
}

/** compiles a variable assignment */
export function variableAssignment (routine: Routine, variable: Variable, lex: number, options: Options): WIP {
  const indexes: number[] = []
  if (variable.isArray) {
  }

  // expecting assignment operator next
  lex += 1
  if (routine.program.language === 'Pascal') {
    if (!routine.lexemes[lex]) {
      throw new CompilerError('Variable must be followed by assignment operator ":=".', routine.lexemes[lex - 1])
    }
    if (routine.lexemes[lex].content !== ':=') {
      throw new CompilerError('Variable must be followed by assignment operator ":=".', routine.lexemes[lex])
    }
  } else {
    if (!routine.lexemes[lex]) {
      throw new CompilerError('Variable must be followed by assignment operator "=".', routine.lexemes[lex - 1])
    }
    if (routine.lexemes[lex].content !== '=') {
      throw new CompilerError('Variable must be followed by assignment operator "=".', routine.lexemes[lex])
    }
  }

  // expecting an expression as the value to assign to the variable
  lex += 1
  if (!routine.lexemes[lex]) {
    throw new CompilerError(`Variable "${name}" must be assigned a value.`, routine.lexemes[lex - 1])
  }
  const result = expression(routine, lex, null, variable.type, options)

  // return the next lexeme index and pcode
  const pcode = variable.isArray
    ? pcoder.storeArrayVariableValue(variable, indexes, options)
    : pcoder.storeVariableValue(variable, options)
  return { type: null, lex: result.lex, pcode: pcoder.merge(result.pcode, [pcode]) }
}

/** compiles a procedure call (also used by the functionCall function below) */
function procedureCall (routine: Routine, command: Command|Subroutine, lex: number, options: Options, procedureCheck: boolean = true): WIP {
  // check it is a procedure; N.B. this function is also used below for handling
  // functions, where the procedureCheck argument is false
  if (procedureCheck && command.returns) {
    throw new CompilerError('{lex} is a function, not a procedure.', routine.lexemes[lex])
  }

  // split into two cases: with and without parameters
  return (command.parameters.length === 0)
    ? commandNoParameters(routine, lex, command, options)
    : commandWithParameters(routine, lex, command, options)
}

/** compiles a simple expression */
function simple (routine: Routine, lex: number, type: ExpressionType, needed: ExpressionType, options: Options): WIP {
  const simpleTypes = [PCode.plus, PCode.subt, PCode.or, PCode.orl, PCode.xor]

  // evaluate the first bit
  let result = term(routine, lex, type, needed, options)

  // evaluate the expression operator and next bit (if any), and merge the results
  while (routine.lexemes[result.lex] && (simpleTypes.indexOf(routine.lexemes[result.lex].value as PCode) > -1)) {
    const operator = unambiguousOperator(routine.lexemes[result.lex].value as PCode, result.type, options)
    const next = term(routine, result.lex + 1, result.type, needed, options)
    const makeAbsolute = (routine.program.language === 'Python' && operator === PCode.orl)
    result = pcoder.mergeWithOperator(result.pcode, next, operator, makeAbsolute)
  }

  // return the whole thing
  return result
}

/** compiles a term expression */
function term (routine: Routine, lex: number, type: ExpressionType, needed: ExpressionType, options: Options): WIP {
  const termTypes = [PCode.and, PCode.andl, PCode.div, PCode.divr, PCode.mod, PCode.mult]

  // evaluate the first bit
  let result = factor(routine, lex, type, needed, options)

  // evaluate the term operator and next bit (if any), and merge the results
  while (routine.lexemes[result.lex] && termTypes.indexOf(routine.lexemes[result.lex].value as PCode) > -1) {
    const operator = unambiguousOperator(routine.lexemes[result.lex].value as PCode, result.type, options)
    const next = factor(routine, result.lex + 1, result.type, needed, options)
    const makeAbsolute = (routine.program.language === 'Python' && operator === PCode.andl)
    result = pcoder.mergeWithOperator(result.pcode, next, operator, makeAbsolute)
  }

  // return the whole thing
  return result
}

/** compiles a factor (where expressions bottom out) */
function factor (routine: Routine, lex: number, type: ExpressionType, needed: ExpressionType, options: Options): WIP {
  let wip: WIP = { type, lex, pcode: [] }

  switch (routine.lexemes[lex].type) {
    // operators
    case 'operator':
      const operator = routine.lexemes[lex].value as PCode
      switch (operator) {
        case PCode.subt: // fallthrough
        case PCode.not:
          type.variableType = (operator === PCode.subt) ? 'integer' : 'boolint'
          // check the type is okay
          check(needed, type, routine.lexemes[lex], options)
          // handle what follows (should be a factor)
          wip = factor(routine, lex + 1, type, needed, options)
          // append the negation operator
          wip.pcode = pcoder.merge(wip.pcode, [pcoder.applyOperator(operator, routine.program.language, options)])
          break
        
        default:
          throw new CompilerError('{lex} makes no sense here.', routine.lexemes[lex])
      }

    // literal values
    case 'boolean': // fallthrough
    case 'integer': // fallthrough
    case 'string': // fallthrough
    case 'character':
      wip.type.
      // check this type is ok (will throw an error if not)
      check(needed, type, routine.lexemes[lex], options)
      wip.type = type
      // get the pcode
      const pcode = [pcoder.loadLiteralValue(needed.variableType, routine.lexemes[lex].type as VariableType, routine.lexemes[lex].value, options)]
      // return the stuff
      return { type, lex: lex + 1, pcode }

    // input codes
    case 'keycode': // fallthrough
    case 'query':
      const input = routine.findInput(routine.lexemes[lex].content)
      if (input) {
        const type: ExpressionType = { variableType: 'integer', arrayDimensions: 0 }
        // check the type is ok (will throw an error if not)
        check(needed, type, routine.lexemes[lex], options)
        // return the stuff
        return { type, lex: lex + 1, pcode: [pcoder.loadInputValue(input, options)] }
      } else {
        throw new CompilerError('{lex} is not a valid input code.', routine.lexemes[lex])
      }

    // identifiers
    case 'identifier':
      const constant = routine.findConstant(routine.lexemes[lex].content)
      if (constant) {}

      const variable = routine.findVariable(routine.lexemes[lex].content)
      if (variable) {}

      const colour = routine.findColour(routine.lexemes[lex].content)
      if (colour) {}

      const command = routine.findCommand(routine.lexemes[lex].content)
      if (command) {
        functionCall(routine, command, lex, needed, options)
      }

      throw new CompilerError('{lex} is not defined.', routine.lexemes[lex])

    // everything else
    default:
      // look for an open bracket
      if (routine.lexemes[lex].content === '(') {
        // what follows should be an expression
        const result = expression(routine, lex + 1, type, needed, options)

        // now check for a closing bracket
        if (routine.lexemes[result.lex] && (routine.lexemes[result.lex].content === ')')) {
          return Object.assign(result, { lex: result.lex + 1 })
        } else {
          throw new CompilerError('Closing bracket missing.', routine.lexemes[lex - 1])
        }
      } else {
        // anything else is an error
        throw new CompilerError('{lex} makes no sense here.', routine.lexemes[lex])
      }
  }

  return wip
}

// handle a function call
function functionCall (routine: Routine, command: Command|Subroutine, lex: number, needed: ExpressionType, options: Options): WIP {
  // check it is a function
  if (!command.returns) {
    throw new CompilerError('{lex} is a procedure, not a function.', routine.lexemes[lex])
  }

  // check return type (throws an error if wrong)
  const type: ExpressionType = { variableType: command.returns, arrayDimensions: 0 }
  check(needed, type, routine.lexemes[lex], options)

  // handle the bulk of the function (mostly works just like a procedure call, except that the
  // last argument is set to false, so as to bypass the procedure check)
  const wip = procedureCall(routine, command, lex, options, false)

  // user-defined functions need this at the end
  if (command instanceof Subroutine) {
    wip.pcode.push(pcoder.loadFunctionReturnValue(command, options))
  }

  wip.type = type
  return wip
}

// handle a command with no parameters
function commandNoParameters (routine: Routine, lex: number, command: Command|Subroutine, options: Options): WIP {
  // command with no parameters in Python
  if (routine.program.language === 'Python') {
    // check for opening bracket
    if (!routine.lexemes[lex + 1] || (routine.lexemes[lex + 1].content !== '(')) {
      throw new CompilerError('Opening bracket missing after command {lex}.', routine.lexemes[lex])
    }

    // check for immediate closing bracket (no arguments)
    if (!routine.lexemes[lex + 2] || routine.lexemes[lex + 2].type === 'newline') {
      throw new CompilerError('Closing bracket missing after command call.', routine.lexemes[lex])
    }
    if (routine.lexemes[lex + 2].content !== ')') {
      throw new CompilerError('Command {lex} takes no arguments.', routine.lexemes[lex])
    }

    // return the command call and the index of the next lexeme
    return { type: null, lex: lex + 3, pcode: [pcoder.callCommand(command, routine, options)] }
  }

  // command with no parameters in BASIC or Pascal
  if (routine.lexemes[lex + 1] && (routine.lexemes[lex + 1].content === '(')) {
    throw new CompilerError('Command {lex} takes no arguments.', routine.lexemes[lex])
  }

  return { type: null, lex: lex + 1, pcode: [pcoder.callCommand(command, routine, options)] }
}

// handle a command with parameters
function commandWithParameters (routine: Routine, lex: number, command: Command|Subroutine, options: Options): WIP {
  // check for opening bracket
  if (!routine.lexemes[lex + 1] || routine.lexemes[lex + 1].content !== '(') {
    throw new CompilerError('Opening bracket missing after command {lex}.', routine.lexemes[lex])
  }

  // handle the parameters
  const result = args(routine, lex + 2, command, options)

  // return the parameters followed by the pcode for calling the command
  const callCommand = [pcoder.callCommand(command, routine, options)]
  return Object.assign(result, { pcode: pcoder.merge(result.pcode, callCommand) })
}

// pcode for loading arguments for a command call
function args (routine: Routine, lex: number, command: Command|Subroutine, options: Options): WIP {
  const commandName = (command instanceof Command) ? command.names[routine.program.language] : command.name
  // handle the arguments
  const argsExpected = command.parameters.length
  let argsGiven = 0
  let pcode = [[]]
  while ((argsGiven < argsExpected) && (routine.lexemes[lex].content !== ')')) {
    const result = argument(routine, lex, command, argsGiven, options)
    argsGiven += 1
    lex = result.lex
    pcode = pcoder.merge(pcode, result.pcode)
    if (argsGiven < argsExpected) {
      if (!routine.lexemes[lex]) {
        throw new CompilerError('Comma needed after parameter.', routine.lexemes[lex - 1])
      }
      if (routine.lexemes[lex].content === ')') {
        throw new CompilerError(`Not enough arguments given for command "${commandName}".`, routine.lexemes[lex])
      }
      if (routine.lexemes[lex].type === 'identifier') {
        throw new CompilerError('Comma missing between parameters.', routine.lexemes[lex])
      }
      if (routine.lexemes[lex].content !== ',') {
        throw new CompilerError('Comma needed after parameter.', routine.lexemes[lex])
      }
      lex += 1
    }
  }

  // final error checking
  if (argsGiven < argsExpected) {
    throw new CompilerError(`Not enough arguments given for command "${commandName}".`, routine.lexemes[lex])
  }
  if (routine.lexemes[lex].content === ',') {
    throw new CompilerError(`Too many arguments given for command "${commandName}".`, routine.lexemes[lex])
  }
  if (routine.lexemes[lex].content !== ')') {
    throw new CompilerError(`Closing bracket missing after command "${commandName}".`, routine.lexemes[lex - 1])
  }

  // return the next lex index and the pcode
  return { type: null, lex: lex + 1, pcode }
}

// handle the argument to a command call
function argument (routine: Routine, lex: number, command: Command|Subroutine, index: number, options: Options): WIP {
  // reference parameter
  if (command.parameters[index].isReferenceParameter) {
    const variable = routine.findVariable(routine.lexemes[lex].content)
    if (!variable) {
      throw new CompilerError('{lex} is not defined.}', routine.lexemes[lex])
    }
    return { type: variable.type, lex: lex + 1, pcode: [pcoder.loadVariableAddress(variable, options)] }
  }

  // value parameter
  const type = command.parameters[index].type
  return expression(routine, lex, null, type, options)
}
