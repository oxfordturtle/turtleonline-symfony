/**
 * Evaluates an expression (used for assigning values to constants at compile
 * time).
 */
import { Language } from '../constants/languages'
import { PCode } from '../constants/pcodes'
import { Lexeme } from '../lexer/lexeme'
import { CompilerError } from '../tools/error'
import { Expression, LiteralValue, VariableValue, CommandCall } from './expression'

export default function evaluate (lexeme: Lexeme, language: Language, expression: Expression): number|string {
  const True = (language === 'BASIC' || language === 'Pascal') ? -1 : 1
  const False = 0

  // variable values are not allowed
  if (expression instanceof VariableValue) {
    throw new CompilerError('Constant value cannot refer to any variables.', lexeme)
  }

  // function calls are not allowed
  if (expression instanceof CommandCall) {
    throw new CompilerError('Constant value cannot invoke any functions.', lexeme)
  }

  // literal values are easy
  if (expression instanceof LiteralValue) {
    return expression.value
  }

  // compound expressions
  const left = expression.left ? evaluate(lexeme, language, expression.left) : null
  const right = evaluate(lexeme, language, expression.right)
  switch (expression.operator) {
    case PCode.eqal:
    case PCode.seql:
      return (left as number|string) === right ? True : False

    case PCode.less:
    case PCode.sles:
      return (left as number|string) < right ? True : False

    case PCode.lseq:
    case PCode.sleq:
      return (left as number|string) <= right ? True : False

    case PCode.more:
    case PCode.smor:
      return (left as number|string) > right ? True : False

    case PCode.mreq:
    case PCode.smeq:
      return (left as number|string) >= right ? True : False

    case PCode.noeq:
    case PCode.sneq:
      return (left as number|string) !== right ? True : False

    case PCode.plus:
      return (left as number) + (right as number)

    case PCode.scat:
      return (left as string) + (right as string)

    case PCode.subt:
      return left ? (left as number) - (right as number) : -(left as number)

    case PCode.not:
      return right === 0 ? True : False

    case PCode.or:
      return (left as number) | (right as number)

    case PCode.orl:
      return (left as number) || (right as number)

    case PCode.xor:
      return (left as number) ^ (right as number)

    case PCode.and:
      return (left as number) & (right as number)

    case PCode.andl:
      return (left as number) && (right as number)

    case PCode.div:
      return Math.floor((left as number) / (right as number))

    case PCode.divr:
      return Math.round((left as number) / (right as number))

    case PCode.mod:
      return (left as number) % (right as number)

    case PCode.mult:
      return (left as number) * (right as number)

    default:
      throw new CompilerError('Unable to parse expression for constant value.', lexeme)
  }
}