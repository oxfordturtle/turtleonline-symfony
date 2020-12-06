/**
 * Tests for the Turtle Pascal lexical analysis function.
 */
import lexify from '../../../app/js/lexer/lexify'
import { BooleanLexeme, CommentLexeme, IdentifierLexeme, IntegerLexeme, KeycodeLexeme, Operator, OperatorLexeme, QueryLexeme, StringLexeme } from '../../../app/js/lexer/lexeme'

test('Lexer: Pascal: Errors', function () {
  // comments
  expect(() => {
    lexify('{blah', 'Pascal')
  }).toThrow('Unterminated comment. ("{blah", line 1, index 1)')

  // single quoted strings
  expect(() => {
    lexify('\'blah', 'Pascal')
  }).toThrow('Unterminated string. ("\'blah", line 1, index 1)')

  // double quoted strings
  expect(() => {
    lexify('"blah', 'Pascal')
  }).toThrow('Unterminated string. ("\"blah", line 1, index 1)')

  // real numbers
  expect(() => {
    lexify('1.2', 'Pascal')
  }).toThrow('The Turtle System does not support real numbers. ("1.2", line 1, index 1)')

  // keycodes
  expect(() => {
    lexify('\\bookspace', 'Pascal')
  }).toThrow('Unrecognised input keycode. ("\\bookspace", line 1, index 1)')

  // queries
  expect(() => {
    lexify('?keyboofer', 'Pascal')
  }).toThrow('Unrecognised input query. ("?keyboofer", line 1, index 1)')

  // illegal characters
  expect(() => {
    lexify('!', 'Pascal')
  }).toThrow('Illegal character in this context. ("!", line 1, index 1)')
})

test('Lexer: Pascal: Comments', function () {
  const lexemes = lexify('{this is a comment}', 'Pascal')
  expect(lexemes.length).toBe(1)
  expect(lexemes[0].type).toBe('comment')
  expect(lexemes[0].content).toBe('{this is a comment}')
  expect((lexemes[0] as CommentLexeme).value).toBe('this is a comment')
})

test('Lexer: Pascal: Keywords', function () {
  const code = 'if else for repeat while procedure function program var const array of begin end then to downto do until'
  const keywords = code.split(' ')
  const lexemes = lexify(code, 'Pascal')
  expect(lexemes.length).toBe(keywords.length)
  for (let index = 0; index < keywords.length; index += 1) {
    expect(lexemes[index].type).toBe('keyword')
    expect(lexemes[index].content).toBe(keywords[index])
  }
})

test('Lexer: Pascal: Type Keywords', function () {
  const code = 'boolean char integer string'
  const types = code.split(' ')
  const lexemes = lexify(code, 'Pascal')
  expect(lexemes.length).toBe(types.length)
  for (let index = 0; index < types.length; index += 1) {
    expect(lexemes[index].type).toBe('type')
    expect(lexemes[index].content).toBe(types[index])
  }
})

test('Lexer: Pascal: Operators', function () {
  const operators: Record<string, Operator|'asgn'> = {
    '+': 'plus',
    '-': 'subt',
    '*': 'mult',
    '/': 'divr',
    'div': 'div',
    'mod': 'mod',
    '=': 'eqal',
    '<>': 'noeq',
    '<=': 'lseq',
    '>=': 'mreq',
    '<': 'less',
    '>': 'more',
    ':=': 'asgn',
    'not': 'not',
    'and': 'and',
    'or': 'or',
    'xor': 'xor'
  }
  for (const operator of Object.keys(operators)) {
    const lexemes = lexify(operator, 'Pascal')
    expect(lexemes.length).toBe(1)
    expect(lexemes[0].type).toBe('operator')
    expect(lexemes[0].content).toBe(operator)
    expect((lexemes[0] as OperatorLexeme).subtype).toBe(operators[operator])
  }
})

test('Lexer: Pascal: Delimiters', function () {
  const code = '( ) [ ] , : ; .. .'
  const delimiters = code.split(' ')
  const lexemes = lexify(code, 'Pascal')
  for (let index = 0; index < delimiters.length; index += 1) {
    expect(lexemes[index].type).toBe('delimiter')
    expect(lexemes[index].content).toBe(delimiters[index])
  }
})

