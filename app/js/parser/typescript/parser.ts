import constant from './constant'
import variable from './variable'
import subroutine from './subroutine'
import { eosCheck, statement } from './statement'
import Lexemes from '../definitions/lexemes'
import Program from '../definitions/program'
import { Subroutine } from '../definitions/subroutine'
import { Lexeme } from '../../lexer/lexeme'

/** parses lexemes as a TypeScript program */
export default function typescript (lexemes: Lexemes): Program {
  // create the program
  const program = new Program('TypeScript')
  program.end = lexemes.lexemes.length

  // parse the program (which will parse its subroutines in turn)
  parseBody(lexemes, program)

  // return the program
  return program
}

/** parses the body of a routine, generating statements from its lexemes */
function parseBody (lexemes: Lexemes, routine: Program|Subroutine): void {
  // first pass: hoist all constants, variables, and functions
  lexemes.index = routine.start
  // TODO: allow block-scoped variables with 'let' and make constants block-scoped as well
  while (lexemes.index < routine.end) {
    const lexeme = lexemes.get() as Lexeme
    lexemes.next()
    switch (lexeme.type) {
      case 'keyword':
        switch (lexeme.subtype) {
          // constant definitions (temporary: don't do this when block-scoping is possible)
          case 'const':
            routine.constants.push(constant(lexemes, routine, true)) // TODO: set second parameter to FALSE when constants aren't hoisted on first pass
            eosCheck(lexemes)
            break

          // variable declarations
          case 'var':
            routine.variables.push(variable(lexemes, routine, true))
            break

          // subroutine definitions
          case 'function':
            routine.subroutines.push(subroutine(lexeme, lexemes, routine))
            break
        }
    }
  }

  // second pass: parse the statements of this routine and any subroutines recursively
  lexemes.index = routine.start
  while (lexemes.index < routine.end) {
    routine.statements.push(statement(lexemes.get() as Lexeme, lexemes, routine))
  }
  for (const sub of routine.subroutines) {
    parseBody(lexemes, sub)
  }
}
