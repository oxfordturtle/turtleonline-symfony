/**
 * Tests for the Turtle Python lexical analysis function.
 */
import lexify from '../../../app/js/lexer/lexify'
import { BooleanLexeme, CommentLexeme, IdentifierLexeme, IntegerLexeme, InputcodeLexeme, Operator, OperatorLexeme, QuerycodeLexeme, StringLexeme } from '../../../app/js/lexer/lexeme'

test('Lexer: Python: Errors', function () {
  // single quoted strings
  expect(() => {
    lexify('\'blah', 'Python')
  }).toThrow('Unterminated string. ("\'blah", line 1, index 1)')

  // double quoted strings
  expect(() => {
    lexify('"blah', 'Python')
  }).toThrow('Unterminated string. ("\"blah", line 1, index 1)')

  // real numbers
  expect(() => {
    lexify('1.2', 'Python')
  }).toThrow('The Turtle System does not support real numbers. ("1.2", line 1, index 1)')

  // keycodes
  expect(() => {
    lexify('\\bookspace', 'Python')
  }).toThrow('Unrecognised input keycode. ("\\bookspace", line 1, index 1)')

  // queries
  expect(() => {
    lexify('?keyboofer', 'Python')
  }).toThrow('Unrecognised input query. ("?keyboofer", line 1, index 1)')

  // illegal characters
  expect(() => {
    lexify('!', 'Python')
  }).toThrow('Illegal character in this context. ("!", line 1, index 1)')
})

test('Lexer: Python: Comments', function () {
  const lexemes = lexify('# this is a comment', 'Python')
  expect(lexemes.length).toBe(2)
  expect(lexemes[0].type).toBe('comment')
  expect(lexemes[0].content).toBe('# this is a comment')
  expect((lexemes[0] as CommentLexeme).value).toBe('this is a comment')
  expect(lexemes[1].type).toBe('newline')
})

test('Lexer: Python: Keywords', function () {
  const code = 'if else elif for while def global nonlocal in pass return'
  const keywords = code.split(' ')
  const lexemes = lexify(code, 'Python')
  expect(lexemes.length).toBe(keywords.length)
  for (let index = 0; index < keywords.length; index += 1) {
    expect(lexemes[index].type).toBe('keyword')
    expect(lexemes[index].content).toBe(keywords[index])
  }
})

test('Lexer: Python: Operators', function () {
  const operators: Record<string, Operator|'asgn'> = {
    '+': 'plus',
    '-': 'subt',
    '*': 'mult',
    '/': 'divr',
    '//': 'div',
    '%': 'mod',
    '==': 'eqal',
    '!=': 'noeq',
    '<=': 'lseq',
    '>=': 'mreq',
    '<': 'less',
    '>': 'more',
    '=': 'asgn',
    '~': 'not',
    '&': 'and',
    '|': 'or',
    '^': 'xor',
    'not': 'not',
    'and': 'andl',
    'or': 'orl'
  }
  for (const operator of Object.keys(operators)) {
    const lexemes = lexify(operator, 'Python')
    expect(lexemes.length).toBe(1)
    expect(lexemes[0].type).toBe('operator')
    expect(lexemes[0].content).toBe(operator)
    expect((lexemes[0] as OperatorLexeme).subtype).toBe(operators[operator])
  }
})

test('Lexer: Python: Delimiters', function () {
  const code = '( ) [ ] , : ; ->'
  const delimiters = code.split(' ')
  const lexemes = lexify(code, 'Python')
  for (let index = 0; index < delimiters.length; index += 1) {
    expect(lexemes[index].type).toBe('delimiter')
    expect(lexemes[index].content).toBe(delimiters[index])
  }
})

