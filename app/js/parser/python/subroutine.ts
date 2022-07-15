import identifier from './identifier'
import type from './type'
import variable from './variable'
import Lexemes from '../definitions/lexemes'
import Program from '../definitions/program'
import { Subroutine } from '../definitions/subroutine'
import { Constant } from '../definitions/constant'
import Variable from '../definitions/variable'
import { CompilerError } from '../../tools/error'
import { KeywordLexeme } from '../../lexer/lexeme'

/** parses lexemes as a subroutine definition (without parsing the subroutine's statements) */
export default function subroutine (lexeme: KeywordLexeme, lexemes: Lexemes, parent: Program|Subroutine, baseIndent: number): Subroutine {
  // expecting an identifier
  const name = identifier(lexemes, parent, true)

  // define the subroutine
  const program = (parent instanceof Program) ? parent : parent.program
  const subroutine = new Subroutine(lexeme, parent, name)
  subroutine.index = program.allSubroutines.length + 1

  // expecting parameters
  subroutine.variables.push(...parameters(lexemes, subroutine))

  // return type is permissible here
  if (lexemes.get()?.content === '->') {
    lexemes.next()

    // expecting return type specification
    const [isConstant, returnType, stringLength, arrayDimensions] = type(lexemes, parent)

    // constants are not allowed
    if (isConstant) {
      throw new CompilerError('Functions cannot return constant values.', lexemes.get())
    }

    // array return values are not allowed
    if (arrayDimensions.length > 0) {
      throw new CompilerError('Functions cannot return arrays.', lexemes.get(-1))
    }

    // set the return type and unshift the result variable for functions
    const variable = new Variable('!result', subroutine)
    variable.type = returnType
    variable.typeIsCertain = true
    variable.stringLength = stringLength
    subroutine.variables.unshift(variable)
    subroutine.typeIsCertain = true
  }

  // expecting a colon
  if (!lexemes.get()) {
    throw new CompilerError('Subroutine declaration must be followed by a colon ":".', lexemes.get(-1))
  }
  if (lexemes.get()?.content !== ':') {
    throw new CompilerError('Subroutine declaration must be followed by a colon ":".', lexemes.get())
  }
  lexemes.next()

  // expecting new line followed by an indent
  if (!lexemes.get()) {
    throw new CompilerError('No statements found after subroutine definition.', lexemes.get(-1))
  }
  if (lexemes.get()?.type !== 'newline') {
    throw new CompilerError('Subroutine definition must be followed by a line break.', lexemes.get())
  }
  lexemes.next()
  if (!lexemes.get()) {
    throw new CompilerError('No statements found after subroutine definition.', lexemes.get(-1))
  }
  if (lexemes.get()?.type !== 'indent') {
    throw new CompilerError('Indent needed after subroutine definition.', lexemes.get())
  }
  subroutine.indent = baseIndent + 1
  lexemes.next()

  // save start lexeme for later
  subroutine.start = lexemes.index

  // move past the subroutine's lexemes
  let indents = 0
  while (lexemes.get() && indents >= 0) {
    if (lexemes.get()?.type === 'indent') {
      indents += 1
    } else if (lexemes.get()?.type === 'dedent') {
      indents -= 1
    }
    lexemes.next()
  }

  // save end lexeme for the second pass
  subroutine.end = lexemes.index - 1

  // return the subroutine
  return subroutine
}

/** parses lexemes as subroutine parameters inside brackets */
function parameters (lexemes: Lexemes, routine: Subroutine): Variable[] {
  // expecting open bracket
  if (!lexemes.get()) {
    throw new CompilerError('Opening bracket "(" missing after function name.', lexemes.get(-1))
  }
  if (lexemes.get()?.content !== '(') {
    throw new CompilerError('Opening bracket "(" missing after function name.', lexemes.get())
  }
  lexemes.next()

  // expecting 0 or more parameters
  const parameters: Variable[] = []
  while (lexemes.get()?.content !== ')') {
    const parameter = variable(lexemes, routine)
    if (parameter instanceof Constant) {
      throw new CompilerError('Subroutine parameters cannot be constants.', lexemes.get(-1))
    }
    parameter.isParameter = true
    parameters.push(parameter)
    if (lexemes.get()?.content === ',') {
      lexemes.next()
    }
  }

  // check for closing bracket
  if (lexemes.get()?.content !== ')') {
    throw new CompilerError('Closing bracket missing after function parameters.', lexemes.get(-1))
  }
  lexemes.next()

  // return the parameters
  return parameters
}
