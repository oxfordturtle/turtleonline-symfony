/*
 * Tokenizer.
 */
import { Token } from './token'
import { colours } from '../constants/colours'
import { commands } from '../constants/commands'
import { inputs } from '../constants/inputs'
import { keywords } from '../constants/keywords'
import { Language } from '../constants/languages'

/** generates an array of tokens from a string of code */
export default function tokenize (code: string, language: Language): Token[] {
  const tokens: Token[] = []
  while (code.length > 0) {
    const lexeme = spaces(code, language) ||
      newline(code, language) ||
      comment(code, language) ||
      operatorOrDelimiter(code, language) ||
      string(code, language) ||
      boolean(code, language) ||
      binary(code,language) ||
      octal(code, language) ||
      hexadecimal(code, language) ||
      decimal(code, language) ||
      keyword(code, language) ||
      keycode(code, language) ||
      query(code, language) ||
      command(code, language) ||
      turtle(code, language) ||
      colour(code, language) ||
      custom(code, language) ||
      variable(code, language) ||
      identifier(code, language) ||
      illegal(code, language)
    tokens.push(lexeme)
    code = code.slice(lexeme.content.length)
  }
  return tokens
}

/** tests for spaces and returns the token if matched */
function spaces (code: string, language: Language): Token|false {
  const test = code.match(/^( +)/)
  return test ? new Token('spaces', null, true, test[0], language) : false
}

/** tests for a newline and returns the token if matched */
function newline (code: string, language: Language): Token|false {
  const test = (code[0] === '\n')
  return test ? new Token('newline', null, true, '\n', language) : false
}