test('Lexer: Python: Strings', function () {
  let value = 'single quoted string'
  let string = "'single quoted string'"
  let lexemes = lexify(string, 'Python')
  expect(lexemes.length).toBe(1)
  expect(lexemes[0].type).toBe('literal')
  expect((lexemes[0] as StringLexeme).subtype).toBe('string')
  expect(lexemes[0].content).toBe(string)
  expect((lexemes[0] as StringLexeme).value).toBe(value)

  value = "single 'quoted' string"
  string = "'single \\'quoted\\' string'"
  lexemes = lexify(string, 'Python')
  expect(lexemes.length).toBe(1)
  expect(lexemes[0].type).toBe('literal')
  expect((lexemes[0] as StringLexeme).subtype).toBe('string')
  expect(lexemes[0].content).toBe(string)
  expect((lexemes[0] as StringLexeme).value).toBe(value)

  value = "double quoted string"
  string = '"double quoted string"'
  lexemes = lexify(string, 'Python')
  expect(lexemes.length).toBe(1)
  expect(lexemes[0].type).toBe('literal')
  expect((lexemes[0] as StringLexeme).subtype).toBe('string')
  expect(lexemes[0].content).toBe(string)
  expect((lexemes[0] as StringLexeme).value).toBe(value)

  value = 'double "quoted" string'
  string = '"double \\"quoted\\" string"'
  lexemes = lexify(string, 'Python')
  expect(lexemes.length).toBe(1)
  expect(lexemes[0].type).toBe('literal')
  expect((lexemes[0] as StringLexeme).subtype).toBe('string')
  expect(lexemes[0].content).toBe(string)
  expect((lexemes[0] as StringLexeme).value).toBe(value)
})

test('Lexer: Python: Booleans', function () {
  const lexemes1 = lexify('True', 'Python')
  expect(lexemes1.length).toBe(1)
  expect(lexemes1[0].type).toBe('literal')
  expect((lexemes1[0] as BooleanLexeme).subtype).toBe('boolean')
  expect(lexemes1[0].content).toBe('True')
  expect((lexemes1[0] as BooleanLexeme).value).toBe(1)

  const lexemes2 = lexify('False', 'Python')
  expect(lexemes2.length).toBe(1)
  expect(lexemes1[0].type).toBe('literal')
  expect((lexemes2[0] as BooleanLexeme).subtype).toBe('boolean')
  expect(lexemes2[0].content).toBe('False')
  expect((lexemes2[0] as BooleanLexeme).value).toBe(0)
})

test('Lexer: Python: Integers', function () {
  // binary numbers
  const binary = lexify('0b10', 'Python')
  expect(binary.length).toBe(1)
  expect(binary[0].type).toBe('literal')
  expect((binary[0] as IntegerLexeme).subtype).toBe('integer')
  expect((binary[0] as IntegerLexeme).radix).toBe(2)
  expect((binary[0] as IntegerLexeme).value).toBe(2)

  // octal numbers
  const octal = lexify('0o10', 'Python')
  expect(octal.length).toBe(1)
  expect(octal[0].type).toBe('literal')
  expect((octal[0] as IntegerLexeme).subtype).toBe('integer')
  expect((octal[0] as IntegerLexeme).radix).toBe(8)
  expect((octal[0] as IntegerLexeme).value).toBe(8)

  // decimal numbers
  const decimal = lexify('10', 'Python')
  expect(decimal.length).toBe(1)
  expect(decimal[0].type).toBe('literal')
  expect((decimal[0] as IntegerLexeme).subtype).toBe('integer')
  expect((decimal[0] as IntegerLexeme).radix).toBe(10)
  expect((decimal[0] as IntegerLexeme).value).toBe(10)

  // hexadecimal numbers
  const hexadecimal = lexify('0x10', 'Python')
  expect(hexadecimal.length).toBe(1)
  expect(hexadecimal[0].type).toBe('literal')
  expect((hexadecimal[0] as IntegerLexeme).subtype).toBe('integer')
  expect((hexadecimal[0] as IntegerLexeme).radix).toBe(16)
  expect((hexadecimal[0] as IntegerLexeme).value).toBe(16)
})

test('Lexer: Python: Keycodes', function () {
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
    const lexemes = lexify(keycode, 'Python')
    expect(lexemes.length).toBe(1)
    expect(lexemes[0].type).toBe('input')
    expect((lexemes[0] as InputcodeLexeme).subtype).toBe('keycode')
  }
})

test('Lexer: Python: Queries', function () {
  const queries = [
    '?kshift',
    '?key',
    '?mousey',
    '?mousex',
    '?clicky',
    '?clickx',
    '?click',
    '?mmouse',
    '?rmouse',
    '?lmouse'
  ]
  for (const query of queries) {
    const lexemes = lexify(query, 'Python')
    expect(lexemes.length).toBe(1)
    expect(lexemes[0].type).toBe('input')
    expect((lexemes[0] as QuerycodeLexeme).subtype).toBe('querycode')
  }
})

test('Lexer: Python: Identifiers', function () {
  const code = 'blot colour turtx turty turtd turta turtt turtc red green blue foo _bar Baz'
  const identifiers = code.split(' ')
  const lexemes = lexify(code, 'Python')

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
