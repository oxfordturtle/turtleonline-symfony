import { subroutineName } from './identifier'
import { newLine } from './statement'
import { variable } from './variable'
import type Program from '../definitions/program'
import { Subroutine } from '../definitions/subroutine'
import Variable from '../definitions/variable'
import type Lexemes from '../definitions/lexemes'
import { CompilerError } from '../../tools/error'
import type { KeywordLexeme } from '../../lexer/lexeme'

/** parses lexemes as a subroutine definition */
export default function subroutine (lexeme: KeywordLexeme, lexemes: Lexemes, program: Program): Subroutine {
  // expecting subroutine name
  const [name, subroutineType, type, stringLength] = subroutineName(lexemes)

  // create the subroutine and add it to the program's subroutines
  const subroutine = new Subroutine(lexeme, program, name)
  subroutine.index = program.subroutines.length + 1
  if (subroutineType === 'function') {
    const returnVariable = new Variable('!result', subroutine)
    returnVariable.type = type
    returnVariable.stringLength = stringLength
    subroutine.variables.push(returnVariable)
  }

  // parameters are permissible here
  if (lexemes.get()?.content === '(') {
    lexemes.next()
    subroutine.variables.push(...parameters(lexemes, subroutine))
  }

  // expecting subroutine statements on a new line
  if (!lexemes.get()) {
    throw new CompilerError('No statements found after subroutine declaration.', lexemes.get(-1))
  }
  newLine(lexemes)

  // save first inner lexeme index (for the second pass)
  subroutine.start = lexemes.index

  // move past all inner lexemes
  let finished = false
  if (subroutine.type === 'procedure') { // procedure
    while (lexemes.get() && !finished) {
      finished = (lexemes.get()?.content === 'ENDPROC')
      lexemes.next()
    }
  } else { // function
    while (lexemes.get() && !finished) {
      if (lexemes.get()?.content === '=' && lexemes.get(-1)?.type === 'newline') {
        finished = true
        while (lexemes.get() && lexemes.get()?.type !== 'newline') {
          lexemes.next() // move past everything up to the next line break
        }
      } else {
        lexemes.next()
      }
    }
  }

  // save last inner lexeme index (for the second pass)
  subroutine.end = (subroutine.type === 'procedure') ? lexemes.index - 2 : lexemes.index

  // check for subroutine end
  if (!finished) {
    if (subroutine.type === 'procedure') {
      throw new CompilerError(`Procedure "${subroutine.name}" does not have an end (expected "ENDPROC").`, lexemes.lexemes[subroutine.start])
    }
    throw new CompilerError(`Function "${subroutine.name}" does not have an end (expected "=<expression>").`, lexemes.lexemes[subroutine.end])
  }

  // new line check
  newLine(lexemes)

  // return the subroutine
  return subroutine
}

/** parses lexemes as parameter declarations */
function parameters (lexemes: Lexemes, subroutine: Subroutine): Variable[] {
  // expecting 0 or more parameters
  const parameters: Variable[] = []
  while (lexemes.get()?.content !== ')') {
    let isReferenceParameter = false
    if (lexemes.get()?.content === 'RETURN') {
      isReferenceParameter = true
      lexemes.next()
    }
    const parameter = variable(lexemes, subroutine)
    parameter.isParameter = true
    parameter.isReferenceParameter = isReferenceParameter
    // brackets here "()" means array parameter
    if (lexemes.get()?.content === '(') {
      parameter.arrayDimensions.push([0,0]) // give dummy array dimensions
      lexemes.next()
      if (!lexemes.get() || lexemes.get()?.content !== ')') {
        throw new CompilerError('Closing bracket missing after array parameter specification.', lexemes.get(-1))
      }
      lexemes.next()
    }
    parameters.push(parameter)
    if (lexemes.get()?.content === ',') {
      lexemes.next()
    }
  }

  // check for closing bracket
  if (lexemes.get()?.content !== ')') {
    throw new CompilerError('Closing bracket missing after method parameters.', lexemes.get(-1))
  }
  lexemes.next()

  // return the parameters
  return parameters
}