test('Lexer: Pascal: Strings', function () {
  let value = 'single quoted string'
  let string = "'single quoted string'"
  let lexemes = lexify(string, 'Pascal')
  expect(lexemes.length).toBe(1)
  expect(lexemes[0].type).toBe('literal')
  expect((lexemes[0] as StringLexeme).subtype).toBe('string')
  expect(lexemes[0].content).toBe(string)
  expect((lexemes[0] as StringLexeme).value).toBe(value)

  value = "single 'quoted' string"
  string = "'single ''quoted'' string'"
  lexemes = lexify(string, 'Pascal')
  expect(lexemes.length).toBe(1)
  expect(lexemes[0].type).toBe('literal')
  expect((lexemes[0] as StringLexeme).subtype).toBe('string')
  expect(lexemes[0].content).toBe(string)
  expect((lexemes[0] as StringLexeme).value).toBe(value)

  value = "double quoted string"
  string = '"double quoted string"'
  lexemes = lexify(string, 'Pascal')
  expect(lexemes.length).toBe(1)
  expect(lexemes[0].type).toBe('literal')
  expect((lexemes[0] as StringLexeme).subtype).toBe('string')
  expect(lexemes[0].content).toBe(string)
  expect((lexemes[0] as StringLexeme).value).toBe(value)

  value = 'double "quoted" string'
  string = '"double ""quoted"" string"'
  lexemes = lexify(string, 'Pascal')
  expect(lexemes.length).toBe(1)
  expect(lexemes[0].type).toBe('literal')
  expect((lexemes[0] as StringLexeme).subtype).toBe('string')
  expect(lexemes[0].content).toBe(string)
  expect((lexemes[0] as StringLexeme).value).toBe(value)
})

test('Lexer: Pascal: Booleans', function () {
  const lexemes1 = lexify('true', 'Pascal')
  expect(lexemes1.length).toBe(1)
  expect(lexemes1[0].type).toBe('literal')
  expect((lexemes1[0] as BooleanLexeme).subtype).toBe('boolean')
  expect(lexemes1[0].content).toBe('true')
  expect((lexemes1[0] as BooleanLexeme).value).toBe(-1)

  const lexemes2 = lexify('false', 'Pascal')
  expect(lexemes2.length).toBe(1)
  expect(lexemes2[0].type).toBe('literal')
  expect((lexemes2[0] as BooleanLexeme).subtype).toBe('boolean')
  expect(lexemes2[0].content).toBe('false')
  expect((lexemes2[0] as BooleanLexeme).value).toBe(0)
})

test('Lexer: Pascal: Integers', function () {
  // binary numbers
  const binary = lexify('%10', 'Pascal')
  expect(binary.length).toBe(1)
  expect(binary[0].type).toBe('literal')
  expect((binary[0] as IntegerLexeme).subtype).toBe('integer')
  expect((binary[0] as IntegerLexeme).radix).toBe(2)
  expect((binary[0] as IntegerLexeme).value).toBe(2)

  // octal numbers
  const octal = lexify('&10', 'Pascal')
  expect(octal.length).toBe(1)
  expect(octal[0].type).toBe('literal')
  expect((octal[0] as IntegerLexeme).subtype).toBe('integer')
  expect((octal[0] as IntegerLexeme).radix).toBe(8)
  expect((octal[0] as IntegerLexeme).value).toBe(8)

  // decimal numbers
  const decimal = lexify('10', 'Pascal')
  expect(decimal.length).toBe(1)
  expect(decimal[0].type).toBe('literal')
  expect((decimal[0] as IntegerLexeme).subtype).toBe('integer')
  expect((decimal[0] as IntegerLexeme).radix).toBe(10)
  expect((decimal[0] as IntegerLexeme).value).toBe(10)

  // hexadecimal numbers
  const hexadecimal = lexify('$10', 'Pascal')
  expect(hexadecimal.length).toBe(1)
  expect(hexadecimal[0].type).toBe('literal')
  expect((hexadecimal[0] as IntegerLexeme).subtype).toBe('integer')
  expect((hexadecimal[0] as IntegerLexeme).radix).toBe(16)
  expect((hexadecimal[0] as IntegerLexeme).value).toBe(16)
})

test('Lexer: Pascal: Keycodes', function () {
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
    const lexemes = lexify(keycode, 'Pascal')
    expect(lexemes.length).toBe(1)
    expect(lexemes[0].type).toBe('input')
    expect((lexemes[0] as KeycodeLexeme).subtype).toBe('keycode')
  }
})

test('Lexer: Pascal: Queries', function () {
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
    const lexemes = lexify(query, 'Pascal')
    expect(lexemes.length).toBe(1)
    expect(lexemes[0].type).toBe('input')
    expect((lexemes[0] as QueryLexeme).subtype).toBe('query')
  }
})

test('Lexer: Pascal: Identifiers', function () {
  const code = 'blot colour turtx turty turtd turta turtt turtc red green blue foo _bar Baz'
  const identifiers = code.split(' ')
  const lexemes = lexify(code, 'Pascal')

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
