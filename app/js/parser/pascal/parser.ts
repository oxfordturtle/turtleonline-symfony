import identifier from './identifier'
import constant from './constant'
import subroutine from './subroutine'
import { variables } from './variable'
import { semicolon, statement } from './statement'
import type Lexemes from '../definitions/lexemes'
import Program from '../definitions/program'
import { CompilerError } from '../../tools/error'
import type { Lexeme } from '../../lexer/lexeme'

/** parses lexemes as a Pascal program */
export default function pascal (lexemes: Lexemes): Program {
  // create the program
  const program = new Program('Pascal')

  // expecting "PROGRAM"
  const programLexeme = lexemes.get()
  if (!programLexeme || programLexeme.type !== 'keyword' || programLexeme.subtype !== 'program') {
    throw new CompilerError('Program must begin with keyword "PROGRAM".', lexemes.get())
  }
  lexemes.next()

  // expecting program name
  program.name = identifier(lexemes, program)

  // semicolon check
  semicolon(lexemes, true, 'program declaration')

  // parse the body of the program (which parses subroutines recursively)
  let begun = false
  while (lexemes.get() && lexemes.get()?.content.toLowerCase() !== 'end') {
    const lexeme = lexemes.get() as Lexeme
    switch (lexeme.type) {
      case 'keyword':
        switch (lexeme.subtype) {
          // constant definitions
          case 'const': {
            if (program.variables.length > 0) {
              throw new CompilerError('Constant definitions must be placed above any variable declarations.', lexemes.get())
            }
            if (program.subroutines.length > 0) {
              throw new CompilerError('Constant definitions must be placed above any subroutine definitions.', lexemes.get())
            }
            lexemes.next()
            const constantsSoFar = program.constants.length
            while (lexemes.get()?.type === 'identifier') {
              program.constants.push(constant(lexemes, program))
            }
            if (program.constants.length === constantsSoFar) {
              throw new CompilerError('"CONST" must be followed by an identifier.', lexemes.get(-1))
            }
            break
          }

          // variable declarations
          case 'var':
            if (program.subroutines.length > 0) {
              throw new CompilerError('Variable declarations must be placed above any subroutine definitions.', lexemes.get())
            }
            lexemes.next()
            program.variables.push(...variables(lexemes, program))
            break

          // procedure/function definition
          case 'procedure': // fallthrough
          case 'function':
            lexemes.next()
            program.subroutines.push(subroutine(lexeme, lexemes, program))
            break

          // start of program statements
          case 'begin':
            begun = true
            lexemes.next()
            while (lexemes.get() && lexemes.get()?.content?.toLowerCase() !== 'end') {
              const lexeme = lexemes.get() as Lexeme
              program.statements.push(statement(lexeme, lexemes, program))
            }
            break

          // any other keyword is an error
          default:
            if (!begun) {
              throw new CompilerError('Keyword "begin" missing for main program.', lexemes.get())
            }
            throw new CompilerError('{lex} makes no sense here.', lexemes.get())
        }
        break

        // anything else is an error
        default:
          if (!begun) {
            throw new CompilerError('Keyword "begin" missing for main program.', lexemes.get())
          }
          throw new CompilerError('{lex} makes no sense here.', lexemes.get())
    }
  }

  // final error checking
  if (!begun) {
    throw new CompilerError('Keyword "begin" missing for main program.', lexemes.get(-1))
  }
  if (!lexemes.get()) {
    throw new CompilerError('Keyword "end" missing after main program.', lexemes.get(-1))
  }
  lexemes.next()
  if (!lexemes.get() || lexemes.get()?.content !== '.') {
    throw new CompilerError('Full stop missing after program "end".', lexemes.get(-1))
  }
  if (lexemes.get(1)) {
    throw new CompilerError('No text can appear after program "end".', lexemes.get(1))
  }

  // return the program
  return program
}
