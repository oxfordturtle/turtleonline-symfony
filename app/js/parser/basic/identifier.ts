import type Lexemes from '../definitions/lexemes'
import type { SubroutineType } from '../definitions/subroutine'
import type { Type } from '../../lexer/lexeme'
import { CompilerError } from '../../tools/error'


/** parses a lexeme as an identifier */
export function identifier (lexemes: Lexemes): string {
  const identifier = lexemes.get()

  if (!identifier) {
    throw new CompilerError('{lex} must be followed by an identifier.', lexemes.get(-1))
  }

  if (identifier.type !== 'identifier') {
    throw new CompilerError('{lex} is not a valid identifier.', identifier)
  }

  if (identifier.subtype === 'turtle') {
    throw new CompilerError('{lex} is already the name of a predefined Turtle property.', identifier)
  }

  lexemes.next()

  return identifier.content
}

/** parses a lexeme as a subroutine name */
export function subroutineName (lexemes: Lexemes): [string, SubroutineType, Type, number] {
  const name = identifier(lexemes)

  let subroutineType: SubroutineType
  if (name.slice(0, 4) === 'PROC') {
    subroutineType = 'procedure'
  } else if (name.slice(0, 2) === 'FN') {
    subroutineType = 'function'
  } else {
    throw new CompilerError('{lex} is not a valid subroutine name. (Procedure names must begin with "PROC", and function names must begin with "FN".)')
  }

  const test = name.match(/\$(\d+)$/)
  let type: Type = 'boolint'
  let stringLength = 32
  if (name.slice(-1) === '$') {
    type = 'string'
  } else if (test) {
    type = 'string'
    stringLength = parseInt(test[1], 10)
  }

  return [name, subroutineType, type, stringLength]
}

/** parses a lexeme as a variable name */
export function variableName (lexemes: Lexemes): [string, Type, number] {
  const name = identifier(lexemes)

  const test = name.match(/\$(\d+)$/)
  let type: Type
  let stringLength = 32
  if (name.slice(-1) === '%') {
    type = 'boolint'
  } else if (name.slice(-1) === '$') {
    type = 'string'
  } else if (test) {
    type = 'string'
    stringLength = parseInt(test[1], 10)
  } else {
    throw new CompilerError('{lex} is not a valid variable name. (Boolean and integer variables end with "%", and string variables end with "$".)', lexemes.get(-1))
  }

  return [name, type, stringLength]
}
