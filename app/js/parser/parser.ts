// type imports
import type { Language } from '../constants/languages'
import type { Lexeme } from '../lexer/lexeme'
import type Program from './definitions/program'

// submodule imports
import basicParser from './basic/parser'
import cParser from './c/parser'
import javaParser from './java/parser'
import pascalParser from './pascal/parser'
import pythonParser from './python/parser'
import typeScriptParser from './typescript/parser'
import Lexemes from './definitions/lexemes'

// other module imports
import lexify from '../lexer/lexify'

/** parses codes string or lexemes and returns a program object */
export default function parser (code: string|Lexeme[], language: Language): Program {
  const rawLexemes = (typeof code === 'string') ? lexify(code, language) : code
  const lexemes = new Lexemes(rawLexemes)

  switch (language) {
    case 'BASIC':
      return basicParser(lexemes)

    case 'C':
      return cParser(lexemes)

    case 'Java':
      return javaParser(lexemes)

    case 'Pascal':
      return pascalParser(lexemes)

    case 'Python':
      return pythonParser(lexemes)

    case 'TypeScript':
      return typeScriptParser(lexemes)
  }
}
