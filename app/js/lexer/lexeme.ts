// type imports
import type { Language } from '../constants/languages'
import { Token } from './token'

/** lexeme */
export type Lexeme =
  | NewlineLexeme
  | IndentLexeme
  | DedentLexeme
  | CommentLexeme
  | KeywordLexeme
  | TypeLexeme
  | OperatorLexeme
  | DelimiterLexeme
  | BooleanLexeme
  | IntegerLexeme
  | CharacterLexeme
  | StringLexeme
  | InputcodeLexeme
  | QuerycodeLexeme
  | IdentifierLexeme

/** base lexeme class (extended by particular lexeme classes) */
class LexemeClass {
  readonly line: number
  readonly character: number
  readonly content: string

  constructor (line: number, character: number, content: string) {
    this.line = line
    this.character = character
    this.content = content
  }
}

/** new line lexeme */
export class NewlineLexeme extends LexemeClass {
  readonly type = 'newline'

  constructor (token: Token) {
    super(token.line, token.character, '[newline]')
  }
}

/** indent lexeme */
export class IndentLexeme extends LexemeClass {
  readonly type = 'indent'

  constructor (token: Token) {
    super(token.line, token.character, '[dedent]')
  }
}

/** dedent lexeme */
export class DedentLexeme extends LexemeClass {
  readonly type = 'dedent'

  constructor (token: Token) {
    super(token.line, token.character, '[dedent]')
  }
}

/** comment lexeme */
export class CommentLexeme extends LexemeClass {
  readonly type = 'comment'
  readonly subtype = null
  readonly value: string

  constructor (token: Token, language: Language) {
    super(token.line, token.character, token.content)
    switch (language) {
      case 'BASIC':
        this.value = token.content.slice(3).trim()
        break
      case 'C': // fallthrough
      case 'Java': //fallthrough
      case 'TypeScript':
        this.value = token.content.slice(2).trim()
        break
      case 'Pascal':
        this.value = token.content.slice(1, -1).trim()
        break
      case 'Python':
        this.value = token.content.slice(1).trim()
        break
    }
  }
}

/** keyword lexeme */
export class KeywordLexeme extends LexemeClass {
  readonly type = 'keyword'
  readonly subtype: Keyword

  constructor (token: Token) {
    super(token.line, token.character, token.content)
    this.subtype = token.content.toLowerCase() as Keyword
  }
}

/** type lexeme */
export class TypeLexeme extends LexemeClass {
  readonly type = 'type'
  readonly subtype: Type|null = null

  constructor (token: Token) {
    super(token.line, token.character, token.content)
    switch (token.content) {
      case 'bool': // fallthrough
      case 'boolean':
        this.subtype = 'boolean'
        break
      case 'char':
        this.subtype = 'character'
        break
      case 'int': // fallthrough
      case 'integer': // fallthrough
      case 'number':
        this.subtype = 'integer'
        break
      case 'string': // fallthrough
      case 'String':
        this.subtype = 'string'
        break
    }
  }
}

/** operator lexeme */
export class OperatorLexeme extends LexemeClass {
  readonly type = 'operator'
  subtype: Operator|'asgn' = 'asgn'

  constructor (token: Token, language: Language) {
    super(token.line, token.character, token.content)
    // N.B. some operator lexemes are ambiguous; for those that are, the parser
    // will disambiguate later
    switch (token.content.toLowerCase()) {
      case '+':
        this.subtype = 'plus'
        break
      case '-':
        this.subtype = 'subt'
        break
      case '*':
        this.subtype = 'mult'
        break
      case '/':
        this.subtype = 'divr'
        break
      case 'div': // fallthrough
      case '//':
        this.subtype = 'div'
        break
      case 'mod': // fallthrough
      case '%':
        this.subtype = 'mod'
        break
      case '=':
        this.subtype = (language === 'BASIC' || language === 'Pascal') ? 'eqal' : 'asgn'
        break
      case '==':
        this.subtype = 'eqal'
        break
      case '<>': // fallthrough
      case '!=':
        this.subtype = 'noeq'
        break
      case '<=':
        this.subtype = 'lseq'
        break
      case '>=':
        this.subtype = 'mreq'
        break
      case '<':
        this.subtype = 'less'
        break
      case '>':
        this.subtype = 'more'
        break
      case 'not': // fallthrough
      case '~': // fallthrough
      case '!':
        this.subtype = 'not'
        break
      case 'and': // BASIC, Pascal, and Python
        this.subtype = (language === 'Python') ? 'andl' : 'and'
        break
      case 'or': // BASIC, Pascal, and Python
        this.subtype = (language === 'Python') ? 'orl' : 'or'
        break
      case 'andl': // fallthrough
      case '&&':
        this.subtype = 'andl'
        break
      case '&':
        this.subtype = 'and'
        break
      case 'orl': // fallthrough
      case '||':
        this.subtype = 'orl'
        break
      case '|':
        this.subtype = 'or'
        break
      case 'eor': // BASIC
      case 'xor': // Pascal
      case '^': // everything else
        this.subtype = 'xor'
        break
    }
  }
}

/** delimiter lexeme */
export class DelimiterLexeme extends LexemeClass {
  readonly type = 'delimiter'
  readonly subtype: Delimiter

