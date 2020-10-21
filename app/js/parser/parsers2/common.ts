import { Expression, CommandCall, CompoundExpression, LiteralValue, VariableAddress, VariableValue, CastExpression } from '../expression'
import { Program, Subroutine, SubroutineType } from '../routine'
import { VariableAssignment, PassStatement } from '../statement'
import { Type } from '../type'
import { Variable } from '../variable'
import { Lexeme } from '../../lexer/lexeme'
import { Command } from '../../constants/commands'
import { PCode } from '../../constants/pcodes'
import { CompilerError } from '../../tools/error'

/** parses lexemes as a simple statement */
export function simpleStatement (routine: Program|Subroutine): CommandCall|VariableAssignment|PassStatement {
  let isDefinition: boolean = false

  // constant/variable declarations in C may begin with ?const <type>
  if (routine.program.language === 'C') {
    if (routine.lexemes[routine.lex].content === 'const') {
      routine.lex += 2
      isDefinition = true
    } else if (routine.lexemes[routine.lex].subtype === 'type') {
      routine.lex += 1
      isDefinition = true
    }
  }

  // constant/variable declarations in Java may begin with ?final <type>
  if (routine.program.language === 'Java') {
    if (routine.lexemes[routine.lex].content === 'final') {
      isDefinition = true
      routine.lex += 2
    } else if (routine.lexemes[routine.lex].subtype === 'type') {
      isDefinition = true
      routine.lex += 1
    }
    if (isDefinition) {
      // maybe move past '*' pointer operator
      if (routine.lexemes[routine.lex].content === '*') {
        routine.lex += 1
      }
    }
  }

  // constand/variable declarations in TypeScript begin with const|var
  if (routine.program.language === 'TypeScript') {
    if (routine.lexemes[routine.lex].content === 'const' || routine.lexemes[routine.lex].content === 'var') {
      routine.lex += 1
      isDefinition = true
    }
  }

  if (isDefinition) {
    const variable = routine.findVariable(routine.lexemes[routine.lex].content as string)
    if (variable) {
      routine.lex += 1
      return variableAssignment(routine, variable, false) // false for assignment not required
    }

    const constant = routine.findConstant(routine.lexemes[routine.lex].content as string)
    if (constant) {
      routine.lex += 1
      return constantDefinition(routine)
    }

    // just in case; but this should be ruled out by parser1
    throw new CompilerError('{lex} is undefined.', routine.lexemes[routine.lex])
  }

  // look for a constant (for meaningful error message)
  const constant = routine.findConstant(routine.lexemes[routine.lex].content as string)
  if (constant) {
    throw new CompilerError('{lex} is a constant, not a variable.', routine.lexemes[routine.lex])
  }

  // look for a variable
  // N.B. look for variable before command, in case variable name overwrites a native command
  const variable = routine.findVariable(routine.lexemes[routine.lex].content as string)
  if (variable) {
    routine.lex += 1
    return variableAssignment(routine, variable)
  }

  // look for a command
  const command = routine.findCommand(routine.lexemes[routine.lex].content as string)
  if (command) {
    routine.lex += 1
    return commandCall(routine, command, 'procedure')
  }

  // if there are no matches, throw an error
  throw new CompilerError('Identifier {lex} is not defined.', routine.lexemes[routine.lex])
}

/** parses lexemes as a command call */
export function commandCall (routine: Program|Subroutine, command: Command|Subroutine, shouldBe: SubroutineType): CommandCall {
  const commandCall = new CommandCall(command)

  // check command type
  if (shouldBe === 'procedure' && command.returns) {
    throw new CompilerError('{lex} is a function, not a procedure.', routine.lexemes[routine.lex - 1])
  }
  if (shouldBe === 'function' && !command.returns) {
    throw new CompilerError('{lex} is a procedure, not a function.', routine.lexemes[routine.lex - 1])
  }

  // with parameters
  if (command.parameters.length > 0) {
    // check for opening bracket
    if (!routine.lexemes[routine.lex] || routine.lexemes[routine.lex].content !== '(') {
      throw new CompilerError('Opening bracket missing after command {lex}.', routine.lexemes[routine.lex - 1])
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
      if (routine.lexemes[routine.lex] && (routine.lexemes[routine.lex].content === '(')) {
        throw new CompilerError('Command {lex} takes no arguments.', routine.lexemes[routine.lex - 1])
      }
    }

    // command with no parameters in other languages (brackets obligatory)
    else {
      const openBracket = routine.lexemes[routine.lex]
      const closeBracket = routine.lexemes[routine.lex + 1]
      // check for opening bracket
      if (!openBracket || openBracket.content !== '(') {
        throw new CompilerError('Opening bracket missing after command {lex}.', routine.lexemes[routine.lex - 1])
      }

      // check for immediate closing bracket (no arguments)
      if (!closeBracket || closeBracket.type === 'newline' || closeBracket.content === ';') {
        throw new CompilerError('Closing bracket missing after command {lex}.', routine.lexemes[routine.lex - 1])
      }
      if (closeBracket.content !== ')') {
        throw new CompilerError('Command {lex} takes no arguments.', routine.lexemes[routine.lex - 1])
      }

      // move past the brackets
      routine.lex += 2
    }
  }

  // return the command call
  return commandCall
}

