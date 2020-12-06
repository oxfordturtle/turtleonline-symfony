import type Program from '../definitions/program'
import { variableName } from './identifier'
import type { Subroutine } from '../definitions/subroutine'
import Variable from '../definitions/variable'
import type Lexemes from '../definitions/lexemes'
import * as find from '../find'
import { typeCheck, expression } from '../expression'
import evaluate from '../evaluate'
import { CompilerError } from '../../tools/error'

/** parses lexemes as a variable name */
export function variable (lexemes: Lexemes, routine: Program|Subroutine): Variable {
  const [name, type, stringLength] = variableName(lexemes)

  // duplicate check
  if (find.isDuplicate(routine, name)) {
    throw new CompilerError('{lex} is already defined in the current scope.', lexemes.get(-1))
  }

  // create the variable
  const variable = new Variable(name, routine)
  variable.type = type
  variable.stringLength = stringLength

  // return the variable
  return variable
}

/** parses lexemes as an array variable declaraion (following "DIM") */
export function array (lexemes: Lexemes, routine: Program|Subroutine): Variable {
  const foo = variable(lexemes, routine)

  // expecting open bracket "("
  if (!lexemes.get()) {
    throw new CompilerError('"DIM" variable identifier must be followed by dimensions in brackets.', lexemes.get(-1))
  }
  if (lexemes.get()?.content !== '(') {
    throw new CompilerError('"DIM" variable identifier must be followed by dimensions in brackets.', lexemes.get())
  }
  lexemes.next()

  // expecting dimensions separated by commas
  while (lexemes.get()?.content !== ')') {
    // expecting array dimension size
    if (!lexemes.get()) {
      throw new CompilerError('Expected array size specification.', lexemes.get(-1))
    }
    if (lexemes.get()?.type === 'newline') {
      throw new CompilerError('Array declaration must be one a single line.', lexemes.get(-1))
    }
    const exp = expression(lexemes, routine)
    typeCheck(exp, 'integer')
    const value = evaluate(exp, 'BASIC', 'array')
    if (typeof value === 'string') {
      throw new CompilerError('Array size must be an integer.', lexemes.get())
    }
    if (value <= 0) {
      throw new CompilerError('Array size must be positive.', lexemes.get())
    }
    // N.B. BASIC arrays are indexed from zero up to *and including* the size
    // (so you get one more element than you might think)
    foo.arrayDimensions.push([0, value])

    // move past comma (if there is one)
    if (lexemes.get()?.content === ',') {
      lexemes.next()
      if (lexemes.get()?.content === ')') {
        throw new CompilerError('Trailing comma in array size specification.', lexemes.get())
      }
    }
  }

  // final error checking
  if (!lexemes.get() || lexemes.get()?.content !== ')') {
    throw new CompilerError('Closing bracket missing after array size specification.', lexemes.get(-1))
  }
  if (foo.arrayDimensions.length === 0) {
    throw new CompilerError('Expected array size specification.', lexemes.get())
  }
  lexemes.next()

  // return the variable
  return foo
}

/** parses lexemes as a comma separated list of variables */
export function variables (lexemes: Lexemes, routine: Program|Subroutine): Variable[] {
  const variables: Variable[] = []
  while (lexemes.get()?.type !== 'newline') {
    variables.push(variable(lexemes, routine))
    if (lexemes.get()?.content === ',') {
      lexemes.next()
      if (!lexemes.get() || lexemes.get()?.type === 'newline') {
        throw new CompilerError('Trailing comma at end of line.', lexemes.get(-1))
      }
    }
  }
  return variables
}
