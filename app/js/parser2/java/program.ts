import { Program } from '../definitions/program'
import { Lexeme } from '../../lexer/lexeme'
import { CompilerError } from '../../tools/error'

/** parses outermost structure "class ProgramName { ... }" */
export default function program (lexemes: Lexeme[]): Program {
  const [keyword, identifier, openingBracket] = lexemes.slice(0, 3)
  const closingBracket = lexemes[lexemes.length - 1]

  // "class" check
  if (!keyword) {
    throw new CompilerError('Program must begin with keyword "class".')
  }
  if (keyword.content !== 'class') {
    throw new CompilerError('Program must begin with keyword "class".', keyword)
  }

  // identifier (program name) check
  if (!identifier) {
    throw new CompilerError('{lex} must be followed by a program name.', keyword)
  }
  if (identifier.type !== 'identifier') {
    throw new CompilerError('{lex} is not a valid program name.', identifier)
  }
  if (identifier.subtype === 'turtle') {
    throw new CompilerError('{lex} is the name of a predefined Turtle attribute, and cannot be used as the name of the program.', identifier)
  }
  const firstCharacterCode = (identifier.content as string).charCodeAt(0)
  if (firstCharacterCode < 65 || firstCharacterCode > 90) {
    throw new CompilerError('Program name must begin with a capital letter.', identifier)
  }

  // opening curly bracket
  if (!openingBracket) {
    throw new CompilerError('Program name must be followed by an opening bracket "{".', identifier)
  }
  if (openingBracket.content !== '{') {
    throw new CompilerError('Program name must be followed by an opening bracket "{".', openingBracket)
  }

  // closing curly bracket
  if (!closingBracket) {
    throw new CompilerError('Program must end with a closing bracket "}".', lexemes[lexemes.length - 1])
  }
  if (closingBracket.content !== '}') {
    throw new CompilerError('Program must end with a closing bracket "}".', lexemes[lexemes.length])
  }

  // create the program
  const prog = new Program('Java', identifier.content as string)
  prog.outerLexemes = lexemes
  prog.lexemes = lexemes.slice(3, -1)

  // return the program
  return prog
}
