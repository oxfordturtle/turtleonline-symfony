import { Expression, CommandCall, CompoundExpression, LiteralValue, VariableValue } from '../expression'
import { Routine, Subroutine } from '../routine'
import { VariableAssignment } from '../statement'
import { Type } from '../type'
import { Variable } from '../variable'
import { Lexeme } from '../../lexer/lexeme'
import { Command } from '../../constants/commands'
import { PCode } from '../../constants/pcodes'
import { CompilerError } from '../../tools/error'

/** parses lexemes as a simple statement */
export function simpleStatement (routine: Routine): CommandCall|VariableAssignment {
  // look for a command
  const command = routine.findCommand(routine.lexemes[routine.lex].content as string)
  if (command) {
    routine.lex += 1
    return commandCall(routine, command, 'procedure')
  }

  // look for a variable
  const variable = routine.findVariable(routine.lexemes[routine.lex].content as string)
  if (variable) {
    routine.lex += 1
    return variableAssignment(routine, variable)
  }

  // if there are no matches, throw an error
  throw new CompilerError('Identifier {lex} is not defined.', routine.lexemes[routine.lex])
}

/** parses lexemes as a command call */
export function commandCall (routine: Routine, command: Command|Subroutine, shouldBe: 'procedure'|'function'): CommandCall {
  const commandCall = new CommandCall(command)

  // check command type
  if (shouldBe === 'procedure' && command.returns) {
    throw new CompilerError('{lex} is a function, not a procedure.', routine.lexemes[routine.lex])
  }
  if (shouldBe === 'function' && !command.returns) {
    throw new CompilerError('{lex} is a procedure, not a function.', routine.lexemes[routine.lex])
  }

  // with parameters
  if (command.parameters.length > 0) {
    // check for opening bracket
    if (!routine.lexemes[routine.lex]) {
      throw new CompilerError('Opening bracket missing after command {lex}.', routine.lexemes[routine.lex - 1])
    }
    if (routine.lexemes[routine.lex].content !== '(') {
      throw new CompilerError('Opening bracket missing after command {lex}.', routine.lexemes[routine.lex])
    }

    // move past the opening bracket
    routine.lex += 1

    // parse the arguments
    parseArguments(routine, commandCall)
  }

  // without parameters
  else {
    // command with no parameters in BASIC or Pascal (brackets not allowed)
    if (routine.program.language === 'BASIC' || routine.program.language === 'Pascal') {
      if (routine.lexemes[routine.lex + 1] && (routine.lexemes[routine.lex + 1].content === '(')) {
        throw new CompilerError('Command {lex} takes no arguments.', routine.lexemes[routine.lex])
      }
    }

    // command with no parameters in other languages (brackets obligatory)
    else {
      const openBracket = routine.lexemes[routine.lex]
      const closeBracket = routine.lexemes[routine.lex + 1]
      // check for opening bracket
      if (!openBracket) {
        throw new CompilerError('Opening bracket missing after command {lex}.', routine.lexemes[routine.lex - 1])
      }
      if (openBracket.content !== '(') {
        throw new CompilerError('Opening bracket missing after command {lex}.', openBracket)
      }

      // check for immediate closing bracket (no arguments)
      if (!closeBracket) {
        throw new CompilerError('Closing bracket missing after command call.', openBracket)
      }
      if (closeBracket.type === 'newline' || closeBracket.content === ';') {
        throw new CompilerError('Closing bracket missing after command call.', closeBracket)
      }
      if (closeBracket.content !== ')') {
        throw new CompilerError('Command {lex} takes no arguments.', closeBracket)
      }

      // move past the brackets
      routine.lex += 2
    }
  }

  // return the command call
  return commandCall
}

/** parses lexemes as a variable assignment */
export function variableAssignment (routine: Routine, variable: Variable): VariableAssignment {
  const variableAssignment = new VariableAssignment(variable)
  const variableLexeme = routine.lexemes[routine.lex - 1]

  if (variable.isArray) {
    // TODO
  }

  // expecting assignment operator
  if (routine.program.language === 'Pascal') {
    if (!routine.lexemes[routine.lex]) {
      throw new CompilerError('Variable must be followed by assignment operator ":=".', routine.lexemes[routine.lex - 1])
    }
    if (routine.lexemes[routine.lex].content !== ':=') {
      throw new CompilerError('Variable must be followed by assignment operator ":=".', routine.lexemes[routine.lex])
    }
  } else {
    if (!routine.lexemes[routine.lex]) {
      throw new CompilerError('Variable must be followed by assignment operator "=".', routine.lexemes[routine.lex - 1])
    }
    if (routine.lexemes[routine.lex].content !== '=') {
      throw new CompilerError('Variable must be followed by assignment operator "=".', routine.lexemes[routine.lex])
    }
  }
  routine.lex += 1

  // expecting an expression as the value to assign to the variable
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError(`Variable "${name}" must be assigned a value.`, routine.lexemes[routine.lex - 1])
  }
  variableAssignment.value = expression(routine)
  typeCheck(variableAssignment.value, variable.type, variableLexeme)

  return variableAssignment
}

