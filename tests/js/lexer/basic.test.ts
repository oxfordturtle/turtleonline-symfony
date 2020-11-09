/**
 * Tests for the Turtle BASIC lexical analysis function.
 */
import lexify from '../../../app/js/lexer/lexify'
import { PCode } from '../../../app/js/constants/pcodes'
import { BooleanLexeme, CommentLexeme, IdentifierLexeme, IntegerLexeme, KeycodeLexeme, Operator, OperatorLexeme, QueryLexeme, StringLexeme } from '../../../app/js/lexer/lexeme'

test('Lexer: BASIC: Errors', function () {
  // unterminated strings
  expect(() => {
    lexify('"this is an unterminated string', 'BASIC')
  }).toThrow('Unterminated string. ("\"this is an unterminated string", line 1, index 1)')

  // real numbers
  expect(() => {
    lexify('1.2', 'BASIC')
  }).toThrow('The Turtle System does not support real numbers. ("1.2", line 1, index 1)')

  // keycodes
  expect(() => {
    lexify('\\bookspace', 'BASIC')
  }).toThrow('Unrecognised input keycode. ("\\bookspace", line 1, index 1)')

  // queries
  expect(() => {
    lexify('?KEYBOOFER', 'BASIC')
  }).toThrow('Unrecognised input query. ("?KEYBOOFER", line 1, index 1)')

  // illegal characters
  expect(() => {
    lexify('!', 'BASIC')
  }).toThrow('Illegal character in this context. ("!", line 1, index 1)')
})

