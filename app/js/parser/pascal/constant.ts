import identifier from './identifier'
import { semicolon } from './statement'
import type Lexemes from '../definitions/lexemes'
import { Constant } from '../definitions/constant'
import type Program from '../definitions/program'
import { expression } from '../expression'
import evaluate from '../evaluate'
import { CompilerError } from '../../tools/error'

/** parses lexemes as constant definitions (after "const") */
export default function constant (lexemes: Lexemes, routine: Program): Constant {
  // expecting constant name
  const name = identifier(lexemes, routine)

  // expecting '='
  if (!lexemes.get() || lexemes.get()?.content !== '=') {
    throw new CompilerError('Constant must be assigned a value.', lexemes.get(-1))
  }
  lexemes.next()

  // expecting an expression
  let exp = expression(lexemes, routine)
  const value = evaluate(exp, 'Pascal', 'constant')

  // create the constant
  const foo = new Constant('Pascal', name, value)

  // expecting a semicolon
  semicolon(lexemes, true, 'constant definition')

  // return the constant
  return foo
}
