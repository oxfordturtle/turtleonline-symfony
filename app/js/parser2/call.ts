import { Lex } from './lex'
import { expression, typeCheck } from './expression'
import { Program } from './definitions/program'
import { Subroutine, SubroutineType } from './definitions/subroutine'
import { ProcedureCall } from './definitions/statement'
import { FunctionCall } from './definitions/expression'
import { Command } from '../constants/commands'
import { CompilerError } from '../tools/error'

/** parses lexemes as a procedure call */
export function procedureCall (routine: Program|Subroutine, lex: Lex, command: Command|Subroutine): ProcedureCall {
  if (command.returns) {
    throw new CompilerError('{lex} is a function, not a procedure.', lex.get(-1))
  }
  const procedureCall = new ProcedureCall(command)
  handleArguments(routine, lex, procedureCall)
  return procedureCall
}

/** parses lexemes as a function call */
export function functionCall (routine: Program|Subroutine, lex: Lex, command: Command|Subroutine): FunctionCall {
  if (!command.returns) {
    throw new CompilerError('{lex} is a procedure, not a function.', lex.get(-1))
  }
  const functionCall = new FunctionCall(command)
  handleArguments(routine, lex, functionCall)
  return functionCall
}

/** parses argument lexemes */
function handleArguments (routine: Program|Subroutine, lex: Lex, commandCall : ProcedureCall|FunctionCall): void {
  // with parameters
  if (commandCall.command.parameters.length > 0) {
    // check for opening bracket
    if (!lex.get() || lex.content() !== '(') {
      throw new CompilerError('Opening bracket missing after command {lex}.', lex.get(-1))
    }

    // move past the opening bracket
    lex.step()

    // parse the arguments
    parseArguments(routine, lex, commandCall)
  }

  // without parameters
  else {
    // command with no parameters in BASIC or Pascal (brackets not allowed)
    if (routine.language === 'BASIC' || routine.language === 'Pascal') {
      if (lex.get() && (lex.content() === '(')) {
        throw new CompilerError('Command {lex} takes no arguments.', lex.get(-1))
      }
    }

    // command with no parameters in other languages (brackets obligatory)
    else {
      const openBracket = lex.get()
      const closeBracket = lex.get(1)
      // check for opening bracket
      if (!openBracket || openBracket.content !== '(') {
        throw new CompilerError('Opening bracket missing after command {lex}.', lex.get(-1))
      }

      // check for immediate closing bracket (no arguments)
      if (!closeBracket || closeBracket.type === 'newline' || closeBracket.content === ';') {
        throw new CompilerError('Closing bracket missing after command {lex}.', lex.get(-1))
      }
      if (closeBracket.content !== ')') {
        throw new CompilerError('Command {lex} takes no arguments.', lex.get(-1))
      }

      // move past the brackets
      lex.step(2)
    }
  }
}

/** parses arguments for a command call */
function parseArguments (routine: Program|Subroutine, lex: Lex, commandCall: ProcedureCall|FunctionCall): void {
  const commandName = (commandCall.command instanceof Command)
    ? commandCall.command.names[routine.language]
    : commandCall.command.name

    // handle the arguments
  const argsExpected = commandCall.command.parameters.length
  let argsGiven = 0
  while ((argsGiven < argsExpected) && (lex.content() !== ')')) {
    const parameter = commandCall.command.parameters[argsGiven]
    let argument = expression(routine, lex)
    const bypassTypeCheck = (commandCall.command instanceof Command)
      && (commandCall.command.names[routine.language]?.toLowerCase() === 'address')
    if (!bypassTypeCheck) { // variable passed (by reference) to built-in address function can be of any type
      argument = typeCheck(argument, parameter.type, lex.get(-1))
    }
    commandCall.arguments.push(argument)
    argsGiven += 1
    if (argsGiven < argsExpected) {
      if (!lex.get()) {
        throw new CompilerError('Comma needed after parameter.', lex.get(-1))
      }
      if (lex.content() === ')') {
        throw new CompilerError(`Not enough arguments given for command "${commandName}".`, lex.get())
      }
      if (lex.type() === 'identifier') {
        throw new CompilerError('Comma missing between parameters.', lex.get())
      }
      if (lex.content() !== ',') {
        throw new CompilerError('Comma needed after parameter.', lex.get())
      }
      lex.step()
    }
  }

  // final error checking
  if (argsGiven < argsExpected) {
    throw new CompilerError(`Not enough arguments given for command "${commandName}".`, lex.get())
  }
  if (lex.content() === ',') {
    throw new CompilerError(`Too many arguments given for command "${commandName}".`, lex.get())
  }
  if (lex.content() !== ')') {
    throw new CompilerError(`Closing bracket missing after command "${commandName}".`, lex.get(-1))
  }

  // move past the closing bracket
  lex.step()
}
