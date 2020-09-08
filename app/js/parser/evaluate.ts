/**
 * Evaluates a sequence of lexemes (to get the value of a constant).
 */
import { Program } from './routine'
import { colours } from '../constants/colours'
import { Lexeme } from '../lexer/lexeme'
import { CompilerError } from '../tools/error'

/** evaluates a sequence of lexemes as an expression */
export default function (identifier: Lexeme, lexemes: Lexeme[], program: Program): number|string {
  try {
    // generate JavaScript expression from the lexemes
    const code = lexemes.map(toJsString).join('')
    // make colour constants and previously defined constants available to the eval function
    const constants = {}
    for (const colour of colours) {
      constants[colour.names[program.language]] = colour.value
    }
    for (const constant of program.constants) {
      constants[constant.name] = constant.value
    }
    // try to evaluate the code
    const value = eval(code)
    // only integers and strings are allowed
    switch (typeof value) {
      case 'boolean':
        return value ? -1 : 0 // only BASIC and Pascal have constants, and they treat true as -1

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
      return lexeme.content.toLowerCase()

    case 'integer':
      return lexeme.content.replace(/^[$&]/, '0x') // fix hexadecimal values

    case 'string':
      return lexeme.content

    case 'identifier':
      return `constants['${lexeme.content}']`

    case 'operator':
      switch (lexeme.value) {
        case 'plus':
          return '+'

        case 'subt':
          return '-'

        case 'mult':
          return '*'

        case 'divr':
          return '/'

        case 'div':
          return '/'

        case 'mod':
          return '%'

        case 'eqal':
          return '==='

        case 'noeq':
          return '!=='

        case 'lseq':
          return '<='

        case 'mreq':
          return '>='

        case 'less':
          return '<'

        case 'more':
          return '>'

        case 'bnot':
          return '!'

        case 'not':
          return '~'

        case 'andl':
          return '&&'

        case 'and':
          return '&'

        case 'orl':
          return '||'

        case 'or':
          return '|'

        case 'xor':
          return '^'
      }
      break

    case 'delimiter':
      if (lexeme.content === '(' || lexeme.content === ')') {
        return lexeme.content
      } else {
        throw new Error() // empty error (will be caught above anyway)
      }

    default:
      throw new Error() // empty error (will be caught above anyway)
  }
}
