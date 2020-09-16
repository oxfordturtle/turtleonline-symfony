/*
 * Lexical analysis function.
 */
import { Lexeme } from './lexeme'
import tokenize from './tokenize'
import { Language, languages } from '../constants/languages'
import { CompilerError } from '../tools/error'

/** generates an array of lexemes from code */
export default function lexify (code: string, language: Language): Lexeme[] {
  // get the tokens from the code
  const tokens = tokenize(code, language)
  const lexemes: Lexeme[] = []
  const errorOffset = languages.indexOf(language)

  // loop through the tokens, pushing lexemes into the lexemes array (or throwing an error)
  const indents = [0]
  let index = 0
  let line = 1
  let character = 1
  let indent = indents[0]
  while (index < tokens.length) {
    if (!tokens[index].ok) {
      switch (tokens[index].type) {
        case 'comment':
          throw new CompilerError(messages[0], new Lexeme(tokens[index], line, character))
  
        case 'character': // fallthrough
        case 'string':
          if (language === 'BASIC' && tokens[index].subtype === 'single') {
            throw new CompilerError(messages[1], new Lexeme(tokens[index], line, character))
          }
          throw new CompilerError(messages[2], new Lexeme(tokens[index], line, character))
  
        case 'integer':
          switch (tokens[index].subtype) {
            case 'binary':
              throw new CompilerError(messages[3 + errorOffset], new Lexeme(tokens[index], line, character))
      
            case 'octal':
              throw new CompilerError(messages[6 + errorOffset], new Lexeme(tokens[index], line, character))
      
            case 'hexadecimal':
              throw new CompilerError(messages[9 + errorOffset], new Lexeme(tokens[index], line, character))
      
            case 'decimal':
              throw new CompilerError(messages[12], new Lexeme(tokens[index], line, character))
          }

        case 'keycode':
          throw new CompilerError(messages[13], new Lexeme(tokens[index], line, character))

        case 'query':
          throw new CompilerError(messages[14], new Lexeme(tokens[index], line, character))

        case 'illegal':
          throw new CompilerError(messages[15], new Lexeme(tokens[index], line, character))
      }
    }

    switch (tokens[index].type) {
      case 'spaces':
        character += (tokens[index].content as string).length
        break

      case 'newline':
        line += 1
        character = 1
        // line breaks are significant in BASIC and Python
        if (language === 'BASIC' || language === 'Python') {
          // push the lexeme, unless this is a blank line at the start of the
          // program or there's a blank line or a comment previously
          if (lexemes[lexemes.length - 1]) {
            if (lexemes[lexemes.length - 1].type !== 'newline' && lexemes[lexemes.length - 1].type !== 'comment') {
              lexemes.push(new Lexeme(tokens[index], line - 1, character))
            }
          }
          // move past any additional line breaks, just incrementing the line number
          while (tokens[index + 1] && tokens[index + 1].type === 'newline') {
            index += 1
            line += 1
          }
        }

        // indents are significant in Python
        if (language === 'Python') {
          indent = (tokens[index + 1] && tokens[index + 1].type === 'spaces')
            ? (tokens[index + 1].content as string).length
            : 0
          if (indent > indents[indents.length - 1]) {
            indents.push(indent)
            lexemes.push(new Lexeme('indent', line, character))
          } else {
            while (indent < indents[indents.length - 1]) {
              indents.pop()
              lexemes.push(new Lexeme('dedent', line, character))
            }
            if (indent !== indents[indents.length - 1]) {
              throw new CompilerError(`Inconsistent indentation at line ${line}.`)
            }
          }
        }
        break

      default:
        lexemes.push(new Lexeme(tokens[index], line, character))
        character += tokens[index].content?.length || 0
        break
    }

    index += 1
  }

  // return the array of lexemes
  return lexemes
}

/** array of error messages */
const messages = [
  'Unterminated comment.',
  'Strings in Turtle BASIC use double quotes, not single quotes.',
  'Unterminated string.',
  'Binary numbers in Turtle BASIC begin with "%".',
  'Binary numbers in Turtle Pascal begin with "%".',
  'Binary numbers in Turtle Python begin with "0b".',
  'Turtle BASIC does not support octal numbers.',
  'Octal numbers in Turtle Pascal begin with "&".',
  'Octal numbers in Turtle Python begin with "0o".',
  'Hexadecimal numbers in Turtle BASIC begin with "&".',
  'Hexadecimal numbers in Turtle Pascal begin with "$".',
  'Hexadecimal numbers in Turtle Python begin with "0x".',
  'The Turtle System does not support real numbers.',
  'Unrecognised keycode constant.',
  'Unrecognised input query.',
  'Illegal character in this context.'
]
