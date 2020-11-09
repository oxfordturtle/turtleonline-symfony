import subroutine from './subroutine'
import { statement } from './statement'
import Lexemes from '../definitions/lexemes'
import Program from '../definitions/program'
import { Subroutine } from '../definitions/subroutine'
import { Lexeme } from '../../lexer/lexeme'

/** parses lexemes as a Python program */
export default function python (lexemes: Lexemes): Program {
  // create the program
  const program = new Program('Python')
  program.end = lexemes.lexemes.length

  // parse the program (which will parse its subroutines in turn)
  parseBody(lexemes, program)

  // return the program
  return program
}

/** parses the body of a routine, generating statements from its lexemes */
function parseBody (lexemes: Lexemes, routine: Program|Subroutine): void {
  // first pass: hoist global and nonlocal declarations and subroutine definitions
  let indents: number = 0
  lexemes.index = routine.start
  while (lexemes.index < routine.end) {
    const lexeme = lexemes.get() as Lexeme
    lexemes.next()
    switch (lexeme.type) {
      // indents
      case 'indent':
        indents += 1
        break

      // dedents
      case 'dedent':
        indents -= 1
        break

      // keywords
      case 'keyword':
        if (lexeme.subtype === 'def') {
          routine.subroutines.push(subroutine(lexeme, lexemes, routine, indents))
        }
        break
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
