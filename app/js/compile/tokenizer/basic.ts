/*
 * tokenizer for Turtle BASIC
 */
import { colours } from '../../definitions/colours'
import { commands } from '../../definitions/commands'
import { Token } from './token'

// exported tokenizer function
export default function (code: string): Token[] {
  const tokens = []
  while (code.length > 0) {
    const token = linebreak(code) ||
      spaces(code) ||
      comment(code) ||
      string(code) ||
      operator(code) ||
      delimiter(code) ||
      boolean(code) ||
      binary(code) ||
      hexadecimal(code) ||
      decimal(code) ||
      keyword(code) ||
      variableClash(code) ||
      command(code) ||
      custom(code) ||
      turtle(code) ||
      colour(code) ||
      variable(code) ||
      keycode(code) ||
      query(code) ||
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
  const start = code.match(/^REM\b/)
  if (start) return { type: 'comment', content: code.split('\n')[0] }
  return false
}

// string literals
function string (code: string): Token|false {
  // awkward cases
  if (code.match(/^""""/)) return { type: 'string', content: '""""' }
  if (code.match(/^""[^"]/)) return { type: 'string', content: '""' }
  // normal cases
  const start = code[0] === '"'
  const end = code.match(/[^"](")([^"]|$)/)
  if (start && end) return { type: 'string', content: code.slice(0, end.index + 2) }
  if (start) return { type: 'unterminated-string', content: code.split('\n')[0] }
  return false
}

// operators
function operator (code: string): Token|false {
  const test = code.match(/^(\+|-|\*|\/|DIV\b|MOD\b|=|<>|<=|>=|<|>|NOT\b|AND\b|OR\b|EOR\b)/)
  return test ? { type: 'operator', content: test[0] } : false
}

// punctuation
function delimiter (code: string): Token|false {
  const test = code.match(/^(\(|\)|,|:)/)
  return test ? { type: 'delimiter', content: test[0] } : false
}

// boolean literals
function boolean (code: string): Token|false {
  const test = code.match(/^(TRUE|FALSE)\b/)
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

function hexadecimal (code: string): Token|false {
  const bad = code.match(/^((\$|(0x))[A-Fa-f0-9]+)\b/)
  const good = code.match(/^((&|#)[A-Fa-f0-9]+)\b/)
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
  const test = code.match(/^(CONST|DEF|DIM|ELSE|END|ENDIF|ENDPROC|ENDWHILE|FOR|IF|LOCAL|NEXT|PRIVATE|REPEAT|RETURN|STEP|THEN|TO|UNTIL|WHILE)\b/)
  return test ? { type: 'keyword', content: test[0] } : false
}

// variable names that would clash with native turtle commands
function variableClash (code: string): Token|false {
  const test = code.match(/^((ABS|ACS|ANGLES|ANTILOG|ASC|ASN|ATN|BACK|BLANK|BLOT|BOOLINT|BOX|CANVAS|CIRCLE|COLOU?R|CONSOLE|COS|CURSOR|DEC||DETECT|DIRECTION|DIVMULT|DRAWXY|DUMP|ELLBLOT|ELLIPSE|EXP|FILL|FORGET|FORWARD|HEAPRESET||HOME|HYPOT|INC|INSTR|KEYBUFFER|KEYECHO|KEYSTATUS|LEFT|LEN|LN|LOG10|MAX|MAXINT|MIN|MIXCOLS|MOVEXY|NEWTURTLE|NOUPDATE|OLDTURTLE|OUTPUT|PAUSE|PENDOWN|PENUP|PI|PIXCOL|PIXSET|POLYGON|POLYLINE|POWER|PRINT|QVAL|RECOLOU?R|REMEMBER|RESET|RESOLUTION|RGB|RIGHT|RND|RNDCOL|ROOT|SETX|SETXY|SETY|SIGN|SIN|SQR|TAN|THICKNESS|TIME|TIMESET|TRACE|TURNXY|UPDATE|VAL|VALDEF|WATCH|WRITE|WRITELN)[$%])/)
  return test ? { type: 'variable', content: test[0] } : false
}

// native turtle commands
function command (code: string): Token|false {
  const names = commands
    .reduce((x, y) => y.names.BASIC ? `${x}|${y.names.BASIC}\\b` : x, '')
    .slice(1)
  const regex = new RegExp(new RegExp(`^(${names.replace(/\$/g, '\\$')})`))
  const test = code.match(regex)
  return test ? { type: 'command', content: test[0] } : false
}

// custom procedure or function names
function custom (code: string): Token|false {
  const test = code.match(/^((PROC|FN)[_a-zA-Z0-9]+[%|$]?)/)
  return test ? { type: 'custom', content: test[0] } : false
}

// built-in turtle property variables
function turtle (code: string): Token|false {
  const test = code.match(/^(turt[xydatc]%)/)
  return test ? { type: 'turtle', content: test[0] } : false
}

// native colour constants
function colour (code: string): Token|false {
  const names = colours
    .reduce((x, y) => `${x}|${y.names.BASIC}`, '')
    .slice(1)
  const regex = new RegExp(new RegExp(`^(${names})\\b`))
  const test = code.match(regex)
  return test ? { type: 'colour', content: test[0] } : false
}

// variable names
function variable (code: string): Token|false {
  const test = code.match(/^([_a-zA-Z][_a-zA-Z0-9]*[%|$]?)/)
  return test ? { type: 'variable', content: test[0] } : false
}

// native keycode constants
function keycode (code: string): Token|false {
  const test = code.match(/^(\\[#A-Z0-9]+)/)
  return test ? { type: 'keycode', content: test[0] } : false
}

// native query codes
function query (code: string): Token|false {
  const test = code.match(/^(\?[A-Z]+)\b/)
  return test ? { type: 'query', content: test[0] } : false
}

// illegal (anything that isn't one of the above)
function illegal (code: string): Token {
  return { type: 'illegal', content: code.split(/\b/)[0] }
}
