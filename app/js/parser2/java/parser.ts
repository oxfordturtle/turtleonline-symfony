import program from './program'
import constant from './constant'
import { statement, simpleStatement, eosCheck } from './statement'
import type from './type'
import identifier from './identifier'
import method from './method'
import { Program } from '../definitions/program'
import { Lexeme } from '../../lexer/lexeme'
import { CompilerError } from '../../tools/error'

/** parses lexemes as a Java program */
export default function java (lexemes: Lexeme[]): Program {
  // create the program
  const prog = program(lexemes)

  // first pass: hoist all constants, variables, and methods
  while (prog.lex()) {
    // constant definitions
    if (prog.lex()?.content === 'final') {
      prog.constants.push(constant(prog))
      eosCheck(prog)
    }

    // variable declarations/assignments or method definitions
    else {
      // remember current lexeme index
      const lexemeIndex = prog.lexemeIndex

      // expecting type specification followed by idenfitier (throw away the results)
      type(prog)
      identifier(prog)
  
      // open bracket here means its a method
      if (prog.lex()?.content === '(') {
        prog.lexemeIndex = lexemeIndex // go back to the start
        prog.subroutines.push(method(prog))
      }

      // otherwise its a variable declaration/assignment
      else {
        prog.lexemeIndex = lexemeIndex // go back to the start
        prog.statements.push(simpleStatement(prog))
        eosCheck(prog)
      }
    }
  }

  // second pass: parse the statements of each method
  for (const subroutine of prog.allSubroutines) {
    // loop through the lexemes
    while (subroutine.lex()) {
      subroutine.statements.push(statement(subroutine))
    }
  }

  // check for a main method
  if (!prog.subroutines.some(x => x.name === 'main')) {
    throw new CompilerError('Program does not contain any "main" method.')
  }

  // return the program
  return prog
}
