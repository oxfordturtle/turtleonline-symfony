import program from './program'
import constant from './constant'
import type from './type'
import identifier from './identifier'
import { variable, varStatement } from './variable'
import { method, parameters, body } from './method'
import * as find from '../find'
import { Program } from '../definitions/program'
import { Subroutine } from '../definitions/subroutine'
import { Variable } from '../definitions/variable'
import { Lexeme } from '../../lexer/lexeme'
import { CompilerError } from '../../tools/error'
import { Lex } from '../lex'
import { VariableAssignment } from '../../parser/statement'

/** parses lexemes as a Java program */
export default function java (lexemes: Lexeme[]): Program {
  // intialise the lex object
  const lex = new Lex(lexemes)

  // create the program (this will also discard outer lexemes "class ProgramName { ... }")
  const prog = program(lex)

  // first pass: hoist all constants, variables, and methods
  hoistProperties(prog, lex)

  // second pass: parse the substance of variable assignments and method statements
  parseSubstance(prog, lex)

  // check for a main method
  if (!prog.subroutines.some(x => x.name === 'main')) {
    throw new CompilerError('Program does not contain any "main" method.')
  }

  // return the program
  return prog
}

/** runs through program lexemes and hoists property definitions */
function hoistProperties (program: Program, lex: Lex): void {
  // reset lexeme counter
  lex.index = 0

  // loop through the lexemes
  while (lex.get()) {
    // constant definitions
    if (lex.content() === 'final') {
      program.constants.push(constant(program, lex))
    }

    // variable declarations/assignments or method definitions
    else {
      // remember current lexeme index
      const index = lex.index

      // expecting type specification followed by idenfitier (throw away the results)
      type(lex)
      identifier(program, lex)
  
      // open bracket here means its a method
      if (lex.content() === '(') {
        lex.index = index // go back to the start
        program.subroutines.push(method(program, lex))
      }

      // otherwise its a variable declaration/assignment
      else {
        lex.index = index // go back to the start
        program.variables.push(variable(program, lex))
      }
    }
  }
}

/** runs through program lexemes and parses the substance */
function parseSubstance (program: Program, lex: Lex): void {
  // reset lexeme counter
  lex.index = 0

  // loop through the lexemes
  while (lex.get()) {
    // constant definition
    if (lex.content() === 'final') {
      // already done everything here on the first pass; just move on
      constant(program, lex) // forget about the result
    }

    // variable declarations/assignments or method definitions
    else {
      // expecting type specification
      type(lex) // throw away the result; we've already got it from the first pass

      // expecting identifier
      const name = identifier(program, lex)

      // find the variable or method (it will definitely exist following a successful first pass)
      const match = find.variable(program, name) || find.subroutine(program, name)

      // variable declaration/assignment
      if (match instanceof Variable) {
        const statement = varStatement(lex, match)
        if (statement instanceof VariableAssignment) {
          // declarations are of no interest at this stage, but we need to keep
          // the assignments
          program.statements.push(statement)
        }
      }

      // method definition
      else if (match instanceof Subroutine) {
        match.variables.push(...parameters(lex))
        match.statements.push(body(match, lex))
      }
    }
  }
}
