import { expression, typeCheck } from './expression'
import basicBody from './basic/body'
import type Program from './definitions/program'
import { Subroutine } from './definitions/subroutine'
import { ProcedureCall } from './definitions/statement'
import { FunctionCall } from './definitions/expression'
import { Command } from '../constants/commands'
import { CompilerError } from '../tools/error'
import type Lexemes from './definitions/lexemes'
import type { IdentifierLexeme } from '../lexer/lexeme'

/** parses lexemes as a procedure call */
export function procedureCall (lexeme: IdentifierLexeme, lexemes: Lexemes, routine: Program|Subroutine, command: Command|Subroutine): ProcedureCall {
  if (command.returns) {
    throw new CompilerError('{lex} is a function, not a procedure.', lexeme)
  }
  const procedureCall = new ProcedureCall(lexeme, command)
  brackets(lexeme, lexemes, routine, procedureCall)
  if (procedureCall.command instanceof Subroutine && procedureCall.command !== routine) {
    if (routine.language === 'BASIC' && procedureCall.command.statements.length === 0) {
      const previousLexemeIndex = lexemes.index
      basicBody(lexemes, procedureCall.command)
      lexemes.index = previousLexemeIndex
    }
  }
  return procedureCall
}

/** parses lexemes as a function call */
export function functionCall (lexeme: IdentifierLexeme, lexemes: Lexemes, routine: Program|Subroutine, command: Command|Subroutine): FunctionCall {
  if (!command.returns) {
    throw new CompilerError('{lex} is a procedure, not a function.', lexemes.get(-1))
  }
  const functionCall = new FunctionCall(lexeme, command)
  brackets(lexeme, lexemes, routine, functionCall)
  if (functionCall.command instanceof Subroutine && functionCall.command !== routine) {
    if (routine.language === 'BASIC' && functionCall.command.statements.length === 0) {
      const previousLexemeIndex = lexemes.index
      basicBody(lexemes, functionCall.command)
      lexemes.index = previousLexemeIndex
    }
  }
  return functionCall
}

/** parses lexemes as (possible) brackets following a command call */
function brackets (lexeme: IdentifierLexeme, lexemes: Lexemes, routine: Program|Subroutine, commandCall : ProcedureCall|FunctionCall): void {
  // with parameters
  if (commandCall.command.parameters.length > 0) {
    // check for opening bracket
    if (!lexemes.get() || lexemes.get()?.content !== '(') {
      throw new CompilerError('Opening bracket missing after command {lex}.', lexeme)
    }

    // move past the opening bracket
    lexemes.next()

    // parse the arguments
    _arguments(lexemes, routine, commandCall)
  }

  // without parameters
  else {
    // command with no parameters in BASIC or Pascal (brackets not allowed)
    if (routine.language === 'BASIC' || routine.language === 'Pascal') {
      if (lexemes.get() && (lexemes.get()?.content === '(')) {
        throw new CompilerError('Command {lex} takes no arguments.', lexemes.get(-1))
      }
    }

    // command with no parameters in other languages (brackets obligatory)
    else {
      const openBracket = lexemes.get()
      const closeBracket = lexemes.get(1)
      // check for opening bracket
      if (!openBracket || openBracket.content !== '(') {
        throw new CompilerError('Opening bracket missing after command {lex}.', lexemes.get(-1))
      }

      // check for immediate closing bracket (no arguments)
      if (!closeBracket || closeBracket.type === 'newline' || closeBracket.content === ';') {
        throw new CompilerError('Closing bracket missing after command {lex}.', lexemes.get(-1))
      }
      if (closeBracket.content !== ')') {
        throw new CompilerError('Command {lex} takes no arguments.', lexemes.get(-1))
      }

      // move past the brackets
      lexemes.next()
      lexemes.next()
    }
  }
}

/** parses arguments for a command call */
function _arguments (lexemes: Lexemes, routine: Program|Subroutine, commandCall: ProcedureCall|FunctionCall): void {
  const commandName = (commandCall.command instanceof Command)
    ? commandCall.command.names[routine.language]
    : commandCall.command.name

    // handle the arguments
  const argsExpected = commandCall.command.parameters.length
  let argsGiven = 0
  while ((argsGiven < argsExpected) && (lexemes.get()?.content !== ')')) {
    const parameter = commandCall.command.parameters[argsGiven]
    let argument = expression(lexemes, routine)
    const bypassTypeCheck = (commandCall.command instanceof Command)
      && (commandCall.command.names[routine.language]?.toLowerCase() === 'address')
    if (!bypassTypeCheck) { // variable passed (by reference) to built-in address function can be of any type
      argument = typeCheck(argument, parameter.type)
    }
    commandCall.arguments.push(argument)
    argsGiven += 1
    if (argsGiven < argsExpected) {
      if (!lexemes.get()) {
        throw new CompilerError('Comma needed after parameter.', argument.lexeme)
      }
      if (lexemes.get()?.content === ')') {
        throw new CompilerError(`Not enough arguments given for command "${commandName}".`, commandCall.lexeme)
      }
      if (lexemes.get()?.content !== ',') {
        console.log(lexemes.lexemes.slice(lexemes.index - 10, lexemes.index + 10))
        throw new CompilerError('Comma needed after parameter.', argument.lexeme)
      }
      lexemes.next()
    }
  }

  // final error checking
  if (argsGiven < argsExpected) {
    throw new CompilerError('Too few arguments given for command {lex}.', commandCall.lexeme)
  }
  if (lexemes.get()?.content === ',') {
    throw new CompilerError('Too many arguments given for command {lex}.', commandCall.lexeme)
  }
  if (lexemes.get()?.content !== ')') {
    throw new CompilerError('Closing bracket missing after command {lex}.', commandCall.lexeme)
  }

  // move past the closing bracket
  lexemes.next()
}
