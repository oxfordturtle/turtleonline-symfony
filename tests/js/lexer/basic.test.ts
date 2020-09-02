/**
 * Tests for the Turtle BASIC lexical analysis function.
 */
import lexify from '../../../app/js/lexer/lexify'
import { PCode } from '../../../app/js/constants/pcodes'

test('Lexer: BASIC: Errors', function () {
  // single quoted strings
  expect(() => {
    lexify('\'single quoted string\'', 'BASIC')
  }).toThrow('Strings in Turtle BASIC use double quotes, not single quotes. ("\'single quoted string\'", line 1.1)')

  // double quoted strings
  expect(() => {
    lexify('"this is an unterminated string', 'BASIC')
  }).toThrow('Unterminated string. ("\"this is an unterminated string", line 1.1)')

  // binary integers
  expect(() => {
    lexify('0b0', 'BASIC')
  }).toThrow('Binary numbers in Turtle BASIC begin with "%". ("0b0", line 1.1)')

  // octal integers
  expect(() => {
    lexify('0o0', 'BASIC')
  }).toThrow('Turtle BASIC does not support octal numbers. ("0o0", line 1.1)')

  // decimal integers
  expect(() => {
    lexify('1.2', 'BASIC')
  }).toThrow('The Turtle System does not support real numbers. ("1.2", line 1.1)')

  // hexadecimal integers
  expect(() => {
    lexify('0x0', 'BASIC')
  }).toThrow('Hexadecimal numbers in Turtle BASIC begin with "&". ("0x0", line 1.1)')
  expect(() => {
    lexify('$0', 'BASIC')
  }).toThrow('Hexadecimal numbers in Turtle BASIC begin with "&". ("$0", line 1.1)')

  // keycodes
  expect(() => {
    lexify('\\bookspace', 'BASIC')
  }).toThrow('Unrecognised keycode constant. ("\\bookspace", line 1.1)')

  // queries
  expect(() => {
    lexify('?KEYBOOFER', 'BASIC')
  }).toThrow('Unrecognised input query. ("?KEYBOOFER", line 1.1)')

  // illegal characters
  expect(() => {
    lexify('!', 'BASIC')
  }).toThrow('Illegal character in this context. ("!", line 1.1)')
})

test('Lexer: BASIC: Comments', function () {
  const lexemes = lexify('REM this is a comment', 'BASIC')
  expect(lexemes.length).toBe(1)
  expect(lexemes[0].type).toBe('comment')
  expect(lexemes[0].content).toBe('REM this is a comment')
  expect(lexemes[0].value).toBe('this is a comment')
})

test('Lexer: BASIC: Keywords', function () {
  const code = 'IF ELSE FOR REPEAT WHILE DEF LOCAL PRIVATE RETURN CONST DIM END ENDPROC THEN ENDIF TO STEP NEXT UNTIL ENDWHILE'
  const keywords = code.split(' ')
  const lexemes = lexify(code, 'BASIC')
  expect(lexemes.length).toBe(keywords.length)
  for (let index = 0; index < keywords.length; index += 1) {
    expect(lexemes[index].type).toBe('keyword')
    expect(lexemes[index].content).toBe(keywords[index])
  }
})

test('Lexer: BASIC: Operators', function () {
  const operators = {
    '+': PCode.plus,
    '-': PCode.subt,
    '*': PCode.mult,
    '/': PCode.divr,
    'DIV': PCode.div,
    'MOD': PCode.mod,
    '=': PCode.eqal,
    '<>': PCode.noeq,
    '<=': PCode.lseq,
    '>=': PCode.mreq,
    '<': PCode.less,
    '>': PCode.more,
    'NOT': PCode.not,
    'AND': PCode.and,
    'OR': PCode.or,
    'EOR': PCode.xor
  }
  for (const operator of Object.keys(operators)) {
    const lexemes = lexify(operator, 'BASIC')
    expect(lexemes.length).toBe(1)
    expect(lexemes[0].type).toBe('operator')
    expect(lexemes[0].content).toBe(operator)
    expect(lexemes[0].value).toBe(operators[operator])
  }
})

