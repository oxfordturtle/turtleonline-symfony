/**
 * lexical analysis; program code (a string) goes in, an array of lexemes comes
 * out
 *
 * the lexer first uses the tokenizer to generate an array of tokens; then it
 * checks for lexical errors, strips whitespace and comments, and enriches the
 * tokens with more information
 *
 * the types are the same as for token types, except that there are no illegal
 * lexemes, whitespace is handled differently, and the "binary", "octal",
 * "hexadecimal", and "decimal" token types are all just "integer" lexical types
 *
 * the value property stores the result of evaluating literal value expressions,
 * the relative address of a turtle variable, or the pcode associated with an
 * operator; it is null for all other lexical types
 */
import CompilerError from '../error'
import tokenizer from '../tokenizer/index'
import { languages, Language } from '../../state/languages'
import { Lexeme } from './lexeme'
import Comment from './comment'

export default function (code: string, language: Language): { lexemes: Lexeme[], comments: Comment[] } {
  // run the tokenizer on the code, then setup some constants
  const tokens = tokenizer(code, language)
  const lexemes: Lexeme[] = []
  const comments: Comment[] = []
  const errorOffset = languages.indexOf(language)

  // loop through the tokens, pushing lexemes into the lexemes array (or throwing an error)
  const indents = [0]
  let index = 0
  let line = 1
  let character = 1
  let indent = indents[0]
  while (index < tokens.length) {
    switch (tokens[index].type) {
      case 'spaces':
        character += tokens[index].content.length
        break

      case 'comment':
        comments.push(new Comment(tokens[index], line, character))
        character += tokens[index].content.length
        break

      case 'linebreak':
        line += 1
        character = 1
        // line breaks are significant in BASIC and Python
        if (language === 'BASIC' || language === 'Python') {
          // create a NEWLINE lexeme, unless this is a blank line at the start f the program or
          // there's a blank line previously (which can happen following a single-line comment)
          if (lexemes[lexemes.length - 1] && lexemes[lexemes.length - 1].type !== 'NEWLINE') {
            lexemes.push(new Lexeme('NEWLINE', line - 1, language))
          }
          // move past any additional line breaks, just incrementing the line number
          while (tokens[index + 1] && tokens[index + 1].type === 'linebreak') {
            index += 1
            line += 1
          }
        }

        // indents are significant in Python
        if (language === 'Python') {
          indent = (tokens[index + 1] && tokens[index + 1].type === 'spaces')
            ? tokens[index + 1].content.length
            : 0
          if (indent > indents[indents.length - 1]) {
            indents.push(indent)
            lexemes.push(new Lexeme('INDENT', line, language))
          } else {
            while (indent < indents[indents.length - 1]) {
              indents.pop()
              lexemes.push(new Lexeme('INDENT', line, language))
            }
            if (indent !== indents[indents.length - 1]) {
              throw new CompilerError(`Inconsistent indentation at line ${line}.`)
            }
          }
        }
        break

      case 'unterminated-comment':
        throw new CompilerError(messages[0], new Lexeme(tokens[index], line, language))

      case 'unterminated-string':
        throw new CompilerError(messages[1], new Lexeme(tokens[index], line, language))

      case 'bad-binary':
        throw new CompilerError(messages[2 + errorOffset], new Lexeme(tokens[index], line, language))

      case 'bad-octal':
        throw new CompilerError(messages[5 + errorOffset], new Lexeme(tokens[index], line, language))

      case 'bad-hexadecimal':
        throw new CompilerError(messages[8 + errorOffset], new Lexeme(tokens[index], line, language))

      case 'bad-decimal':
        throw new CompilerError(messages[11], new Lexeme(tokens[index], line, language))

      case 'illegal':
        throw new CompilerError(messages[12], new Lexeme(tokens[index], line, language))

      default:
        lexemes.push(new Lexeme(tokens[index], line, language))
        character += tokens[index].content.length
        break
    }

    index += 1
  }

  // return the array of lexemes
  return { lexemes, comments }
}

// error messages
const messages = [
  'Unterminated comment.',
  'Unterminated string.',
  'Binary numbers in Turtle BASIC begin with \'%\'.',
  'Binary numbers in Turtle Pascal begin with \'%\'.',
  'Binary numbers in Turtle Python begin with \'0b\'.',
  'Turtle BASIC does not support octal numbers.',
  'Octal numbers in Turtle Pascal begin with \'&\'',
  'Octal numbers in Turtle Python begin with \'0o\'',
  'Hexadecimal numbers in Turtle BASIC begin with \'&\'',
  'Hexadecimal numbers in Turtle Pascal begin with \'$\'',
  'Hexadecimal numbers in Turtle Python begin with \'0x\'',
  'The Turtle System does not support real numbers.',
  'Illegal character in this context.'
]
