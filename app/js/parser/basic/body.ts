import { statement } from './statement'
import Program from '../definitions/program'
import type { Subroutine } from '../definitions/subroutine'
import type { Lexeme } from '../../lexer/lexeme'
import type Lexemes from '../definitions/lexemes'

/** parses the body of a routine */
export default function body (lexemes: Lexemes, routine: Program|Subroutine): void {
  lexemes.index = routine.start
  while (lexemes.index < routine.end) {
    routine.statements.push(statement(lexemes.get() as Lexeme, lexemes, routine))
  }
}
