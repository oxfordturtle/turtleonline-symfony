/**
 * Evaluates a sequence of lexemes (to get the value of a constant).
 */
import { Program } from './routine'
import { colours } from '../constants/colours'
import { PCode } from '../constants/pcodes'
import { Lexeme } from '../lexer/lexeme'
import { CompilerError } from '../tools/error'

/** evaluates a sequence of lexemes as an expression */
export default function (identifier: Lexeme, lexemes: Lexeme[], program: Program): number|string {
  try {
    // generate JavaScript expression from the lexemes
    const code = lexemes.map(toJsString).join('')
    // make colour constants and previously defined constants available to the eval function
    const constants: Record<string, number|string> = {}
    for (const colour of colours) {
      constants[colour.names[program.language]] = colour.value
    }
    for (const constant of program.constants) {
      constants[constant.name] = constant.value
    }
    for (const subroutine of program.allSubroutines) {
      for (const constant of subroutine.constants) {
        constants[constant.name] = constant.value
      }
    }
    // try to evaluate the code
    const value = eval(code)
    // only integers and strings are allowed
    switch (typeof value) {
      case 'boolean':
        if (program.language === 'BASIC' || program.language === 'Pascal') {
          return value ? -1 : 0 // true is -1
        }
        return value ? 1 : 0 // true is 1

      case 'number':
        return (value >= 0) ? Math.floor(value) : Math.ceil(value)

      case 'string':
        return value

      default:
        throw new Error() // throw empty error (will be caught below and ignored)
    }
  } catch (ignore) {
    throw new CompilerError('Could not parse expression for constant value.', identifier)
  }
}

/** gets JavaScript string equivalent of a Turtle language lexeme */
function toJsString (lexeme: Lexeme): string {
  switch (lexeme.type) {
    case 'boolean':
      return (lexeme.content as string).toLowerCase()

    case 'integer':
      return (lexeme.content as string).replace(/^[$&]/, '0x') // fix hexadecimal values

    case 'string':
      return lexeme.content as string

    case 'identifier':
      return `constants['${lexeme.content}']`

    case 'operator':
      switch (lexeme.value) {
        case PCode.plus:
          return '+'

        case PCode.subt:
          return '-'

        case PCode.mult:
          return '*'

        case PCode.divr:
          return '/'

        case PCode.div:
          return '/'

        case PCode.mod:
          return '%'

        case PCode.eqal:
          return '==='

        case PCode.noeq:
          return '!=='

        case PCode.lseq:
          return '<='

        case PCode.mreq:
          return '>='

        case PCode.less:
          return '<'

        case PCode.more:
          return '>'

        case PCode.not:
          return '~'

        case PCode.andl:
          return '&&'

        case PCode.and:
          return '&'

        case PCode.orl:
          return '||'

        case PCode.or:
          return '|'

        case PCode.xor:
          return '^'
        
        default:
          throw new Error()
      }
      break

    case 'delimiter':
      if (lexeme.content === '(' || lexeme.content === ')') {
        return lexeme.content
      }
      throw new Error() // empty error (will be caught above anyway)

    default:
      throw new Error() // empty error (will be caught above anyway)
  }
}
