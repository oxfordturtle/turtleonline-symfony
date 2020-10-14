/**
 * The parser function. Lexemes go in, array of routines comes out.
 */
import { Program } from './routine'
import BASIC1 from './parsers1/basic'
import C1 from './parsers1/c'
import Java1 from './parsers1/java'
import Pascal1 from './parsers1/pascal'
import Python1 from './parsers1/python'
import TypeScript1 from './parsers1/typescript'
import BASIC2 from './parsers2/basic'
import CandJava2 from './parsers2/candjava'
import Pascal2 from './parsers2/pascal'
import Python2 from './parsers2/python'
import TypeScript2 from './parsers2/typescript'
import { Language } from '../constants/languages'
import { Lexeme } from '../lexer/lexeme'

export default function parser (lexemes: Lexeme[], language: Language): Program {
  let program: Program

  switch (language) {
    case 'BASIC':
      program = BASIC1(lexemes.filter(x => x.type !== 'comment'))
      BASIC2(program)
      break

    case 'C':
      program = C1(lexemes.filter(x => x.type !== 'comment'))
      CandJava2(program)
      break

    case 'Java':
      program = Java1(lexemes.filter(x => x.type !== 'comment'))
      CandJava2(program)
      break

      case 'Pascal':
      program = Pascal1(lexemes.filter(x => x.type !== 'comment'))
      Pascal2(program)
      break

    case 'Python':
      program = Python1(lexemes.filter(x => x.type !== 'comment'))
      Python2(program)
      break

    case 'TypeScript':
      program = TypeScript1(lexemes.filter(x => x.type !== 'comment'))
      TypeScript2(program)
      break
  }

  return program
}
