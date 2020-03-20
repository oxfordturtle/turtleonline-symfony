/*
 * tokenizer for Turtle Pascal
 */
import colours from '../../constants/colours.js'
import commands from '../../constants/commands.js'
import { Token } from './token.js'

// exported tokenizer function
export default function (code: string): Token[] {
  const tokens = []
  while (code.length > 0) {
    const token = linebreak(code) ||
      spaces(code) ||
      comment(code) ||
      operator(code) ||
      delimiter(code) ||
      string(code) ||
      boolean(code) ||
      binary(code) ||
      octal(code) ||
      hexadecimal(code) ||
      decimal(code) ||
      keyword(code) ||
      type(code) ||
      command(code) ||
      turtle(code) ||
      colour(code) ||
      keycode(code) ||
      query(code) ||
      identifier(code) ||
      illegal(code)
    tokens.push(token)
    code = code.slice(token.content.length)
  }
  return tokens
}

// whitespace
function linebreak (code: string): Token|false {
  const test = (code[0] === '\n')
  return test ? { type: 'linebreak', content: '\n' } : false
}

function spaces (code: string): Token|false {
  const test = code.match(/^( +)/)
  return test ? { type: 'spaces', content: test[0] } : false
}

// comments
function comment (code: string): Token|false {
  const start = code[0] === '{'
  const end = code.match(/}/)
  if (start && end) return { type: 'comment', content: code.slice(0, end.index + 1) }
  if (start) return { type: 'unterminated-comment', content: code.split('\n')[0] }
  return false
}

// operators
function operator (code: string): Token|false {
  const test = code.match(/^(\+|-|\*|\/|div\b|mod\b|=|<>|<=|>=|<|>|:=|not\b|and\b|or\b|xor\b)/i)
  return test ? { type: 'operator', content: test[0] } : false
}

// punctuation
function delimiter (code: string): Token|false {
  const test = code.match(/^(\(|\)|\[|\]|,|:|;|\.\.|\.)/)
  return test ? { type: 'delimiter', content: test[0] } : false
}

// string literals
function string (code: string): Token|false {
  // awkward cases
  if (code.match(/^''''/)) return { type: 'string', content: '\'\'\'\'' }
  if (code.match(/^''[^']/)) return { type: 'string', content: '\'\'' }
  if (code.match(/^""""/)) return { type: 'string', content: '""""' }
  if (code.match(/^""[^"]/)) return { type: 'string', content: '""' }
  // normal cases
  const start1 = code[0] === '\''
  const start2 = code[0] === '"'
  const end1 = code.match(/[^'](')([^']|$)/)
  const end2 = code.match(/[^"](")([^"]|$)/)
  if (start1 && end1) return { type: 'string', content: code.slice(0, end1.index + 2) }
  if (start1) return { type: 'unterminated-string', content: code.split('\n')[0] }
  if (start2 && end2) return { type: 'string', content: code.slice(0, end2.index + 2) }
  if (start2) return { type: 'unterminated-string', content: code.split('\n')[0] }
  return false
}

// boolean literals
function boolean (code: string): Token|false {
  const test = code.match(/^(true|false)\b/i)
  return test ? { type: 'boolean', content: test[0] } : false
}

// integer literals
function binary (code: string): Token|false {
  const good = code.match(/^(%[01]+)\b/)
  const bad = code.match(/^(0b[01]+)\b/)
  if (good) return { type: 'binary', content: good[0] }
  if (bad) return { type: 'bad-binary', content: bad[0] }
  return false
}

function octal (code: string): Token|false {
  const good = code.match(/^(&[0-7]+)\b/)
  const bad = code.match(/^(0o[0-7]+)\b/)
  if (good) return { type: 'octal', content: good[0] }
  if (bad) return { type: 'bad-octal', content: bad[0] }
  return false
}

function hexadecimal (code: string): Token|false {
  const bad = code.match(/^((&|(0x))[A-Fa-f0-9]+)\b/)
  const good = code.match(/^((\$|#)[A-Fa-f0-9]+)\b/)
  if (bad) return { type: 'bad-hexadecimal', content: bad[0] }
  if (good) return { type: 'hexadecimal', content: good[0] }
  return false
}

function decimal (code: string): Token|false {
  const bad = code.match(/^(\d+\.\d+)/)
  const good = code.match(/^(\d+)\b/)
  if (bad) return { type: 'bad-decimal', content: bad[0] }
  if (good) return { type: 'decimal', content: good[0] }
  return false
}

// keywords
function keyword (code: string): Token|false {
  const test = code.match(/^(begin|const|do|downto|else|end|for|function|if|of|procedure|program|repeat|result|then|to|until|var|while)\b/i)
  return test ? { type: 'keyword', content: test[0] } : false
}

// type definitions
function type (code: string): Token|false {
  const test = code.match(/^(array|boolean|char|integer|string)\b/i)
  return test ? { type: 'type', content: test[0] } : false
}

// native turtle commands
function command (code: string): Token|false {
  const names = commands
    .reduce((x, y) => y.names.Pascal ? `${x}|${y.names.Pascal}` : x, '')
    .slice(1)
  const regex = new RegExp(new RegExp(`^(${names})\\b`, 'i'))
  const test = code.match(regex)
  return test ? { type: 'command', content: test[0] } : false
}

// built-in turtle property variables
function turtle (code: string): Token|false {
  const test = code.match(/^(turt[xydatc])\b/i)
  return test ? { type: 'turtle', content: test[0] } : false
}

// native colour constants
function colour (code: string): Token|false {
  const names = colours
    .reduce((x, y) => `${x}|${y.names.Pascal}`, '')
    .slice(1)
  const regex = new RegExp(new RegExp(`^(${names})\\b`))
  const test = code.match(regex)
  return test ? { type: 'colour', content: test[0] } : false
}

// native keycode constants
function keycode (code: string): Token|false {
  const test = code.match(/^(\\[#a-z0-9]+)/i)
  return test ? { type: 'keycode', content: test[0] } : false
}

// native query codes
function query (code: string): Token|false {
  const test = code.match(/^(\?[a-z]+)\b/i)
  return test ? { type: 'query', content: test[0] } : false
}

// identifiers (i.e. constant, variable, or subroutine names)
function identifier (code: string): Token|false {
  const test = code.match(/^([_a-zA-Z][_a-zA-Z0-9]*)\b/)
  return test ? { type: 'identifier', content: test[0] } : false
}

// illegal (anything that isn't one of the above)
function illegal (code: string): Token {
  return { type: 'illegal', content: code.split(/\b/)[0] }
}
