// type imports
import type { Language } from '../constants/languages'

// submodule imports
import { Token } from './token'

// other modules
import { colours } from '../constants/colours'
import { commands } from '../constants/commands'
import { inputs } from '../constants/inputs'
import { keywords } from '../constants/keywords'

/** generates an array of tokens from a string of code */
export default function tokenize (code: string, language: Language): Token[] {
  const tokens: Token[] = []
  let line = 1
  let character = 1
  while (code.length > 0) {
    const token =
      spaces(code, language, line, character) ||
      newline(code, language, line, character) ||
      comment(code, language, line, character) ||
      operatorOrDelimiter(code, language, line, character) ||
      string(code, language, line, character) ||
      boolean(code, language, line, character) ||
      binary(code,language, line, character) ||
      octal(code, language, line, character) ||
      hexadecimal(code, language, line, character) ||
      decimal(code, language, line, character) ||
      keyword(code, language, line, character) ||
      type(code, language, line, character) ||
      inputcode(code, language, line, character) ||
      querycode(code, language, line, character) ||
      turtle(code, language, line, character) ||
      identifier(code, language, line, character) ||
      illegal(code, language, line, character)
    tokens.push(token)
    code = code.slice(token.content.length)
    if (token.type === 'newline') {
      line += 1
      character = 1
    } else {
      character += token.content.length
    }
  }
  return tokens
}

/** tests for spaces and returns the token if matched */
function spaces (code: string, language: Language, line: number, character: number): Token|false {
  const test = code.match(/^( +)/)
  return test ? new Token('spaces', test[0], line, character) : false
}

/** tests for a newline and returns the token if matched */
function newline (code: string, language: Language, line: number, character: number): Token|false {
  const test = (code[0] === '\n')
  return test ? new Token('newline', '\n', line, character) : false
}

