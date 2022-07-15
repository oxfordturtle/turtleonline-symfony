import { variable } from './variable'
import { Constant } from '../definitions/constant'
import type Program from '../definitions/program'
import type { Subroutine } from '../definitions/subroutine'
import type Lexemes from '../definitions/lexemes'
import { typeCheck, expression } from '../expression'
import evaluate from '../evaluate'
import { CompilerError } from '../../tools/error'

/** parses lexemes as a constant definition */
export default function constant (lexemes: Lexemes, routine: Program|Subroutine): Constant {
  // expecting constant name (which is just like a variable name)
  const foo = variable(lexemes, routine)

  // expecting '='
  if (!lexemes.get() || lexemes.get()?.content !== '=') {
    throw new CompilerError('Constant must be assigned a value.', lexemes.get(-1))
  }
  lexemes.next()

  // expecting an expression
  let exp = expression(lexemes, routine)
  const value = evaluate(exp, 'BASIC', 'constant')
  exp = typeCheck(exp, foo.type)

  // create and return the constant
  return new Constant('BASIC', foo.name, value)
}