/** parses lexemes as an expression */
export function expression (routine: Routine, level: number = 0): Expression {
  // break out of recursion at level > 2
  if (level > 2) {
    return factor(routine)
  }

  // evaluate the first bit
  const left = expression(routine, level + 1)

  // check for operator
  const allOperators = [
    [PCode.eqal, PCode.less, PCode.lseq, PCode.more, PCode.mreq, PCode.noeq],
    [PCode.plus, PCode.subt, PCode.or, PCode.orl, PCode.xor],
    [PCode.and, PCode.andl, PCode.div, PCode.divr, PCode.mod, PCode.mult]
  ]
  const operators = allOperators[level]
  if (routine.lexemes[routine.lex]) {
    const operator = operators.find(x => x === routine.lexemes[routine.lex].value as PCode)
    if (operator) {
      // move past the operator
      routine.lex += 1

      // evaluate the right hand expression
      const right = expression(routine, level)

      // check types match
      typeCheck(left, right.type, routine.lexemes[routine.lex])

      // maybe replace comparison operator with string comparison operator
      const finalOperator = (left.type === 'string' || left.type === 'character')
        ? stringOperator(operator)
        : operator

      // create and return the compound expression
      if (right instanceof CompoundExpression && right.left) {
        // jiggle around to give left-to-right associativity
        // (i.e. later operators have wider scope)
        const compoundLeft = new CompoundExpression(left, right.left, finalOperator)
        return new CompoundExpression(compoundLeft, right.right, right.operator)
      }

      // if RHS isn't compound, jiggling is unnecessary
      return new CompoundExpression(left, right, finalOperator)
    }
  }
  
  // if there's no operator, just return the left bit
  return left
}

/** parses lexemes as a factor */
function factor (routine: Routine): Expression {
  let result: Expression

  switch (routine.lexemes[routine.lex].type) {
    // operators
    case 'operator':
      const operator = routine.lexemes[routine.lex].value as PCode
      switch (operator) {
        case PCode.subt:
          routine.lex += 1
          result = factor(routine)
          typeCheck(result, 'integer', routine.lexemes[routine.lex])
          return new CompoundExpression(null, result, PCode.neg)

        case PCode.not:
          routine.lex += 1
          result = factor(routine)
          typeCheck(result, 'boolint', routine.lexemes[routine.lex])
          return new CompoundExpression(null, result, PCode.not)
        
        default:
          throw new CompilerError('{lex} makes no sense here.', routine.lexemes[routine.lex])
      }

    // literal values
    case 'boolean': // fallthrough
    case 'integer': // fallthrough
    case 'string': // fallthrough
    case 'character':
      routine.lex += 1
      return new LiteralValue(routine.lexemes[routine.lex - 1].type as Type, routine.lexemes[routine.lex - 1].value as number|string)

    // input codes
    case 'keycode': // fallthrough
    case 'query':
      const input = routine.findInput(routine.lexemes[routine.lex].content as string)
      if (input) {
        routine.lex += 1
        result = new LiteralValue('integer', input.value)
        result.input = input.value < 0
        return result
      }
      throw new CompilerError('{lex} is not a valid input code.', routine.lexemes[routine.lex])

    // identifiers
    case 'identifier':
      // look for a constant
      const constant = routine.findConstant(routine.lexemes[routine.lex].content as string)
      if (constant) {
        routine.lex += 1
        return new LiteralValue(constant.type, constant.value)
      }

      // look for a variable
      const variable = routine.findVariable(routine.lexemes[routine.lex].content as string)
      if (variable) {
        // TODO: array variable indexes
        routine.lex += 1
        return new VariableValue(variable)
      }

      // look for a predefined colour constant
      const colour = routine.findColour(routine.lexemes[routine.lex].content as string)
      if (colour) {
        routine.lex += 1
        return new LiteralValue('integer', colour.value)
      }

      // look for a command
      const command = routine.findCommand(routine.lexemes[routine.lex].content as string)
      if (command) {
        routine.lex += 1
        return commandCall(routine, command, 'function')
      }

      // if none of those were found, throw an error
      throw new CompilerError('{lex} is not defined.', routine.lexemes[routine.lex])

    // everything else
    default:
      // look for an open bracket
      if (routine.lexemes[routine.lex].content === '(') {
        // what follows should be an expression
        routine.lex += 1
        result = expression(routine)

        // now check for a closing bracket
        if (routine.lexemes[routine.lex] && (routine.lexemes[routine.lex].content === ')')) {
          routine.lex += 1
          return result
        } else {
          throw new CompilerError('Closing bracket missing.', routine.lexemes[routine.lex - 1])
        }
      } else {
        // anything else is an error
        throw new CompilerError('{lex} makes no sense here.', routine.lexemes[routine.lex])
      }
  }
}

