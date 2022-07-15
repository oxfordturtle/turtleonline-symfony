import type from './type'
import identifier from './identifier'
import variable from './variable'
import Lexemes from '../definitions/lexemes'
import Program from '../definitions/program'
import { Subroutine } from '../definitions/subroutine'
import Variable from '../definitions/variable'
import { CompilerError } from '../../tools/error'
import { KeywordLexeme } from '../../lexer/lexeme'

/** parses lexemes at subroutine definition, and returns the subroutine */
export default function subroutine (lexeme: KeywordLexeme, lexemes: Lexemes, parent: Program|Subroutine): Subroutine {
  // expecting subroutine name
  const name = identifier(lexemes, parent, true)

  // create the subroutine
  const subroutine = new Subroutine(lexeme, parent, name)
  const program = (parent instanceof Program) ? parent : parent.program
  subroutine.index = program.allSubroutines.length + 1

  // parse the parameters
  subroutine.variables.push(...parameters(lexemes, subroutine))

  // expecting return type specification
  const [subroutineType, stringLength, arrayDimensions] = type(lexemes, parent)

  // array return values are not allowed
  if (arrayDimensions.length > 0) {
    throw new CompilerError('Functions cannot return arrays.', lexemes.get(-1))
  }

  // set the return type and unshift the result variable for functions
  if (subroutineType !== null) {
    const variable = new Variable('!result', subroutine)
    variable.type = subroutineType
    variable.stringLength = stringLength
    subroutine.variables.unshift(variable)
  }

  // expecting opening bracket "{"
  if (!lexemes.get()) {
    throw new CompilerError('Method parameters must be followed by an opening bracket "{".', lexemes.get(-1))
  }
  if (lexemes.get()?.content !== '{') {
    throw new CompilerError('Method parameters must be followed by an opening bracket "{".', lexemes.get())
  }
  lexemes.next()

  // save first inner lexeme index
  subroutine.start = lexemes.index

  // move past body lexemes
  let brackets = 0
  while (lexemes.get() && brackets >= 0) {
    if (lexemes.get()?.content === '{') {
      brackets += 1
    } else if (lexemes.get()?.content === '}') {
      brackets -= 1
    }
    lexemes.next()
  }

  // save last inner lexeme index
  subroutine.end = lexemes.index - 1

  // return the subroutine
  return subroutine
}

/** parses lexemes at subroutine parameters, and returns the parameters */
function parameters (lexemes: Lexemes, subroutine: Subroutine): Variable[] {
  // expecting opening bracket "("
  if (!lexemes.get()) {
    throw new CompilerError('Opening bracket "(" missing after function name.', lexemes.get(-1))
  }
  if (lexemes.get()?.content !== '(') {
    throw new CompilerError('Opening bracket "(" missing after function name.', lexemes.get())
  }
  lexemes.next()

  // expecting 0 or more parameters
  const parameters: Variable[] = []
  while (lexemes.get()?.content !== ')') {
    const parameter = variable(lexemes, subroutine, true)
    parameter.isParameter = true
    parameters.push(parameter)
    if (lexemes.get()?.content === ',') {
      lexemes.next()
    }
  }

  // check for closing bracket
  if (lexemes.get()?.content !== ')') {
    throw new CompilerError('Closing bracket missing after function parameters.', lexemes.get(-1))
  }
  lexemes.next()

  // return the parameters
  return parameters
}
