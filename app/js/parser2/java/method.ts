import type from './type'
import identifier from './identifier'
import variable from './variable'
import { Program } from '../definitions/program'
import { Subroutine } from '../definitions/subroutine'
import { Variable } from '../definitions/variable'
import { CompilerError } from '../../tools/error'

/** parses lexemes at method definition, and returns the method */
export default function method (program: Program): Subroutine {
  // save first outer lexeme index
  const firstOuterLexemeIndex = program.lexemeIndex

  // expecting type specification and method name
  const [methodType, arrayDimensions] = type(program)
  const name = identifier(program)

  // array return values are not allowed
  if (arrayDimensions.length > 0) {
    throw new CompilerError('Methods cannot return arrays.', program.lex(-1))
  }

  // create the subroutine
  const subroutine = new Subroutine(program, name)
  subroutine.index = program.subroutines.length + 1
  if (methodType !== null) {
    subroutine.type = 'function'
    subroutine.returns = methodType
  }

  // parse the parameters
  subroutine.variables.push(...parameters(program, subroutine))

  // expecting opening bracket "{"
  if (!program.lex()) {
    throw new CompilerError('Method parameters must be followed by an opening bracket "{".', program.lex(-1))
  }
  if (program.lex()?.content !== '{') {
    throw new CompilerError('Method parameters must be followed by an opening bracket "{".', program.lex())
  }
  program.lexemeIndex += 1

  // save first inner lexeme index
  const firstInnerLexemeIndex = program.lexemeIndex

  // move past body lexemes
  let brackets = 0
  while (program.lex() && brackets >= 0) {
    if (program.lex()?.content === '{') {
      brackets += 1
    } else if (program.lex()?.content === '}') {
      brackets -= 1
    }
    program.lexemeIndex += 1
  }

  // attach this subroutine's lexemes
  subroutine.outerLexemes = program.lexemes.slice(firstOuterLexemeIndex, program.lexemeIndex)
  subroutine.lexemes = program.lexemes.slice(firstInnerLexemeIndex, program.lexemeIndex - 1)

  // return the subroutine
  return subroutine
}

/** parses lexemes at method parameters, and returns the parameters */
function parameters (program: Program, subroutine: Subroutine): Variable[] {
  // expecting opening bracket "("
  if (!program.lex()) {
    throw new CompilerError('Opening bracket missing after method name.', program.lex(-1))
  }
  if (program.lex()?.content !== '(') {
    throw new CompilerError('Opening bracket missing after method name.', program.lex())
  }
  program.lexemeIndex += 1

  // expecting 0 or more parameters
  const parameters: Variable[] = []
  while (program.lex()?.content !== ')') {
    const parameter = variable(program, subroutine)
    parameter.isParameter = true
    parameters.push(parameter)
    if (program.lex()?.content === ',') {
      program.lexemeIndex += 1
    }
  }

  // check for closing bracket
  if (program.lex()?.content !== ')') {
    throw new CompilerError('Closing bracket missing after method parameters.', program.lex(-1))
  }
  program.lexemeIndex += 1

  // return the parameters
  return parameters
}
