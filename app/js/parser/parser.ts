/**
 * The parser function. Lexemes go in, array of routines comes out.
 */
import { Routine } from './routine'
import BASIC from './parsers/basic'
import C from './parsers/c'
import Pascal from './parsers/pascal'
import Python from './parsers/python'
import TypeScript from './parsers/typescript'
import { Language } from '../constants/languages'
import { Lexeme } from '../lexer/lexeme'

export default function parser (lexemes: Lexeme[], language: Language): Routine[] {
  const parsers = { BASIC, C, Pascal, Python, TypeScript }

  // throw away comments
  lexemes = lexemes.filter(x => x.type !== 'comment')

  // parse the rest
  return parsers[language](lexemes)
}