  constructor (token: Token) {
    super(token.line, token.character, token.content)
    this.subtype = token.content as Delimiter
  }
}

/** boolean lexeme */
export class BooleanLexeme extends LexemeClass {
  readonly type = 'literal'
  readonly subtype = 'boolean'
  readonly value: number

  constructor (token: Token, language: Language) {
    super(token.line, token.character, token.content)
    if (language === 'C' || language === 'Python') {
      this.value = (token.content.toLowerCase() === 'true') ? 1 : 0
    } else {
      this.value = (token.content.toLowerCase() === 'true') ? -1 : 0
    }
}
}

/** integer lexeme */
export class IntegerLexeme extends LexemeClass {
  readonly type = 'literal'
  readonly subtype = 'integer'
  readonly value: number
  readonly radix: number

  constructor (token: Token, radix: number) {
    super(token.line, token.character, token.content)
    const firstNonInteger = token.content.match(/[^0-9]/)
    const trimmedContent = firstNonInteger
      ? token.content.slice((firstNonInteger.index || 0) + 1)
      : token.content
    this.value = parseInt(trimmedContent, radix)
    this.radix = radix
  }
}

/** character lexeme */
export class CharacterLexeme extends LexemeClass {
  readonly type = 'literal'
  readonly subtype = 'character'
  readonly value: number

  constructor (lexeme: StringLexeme) {
    super(lexeme.line, lexeme.character, lexeme.content)
    this.value = lexeme.value.charCodeAt(0)
  }
}

/** string lexeme */
export class StringLexeme extends LexemeClass {
  readonly type = 'literal'
  readonly subtype = 'string'
  readonly value: string

  constructor (token: Token, language: Language) {
    super(token.line, token.character, token.content)
    switch (language) {
      case 'BASIC':
        this.value = token.content.slice(1, -1).replace(/""/g, '"')
        break
      case 'Pascal':
        if (token.content[0] === '\'') {
          this.value = token.content.slice(1, -1).replace(/''/g, '\'')
        } else {
          this.value = token.content.slice(1, -1).replace(/""/g, '"')
        }
        break
      case 'C': // fallthrough
      case 'Java':
        this.value = token.content.slice(1, -1).replace(/\\('|")/g, '$1')
        break
      case 'Python': // fallthrough
      case 'TypeScript':
        this.value = token.content.slice(1, -1).replace(/\\('|")/g, '$1')
        break
    }
  }
}

/** inputcode lexeme */
export class InputcodeLexeme extends LexemeClass {
  readonly type = 'input'
  readonly subtype = 'inputcode'
  readonly value: string

  constructor (token: Token, language: Language) {
    super(token.line, token.character, token.content)
    this.value = (language === 'Pascal') ? token.content.slice(1).toLowerCase() : token.content.slice(1)
  }
}

/** query lexeme */
export class QuerycodeLexeme extends LexemeClass {
  readonly type = 'input'
  readonly subtype = 'querycode'
  readonly value: string

  constructor (token: Token, language: Language) {
    super(token.line, token.character, token.content)
    this.value = (language === 'Pascal') ? token.content.slice(1).toLowerCase() : token.content.slice(1)
  }
}

/** identifier lexeme */
export class IdentifierLexeme extends LexemeClass {
  readonly type = 'identifier'
  readonly subtype: 'turtle'|'identifier'
  readonly value: string

  constructor (token: Token, language: Language) {
    super(token.line, token.character, token.content)
    this.subtype = (token.type === 'turtle') ? 'turtle' : 'identifier'
    this.value = (language === 'Pascal') ? token.content.toLowerCase() : token.content
  }
}

/** keywords */
export type Keyword =
  | 'program'
  | 'procedure'
  | 'function'
  | 'class'
  | 'def'
  | 'begin'
  | 'end'
  | 'endproc'
  | 'if'
  | 'then'
  | 'else'
  | 'elif'
  | 'endif'
  | 'for'
  | 'to'
  | 'downto'
  | 'step'
  | 'in'
  | 'next'
  | 'while'
  | 'endwhile'
  | 'do'
  | 'repeat'
  | 'until'
  | 'pass'
  | 'return'
  | 'const'
  | 'final'
  | 'var'
  | 'dim'
  | 'local'
  | 'private'
  | 'global'
  | 'nonlocal'
  | 'array'
  | 'of'
  | 'void'
  | 'boolean'
  | 'character'
  | 'integer'
  | 'string'

/** types */
export type Type =
  | 'boolint'
  | 'boolean'
  | 'integer'
  | 'character'
  | 'string'

/** operators */
export type Operator =
  | 'neg'
  | 'not'
  | 'plus'
  | 'subt'
  | 'mult'
  | 'divr'
  | 'div'
  | 'mod'
  | 'and'
  | 'or'
  | 'xor'
  | 'andl'
  | 'orl'
  | 'scat'
  | 'eqal'
  | 'noeq'
  | 'less'
  | 'more'
  | 'lseq'
  | 'mreq'
  | 'seql'
  | 'sneq'
  | 'sles'
  | 'smor'
  | 'sleq'
  | 'smeq'

/** delimiters */
type Delimiter =
  | '('
  | ')'
  | '{'
  | '}'
  | '['
  | ']'
  | ','
  | ':'
  | ';'
  | '.'
  | '..'
  | '->'
