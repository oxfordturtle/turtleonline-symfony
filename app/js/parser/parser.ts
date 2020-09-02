/**
 * The parser function. Lexemes go in, array of routines comes out.
 */
import { Routine } from './routine'
import BASIC from './basic'
import C from './c'
import Pascal from './pascal'
import Python from './python'
import TypeScript from './typescript'
import { Language } from '../constants/languages'
import { Lexeme } from '../lexer/lexeme'

export default function parser (lexemes: Lexeme[], language: Language): Routine[] {
  const parsers = { BASIC, C, Pascal, Python, TypeScript }

  // throw away comments
  lexemes = lexemes.filter(x => x.type !== 'comment')

  // parse the rest
  return parsers[language](lexemes)
}
