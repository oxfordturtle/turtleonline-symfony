/*
 * Lexical analysis function.
 */
import { Lexeme } from './lexeme'
import tokenize from './tokenize'
import { Language } from '../constants/languages'
import { CompilerError } from '../tools/error'

/** generates an array of lexemes from code */
export default function lexify (code: string, language: Language): Lexeme[] {
  // get the tokens from the code
  const tokens = tokenize(code, language)
  const lexemes: Lexeme[] = []

  // loop through the tokens, pushing lexemes into the lexemes array (or throwing an error)
  const indents = [0]
  let index = 0
  let line = 1
  let character = 1
  let indent = indents[0]
  let messages: Record<Language, string>
  let message: string
  while (index < tokens.length) {
    if (!tokens[index].ok) {
      switch (tokens[index].type) {
        case 'comment':
          message = 'Unterminated comment.'
          throw new CompilerError(message, new Lexeme(tokens[index], line, character))
  
        case 'character': // fallthrough
        case 'string':
          message = (language === 'BASIC' && tokens[index].subtype === 'single')
            ? 'Strings in Turtle BASIC use double quotes, not single quotes.'
            : 'Unterminated string.'
          throw new CompilerError(message, new Lexeme(tokens[index], line, character))
  
        case 'integer':
          switch (tokens[index].subtype) {
            case 'binary':
              messages = {
                BASIC: 'Binary numbers in Turtle BASIC begin with "%".',
                C: 'Binary numbers in Turtle C begin with "0b".',
                Java: 'Binary numbers in Turtle Java begin with "0b".',
                Pascal: 'Binary numbers in Turtle Pascal begin with "%".',
                Python: 'Binary numbers in Turtle Python begin with "0b".',
                TypeScript: 'Binary numbers in Turtle TypeScript begin with "0b".'
              }
              throw new CompilerError(messages[language], new Lexeme(tokens[index], line, character))
      
            case 'octal':
              messages = {
                BASIC: 'Turtle BASIC does not support octal numbers.',
                C: 'Octal numbers in Turtle C begin with "0o".',
                Java: 'Octal numbers in Turtle Java begin with "0o".',
                Pascal: 'Octal numbers in Turtle Pascal begin with "&".',
                Python: 'Octal numbers in Turtle Python begin with "0o".',
                TypeScript: 'Octal numbers in Turtle TypeScript begin with "0o".'
              }
              throw new CompilerError(messages[language], new Lexeme(tokens[index], line, character))
      
            case 'hexadecimal':
              messages = {
                BASIC: 'Hexadecimal numbers in Turtle BASIC begin with "&".',
                C: 'Hexadecimal numbers in Turtle C begin with "0x".',
                Java: 'Hexadecimal numbers in Turtle Java begin with "0x".',
                Pascal: 'Hexadecimal numbers in Turtle Pascal begin with "$".',
                Python: 'Hexadecimal numbers in Turtle Python begin with "0x".',
                TypeScript: 'Hexadecimal numbers in Turtle TypeScript begin with "0x".'
              }
              throw new CompilerError(messages[language], new Lexeme(tokens[index], line, character))
      
            case 'decimal':
              message = 'The Turtle System does not support real numbers.'
              throw new CompilerError(message, new Lexeme(tokens[index], line, character))
          }

        case 'keycode':
          message = 'Unrecognised keycode constant.'
          throw new CompilerError(message, new Lexeme(tokens[index], line, character))

        case 'query':
          message = 'Unrecognised input query.'
          throw new CompilerError(message, new Lexeme(tokens[index], line, character))

        case 'illegal':
          message = 'Illegal character in this context.'
          throw new CompilerError(message, new Lexeme(tokens[index], line, character))
      }
    }

    switch (tokens[index].type) {
      case 'spaces':
        character += (tokens[index].content as string).length
        break

      case 'newline':
        line += 1
        character = 1
        // line breaks are significant in BASIC, Python, and TypeScript
        if (language === 'BASIC' || language === 'Python' || language === 'TypeScript') {
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

      case 'comment':
        lexemes.push(new Lexeme(tokens[index], line, character))
        character += tokens[index].content?.length || 0
        // in Python and BASIC, line breaks are significant, and comments are terminated
        // with a line break; so we need to add a newline lexeme after each comment
        if (language === 'BASIC' || language === 'Python') {
          lexemes.push(new Lexeme('newline', line, character))
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