/** tests for a comment and returns the token if matched */
function comment (code: string, language: Language, line: number, character: number): Token|false {
  switch (language) {
    case 'BASIC': {
      const startBASIC = code.match(/^REM/)
      return startBASIC ? new Token('comment', code.split('\n')[0], line, character) : false
    }

    case 'C': // fallthrough
    case 'Java': // fallthrough
    case 'TypeScript': {
      const startCorTS = code.match(/^\/\//)
      return startCorTS ? new Token('comment', code.split('\n')[0], line, character) : false
    }

    case 'Pascal': {
      const start = code[0] === '{'
      const end = code.match(/}/)
      if (start && end) {
        return new Token('comment', code.slice(0, end.index as number + 1), line, character)
      }
      if (start) {
        return new Token('unterminated-comment', code.split('\n')[0], line, character)
      }
      return false
    }
    
    case 'Python': {
      const startPython = code.match(/^#/)
      return startPython ? new Token('comment', code.split('\n')[0], line, character) : false
    }
  }
}

/** tests for an operator or delimiter and returns the token if matched */
function operatorOrDelimiter (code: string, language: Language, line: number, character: number): Token|false {
  switch (language) {
    case 'BASIC': // fallthrough
    case 'C': // fallthrough
    case 'Java': // fallthrough
    case 'TypeScript':
      // the order doesn't matter
      return operator(code, language, line, character) || delimiter(code, language, line, character)

    case 'Pascal':
      // check for operator ':=' before delimiter ':'
      return operator(code, language, line, character) || delimiter(code, language, line, character)

    case 'Python':
      // check for delimiter '->' before operator '-'
      return delimiter(code, language, line, character) || operator(code, language, line, character)
  }
}

/** tests for an operator and returns the token if matched */
function operator (code: string, language: Language, line: number, character: number): Token|false {
  const tests = {
    BASIC: /^(\+|-|\*|\/|DIV\b|MOD\b|=|<>|<=|>=|<|>|ANDL\b|ORL\b|NOT\b|AND\b|OR\b|EOR\b)/,
    C: /^(\+|-|\*|\/|div\b|%|==|!=|<=|>=|<|>|=|!|&&|\|\||~|&|\||\^)/,
    Java: /^(\+|-|\*|\/|div\b|%|==|!=|<=|>=|<|>|=|!|&&|\|\||~|&|\||\^)/,
    Pascal: /^(\+|-|\*|\/|div\b|mod\b|=|<>|<=|>=|<|>|:=|andl\b|orl\b|not\b|and\b|or\b|xor\b)/i,
    Python: /^(\+|-|\*|\/\/|\/|%|==|!=|<=|>=|<|>|=|not\b|and\b|or\b|~|&|\||\^)/,
    TypeScript: /^(\+|-|\*|\/|div\b|%|==|!=|<=|>=|<|>|=|!|&&|\|\||~|&|\||\^)/
  }
  const test = code.match(tests[language])
  return test ? new Token('operator', test[0], line, character) : false
}

/** tests for a delimiter and returns the token if matched */
function delimiter (code: string, language: Language, line: number, character: number): Token|false {
  const tests = {
    BASIC: /^(\(|\)|,|:)/,
    C: /^(\(|\)|{|}|\[|\]|,|;)/,
    Java: /^(\(|\)|{|}|\[|\]|,|;)/,
    Pascal: /^(\(|\)|\[|\]|,|:|;|\.\.|\.)/,
    Python: /^(\(|\)|\[|\]|,|:|;|->)/,
    TypeScript: /^(\(|\)|{|}|\[|\]|,|;|:)/
  }
  const test = code.match(tests[language])
  return test ? new Token('delimiter', test[0], line, character) : false
}

/** tests for a string literal and returns the token if matched */
function string (code: string, language: Language, line: number, character: number): Token|false {
  code = code.split('\n')[0]
  switch (language) {
    case 'BASIC': // fallthrough
    case 'Pascal':
      // TODO: rule out single-quoted strings in BASIC ??
      if (code[0] === '\'' || code[0] === '"') {
        const quote = code[0]
        let length = 1
        let end = false
        while (code[length] && !end) {
          if (code[length] === '\n') {
            return new Token('unterminated-string', code.slice(0, length), line, character)
          }
          if (code[length] !== quote) {
            length += 1
          } else {
            length += 1
            if (code[length] !== quote) {
              end = true
            } else {
              length += 1
            }
          }
        }
        if (!end) {
          return new Token('unterminated-string', code.slice(0, length), line, character)
        }
        return new Token('string', code.slice(0, length), line, character)
      }
      return false

    case 'C': // fallthrough
    case 'Java': // fallthrough
    case 'Python': // fallthrough
    case 'TypeScript': {
      const start1 = code[0] === '\''
      const start2 = code[0] === '"'
      const end1 = code.match(/[^\\](')/)
      const end2 = code.match(/[^\\](")/)
      if (start1 && end1) {
        return new Token('string', code.slice(0, end1.index as number + 2), line, character)
      }
      if (start1) {
        return new Token('unterminated-string', code.split('\n')[0], line, character)
      }
      if (start2 && end2) {
        return new Token('string', code.slice(0, end2.index as number + 2), line, character)
      }
      if (start2) {
        return new Token('unterminated-string', code.split('\n')[0], line, character)
      }
      return false
    }
  }
}

/** tests for a boolean literal and returns the token if matched */
function boolean (code: string, language: Language, line: number, character: number): Token|false {
  const tests = {
    BASIC: /^(TRUE|FALSE)\b/,
    C: /^(true|false)\b/,
    Java: /^(true|false)\b/,
    Pascal: /^(true|false)\b/i,
    Python: /^(True|False)\b/,
    TypeScript: /^(true|false)\b/
  }
  const test = code.match(tests[language])
  return test ? new Token('boolean', test[0], line, character) : false
}

/** tests for a binary integer literal and returns the token if matched */
function binary (code: string, language: Language, line: number, character: number): Token|false {
  // TODO: errors for binary numbers with digits > 1
  switch (language) {
    case 'BASIC': // fallthrough
    case 'Pascal': {
      const good = code.match(/^(%[01]+)\b/)
      const bad = code.match(/^(0b[01]+)\b/)
      if (good) {
        return new Token('binary', good[0], line, character)
      }
      if (bad) {
        return new Token('bad-binary', bad[0], line, character)
      }
      return false
    }

    case 'C': // fallthrough
    case 'Java': // fallthrough
    case 'Python': // fallthrough
    case 'TypeScript': {
      // N.B. there's no bad binary in these languages, since '%' will match the MOD operator
      const test = code.match(/^(0b[01]+)\b/)
      if (test) {
        return new Token('binary', test[0], line, character)
      }
      return false
    }
  }
}

/** tests for an octal integer literal and returns the token if matched */
function octal (code: string, language: Language, line: number, character: number): Token|false {
  // TODO: errors for octal numbers with digits > 7
  switch (language) {
    case 'BASIC':
      // BASIC doesn't support octal numbers
      return false

    case 'Pascal': {
      const goodPascal = code.match(/^(&[0-7]+)\b/)
      const badPascal = code.match(/^(0o[0-7]+)\b/)
      if (goodPascal) {
        return new Token('octal', goodPascal[0], line, character)
      }
      if (badPascal) {
        return new Token('bad-octal', badPascal[0], line, character)
      }
      return false
    }

    case 'C': // fallthrough
    case 'Java': // fallthrough
    case 'Python': // fallthrough
    case 'TypeScript': {
      // N.B. there's no bad octal in these languages, since '&' will match the boolean AND operator
      const testPython = code.match(/^(0o[0-7]+)\b/)
      if (testPython) {
        return new Token('octal', testPython[0], line, character)
      }
      return false
    }
  }
}

/** tests for a hexadecimal integer literal and returns the token if matched */
function hexadecimal (code: string, language: Language, line: number, character: number): Token|false {
  const bads = {
    BASIC: /^((\$|(0x))[A-Fa-f0-9]+)\b/,
    C: /^((&|#|\$)[A-Fa-f0-9]+)\b/,
    Java: /^((&|#|\$)[A-Fa-f0-9]+)\b/,
    Pascal: /^((&|(0x))[A-Fa-f0-9]+)\b/,
    Python: /^((&|#|\$)[A-Fa-f0-9]+)\b/,
    TypeScript: /^((&|#|\$)[A-Fa-f0-9]+)\b/
  }
  const goods = {
    BASIC: /^((&|#)[A-Fa-f0-9]+)\b/, // also allow '#' notation
    C: /^((0x|#)[A-Fa-f0-9]+)\b/, // also allow '#' notation
    Java: /^((0x|#)[A-Fa-f0-9]+)\b/, // also allow '#' notation
    Pascal: /^((\$|#)[A-Fa-f0-9]+)\b/, // also allow '#' notation
    Python: /^(0x[A-Fa-f0-9]+)\b/, // don't allow '#' notation ('#' is for comments)
    TypeScript: /^((0x|#)[A-Fa-f0-9]+)\b/ // also allow '#' notation
  }
  const bad = code.match(bads[language])
  const good = code.match(goods[language])
  if (bad) {
    return new Token('bad-hexadecimal', bad[0], line, character)
  }
  if (good) {
    return new Token('hexadecimal', good[0], line, character)
  }
  return false
}

/** tests for a decimal integer literal and returns the token if matched */
function decimal (code: string, language: Language, line: number, character: number): Token|false {
  const good = code.match(/^(\d+)\b/)
  const bad = code.match(/^(\d+\.\d+)/)
  if (bad) { // good will also match if bad matches, so give this priority
    return new Token('real', bad[0], line, character)
  }
  if (good) {
    return new Token('decimal', good[0], line, character)
  }
  return false
}

/** tests for a keyword and returns the token if matched */
function keyword (code: string, language: Language, line: number, character: number): Token|false {
  const names = keywords[language].map(x => x.name).join('|')
  const regex = (language === 'Pascal') ? new RegExp(`^(${names})\\b`, 'i') : new RegExp(`^(${names})\\b`)
  const test = code.match(regex)
  return test ? new Token('keyword', test[0], line, character) : false
}

/** tests for a type keyword and returns the token if matched */
function type (code: string, language: Language, line: number, character: number): Token|false {
  let test: RegExpMatchArray|null = null
  switch (language) {
    case 'C':
      test = code.match(/^(void|bool|char|int|string)\b/)
      break
    case 'Java':
      test = code.match(/^(void|boolean|char|int|String)\b/)
      break
    case 'Pascal':
      test = code.match(/^(boolean|char|integer|string)\b/i)
      break
    case 'TypeScript':
      test = code.match(/^(void|boolean|number|string)\b/)
      break
  }
  return test ? new Token('type', test[0], line, character) : false
}

/** tests for a native inputcode constant and returns the token if matched */
function inputcode (code: string, language: Language, line: number, character: number): Token|false {
  const names = inputs
    .map(x => `\\\\${x.name}`)
    .join('|')
  const regex = (language === 'Pascal') ? new RegExp(`^(${names})\\b`, 'i') : new RegExp(`^(${names})\\b`)
  const good = code.match(regex)
  const bad = code.match(/^(\\[#a-zA-Z0-9]*)\b/)
  if (good) {
    return new Token('inputcode', good[0], line, character)
  }
  if (bad) {
    return new Token('bad-inputcode', bad[0], line, character)
  }
  return false
}

/** tests for a native querycode and returns the token if matched */
function querycode (code: string, language: Language, line: number, character: number): Token|false {
  const names = inputs
    .map(x => `\\?${x.name}`)
    .join('|')
  const regex = (language === 'Pascal') ? new RegExp(`^(${names})\\b`, 'i') : new RegExp(`^(${names})\\b`)
  const good = code.match(regex)
  const bad = code.match(/^(\?[#a-zA-Z0-9]*)\b/)
  if (good) {
    return new Token('querycode', good[0], line, character)
  }
  if (bad) {
    return new Token('bad-querycode', bad[0], line, character)
  }
  return false
}

/** tests for a built-in turtle variable (identifier) and returns the token if matched */
function turtle (code: string, language: Language, line: number, character: number): Token|false {
  const tests = {
    BASIC: /^(turt[xydatc]%)/,
    C: /^(turt[xydatc])\b/,
    Java: /^(turt[xydatc])\b/,
    Pascal: /^(turt[xydatc])\b/i,
    Python: /^(turt[xydatc])\b/,
    TypeScript: /^(turt[xydatc])\b/
  }
  const test = code.match(tests[language])
  return test ? new Token('turtle', test[0], line, character) : false
}

/** tests for any other identifier and returns the token if matched */
function identifier (code: string, language: Language, line: number, character: number): Token|false {
  const test = (language === 'BASIC')
    ? code.match(/^([_a-zA-Z][_a-zA-Z0-9]*\$\d*|[_a-zA-Z][_a-zA-Z0-9]*%?)/)
    : code.match(/^([_a-zA-Z][_a-zA-Z0-9]*)\b/)
  if (test) {
    const name = (language === 'Pascal') ? test[0].toLowerCase() : test[0]
    const colour = colours.find(x => x.names[language] === name)
    const command = commands.find(x => x.names[language] === name)
    if (colour) {
      return new Token('colour', test[0], line, character)
    }
    if (command) {
      return new Token('command', test[0], line, character)
    }
    if (language === 'Python' && name === 'range') { // pretend 'range' is a command in Python
      return new Token('command', test[0], line, character)
    }
    return new Token('identifier', test[0], line, character)
  }
  return false
}

/** returns an illegal token (for use if none of the above matched) */
function illegal (code: string, language: Language, line: number, character: number): Token {
  return new Token('illegal', code.split(/\s/)[0], line, character)
}