/** converts an integer/boolean operator into its string equivalent */
function stringOperator (operator: PCode): PCode {
  const defaultVersions = [PCode.eqal, PCode.less, PCode.lseq, PCode.more, PCode.mreq, PCode.noeq, PCode.plus]
  const stringVersions = [PCode.seql, PCode.sles, PCode.sleq, PCode.smor, PCode.smeq, PCode.sneq, PCode.scat]
  return stringVersions[defaultVersions.indexOf(operator)]
}

/** checks types match (throws an error if not) */
export function typeCheck (foundExpression: Expression, expectedType: Type, lexeme: Lexeme): void {
  // found and expected the same is obviously ok
  if (foundExpression.type === expectedType) {
    return
  }

  // if STRING is expected, CHARACTER is ok
  if ((expectedType === 'string') && (foundExpression.type === 'character')) {
    // but we'll need to convert the character to a string when creating the pcode
    // N.B. found can't be a CompoundExpression, because those are never characters
    (foundExpression as LiteralValue|VariableValue|CommandCall).string = true
    return
  }

  // if CHARACTER is expected, STRING is ok
  // the whole expression will end up being a string anyway
  if ((expectedType === 'character') && (foundExpression.type === 'string')) {
    return
  }

  // if BOOLINT is expected, either BOOLEAN or INTEGER is ok
  if (expectedType === 'boolint' && (foundExpression.type === 'boolean' || foundExpression.type === 'integer')) {
    return
  }

  // if BOOLINT is found, either BOOLEAN or INTEGER expected is ok
  if (foundExpression.type === 'boolint' && (expectedType === 'boolean' || expectedType === 'integer')) {
    return
  }

  // everything else is an error
  throw new CompilerError(`Type error: '${expectedType}' expected but '${foundExpression.type}' found.`, lexeme)
}

/** parses arguments for a command call */
function parseArguments (routine: Routine, commandCall: CommandCall): void {
  const command = commandCall.command
  const commandName = (command instanceof Command)
    ? command.names[routine.program.language]
    : command.name

    // handle the arguments
  const argsExpected = command.parameters.length
  let argsGiven = 0
  while ((argsGiven < argsExpected) && (routine.lexemes[routine.lex].content !== ')')) {
    const parameter = command.parameters[argsGiven]
    const argument = expression(routine)
    typeCheck(argument, parameter.type, routine.lexemes[routine.lex - 1])
    commandCall.arguments.push(argument)
    argsGiven += 1
    if (argsGiven < argsExpected) {
      if (!routine.lexemes[routine.lex]) {
        throw new CompilerError('Comma needed after parameter.', routine.lexemes[routine.lex - 1])
      }
      if (routine.lexemes[routine.lex].content === ')') {
        throw new CompilerError(`Not enough arguments given for command "${commandName}".`, routine.lexemes[routine.lex])
      }
      if (routine.lexemes[routine.lex].type === 'identifier') {
        throw new CompilerError('Comma missing between parameters.', routine.lexemes[routine.lex])
      }
      if (routine.lexemes[routine.lex].content !== ',') {
        throw new CompilerError('Comma needed after parameter.', routine.lexemes[routine.lex])
      }
      routine.lex += 1
    }
  }

  // final error checking
  if (argsGiven < argsExpected) {
    throw new CompilerError(`Not enough arguments given for command "${commandName}".`, routine.lexemes[routine.lex])
  }
  if (routine.lexemes[routine.lex].content === ',') {
    throw new CompilerError(`Too many arguments given for command "${commandName}".`, routine.lexemes[routine.lex])
  }
  if (routine.lexemes[routine.lex].content !== ')') {
    throw new CompilerError(`Closing bracket missing after command "${commandName}".`, routine.lexemes[routine.lex - 1])
  }

  // move past the closing bracket
  routine.lex += 1
}
