import constant from './constant'
import { statement, simpleStatement, eosCheck } from './statement'
import type from './type'
import identifier from './identifier'
import subroutine from './subroutine'
import Lexemes from '../definitions/lexemes'
import Program from '../definitions/program'
import { CompilerError } from '../../tools/error'
import { Lexeme } from '../../lexer/lexeme'

/** parses lexemes as a C program */
export default function c (lexemes: Lexemes): Program {
  // create the program
  const program = new Program('C')

  // first pass: hoist all constants, variables, and methods
  while (lexemes.get()) {
    const lexeme = lexemes.get() as Lexeme
    const lexemeIndex = lexemes.index

    switch (lexeme.type) {
      case 'keyword':
        if (lexeme.subtype === 'const') {
          lexemes.next()
          program.constants.push(constant(lexemes, program))
          eosCheck(lexemes)
        } else {
          throw new CompilerError('Program can only contain constant definitions, variable declarations, and subroutine defintions.', lexeme)
        }
        break

      case 'type':
        // expecting type specification followed by idenfitier (throw away the results)
        type(lexemes)
        identifier(lexemes, program)
    
        // open bracket here means its a subroutine
        if (lexemes.get()?.content === '(') {
          lexemes.index = lexemeIndex // go back to the start
          program.subroutines.push(subroutine(lexeme, lexemes, program))
        }

        // otherwise its a variable declaration/assignment
        else {
          lexemes.index = lexemeIndex // go back to the start
          program.statements.push(simpleStatement(lexeme, lexemes, program))
          eosCheck(lexemes)
        }
        break

      default:
        throw new CompilerError('Program can only contain constant definitions, variable declarations, and subroutine defintions.', lexeme)
    }
  }

  // second pass: parse the statements of each subroutine
  for (const subroutine of program.allSubroutines) {
    // loop through the lexemes
    lexemes.index = subroutine.start
    while (lexemes.index < subroutine.end) {
      subroutine.statements.push(statement(lexemes.get() as Lexeme, lexemes, subroutine))
    }
  }

  // check for a main subroutine
  if (!program.subroutines.some(x => x.name === 'main')) {
    throw new CompilerError('Program does not contain any "main" method.')
  }

  // return the program
  return program
}
