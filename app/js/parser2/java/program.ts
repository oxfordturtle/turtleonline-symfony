import { Program } from '../definitions/program'
import { Lex } from '../lex'
import { CompilerError } from '../../tools/error'

/** parses outermost structure "class ProgramName { ... }" */
export default function program (lex: Lex): Program {
  const keyword = lex.lexemes.shift()
  const identifier = lex.lexemes.shift()
  const openingBracket = lex.lexemes.shift()
  const closingBracket = lex.lexemes.pop()

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
    throw new CompilerError('Program must end with a closing bracket "}".', lex.lexemes[lex.lexemes.length - 1])
  }

  // create and return the program
  return new Program('Java', identifier.content as string)
}
