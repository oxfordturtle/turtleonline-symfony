// type imports
import type { Token } from './token'
import type { Language } from '../constants/languages'

// module imports
import tokenize from './tokenize'
import {
  Lexeme,
  NewlineLexeme,
  IndentLexeme,
  DedentLexeme,
  CommentLexeme,
  KeywordLexeme,
  TypeLexeme,
  OperatorLexeme,
  DelimiterLexeme,
  BooleanLexeme,
  IntegerLexeme,
  CharacterLexeme,
  StringLexeme,
  InputcodeLexeme,
  QuerycodeLexeme,
  IdentifierLexeme
} from './lexeme'
import { CompilerError } from '../tools/error'

/** generates an array of lexemes from code string or tokens */
export default function lexify (code: string|Token[], language: Language): Lexeme[] {
  // get the tokens (if first argument was code string)
  const tokens = (typeof code === 'string') ? tokenize(code, language) : code

  // loop through the tokens, pushing lexemes into the lexemes array (or throwing an error)
  const lexemes: Lexeme[] = []
  const indents = [0]
  let index = 0
  let indent = indents[0]
  while (index < tokens.length) {
    switch (tokens[index].type) {
      case 'spaces':
        break

      case 'newline':
        // line breaks are significant in BASIC, Python, and TypeScript
        if (language === 'BASIC' || language === 'Python' || language === 'TypeScript') {
          // push the lexeme, unless this is a blank line at the start of the
          // program or there's a blank line or a comment previously
          if (lexemes[lexemes.length - 1]) {
            if (lexemes[lexemes.length - 1].type !== 'newline' && lexemes[lexemes.length - 1].type !== 'comment') {
              lexemes.push(new NewlineLexeme(tokens[index]))
            }
          }
          // move past any additional line breaks
          while (tokens[index + 1] && tokens[index + 1].type === 'newline') {
            index += 1
          }
        }

        // indents are significant in Python
        if (language === 'Python') {
          indent = (tokens[index + 1] && tokens[index + 1].type === 'spaces')
            ? tokens[index + 1].content.length
            : 0
          if (indent > indents[indents.length - 1]) {
            indents.push(indent)
            lexemes.push(new IndentLexeme(tokens[index + 1]))
          } else {
            while (indent < indents[indents.length - 1]) {
              indents.pop()
              lexemes.push(new DedentLexeme(tokens[index + 1] || tokens[index]))
            }
            if (indent !== indents[indents.length - 1]) {
              throw new CompilerError(`Inconsistent indentation at line ${(tokens[index + 1] || tokens[index]).line}.`)
            }
          }
        }
        break

      case 'comment':
        lexemes.push(new CommentLexeme(tokens[index], language))
        // in Python and BASIC, line breaks are significant, and comments are terminated
        // with a line break; so we need to add a newline lexeme after each comment
        if (language === 'BASIC' || language === 'Python') {
          lexemes.push(new NewlineLexeme(tokens[index + 1] || tokens[index]))
        }
        break

      case 'keyword':
        lexemes.push(new KeywordLexeme(tokens[index]))
        break

      case 'type':
        lexemes.push(new TypeLexeme(tokens[index]))
        break

      case 'operator':
        lexemes.push(new OperatorLexeme(tokens[index], language))
        break

      case 'delimiter':
        lexemes.push(new DelimiterLexeme(tokens[index]))
        break

      case 'string': {
        const stringLexeme = new StringLexeme(tokens[index], language)
        const isCharacter = stringLexeme.value.length === 1
        if (isCharacter && (language === 'C' || language === 'Java' || language === 'Pascal')) {
          lexemes.push(new CharacterLexeme(stringLexeme))
        } else {
          lexemes.push(stringLexeme)
        }
        break
      }

      case 'boolean':
        lexemes.push(new BooleanLexeme(tokens[index], language))
        break

      case 'binary':
        lexemes.push(new IntegerLexeme(tokens[index], 2))
        break

      case 'octal':
        lexemes.push(new IntegerLexeme(tokens[index], 8))
        break

      case 'hexadecimal':
        lexemes.push(new IntegerLexeme(tokens[index], 16))
        break

      case 'decimal':
        lexemes.push(new IntegerLexeme(tokens[index], 10))
        break

      case 'inputcode':
        lexemes.push(new InputcodeLexeme(tokens[index], language))
        break

      case 'querycode':
        lexemes.push(new QuerycodeLexeme(tokens[index], language))
        break

      case 'command':
      case 'turtle':
      case 'colour':
      case 'identifier':
        lexemes.push(new IdentifierLexeme(tokens[index], language))
        break

      case 'unterminated-comment':
        throw new CompilerError('Unterminated comment.', tokens[index])

      case 'unterminated-string':
        throw new CompilerError('Unterminated string.', tokens[index])

      case 'bad-binary':
      case 'bad-octal':
      case 'bad-hexadecimal':
        throw new CompilerError('Ill-formed integer literal.', tokens[index])

      case 'real':
        throw new CompilerError('The Turtle System does not support real numbers.', tokens[index])

      case 'bad-inputcode':
        throw new CompilerError('Unrecognised input code.', tokens[index])

      case 'bad-querycode':
        throw new CompilerError('Unrecognised input query.', tokens[index])

      case 'illegal':
        throw new CompilerError('Illegal character in this context.', tokens[index])
    }

    index += 1
  }

  // return the array of lexemes
  return lexemes
}