test('Lexer: BASIC: Delimiters', function () {
  const code = '( ) , :'
  const delimiters = code.split(' ')
  const lexemes = lexify(code, 'BASIC')
  for (let index = 0; index < delimiters.length; index += 1) {
    expect(lexemes[index].type).toBe('delimiter')
    expect(lexemes[index].content).toBe(delimiters[index])
  }
})

test('Lexer: BASIC: Strings', function () {
  let value = "double quoted string"
  let string = '"double quoted string"'
  let lexemes = lexify(string, 'BASIC')
  expect(lexemes.length).toBe(1)
  expect(lexemes[0].type).toBe('string')
  expect(lexemes[0].content).toBe(string)
  expect(lexemes[0].value).toBe(value)

  value = 'double "quoted" string'
  string = '"double ""quoted"" string"'
  lexemes = lexify(string, 'BASIC')
  expect(lexemes.length).toBe(1)
  expect(lexemes[0].type).toBe('string')
  expect(lexemes[0].content).toBe(string)
  expect(lexemes[0].value).toBe(value)
})

test('Lexer: BASIC: Booleans', function () {
  const lexemes1 = lexify('TRUE', 'BASIC')
  expect(lexemes1.length).toBe(1)
  expect(lexemes1[0].type).toBe('boolean')
  expect(lexemes1[0].content).toBe('TRUE')
  expect(lexemes1[0].value).toBe(-1)

  const lexemes2 = lexify('FALSE', 'BASIC')
  expect(lexemes2.length).toBe(1)
  expect(lexemes2[0].type).toBe('boolean')
  expect(lexemes2[0].content).toBe('FALSE')
  expect(lexemes2[0].value).toBe(0)
})

test('Lexer: BASIC: Integers', function () {
  // binary numbers
  const binary = lexify('%10', 'BASIC')
  expect(binary.length).toBe(1)
  expect(binary[0].type).toBe('integer')
  expect(binary[0].subtype).toBe('binary')
  expect(binary[0].value).toBe(2)

  // decimal numbers
  const decimal = lexify('10', 'BASIC')
  expect(decimal.length).toBe(1)
  expect(decimal[0].type).toBe('integer')
  expect(decimal[0].subtype).toBe('decimal')
  expect(decimal[0].value).toBe(10)

  // hexadecimal numbers
  const hexadecimal = lexify('&10', 'BASIC')
  expect(hexadecimal.length).toBe(1)
  expect(hexadecimal[0].type).toBe('integer')
  expect(hexadecimal[0].subtype).toBe('hexadecimal')
  expect(hexadecimal[0].value).toBe(16)
})