/** tests for a comment and returns the token if matched */
function comment (code: string, language: Language): Token|false {
  switch (language) {
    case 'BASIC':
      const startBASIC = code.match(/^REM/)
      return startBASIC ? new Token('comment', null, true, code.split('\n')[0], language) : false

    case 'C': // fallthrough
    case 'TypeScript':
      const startCorTS = code.match(/^\/\//)
      return startCorTS ? new Token('comment', null, true, code.split('\n')[0], language) : false

    case 'Pascal':
      const start = code[0] === '{'
      const end = code.match(/}/)
      if (start && end) {
        return new Token('comment', null, true, code.slice(0, end.index + 1), language)
      }
      if (start) {
        return new Token('comment', null, false, code.split('\n')[0], language)
      }
      return false
    
    case 'Python':
      const startPython = code.match(/^#/)
      return startPython ? new Token('comment', null, true, code.split('\n')[0], language) : false
  }
}

/** tests for an operator or delimiter and returns the token if matched */
function operatorOrDelimiter (code: string, language: Language): Token|false {
  switch (language) {
    case 'BASIC': // fallthrough
    case 'C': // fallthrough
    case 'TypeScript':
      // the order doesn't matter
      return operator(code, language) || delimiter(code, language)

    case 'Pascal':
      // check for operator ':=' before delimiter ':'
      return operator(code, language) || delimiter(code, language)

    case 'Python':
      // check for delimiter '->' before operator '-'
      return delimiter(code, language) || operator(code, language)
  }
}

/** tests for an operator and returns the token if matched */
function operator (code: string, language: Language): Token|false {
  const tests = {
    BASIC: /^(\+|-|\*|\/|DIV\b|MOD\b|=|<>|<=|>=|<|>|NOT\b|AND\b|OR\b|EOR\b)/,
    C: /^(\+|-|\*|\/|%|==|!=|<=|>=|<|>|=|!|&&|\|\||&|\||\^)/,
    Pascal: /^(\+|-|\*|\/|div\b|mod\b|=|<>|<=|>=|<|>|:=|not\b|and\b|or\b|xor\b)/i,
    Python: /^(\+|-|\*|\/\/|\/|%|==|!=|<=|>=|<|>|=|~|&|\||\^|not\b|and\b|or\b)/,
    TypeScript: /^(\+|-|\*|\/|%|==|!=|<=|>=|<|>|=|!|&&|\|\||&|\||\^)/,
  }
  const test = code.match(tests[language])
  return test ? new Token('operator', null, true, test[0], language) : false
}

/** tests for a delimiter and returns the token if matched */
function delimiter (code: string, language: Language): Token|false {
  const tests = {
    BASIC: /^(\(|\)|,|:)/,
    C: /^(\(|\)|{|}|\[|\]|,|;)/,
    Pascal: /^(\(|\)|\[|\]|,|:|;|\.\.|\.)/,
    Python: /^(\(|\)|\[|\]|,|:|;|->)/,
    TypeScript: /^(\(|\)|{|}|\[|\]|,|;|:)/
  }
  const test = code.match(tests[language])
  return test ? new Token('delimiter', null, true, test[0], language) : false
}

/** tests for a string literal and returns the token if matched */
function string (code: string, language: Language): Token|false {
  code = code.split('\n')[0]
  switch (language) {
    case 'BASIC':
      // single quoted strings are not allowed
      if (code[0] === '\'') {
        const content = code.match(/'(.*?)'/) ? code.match(/'(.*?)'/)[0] : code
        return new Token('string', 'single', false, content, language)
      }
      // awkward cases
      if (code.match(/^""""/)) return new Token('string', 'double', true, '""""', language)
      if (code.match(/^""([^"]|$)/)) return new Token('string', 'double', true, '""', language)
      // normal cases
      const startBASIC = code[0] === '"'
      const endBASIC = code.match(/[^"](")([^"]|$)/)
      if (startBASIC && endBASIC) {
        return new Token('string', 'double', true, code.slice(0, endBASIC.index + 2), language)
      }
      if (startBASIC) {
        return new Token('string', 'double', false, code.split('\n')[0], language)
      }
      return false

    case 'Pascal':
      // awkward cases
      if (code.match(/^''''/)) return new Token('string', 'single', true, '\'\'\'\'', language)
      if (code.match(/^''[^']/)) return new Token('string', 'single', true, '\'\'', language)
      if (code.match(/^""""/)) return new Token('string', 'double', true, '""""', language)
      if (code.match(/^""[^"]/)) return new Token('string', 'double', true, '""', language)
      // normal cases
      const start1Pascal = code[0] === '\''
      const start2Pascal = code[0] === '"'
      const end1Pascal = code.match(/[^'](')([^']|$)/)
      const end2Pascal = code.match(/[^"](")([^"]|$)/)
      if (start1Pascal && end1Pascal) {
        return new Token('string', 'single', true, code.slice(0, end1Pascal.index + 2), language)
      }
      if (start1Pascal) {
        return new Token('string', 'single', false, code.split('\n')[0], language)
      }
      if (start2Pascal && end2Pascal) {
        return new Token('string', 'double', true, code.slice(0, end2Pascal.index + 2), language)
      }
      if (start2Pascal) {
        return new Token('string', 'double', false, code.split('\n')[0], language)
      }
      return false

    case 'C': // fallthrough
    case 'Python': // fallthrough
    case 'TypeScript':
      const start1Python = code[0] === '\''
      const start2Python = code[0] === '"'
      const end1Python = code.match(/[^\\](')/)
      const end2Python = code.match(/[^\\](")/)
      if (start1Python && end1Python) {
        return new Token('string', 'single', true, code.slice(0, end1Python.index + 2), language)
      }
      if (start1Python) {
        return new Token('string', 'single', false, code.split('\n')[0], language)
      }
      if (start2Python && end2Python) {
        return new Token('string', 'double', true, code.slice(0, end2Python.index + 2), language)
      }
      if (start2Python) {
        return new Token('string', 'double', false, code.split('\n')[0], language)
      }
      return false
    }
}

/** tests for a boolean literal and returns the token if matched */
function boolean (code: string, language: Language): Token|false {
  const tests = {
    BASIC: /^(TRUE|FALSE)\b/,
    C: /^(true|false)\b/,
    Pascal: /^(true|false)\b/i,
    Python: /^(True|False)\b/,
    TypeScript: /^(true|false)\b/,
  }
  const test = code.match(tests[language])
  return test ? new Token('boolean', null, true, test[0], language) : false
}

/** tests for a binary integer literal and returns the token if matched */
function binary (code: string, language: Language): Token|false {
  // TODO: errors for binary numbers with digits > 1
  switch (language) {
    case 'BASIC': // fallthrough
    case 'Pascal':
      const good = code.match(/^(%[01]+)\b/)
      const bad = code.match(/^(0b[01]+)\b/)
      if (good) {
        return new Token('integer', 'binary', true, good[0], language)
      }
      if (bad) {
        return new Token('integer', 'binary', false, bad[0], language)
      }
      return false

    case 'C': // fallthrough
    case 'Python': // fallthrough
    case 'TypeScript':
      // N.B. there's no bad binary in these languages, since '%' will match the MOD operator
      const test = code.match(/^(0b[01]+)\b/)
      if (test) {
        return new Token('integer', 'binary', true, test[0], language)
      }
      return false
  }
}

/** tests for an octal integer literal and returns the token if matched */
function octal (code: string, language: Language): Token|false {
  // TODO: errors for octal numbers with digits > 7
  switch (language) {
    case 'BASIC':
      const testBASIC = code.match(/^(0o[0-7]+)\b/)
      if (testBASIC) {
        return new Token('integer', 'octal', false, testBASIC[0], language)
      }
      return false

    case 'Pascal':
      const goodPascal = code.match(/^(&[0-7]+)\b/)
      const badPascal = code.match(/^(0o[0-7]+)\b/)
      if (goodPascal) {
        return new Token('integer', 'octal', true, goodPascal[0], language)
      }
      if (badPascal) {
        return new Token('integer', 'octal', false, badPascal[0], language)
      }
      return false

    case 'C': // fallthrough
    case 'Python': // fallthrough
    case 'TypeScript':
      // N.B. there's no bad octal in these languages, since '&' will match the boolean AND operator
      const testPython = code.match(/^(0o[0-7]+)\b/)
      if (testPython) {
        return new Token('integer', 'octal', true, testPython[0], language)
      }
      return false
  }
}

/** tests for a hexadecimal integer literal and returns the token if matched */
function hexadecimal (code: string, language: Language): Token|false {
  const bads = {
    BASIC: /^((\$|(0x))[A-Fa-f0-9]+)\b/,
    C: /^((&|#|\$)[A-Fa-f0-9]+)\b/,
    Pascal: /^((&|(0x))[A-Fa-f0-9]+)\b/,
    Python: /^((&|#|\$)[A-Fa-f0-9]+)\b/,
    TypeScript: /^((&|#|\$)[A-Fa-f0-9]+)\b/
  }
  const goods = {
    BASIC: /^((&|#)[A-Fa-f0-9]+)\b/, // also allow '#' notation
    C: /^((0x|#)[A-Fa-f0-9]+)\b/, // also allow '#' notation
    Pascal: /^((\$|#)[A-Fa-f0-9]+)\b/, // also allow '#' notation
    Python: /^(0x[A-Fa-f0-9]+)\b/, // don't allow '#' notation ('#' is for comments)
    TypeScript: /^((0x|#)[A-Fa-f0-9]+)\b/ // also allow '#' notation
  }
  const bad = code.match(bads[language])
  const good = code.match(goods[language])
  if (bad) {
    return new Token('integer', 'hexadecimal', false, bad[0], language)
  }
  if (good) {
    return new Token('integer', 'hexadecimal', true, good[0], language)
  }
  return false
}

/** tests for a decimal integer literal and returns the token if matched */
function decimal (code: string, language: Language): Token|false {
  const good = code.match(/^(\d+)\b/)
  const bad = code.match(/^(\d+\.\d+)/)
  if (bad) { // good will also match if bad matches, so give this priority
    return new Token('integer', 'decimal', false, bad[0], language)
  }
  if (good) {
    return new Token('integer', 'decimal', true, good[0], language)
  }
  return false
}

/** tests for a keyword and returns the token if matched */
function keyword (code: string, language: Language): Token|false {
  const names = keywords[language].map(x => x.name).join('|')
  const regex = (language === 'Pascal') ? new RegExp(`^(${names})\\b`, 'i') : new RegExp(`^(${names})\\b`)
  const test = code.match(regex)
  return test ? new Token('keyword', null, true, test[0], language) : false
}

/** tests for a native keycode constant and returns the token if matched */
function keycode (code: string, language: Language): Token|false {
  const names = inputs
    .filter(x => x.value >= 0)
    .map(x => x.names[language].replace(/\\/, '\\\\'))
    .join('|')
  const regex = (language === 'Pascal') ? new RegExp(`^(${names})\\b`, 'i') : new RegExp(`^(${names})\\b`)
  const good = code.match(regex)
  const bad = code.match(/^(\\[#a-zA-Z0-9]*)\b/)
  if (good) {
    return new Token('keycode', null, true, good[0], language)
  }
  if (bad) {
    return new Token('keycode', null, false, bad[0], language)
  }
  return false
}

/** tests for a native query code and returns the token if matched */
function query (code: string, language: Language): Token|false {
  const names = inputs
    .filter(x => x.value < 0)
    .map(x => x.names[language].replace(/\?/, '\\?'))
    .join('|')
  const regex = (language === 'Pascal') ? new RegExp(`^(${names})\\b`, 'i') : new RegExp(`^(${names})\\b`)
  const good = code.match(regex)
  const bad = code.match(/^(\?[#a-zA-Z0-9]*)\b/)
  if (good) {
    return new Token('query', null, true, good[0], language)
  }
  if (bad) {
    return new Token('query', null, false, bad[0], language)
  }
  return false
}

/** tests for a native turtle command (identifier) and returns the token if matched */
function command (code: string, language: Language): Token|false {
  const names = commands
    .filter(x => x.names[language])
    .map(x => x.names[language])
    .join('|')
  const regex = (language === 'Python')
    // pretend "bool" and "range" are also commands in Python (these should be added later)
    ? new RegExp(`^(${names}|bool|range)\\b`)
    : ((language === 'Pascal') ? new RegExp(`^(${names})\\b`, 'i') : new RegExp(`^(${names})\\b`))
  const test = code.match(regex)
  return test ? new Token('identifier', 'command', true, test[0], language) : false
}

/** tests for a built-in turtle variable (identifier) and returns the token if matched */
function turtle (code: string, language: Language): Token|false {
  const tests = {
    BASIC: /^(turt[xydatc]%)/,
    C: /^(turt[xydatc])\b/,
    Pascal: /^(turt[xydatc])\b/i,
    Python: /^(turt[xydatc])\b/,
    TypeScript: /^(turt[xydatc])\b/
  }
  const test = code.match(tests[language])
  return test ? new Token('identifier', 'turtle', true, test[0], language) : false
}

/** tests for a native colour constant (identifier) and returns the token if matched */
function colour (code: string, language: Language): Token|false {
  const names = colours
    .map(x => x.names[language])
    .join('|')
  const regex = (language === 'Pascal') ? new RegExp(`^(${names})\\b`, 'i') : new RegExp(`^(${names})\\b`)
  const test = code.match(regex)
  return test ? new Token('identifier', 'colour', true, test[0], language) : false
}

/** tests for a custom command and returns the token if matched */
function custom (code: string, language: Language): Token|false {
  if (language !== 'BASIC') return false // BASIC only
  const test = code.match(/^((PROC|FN)[_a-zA-Z0-9]+[%|$]?)/)
  return test ? new Token('identifier', 'custom', true, test[0], language) : false
}

/** tests for a custom variable or constant and returns the token if matched */
function variable (code: string, language: Language): Token|false {
  if (language !== 'BASIC') return false // BASIC only
  const test = code.match(/^([_a-zA-Z][_a-zA-Z0-9]*[%|$]?)/)
  return test ? new Token('identifier', 'variable', true, test[0], language) : false
}

/** tests for any other identifier and returns the token if matched */
function identifier (code: string, language: Language): Token|false {
  const test = code.match(/^([_a-zA-Z][_a-zA-Z0-9]*)\b/)
  return test ? new Token('identifier', null, true, test[0], language) : false
}

/** returns an illegal token (for use if none of the above matched) */
function illegal (code: string, language: Language): Token {
  return new Token('illegal', null, false, code.split(/\b/)[0], language)
}
