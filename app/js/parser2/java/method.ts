import type from './type'
import identifier from './identifier'
import { Program } from '../definitions/program'
import { Subroutine } from '../definitions/subroutine'
import { Variable } from '../definitions/variable'
import { Type } from '../definitions/type'
import { Statement } from '../definitions/statement'
import { Lex } from '../lex'
import { CompilerError } from '../../tools/error'

/** parses lexemes at method definition, and returns the method */
export function method (program: Program, lex: Lex): Subroutine {
  // expecting type specification followed by idenfitier
  const [methodType, arrayDimensions] = type(lex)
  const name = identifier(program, lex)

  // create the subroutine
  const subroutine = new Subroutine(program, name)

  // parse parameters (throw away the result)
  parameters(subroutine, lex)

  // expecting opening bracket "{"
  if (!lex.get()) {}
  if (lex.content() !== '{') {}
  lex.step()

  // move past body lexemes
  let brackets = 0
  while (lex.get() && brackets >= 0) {
    if (lex.content() === '{') {
      brackets += 1
    } else if (lex.content() === '}') {
      brackets -= 1
    }
    lex.step()
  }

  // return the subroutine
  return subroutine
}

/** parses lexemes at method parameters, and returns the parameters */
export function parameters (subroutine: Subroutine, lex: Lex): Variable[] {
  // expecting opening bracket "("
  if (!lex.get()) {
    throw new CompilerError('Opening bracket missing after method name.', lex.get(-1))
  }
  if (lex.content() !== '(') {
    throw new CompilerError('Opening bracket missing after method name.', lex.get())
  }

  // expecting 0 or more parameters
  const parameters: Variable[] = []
  while (lex.content() !== ')') {
    const parameter = variableDeclaration(subroutine, lex)
    parameter.isParameter = true
    if (lex.content() === ',') {
      lex.step()
    }
  }

  // check for closing bracket
  if (lex.content(-1) !== ')') {
    throw new CompilerError('Closing bracket missing after method parameters.', lex.get(-1))
  }

  // return the parameters
  return parameters
}

/** parses lexemes at method body, and returns the statements */
export function body (subroutine: Subroutine, lex: Lex): Statement[] {
  const statements: Statement[] = []
  return statements
}