test('Lexer: BASIC: Keycodes', function () {
  const keycodes = {
    '\\keybuffer': 0,
    '\\backspace': 8,
    '\\tab': 9,
    '\\enter': 13,
    '\\return': 13,
    '\\shift': 16,
    '\\ctrl': 17,
    '\\alt': 18,
    '\\pause': 19,
    '\\capslock': 20,
    '\\escape': 27,
    '\\space': 32,
    '\\pgup': 33,
    '\\pgdn': 34,
    '\\end': 35,
    '\\home': 36,
    '\\left': 37,
    '\\up': 38,
    '\\right': 39,
    '\\down': 40,
    '\\insert': 45,
    '\\delete': 46,
    '\\0': 48,
    '\\1': 49,
    '\\2': 50,
    '\\3': 51,
    '\\4': 52,
    '\\5': 53,
    '\\6': 54,
    '\\7': 55,
    '\\8': 56,
    '\\9': 57,
    '\\a': 65,
    '\\b': 66,
    '\\c': 67,
    '\\d': 68,
    '\\e': 69,
    '\\f': 70,
    '\\g': 71,
    '\\h': 72,
    '\\i': 73,
    '\\j': 74,
    '\\k': 75,
    '\\l': 76,
    '\\m': 77,
    '\\n': 78,
    '\\o': 79,
    '\\p': 80,
    '\\q': 81,
    '\\r': 82,
    '\\s': 83,
    '\\t': 84,
    '\\u': 85,
    '\\v': 86,
    '\\w': 87,
    '\\x': 88,
    '\\y': 89,
    '\\z': 90,
    '\\lwin': 91,
    '\\rwin': 92,
    '\\#0': 96,
    '\\#1': 97,
    '\\#2': 98,
    '\\#3': 99,
    '\\#4': 100,
    '\\#5': 101,
    '\\#6': 102,
    '\\#7': 103,
    '\\#8': 104,
    '\\#9': 105,
    '\\multiply': 106,
    '\\add': 107,
    '\\subtract': 109,
    '\\decimal': 110,
    '\\divide': 111,
    '\\f1': 112,
    '\\f2': 113,
    '\\f3': 114,
    '\\f4': 115,
    '\\f5': 116,
    '\\f6': 117,
    '\\f7': 118,
    '\\f8': 119,
    '\\f9': 120,
    '\\f10': 121,
    '\\f11': 122,
    '\\f12': 123,
    '\\numlock': 144,
    '\\scrolllock': 145,
    '\\semicolon': 186,
    '\\equals': 187,
    '\\comma': 188,
    '\\dash': 189,
    '\\fullstop': 190,
    '\\forwardslash': 191,
    '\\singlequote': 192,
    '\\openbracket': 219,
    '\\backslash': 220,
    '\\closebracket': 221,
    '\\hash': 222,
    '\\backtick': 223
  }
  for (const keycode of Object.keys(keycodes)) {
    const lexemes = lexify(keycode, 'BASIC')
    expect(lexemes.length).toBe(1)
    expect(lexemes[0].type).toBe('keycode')
    expect(lexemes[0].value).toBe(keycodes[keycode])
  }
})

test('Lexer: BASIC: Queries', function () {
  const queries = {
    '?KSHIFT': -10,
    '?KEY': -9,
    '?MOUSEY': -8,
    '?MOUSEX': -7,
    '?CLICKY': -6,
    '?CLICKX': -5,
    '?CLICK': -4,
    '?MMOUSE': -3,
    '?RMOUSE': -2,
    '?LMOUSE': -1
  }
  for (const query of Object.keys(queries)) {
    const lexemes = lexify(query, 'BASIC')
    expect(lexemes.length).toBe(1)
    expect(lexemes[0].type).toBe('query')
    expect(lexemes[0].value).toBe(queries[query])
  }
})

test('Lexer: BASIC: Identifiers', function () {
  const code = 'BLOT COLOUR turtx% turty% turtd% turta% turtt% turtc% RED GREEN BLUE foo PROCbar FNbaz'
  const identifiers = code.split(' ')
  const lexemes = lexify(code, 'BASIC')

  expect(lexemes.length).toBe(identifiers.length)

  for (let index = 0; index < identifiers.length; index += 1) {
    expect(lexemes[index].type).toBe('identifier')
    expect(lexemes[index].content).toBe(identifiers[index])
    if (index < 2) {
      expect(lexemes[index].subtype).toBe('command')
    } else if (index < 8) {
      expect(lexemes[index].subtype).toBe('turtle')
      expect(lexemes[index].value).toBe(index - 1)
    } else if (index < 11) {
      expect(lexemes[index].subtype).toBe('colour')
      switch (identifiers[index]) {
        case 'RED':
          expect(lexemes[index].value).toBe(0xFF0000)
          break
        case 'GREEN':
          expect(lexemes[index].value).toBe(0x228B22)
          break
        case 'BLUE':
          expect(lexemes[index].value).toBe(0x0000FF)
          break
      }
    } else if (index === 11) {
      expect(lexemes[index].subtype).toBe('variable')
    } else if (index === 12) {
      expect(lexemes[index].subtype).toBe('custom')
    } else if (index === 13) {
      expect(lexemes[index].subtype).toBe('custom')
    }
  }
})