/** parses lexemes as a variable assignment (or declaration) */
export function variableAssignment (routine: Program|Subroutine, variable: Variable, assignmentRequired: boolean = true): VariableAssignment|PassStatement {
  const variableAssignment = new VariableAssignment(variable)
  const variableLexeme = routine.lexemes[routine.lex - 1]

  // strings and array variables permit element indexes at this point
  if (variable.isArray || variable.type === 'string') {
    const open = (routine.program.language === 'BASIC') ? '(' : '['
    const close = (routine.program.language === 'BASIC') ? ')' : ']'
    if (routine.lexemes[routine.lex] && routine.lexemes[routine.lex].content === open) {
      if (routine.program.language === 'BASIC' || routine.program.language === 'Python' || routine.program.language === 'TypeScript') {
        if (!variable.isArray) {
          throw new CompilerError('String characters cannot be assigned a value.', routine.lexemes[routine.lex])
        }
      }
      routine.lex += 1
      let exp = expression(routine)
      exp = typeCheck(exp, 'integer', routine.lexemes[routine.lex])
      variableAssignment.indexes.push(exp)
      // TODO: multi-dimensional stuff
      if (!routine.lexemes[routine.lex]) {
        throw new CompilerError(`Closing bracket "${close}" missing after string/array index.`, routine.lexemes[routine.lex - 1])
      }
      if (routine.lexemes[routine.lex].content !== close) {
        throw new CompilerError(`Closing bracket "${close}" missing after string/array index.`, routine.lexemes[routine.lex])
      }
      routine.lex += 1
    }
  }

  // Python and TypeScript permit type hints at this point
  // (but we ignore them here; parser1 has taken care of them)
  if (routine.program.language === 'Python' || routine.program.language === 'TypeScript') {
    if (routine.lexemes[routine.lex].content === ':') {
      routine.lex += 2 // move past colon and base type
      // TODO: multi-dimensional arrays/lists
      if (routine.lexemes[routine.lex].content === '[') {
        routine.lex += 2
        if (routine.program.language === 'Python') {
          routine.lex += 1
        }
      }
    }
  }

  // expecting assignment operator (maybe)
  const operator = (routine.program.language === 'Pascal') ? ':=' : '='
  if ((routine.program.language === 'Python') || !assignmentRequired) {
    if (!routine.lexemes[routine.lex] || routine.lexemes[routine.lex].content !== operator) {
      return new PassStatement()
    }
  }
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError(`Variable must be followed by assignment operator "${operator}".`, routine.lexemes[routine.lex - 1])
  }
  if (routine.lexemes[routine.lex].content !== operator) {
    throw new CompilerError(`Variable must be followed by assignment operator "${operator}".`, routine.lexemes[routine.lex])
  }
  routine.lex += 1

  // expecting an expression as the value to assign to the variable
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError(`Variable "${name}" must be assigned a value.`, routine.lexemes[routine.lex - 1])
  }
  variableAssignment.value = expression(routine)
  const variableValue = new VariableValue(variableAssignment.variable)
  variableValue.indexes.push(...variableAssignment.indexes)
  // check against variableValue.type rather than variableAssignment.variable.type
  // in case string has indexes and should be a character
  variableAssignment.value = typeCheck(variableAssignment.value, variableValue.type, variableLexeme)

  return variableAssignment
}

/** parses lexemes as a constant definition */
export function constantDefinition (routine: Program|Subroutine): PassStatement {
  // constant definitions are handled by parser1; here we just need to move past
  // all the lexemes
  if (routine.program.language === 'TypeScript') {
    routine.lex += 2 // move past ": <type>"
  }
  routine.lex += 1 // move past '='
  expression(routine) // move past the expression lexemes
  return new PassStatement()
}