test('Lexer: BASIC: Comments', function () {
  const lexemes = lexify('REM this is a comment', 'BASIC')
  expect(lexemes.length).toBe(2)
  expect(lexemes[0].type).toBe('comment')
  expect(lexemes[0].content).toBe('REM this is a comment')
  expect((lexemes[0] as CommentLexeme).value).toBe('this is a comment')
  expect(lexemes[1].type).toBe('newline')
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
  const operators: Record<string, Operator> = {
    '+': 'plus',
    '-': 'subt',
    '*': 'mult',
    '/': 'divr',
    'DIV': 'div',
    'MOD': 'mod',
    '=': 'eqal',
    '<>': 'noeq',
    '<=': 'lseq',
    '>=': 'mreq',
    '<': 'less',
    '>': 'more',
    'NOT': 'not',
    'AND': 'and',
    'OR': 'or',
    'EOR': 'xor'
  }
  for (const operator of Object.keys(operators)) {
    const lexemes = lexify(operator, 'BASIC')
    expect(lexemes.length).toBe(1)
    expect(lexemes[0].type).toBe('operator')
    expect(lexemes[0].content).toBe(operator)
    expect((lexemes[0] as OperatorLexeme).subtype).toBe(operators[operator])
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
  expect(lexemes[0].type).toBe('literal')
  expect((lexemes[0] as StringLexeme).subtype).toBe('string')
  expect(lexemes[0].content).toBe(string)
  expect((lexemes[0] as StringLexeme).value).toBe(value)

  value = 'double "quoted" string'
  string = '"double ""quoted"" string"'
  lexemes = lexify(string, 'BASIC')
  expect(lexemes.length).toBe(1)
  expect(lexemes[0].type).toBe('literal')
  expect((lexemes[0] as StringLexeme).subtype).toBe('string')
  expect(lexemes[0].content).toBe(string)
  expect((lexemes[0] as StringLexeme).value).toBe(value)
})

test('Lexer: BASIC: Booleans', function () {
  const lexemes1 = lexify('TRUE', 'BASIC')
  expect(lexemes1.length).toBe(1)
  expect(lexemes1[0].type).toBe('literal')
  expect((lexemes1[0] as BooleanLexeme).subtype).toBe('boolean')
  expect(lexemes1[0].content).toBe('TRUE')
  expect((lexemes1[0] as BooleanLexeme).value).toBe(-1)

  const lexemes2 = lexify('FALSE', 'BASIC')
  expect(lexemes2.length).toBe(1)
  expect(lexemes2[0].type).toBe('literal')
  expect((lexemes2[0] as BooleanLexeme).subtype).toBe('boolean')
  expect(lexemes2[0].content).toBe('FALSE')
  expect((lexemes2[0] as BooleanLexeme).value).toBe(0)
})

test('Lexer: BASIC: Integers', function () {
  // binary numbers
  const binary = lexify('%10', 'BASIC')
  expect(binary.length).toBe(1)
  expect(binary[0].type).toBe('literal')
  expect((binary[0] as IntegerLexeme).subtype).toBe('integer')
  expect((binary[0] as IntegerLexeme).radix).toBe(2)
  expect((binary[0] as IntegerLexeme).value).toBe(2)

  // decimal numbers
  const decimal = lexify('10', 'BASIC')
  expect(decimal.length).toBe(1)
  expect(decimal[0].type).toBe('literal')
  expect((decimal[0] as IntegerLexeme).subtype).toBe('integer')
  expect((decimal[0] as IntegerLexeme).radix).toBe(10)
  expect((decimal[0] as IntegerLexeme).value).toBe(10)

  // hexadecimal numbers
  const hexadecimal = lexify('&10', 'BASIC')
  expect(hexadecimal.length).toBe(1)
  expect(hexadecimal[0].type).toBe('literal')
  expect((hexadecimal[0] as IntegerLexeme).subtype).toBe('integer')
  expect((hexadecimal[0] as IntegerLexeme).radix).toBe(16)
  expect((hexadecimal[0] as IntegerLexeme).value).toBe(16)
})

test('Lexer: BASIC: Keycodes', function () {
  const keycodes = [
    '\\keybuffer',
    '\\backspace',
    '\\tab',
    '\\enter',
    '\\return',
    '\\shift',
    '\\ctrl',
    '\\alt',
    '\\pause',
    '\\capslock',
    '\\escape',
    '\\space',
    '\\pgup',
    '\\pgdn',
    '\\end',
    '\\home',
    '\\left',
    '\\up',
    '\\right',
    '\\down',
    '\\insert',
    '\\delete',
    '\\0',
    '\\1',
    '\\2',
    '\\3',
    '\\4',
    '\\5',
    '\\6',
    '\\7',
    '\\8',
    '\\9',
    '\\a',
    '\\b',
    '\\c',
    '\\d',
    '\\e',
    '\\f',
    '\\g',
    '\\h',
    '\\i',
    '\\j',
    '\\k',
    '\\l',
    '\\m',
    '\\n',
    '\\o',
    '\\p',
    '\\q',
    '\\r',
    '\\s',
    '\\t',
    '\\u',
    '\\v',
    '\\w',
    '\\x',
    '\\y',
    '\\z',
    '\\lwin',
    '\\rwin',
    '\\#0',
    '\\#1',
    '\\#2',
    '\\#3',
    '\\#4',
    '\\#5',
    '\\#6',
    '\\#7',
    '\\#8',
    '\\#9',
    '\\multiply',
    '\\add',
    '\\subtract',
    '\\decimal',
    '\\divide',
    '\\f1',
    '\\f2',
    '\\f3',
    '\\f4',
    '\\f5',
    '\\f6',
    '\\f7',
    '\\f8',
    '\\f9',
    '\\f10',
    '\\f11',
    '\\f12',
    '\\numlock',
    '\\scrolllock',
    '\\semicolon',
    '\\equals',
    '\\comma',
    '\\dash',
    '\\fullstop',
    '\\forwardslash',
    '\\singlequote',
    '\\openbracket',
    '\\backslash',
    '\\closebracket',
    '\\hash',
    '\\backtick'
  ]
  for (const keycode of keycodes) {
    const lexemes = lexify(keycode, 'BASIC')
    expect(lexemes.length).toBe(1)
    expect(lexemes[0].type).toBe('input')
    expect((lexemes[0] as KeycodeLexeme).subtype).toBe('keycode')
  }
})

test('Lexer: BASIC: Queries', function () {
  const queries = [
    '?KSHIFT',
    '?KEY',
    '?MOUSEY',
    '?MOUSEX',
    '?CLICKY',
    '?CLICKX',
    '?CLICK',
    '?MMOUSE',
    '?RMOUSE',
    '?LMOUSE'
  ]
  for (const query of queries) {
    const lexemes = lexify(query, 'BASIC')
    expect(lexemes.length).toBe(1)
    expect(lexemes[0].type).toBe('input')
    expect((lexemes[0] as QueryLexeme).subtype).toBe('query')
  }
})

test('Lexer: BASIC: Identifiers', function () {
  const code = 'BLOT COLOUR turtx% turty% turtd% turta% turtt% turtc% RED GREEN BLUE foo% bar$ bar$64 PROCproc FNfunc'
  const identifiers = code.split(' ')
  const lexemes = lexify(code, 'BASIC')

  expect(lexemes.length).toBe(identifiers.length)

  for (let index = 0; index < identifiers.length; index += 1) {
    expect(lexemes[index].type).toBe('identifier')
    expect(lexemes[index].content).toBe(identifiers[index])
    if (index < 2) {
      expect((lexemes[index] as IdentifierLexeme).subtype).toBe('identifier')
    } else if (index < 8) {
      expect((lexemes[index] as IdentifierLexeme).subtype).toBe('turtle')
    }
  }
})
