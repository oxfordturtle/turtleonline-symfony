import type { Language } from '../constants/languages'
import { CompilerError } from '../tools/error'
import { Expression } from './definitions/expression'

/** evaluates an expression */
export default function evaluate (expression: Expression, language: Language, context: 'constant'|'string'|'array'|'step'): number|string {
  const True = (language === 'BASIC' || language === 'Pascal') ? -1 : 1
  const False = 0

  switch (expression.expressionType) {
    // variable values are not allowed
    case 'address':
    case 'variable':
      if (context === 'constant') {
        throw new CompilerError('Constant value cannot refer to any variables.', expression.lexeme)
      } else if (context === 'string') {
        throw new CompilerError('String size specification cannot refer to any variables.', expression.lexeme)
      } else if (context === 'array') {
        throw new CompilerError('Array size specification cannot refer to any variables.', expression.lexeme)
      } else {
        throw new CompilerError('FOR loop step change specification cannot refer to any variables.', expression.lexeme)
      }

    // function calls are not allowed
    case 'function':
      if (context === 'constant') {
        throw new CompilerError('Constant value cannot invoke any functions.', expression.lexeme)
      } else if (context === 'string') {
        throw new CompilerError('String size specification cannot invoke any functions.', expression.lexeme)
      } else if (context === 'array') {
        throw new CompilerError('Array size specification cannot invoke any functions.', expression.lexeme)
      } else {
        throw new CompilerError('FOR loop step change specification cannot invoke any functions.', expression.lexeme)
      }

    // constant values
    case 'constant':
      return expression.constant.value

    // integer or string values
    case 'integer':
    case 'string':
      return expression.value

    // input values
    case 'input':
      return expression.input.value

    // colour values
    case 'colour':
      return expression.colour.value

    // cast expressions
    case 'cast':
      return evaluate(expression.expression, language, context)

    // compound expressions
    case 'compound':
      const left = expression.left ? evaluate(expression.left, language, context) : null
      const right = evaluate(expression.right, language, context)
      switch (expression.operator) {
        case 'eqal':
        case 'seql':
          return (left as number|string) === right ? True : False

        case 'less':
        case 'sles':
          return (left as number|string) < right ? True : False

        case 'lseq':
        case 'sleq':
          return (left as number|string) <= right ? True : False

        case 'more':
        case 'smor':
          return (left as number|string) > right ? True : False

        case 'mreq':
        case 'smeq':
          return (left as number|string) >= right ? True : False

        case 'noeq':
        case 'sneq':
          return (left as number|string) !== right ? True : False

        case 'plus':
          return (left as number) + (right as number)

        case 'scat':
          return (left as string) + (right as string)

        case 'subt':
          return left ? (left as number) - (right as number) : -(right as number)

        case 'neg':
          return -(right as number)

        case 'not':
          return right === 0 ? True : False
    
        case 'or':
          return (left as number) | (right as number)
    
        case 'orl':
          return (left as number) || (right as number)
    
        case 'xor':
          return (left as number) ^ (right as number)

        case 'and':
          return (left as number) & (right as number)

        case 'andl':
          return (left as number) && (right as number)

        case 'div':
          return Math.floor((left as number) / (right as number))

        case 'divr':
          return Math.round((left as number) / (right as number))

        case 'mod':
          return (left as number) % (right as number)

        case 'mult':
          return (left as number) * (right as number)
      }
  }
}
