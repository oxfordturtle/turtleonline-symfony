/**
 * Lexemes (output by the lexical analysis).
 */
import { Token } from '../tokenizer/token'
import { Language } from '../../state/languages'
import SystemError from '../../state/error'

/** the lexeme class */
export class Lexeme {
  readonly type: LexemeType
  readonly line: number
  readonly content: string
  readonly value: string|number|null

  constructor (tokenOrType: Token|LexemeType, line: number, language: Language) {
    if (typeof tokenOrType === 'string') {
      this.type = tokenOrType
      this.content = tokenOrType
      this.value = null
    } else {
      this.type = lexemeType(tokenOrType)
      this.content = (language === 'Pascal') ? tokenOrType.content.toLowerCase() : tokenOrType.content
      this.value = lexemeValue(tokenOrType, language)
    }
    this.line = line
  }
}

/** the possible lexemeType values */
export type LexemeType =
  | 'operator'
  | 'delimiter'
  | 'string'
  | 'boolean'
  | 'integer'
  | 'keyword'
  | 'type'
  | 'command'
  | 'custom'
  | 'turtle'
  | 'colour'
  | 'keycode'
  | 'query'
  | 'identifier'
  | 'subroutine'
  | 'variable'
  | 'unterminated-comment'
  | 'unterminated-string'
  | 'bad-binary'
  | 'bad-octal'
  | 'bad-hexadecimal'
  | 'decimal'
  | 'bad-decimal'
  | 'illegal'
  | 'NEWLINE'
  | 'INDENT'
  | 'DEDENT'

/** get lexeme type from token */
function lexemeType (token: Token): LexemeType {
  switch (token.type) {
    case 'binary': // fallthrough
    case 'octal': // fallthrough
    case 'hexadecimal': // fallthrough
    case 'decimal': // falthrough
      return 'integer'

    case 'command': // fallthrough
    case 'colour': // fallthrough
    case 'custom': // fallthrough
    case 'variable': // fallthrough
    case 'identifier':
      return 'identifier'

    case 'keyword':
      return (token.content === 'result') ? 'identifier' : token.type

    case 'type': // fallthrough
    case 'turtle': // fallthrough
    case 'keycode': // fallthrough
    case 'query':
    case 'operator':
    case 'delimiter':
    case 'string':
    case 'boolean':
      return token.type

    case 'unterminated-comment': // fallthrough
    case 'unterminated-string': // fallthrough
    case 'bad-binary': // fallthrough
    case 'bad-octal': // fallthrough
    case 'bad-hexadecimal': // fallthrough
    case 'decimal': // fallthrough
    case 'bad-decimal': // fallthrough
    case 'illegal':
      // the lexer should never return lexemes of this type; they should only be
      // used in compiler errors
      return token.type

    case 'linebreak': // fallthrough
    case 'spaces': // fallthrough
    case 'comment':
      // the lexer should never try to create a lexeme from these tokens
      throw new SystemError('Oops, there appears to be a bug in our lexical analyser. Please contact us, and send us a copy of the program code that generated this error message.')
  }
}

/** get lexeme value from token and language */
function lexemeValue (token: Token, language: Language) {
  switch (token.type) {
    case 'operator':
      switch (token.content.toLowerCase()) {
        case '+':
          return 'plus'

        case '-':
          return 'subt'

        case '*':
          return 'mult'

        case '/':
          return 'divr'

        case 'div': // fallthrough
        case '//':
          return 'div'

        case 'mod': // fallthrough
        case '%':
          return 'mod'

        case '=': // fallthrough (N.B. in BASIC, this could also be variable assignment)
        case '==':
          return 'eqal'

        case '<>': // fallthrough
        case '!=':
          return 'noeq'

        case '<=':
          return 'lseq'

        case '>=':
          return 'mreq'

        case '<':
          return 'less'

        case '>':
          return 'more'

        case 'not':
          // 'not' is bitwise negation in BASIC and Pascal, but boolean in Python
          return language === 'Python' ? 'bnot' : 'not'

        case '~':
          // in Python, '~' is bitwise negation
          return 'not'

        case 'and':
          // 'and' is bitwise conjucntion in BASIC and Pascal, but lazy in Python
          return language === 'Python' ? 'andl' : 'and'

        case '&':
          // in Python, '&' is bitwise conjunction
          return 'and'

        case 'or':
          // 'or' is bitwise disjunction in BASIC and Pascal, but lazy in Python
          return language === 'Python' ? 'orl' : 'or'

        case '|':
          // in Python, '|' is bitwise disjunction
          return 'or'

        case 'xor': // fallthrough
        case 'eor': // fallthrough
        case '^':
          return 'xor'

        default:
          return null
      }

    case 'string':
      switch (language) {
        case 'BASIC':
          return token.content.slice(1, -1).replace(/""/g, '"')

        case 'Pascal':
          if (token.content[0] === '\'') return token.content.slice(1, -1).replace(/''/g, '\'')
          return token.content.slice(1, -1).replace(/""/g, '"')

        case 'Python':
          return token.content.slice(1, -1).replace(/\\('|")/g, '$1')
      }

    case 'boolean':
      // N.B. case sensitivity check is already handled by the tokenizer
      if (language === 'Python') return (token.content.toLowerCase() === 'true') ? 1 : 0
      return (token.content.toLowerCase() === 'true') ? -1 : 0

    case 'binary':
      return language === 'Python'
        ? parseInt(token.content.slice(2), 2)
        : parseInt(token.content.slice(1), 2)

    case 'octal':
      return language === 'Python'
        ? parseInt(token.content.slice(2), 8)
        : parseInt(token.content.slice(1), 8)

    case 'hexadecimal':
      return language === 'Python'
        ? parseInt(token.content.slice(2), 16)
        : parseInt(token.content.slice(1), 16)

    case 'decimal':
      return parseInt(token.content)

    case 'turtle':
      return ['x', 'y', 'd', 'p', 'c'].indexOf(token.content[4].toLowerCase()) + 1

    default:
      return null
  }
}