/** parses lexemes as an expression */
export function expression (routine: Program|Subroutine, level: number = 0): Expression {
  // break out of recursion at level > 2
  if (level > 2) {
    return factor(routine)
  }

  // evaluate the first bit
  let exp = expression(routine, level + 1)

  // get relevant operators for the current level
  const allOperators = [
    [PCode.eqal, PCode.less, PCode.lseq, PCode.more, PCode.mreq, PCode.noeq],
    [PCode.plus, PCode.subt, PCode.or, PCode.orl, PCode.xor],
    [PCode.and, PCode.andl, PCode.div, PCode.divr, PCode.mod, PCode.mult]
  ]
  const operators = allOperators[level]

  while (routine.lexemes[routine.lex] && operators.includes(routine.lexemes[routine.lex].value as PCode)) {
    // get the operator (provisionally)
    let operator = routine.lexemes[routine.lex].value as PCode

    // move past the operator
    routine.lex += 1

    // evaluate the second bit
    let nextExp = expression(routine, level + 1)

    // check types match (check both ways - so that if there's a character on
    // either side, and a string on the other, we'll know to convert the
    // character to a string)
    exp = typeCheck(exp, nextExp.type, routine.lexemes[routine.lex])
    nextExp = typeCheck(nextExp, exp.type, routine.lexemes[routine.lex])

    // maybe replace provisional operator with its string equivalent
    if (exp.type === 'string' || nextExp.type === 'string') {
      operator = stringOperator(operator)
    }

    // create a compound expression with the operator
    exp = new CompoundExpression(exp, nextExp, operator)
  }
  
  // return the expression
  return exp
}

