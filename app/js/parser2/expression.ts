import { functionCall } from './call'
import * as find from './find'
import { Expression, CompoundExpression, LiteralValue, VariableAddress, VariableValue, CastExpression } from './definitions/expression'
import { Program } from './definitions/program'
import { Subroutine } from './definitions/subroutine'
import { Type } from './definitions/type'
import { Lexeme } from '../lexer/lexeme'
import { PCode } from '../constants/pcodes'
import { CompilerError } from '../tools/error'

/** checks types match (throws an error if not) */
export function typeCheck (foundExpression: Expression, expectedType: Type, lexeme: Lexeme|undefined): Expression {
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

  while (routine.lex() && operators.includes(routine.lex()?.value as PCode)) {
    // get the operator (provisionally)
    let operator = routine.lex()?.value as PCode

    // move past the operator
    routine.lexemeIndex += 1

    // evaluate the second bit
    let nextExp = expression(routine, level + 1)

    // check types match (check both ways - so that if there's a character on
    // either side, and a string on the other, we'll know to convert the
    // character to a string)
    exp = typeCheck(exp, nextExp.type, routine.lex())
    nextExp = typeCheck(nextExp, exp.type, routine.lex())

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

  switch (routine.lex()?.type) {
    // operators
    case 'operator':
      const operator = routine.lex()?.value as PCode
      switch (operator) {
        case PCode.subt:
          routine.lexemeIndex += 1
          exp = factor(routine)
          exp = typeCheck(exp, 'integer', routine.lex())
          return new CompoundExpression(null, exp, PCode.neg)

        case PCode.not:
          routine.lexemeIndex += 1
          exp = factor(routine)
          exp = typeCheck(exp, 'boolint', routine.lex())
          return new CompoundExpression(null, exp, PCode.not)

        case PCode.and:
          if (routine.language !== 'C') {
            throw new CompilerError('Expression cannot begin with {lex}.', routine.lex())
          }
          routine.lexemeIndex += 1
          exp = factor(routine)
          if (!(exp instanceof VariableValue)) {
            throw new CompilerError('Address operator "&" must be followed by a variable.', routine.lex())
          }
          if (exp.indexes.length > 0) {
            throw new CompilerError('Variable following address operator "&" cannot include array indexes.', routine.lex())
          }
          return new VariableAddress(exp.variable)

        default:
          throw new CompilerError('Expression cannot begin with {lex}.', routine.lex())
      }

    // literal values
    case 'boolean': // fallthrough
    case 'integer': // fallthrough
    case 'string': // fallthrough
    case 'character':
      routine.lexemeIndex += 1
      return new LiteralValue(routine.lex(-1)?.type as Type, routine.lex(-1)?.value as number|string)

    // input codes
    case 'keycode': // fallthrough
    case 'query':
      const input = find.input(routine, routine.lex()?.content as string)
      if (input) {
        routine.lexemeIndex += 1
        exp = new LiteralValue('integer', input.value)
        exp.input = (input.value < 0)
        return exp
      }
      throw new CompilerError('{lex} is not a valid input code.', routine.lex())

    // identifiers
    case 'identifier':
      // look for a constant
      const constant = find.constant(routine, routine.lex()?.content as string)
      if (constant) {
        routine.lexemeIndex += 1
        return new LiteralValue(constant.type, constant.value)
      }

      // look for a variable
      const variable = find.variable(routine, routine.lex()?.content as string)
      if (variable) {
        const variableValue = new VariableValue(variable)
        routine.lexemeIndex += 1
        if (variable.isArray || variable.type === 'string') {
          const open = (routine.language === 'BASIC') ? '(' : '['
          const close = (routine.language === 'BASIC') ? ')' : ']'
          if (routine.lex() && routine.lex()?.content === open) {
            routine.lexemeIndex += 1
            exp = expression(routine)
            exp = typeCheck(exp, 'integer', routine.lex())
            variableValue.indexes.push(exp)
            // TODO: multi-dimensional stuff
            if (!routine.lex()) {
              throw new CompilerError(`Closing bracket "${close}" missing after string/array index.`, routine.lex(-1))
            }
            if (routine.lex()?.content !== close) {
              throw new CompilerError(`Closing bracket "${close}" missing after string/array index.`, routine.lex())
            }
            routine.lexemeIndex += 1
          }
        }
        return variableValue
      }

      // look for a predefined colour constant
      const colour = find.colour(routine, routine.lex()?.content as string)
      if (colour) {
        routine.lexemeIndex += 1
        return new LiteralValue('integer', colour.value)
      }

      // look for a command
      const command = find.command(routine, routine.lex()?.content as string)
      if (command) {
        routine.lexemeIndex += 1
        return functionCall(routine, command)
      }

      // if none of those were found, throw an error
      throw new CompilerError('{lex} is not defined.', routine.lex())

    // everything else
    default:
      // type casting in C and Java
      if ((routine.language === 'C' || routine.language === 'Java') && (routine.lex()?.content === '(') && (routine.lex(1)?.subtype === 'type')) {
        routine.lexemeIndex += 1
        const typeLexeme = routine.lex() as Lexeme
        const type = typeLexeme.value as Type|null
        if (type === null) {
          throw new CompilerError('Expression cannot be cast as void.', typeLexeme)
        }
        routine.lexemeIndex += 1
        if (routine.lex()?.content !== ')') {
          throw new CompilerError('Type in type cast expression must be followed by a closing bracket ")".', typeLexeme)
        }
        routine.lexemeIndex += 1
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
      else if (routine.lex()?.content === '(') {
        // what follows should be an expression
        routine.lexemeIndex += 1
        exp = expression(routine)

        // now check for a closing bracket
        if (routine.lex() && (routine.lex()?.content === ')')) {
          routine.lexemeIndex += 1
          return exp
        } else {
          throw new CompilerError('Closing bracket missing after expression.', routine.lex(-1))
        }
      }
      
      // anything else is an error
      else {
        throw new CompilerError('Expression cannot begin with {lex}.', routine.lex())
      }
  }
}

/** converts an integer/boolean operator into its string equivalent */
function stringOperator (operator: PCode): PCode {
  const defaultVersions = [PCode.eqal, PCode.less, PCode.lseq, PCode.more, PCode.mreq, PCode.noeq, PCode.plus]
  const stringVersions = [PCode.seql, PCode.sles, PCode.sleq, PCode.smor, PCode.smeq, PCode.sneq, PCode.scat]
  return stringVersions[defaultVersions.indexOf(operator)]
}
