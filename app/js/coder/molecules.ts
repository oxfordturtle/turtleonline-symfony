/*
compile the basic 'atoms' of a program, i.e. expressions, variable assignments, and procedure calls
*/
import * as atoms from './atoms'
import check from './check'
import { Options } from './options'
import * as pcoder from './pcoder'
import { Command } from '../constants/commands'
import { PCode } from '../constants/pcodes'
import { CompilerError } from '../tools/error'
import { Routine, Subroutine, VariableType } from '../parser/routine'

type Result = { type: VariableType|null, lex: number, pcode: number[][] }

// generate pcode for an expression (mutually recursive with simple, term, and factor below)
export function expression (routine: Routine, lex: number, type: VariableType|null, needed: VariableType|null, options: Options): Result {
  const expTypes = [PCode.eqal, PCode.less, PCode.lseq, PCode.more, PCode.mreq, PCode.noeq]

  // expressions are boolean anyway
  if (needed === 'boolean') needed = null

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

// variable assignment
export function variableAssignment (routine: Routine, name: string, lex: number, options: Options): Result {
  // search for the variable and check it exists
  const variable = routine.findVariable(name)
  if (!variable) {
    throw new CompilerError(`Variable "${name}" is not defined.`, routine.lexemes[lex])
  }

  // check there is some value assignment, and if so evaluate it
  if (!routine.lexemes[lex]) {
    throw new CompilerError(`Variable "${name}" must be assigned a value.`, routine.lexemes[lex - 1])
  }
  const result = expression(routine, lex, null, variable.type, options)

  // return the next lexeme index and pcode
  return { type: null, lex: result.lex, pcode: pcoder.merge(result.pcode, [pcoder.storeVariableValue(variable, options)]) }
}

// procedure call (but also used internally by the functionCall function below, since most of the
// code for calling a function (loading arguments onto the stack, then calling the command) is the
// same
export function procedureCall (routine: Routine, lex: number, options: Options, procedureCheck: boolean = true): Result {
  // look for the command
  const command = routine.findCommand(routine.lexemes[lex].content)
  if (!command) throw new CompilerError('Command "{lex}" not found.', routine.lexemes[lex])

  // check it is a procedure; N.B. this function is also used below for handling functions, where
  // the procedureCheck argument is false
  if (procedureCheck && command.returns) {
    throw new CompilerError('{lex} is a function, not a procedure.', routine.lexemes[lex])
  }

  // split into two cases: with and without parameters
  return (command.parameters.length === 0)
    ? commandNoParameters(routine, lex, command, options)
    : commandWithParameters(routine, lex, command, options)
}

// get unambiguous operator from ambiguous one
function unambiguousOperator (operator: PCode, type: VariableType|null, options: Options): PCode {
  const integerVersions = [PCode.eqal, PCode.less, PCode.lseq, PCode.more, PCode.mreq, PCode.noeq, PCode.plus]
  const stringVersions = [PCode.seql, PCode.sles, PCode.sleq, PCode.smor, PCode.smeq, PCode.sneq, PCode.scat]
  return (type === 'string' || type === 'character')
    ? stringVersions[integerVersions.indexOf(operator)]
    : operator
}

// handle a simple
function simple (routine: Routine, lex: number, type: VariableType|null, needed: VariableType|null, options: Options): Result {
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

// handle a term
function term (routine: Routine, lex: number, type: VariableType|null, needed: VariableType|null, options: Options): Result {
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

// handle a factor (the lowest level of an expression)
function factor (routine: Routine, lex: number, type: VariableType|null, needed: VariableType|null, options: Options): Result {
  switch (routine.lexemes[lex].type) {
    // operators
    case 'operator':
      return negative(routine, lex, needed, options) ||
        (() => { throw new CompilerError('{lex} makes no sense here.', routine.lexemes[lex]) })()

    // literal values
    case 'boolean': // fallthrough
    case 'integer': // fallthrough
    case 'string': // fallthrough
    case 'character':
      return atoms.literal(routine, lex, needed, routine.lexemes[lex].type as VariableType, options)

    // input codes
    case 'keycode': // fallthrough
    case 'query':
      return atoms.input(routine, lex, needed, options) ||
        (() => { throw new CompilerError('{lex} is not a valid input code.', routine.lexemes[lex]) })()

    // identifiers
    case 'identifier':
      return atoms.constant(routine, lex, needed, options) ||
        atoms.variable(routine, lex, needed, options) ||
        atoms.colour(routine, lex, needed, options) ||
        functionCall(routine, lex, needed, options) ||
        (() => { throw new CompilerError('{lex} is not defined.', routine.lexemes[lex]) })()

    // everything else
    default:
      return brackets(routine, lex, type, needed, options) ||
        (() => { throw new CompilerError('{lex} makes no sense here.', routine.lexemes[lex]) })()
  }
}

// handle negation (integer or boolean)
function negative (routine: Routine, lex: number, needed: VariableType|null, options: Options): Result {
  // check for a negation operator, and handle it if found
  const negs = [PCode.subt, PCode.not]
  if (negs.indexOf(routine.lexemes[lex].value as PCode) > -1) {
    const found = (routine.lexemes[lex].value === PCode.subt) ? 'integer' : 'boolint'
    const operator = routine.lexemes[lex].value as PCode

    // check the type is okay
    check(needed, 'integer', routine.lexemes[lex], options)

    // handle what follows (should be a factor)
    const result = factor(routine, lex + 1, found, needed, options)

    // return the result of the factor, with the negation operator appended
    return Object.assign(result, { pcode: pcoder.merge(result.pcode, [pcoder.applyOperator(operator, routine.program.language, options)]) })
  }

  // return null if there's no negation operator
  return null
}

// handle a function call
function functionCall (routine: Routine, lex: number, needed: VariableType|null, options: Options): Result {
  // look for the function
  const hit = routine.findCommand(routine.lexemes[lex].content)
  if (hit) {
    // check it is a function
    if (!hit.returns) {
      throw new CompilerError('{lex} is a procedure, not a function.', routine.lexemes[lex])
    }

    // check return type (throws an error if wrong)
    check(needed, hit.returns, routine.lexemes[lex], options)

    // handle the bulk of the function (mostly works just like a procedure call, except that the
    // last argument is set to false, so as to bypass the procedure check)
    const result = procedureCall(routine, lex, options, false)

    // user-defined functions need this at the end
    if (hit instanceof Subroutine) result.pcode.push(pcoder.loadFunctionReturnValue(hit, options))

    return Object.assign(result, { type: hit.returns })
  }

  // return null if no function is found
  return null
}

// handle an expression that starts with an open bracket
function brackets (routine: Routine, lex: number, type: VariableType|null, needed: VariableType|null, options: Options): Result {
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
  }

  // return null if there is no open bracket
  return null
}

// handle a command with no parameters
function commandNoParameters (routine: Routine, lex: number, command: Command|Subroutine, options: Options): Result {
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
function commandWithParameters (routine: Routine, lex: number, command: Command|Subroutine, options: Options): Result {
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
function args (routine: Routine, lex: number, command: Command|Subroutine, options: Options): Result {
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
function argument (routine: Routine, lex: number, command: Command|Subroutine, index: number, options: Options): Result {
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