/** parses lexemes as a factor */
function factor (routine: Program|Subroutine): Expression {
  let exp: Expression

  switch (routine.lexemes[routine.lex].type) {
    // operators
    case 'operator':
      const operator = routine.lexemes[routine.lex].value as PCode
      switch (operator) {
        case PCode.subt:
          routine.lex += 1
          exp = factor(routine)
          exp = typeCheck(exp, 'integer', routine.lexemes[routine.lex])
          return new CompoundExpression(null, exp, PCode.neg)

        case PCode.not:
          routine.lex += 1
          exp = factor(routine)
          exp = typeCheck(exp, 'boolint', routine.lexemes[routine.lex])
          return new CompoundExpression(null, exp, PCode.not)

        case PCode.and:
          if (routine.program.language !== 'C') {
            throw new CompilerError('Expression cannot begin with {lex}.', routine.lexemes[routine.lex])
          }
          routine.lex += 1
          exp = factor(routine)
          if (!(exp instanceof VariableValue)) {
            throw new CompilerError('Address operator "&" must be followed by a variable.', routine.lexemes[routine.lex])
          }
          if (exp.indexes.length > 0) {
            throw new CompilerError('Variable following address operator "&" cannot include array indexes.', routine.lexemes[routine.lex])
          }
          return new VariableAddress(exp.variable)

        default:
          throw new CompilerError('Expression cannot begin with {lex}.', routine.lexemes[routine.lex])
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
        exp = new LiteralValue('integer', input.value)
        exp.input = (input.value < 0)
        return exp
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
        const variableValue = new VariableValue(variable)
        routine.lex += 1
        if (variable.isArray || variable.type === 'string') {
          const open = (routine.program.language === 'BASIC') ? '(' : '['
          const close = (routine.program.language === 'BASIC') ? ')' : ']'
          if (routine.lexemes[routine.lex] && routine.lexemes[routine.lex].content === open) {
            routine.lex += 1
            exp = expression(routine)
            exp = typeCheck(exp, 'integer', routine.lexemes[routine.lex])
            variableValue.indexes.push(exp)
            // TODO: multi-dimensional stuff
            if (!routine.lexemes[routine.lex]) {
              throw new CompilerError(`Closing bracket "${close}" missing after string/array index.`, routine.lexemes[routine.lex - 1])
            }
            if (routine.lexemes[routine.lex].content !== close) {
              throw new CompilerError(`Closing bracket "${close}" missing after string/array index.`, routine.lexemes[routine.lex])
            }
            routine.lex += 1
          }
        }
        return variableValue
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
      // type casting in C and Java
      if ((routine.program.language === 'C' || routine.program.language === 'Java')
        && (routine.lexemes[routine.lex].content === '(')
        && (routine.lexemes[routine.lex + 1]?.subtype === 'type')) {
        routine.lex += 1
        const typeLexeme = routine.lexemes[routine.lex]
        const type = typeLexeme.value as Type|null
        if (type === null) {
          throw new CompilerError('Expression cannot be cast as void.', typeLexeme)
        }
        routine.lex += 1
        if (routine.lexemes[routine.lex]?.content !== ')') {
          throw new CompilerError('Type in type cast expression must be followed by a closing bracket ")".', typeLexeme)
        }
        routine.lex += 1
        exp = expression(routine)
        if (type !== exp.type) {
          if (type === 'boolean' && exp.type === 'character') {
            throw new CompilerError('Characters cannot be cast as booleans.', typeLexeme)
          }
          if (type === 'boolean' && exp.type === 'string') {
            throw new CompilerError('Strings cannot be cast as booleans.', typeLexeme)
          }
          if (type === 'string' && exp.type === 'boolean') {
            throw new CompilerError('Booleans cannot be cast as strings.', typeLexeme)
          }
          if (type === 'character' && exp.type === 'boolean') {
            throw new CompilerError('Booleans cannot be cast as characters.', typeLexeme)
          }
          if (type === 'character' && exp.type === 'string') {
            throw new CompilerError('Strings cannot be cast as characters.', typeLexeme)
          }
          exp = new CastExpression(type, exp)
        }
        return exp
      }

      // bracketed expression
      else if (routine.lexemes[routine.lex].content === '(') {
        // what follows should be an expression
        routine.lex += 1
        exp = expression(routine)

        // now check for a closing bracket
        if (routine.lexemes[routine.lex] && (routine.lexemes[routine.lex].content === ')')) {
          routine.lex += 1
          return exp
        } else {
          throw new CompilerError('Closing bracket missing.', routine.lexemes[routine.lex - 1])
        }
      }
      
      // anything else is an error
      else {
        throw new CompilerError('Expression cannot begin with {lex}.', routine.lexemes[routine.lex])
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
export function typeCheck (foundExpression: Expression, expectedType: Type, lexeme: Lexeme): Expression {
  // found and expected the same is obviously ok
  if (foundExpression.type === expectedType) {
    return foundExpression
  }

  // if STRING is expected, CHARACTER is ok
  if ((expectedType === 'string') && (foundExpression.type === 'character')) {
    // but we'll need to cast it as a string
    return new CastExpression('string', foundExpression)
  }

  // if CHARACTER is expected, STRING is ok
  // (the whole expression will end up being a string anyway)
  if ((expectedType === 'character') && (foundExpression.type === 'string')) {
    return foundExpression
  }

  // if CHARACTER is expected, INTEGER is ok
  if ((expectedType === 'character') && (foundExpression.type === 'integer')) {
    return foundExpression
  }

  // if INTEGER is expected, CHARACTER is ok
  if ((expectedType === 'integer') && (foundExpression.type === 'character')) {
    return foundExpression
  }

  // if BOOLINT is expected, either BOOLEAN or INTEGER is ok
  if (expectedType === 'boolint' && (foundExpression.type === 'boolean' || foundExpression.type === 'integer')) {
    return foundExpression
  }

  // if BOOLINT is found, either BOOLEAN or INTEGER expected is ok
  if (foundExpression.type === 'boolint' && (expectedType === 'boolean' || expectedType === 'integer')) {
    return foundExpression
  }

  // everything else is an error
  throw new CompilerError(`Type error: '${expectedType}' expected but '${foundExpression.type}' found.`, lexeme)
}

/** parses arguments for a command call */
function parseArguments (routine: Program|Subroutine, commandCall: CommandCall): void {
  const commandName = (commandCall.command instanceof Command)
    ? commandCall.command.names[routine.program.language]
    : commandCall.command.name

    // handle the arguments
  const argsExpected = commandCall.command.parameters.length
  let argsGiven = 0
  while ((argsGiven < argsExpected) && (routine.lexemes[routine.lex].content !== ')')) {
    const parameter = commandCall.command.parameters[argsGiven]
    let argument = expression(routine)
    const bypassTypeCheck = (commandCall.command instanceof Command)
      && (commandCall.command.names[routine.program.language]?.toLowerCase() === 'address')
    if (!bypassTypeCheck) { // variable passed (by reference) to built-in address function can be of any type
      argument = typeCheck(argument, parameter.type, routine.lexemes[routine.lex - 1])
    }
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
