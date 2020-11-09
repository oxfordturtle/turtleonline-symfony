import type Program from './definitions/program'
import type { Subroutine } from './definitions/subroutine'
import type Lexemes from './definitions/lexemes'
import type { Lexeme, Type, Operator, OperatorLexeme, TypeLexeme } from '../lexer/lexeme'

import { functionCall } from './call'
import * as find from './find'
import { Expression, CompoundExpression, IntegerValue, StringValue, InputValue, ColourValue, ConstantValue, VariableAddress, VariableValue, CastExpression } from './definitions/expression'
import { operator, stringOperator } from './definitions/operators'
import { CompilerError } from '../tools/error'

/** checks types match (throws an error if not) */
export function typeCheck (foundExpression: Expression, expectedType: Type): Expression {
  // found and expected the same is obviously ok
  if (foundExpression.type === expectedType) {
    return foundExpression
  }

  // if STRING is expected, CHARACTER is ok
  if ((expectedType === 'string') && (foundExpression.type === 'character')) {
    // but we'll need to cast it as a string
    return new CastExpression(foundExpression.lexeme, 'string', foundExpression)
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
  throw new CompilerError(`Type error: '${expectedType}' expected but '${foundExpression.type}' found.`, foundExpression.lexeme)
}

/** parses lexemes as an expression */
export function expression (lexemes: Lexemes, routine: Program|Subroutine, level: number = 0): Expression {
  // break out of recursion at level > 2
  if (level > 2) {
    return factor(lexemes, routine)
  }

  // evaluate the first bit
  let exp = expression(lexemes, routine, level + 1)

  while (lexemes.get() && operator(lexemes.get() as Lexeme, level)) {
    // get the operator (provisionally), and save the operator lexeme
    const lexeme = lexemes.get() as OperatorLexeme
    let op = operator(lexeme, level) as Operator

    // move past the operator
    lexemes.next()

    // evaluate the second bit
    let nextExp = expression(lexemes, routine, level + 1)

    // check types match (check both ways - so that if there's a character on
    // either side, and a string on the other, we'll know to convert the
    // character to a string)
    exp = typeCheck(exp, nextExp.type)
    nextExp = typeCheck(nextExp, exp.type)

    // maybe replace provisional operator with its string equivalent
    if (exp.type === 'string' || nextExp.type === 'string') {
      op = stringOperator(op)
    }

    // create a compound expression with the operator
    exp = new CompoundExpression(lexeme, exp, nextExp, op)
  }
  
  // return the expression
  return exp
}

/** parses lexemes as a factor */
function factor (lexemes: Lexemes, routine: Program|Subroutine): Expression {
  const lexeme = lexemes.get() as Lexeme
  let exp: Expression

  switch (lexeme.type) {
    // operators
    case 'operator':
      switch (lexeme.subtype) {
        case 'subt':
          lexemes.next()
          exp = factor(lexemes, routine)
          exp = typeCheck(exp, 'integer')
          return new CompoundExpression(lexeme, null, exp, 'neg')

        case 'not':
          lexemes.next()
          exp = factor(lexemes, routine)
          exp = typeCheck(exp, 'boolint')
          return new CompoundExpression(lexeme, null, exp, 'not')

        case 'and':
          if (routine.language !== 'C') {
            throw new CompilerError('Expression cannot begin with {lex}.', lexemes.get())
          }
          lexemes.next()
          exp = factor(lexemes, routine)
          if (!(exp instanceof VariableValue)) {
            throw new CompilerError('Address operator "&" must be followed by a variable.', lexeme)
          }
          if (exp.indexes.length > 0) {
            throw new CompilerError('Variable following address operator "&" cannot include array indexes.', lexeme)
          }
          return new VariableAddress(exp.lexeme, exp.variable)

        default:
          console.log(lexeme)
          console.log(operator)
          throw new CompilerError('Expression cannot begin with {lex}.', lexeme)
      }

    // literal values
    case 'literal':
      lexemes.next()
      return (lexeme.subtype === 'string') ? new StringValue(lexeme) : new IntegerValue(lexeme)

    // input codes
    case 'input':
      const input = find.input(routine, lexeme.content)
      if (input) {
        lexemes.next()
        return new InputValue(lexeme, input)
      }
      throw new CompilerError('{lex} is not a valid input code.', lexeme)

    // identifiers
    case 'identifier':
      // look for a constant
      const constant = find.constant(routine, lexeme.value)
      if (constant) {
        lexemes.next()
        return new ConstantValue(lexeme, constant)
      }

      // look for a variable
      const variable = find.variable(routine, lexeme.value)
      if (variable) {
        const variableValue = new VariableValue(lexeme, variable)
        lexemes.next()
        const open = (routine.language === 'BASIC') ? '(' : '['
        const close = (routine.language === 'BASIC') ? ')' : ']'
        if (lexemes.get() && lexemes.get()?.content === open) {
          if (variable.type === 'string') {
            lexemes.next()
            // expecting integer expression for the character index
            exp = expression(lexemes, routine)
            exp = typeCheck(exp, 'integer')
            variableValue.indexes.push(exp)
            // expecting closing bracket
            if (!lexemes.get() || (lexemes.get()?.content !== close)) {
              throw new CompilerError(`Closing bracket "${close}" missing after string variable index.`, exp.lexeme)
            }
            lexemes.next()
          } else if (variable.isArray) {
            lexemes.next()
            while (lexemes.get() && lexemes.get()?.content !== close) {
              // expecting integer expression for the element index
              let exp = expression(lexemes, routine)
              exp = typeCheck(exp, 'integer')
              variableValue.indexes.push(exp)
              if (routine.language === 'BASIC' || routine.language === 'Pascal') {
                // maybe move past comma
                if (lexemes.get()?.content === ',') {
                  lexemes.next()
                  // check for trailing comma
                  if (lexemes.get()?.content === close) {
                    throw new CompilerError('Trailing comma at the end of array indexes.', lexemes.get(-1))
                  }
                }
              } else {
                // maybe move past "]["
                if (lexemes.get()?.content === close && lexemes.get(1)?.content === open) {
                  lexemes.next()
                  lexemes.next()
                }
              }
            }
            // check we came out of the loop above for the right reason
            if (!lexemes.get()) {
              throw new CompilerError(`Closing bracket "${close}" needed after array indexes.`, lexemes.get(-1))
            }
            // move past the closing bracket
            lexemes.next()
          } else {
            throw new CompilerError('{lex} is not a string or array variable.', lexeme)
          }
        }
        // check the right number of array variable indexes have been given
        if (variable.isArray) {
          if (variableValue.indexes.length === 0) {
            throw new CompilerError('Array variable {lex} cannot be assigned a value.', lexeme)
          }
          if (variableValue.indexes.length < variable.arrayDimensions.length) {
            throw new CompilerError('Too few indexes for array variable {lex}.', lexeme)
          }
          if (variableValue.indexes.length > variable.arrayDimensions.length) {
            throw new CompilerError('Too many indexes for array variable {lex}.', lexeme)
          }
        }
        // return the variable value
        return variableValue
      }

      // look for a predefined colour constant
      const colour = find.colour(routine, lexeme.value)
      if (colour) {
        lexemes.next()
        return new ColourValue(lexeme, colour)
      }

      // look for a command
      const command = find.command(routine, lexeme.value)
      if (command) {
        lexemes.next()
        return functionCall(lexeme, lexemes, routine, command)
      }

      // if none of those were found, throw an error
      throw new CompilerError('{lex} is not defined.', lexeme)

    // everything else
    default:
      // type casting in C and Java
      if ((routine.language === 'C' || routine.language === 'Java') && (lexemes.get()?.content === '(') && (lexemes.get(1)?.type === 'type')) {
        lexemes.next()
        const typeLexeme = lexemes.get() as TypeLexeme
        const type = typeLexeme.subtype
        if (type === null) {
          throw new CompilerError('Expression cannot be cast as void.', typeLexeme)
        }
        lexemes.next()
        if (lexemes.get()?.content !== ')') {
          throw new CompilerError('Type in type cast expression must be followed by a closing bracket ")".', typeLexeme)
        }
        lexemes.next()
        exp = expression(lexemes, routine)
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
          exp = new CastExpression(typeLexeme, type, exp)
        }
        return exp
      }

      // bracketed expression
      else if (lexemes.get()?.content === '(') {
        // what follows should be an expression
        lexemes.next()
        exp = expression(lexemes, routine)

        // now check for a closing bracket
        if (lexemes.get() && (lexemes.get()?.content === ')')) {
          lexemes.next()
          return exp
        } else {
          throw new CompilerError('Closing bracket missing after expression.', exp.lexeme)
        }
      }
      
      // anything else is an error
      else {
        throw new CompilerError('Expression cannot begin with {lex}.', lexeme)
      }
  }
}
