/**
 * Generates the pcode for a statement.
 */
import { Options } from './options'
import expression from './expression'
import { PCode } from '../constants/pcodes'
import {
  Program,
  Subroutine
} from '../parser/routine'
import {
  CommandCall
} from '../parser/expression'
import {
  Statement,
  VariableAssignment,
  IfStatement,
  ForStatement,
  RepeatStatement,
  WhileStatement
} from '../parser/statement'

/** generates the pcode for a statement of any kind */
export default function statement (stmt: Statement, program: Program, startLine: number, options: Options): number[][] {
  if (stmt instanceof VariableAssignment) {
    return [variableAssignment(stmt, program, options)]
  } else if (stmt instanceof CommandCall) {
    return [procedureCall(stmt, program, startLine, options)]
  } else if (stmt instanceof IfStatement) {
    return ifStatement(stmt, program, startLine, options)
  } else if (stmt instanceof ForStatement) {
    return forStatement(stmt, program, startLine, options)
  } else if (stmt instanceof RepeatStatement) {
    return repeatStatement(stmt, program, startLine, options)
  } else if (stmt instanceof WhileStatement) {
    return whileStatement(stmt, program, startLine, options)
  }
}

/** generates the pcode for a variable assignment */
function variableAssignment (stmt: VariableAssignment, program: Program, options: Options): number[] {
  return stmt.variable.isGlobal
    ? globalVariableAssignment(stmt, program, options)
    : localVariableAssignment(stmt, program, options)
}

/** generates the pcode for a global variable assignment */
function globalVariableAssignment (stmt: VariableAssignment, program: Program, options: Options): number[] {
  const { variable, indexes, value } = stmt
  const address = program.turtleAddress + program.turtleVariables.length + variable.index

  const pcode = expression(value, program, options)

  // global turtle property
  if (variable.turtle) {
    // turtle variable
    // TODO: after NEWTURTLE??
    pcode.push(PCode.stvg, program.turtleAddress + variable.turtle)
  }

  // global array
  else if (variable.isArray) {
    // TODO
  }

  // global string: character assignment
  else if (variable.type === 'string' && indexes.length > 0) {
    // TODO
  }

  // global string
  else if (variable.type === 'string') {
    pcode.push(PCode.ldvg, address, PCode.cstr)
  }

  // global boolean/character/integer
  else {
    pcode.push(PCode.stvg, address)
  }

  return pcode
}

/** generates the pcode for a local variable assignment */
function localVariableAssignment (stmt: VariableAssignment, program: Program, options: Options): number[] {
  const { variable, indexes, value } = stmt

  const pcode = expression(value, program, options)

  // local reference parameter
  if (variable.isReferenceParameter) {
    // TODO
  }

  // local array
  else if (variable.isArray) {
    // TODO
  }

  // local string: character assignment
  else if (variable.type === 'string' && indexes.length > 0) {
    // TODO
  }

  // local string
  else if (variable.type === 'string') {
    pcode.push(PCode.ldvv, variable.routine.index + program.baseOffset, variable.index, PCode.cstr)
  }

  // local boolean/character/integer
  else {
    pcode.push(PCode.stvv, variable.routine.index + program.baseOffset, variable.index)
  }

  return pcode
}

/** generates the pcode for a procedure call */
function procedureCall (stmt: CommandCall, program: Program, startLine: number, options: Options): number[] {
  const pcode = []

  // first: load arguments onto the stack
  for (let index = 0; index < stmt.command.parameters.length; index += 1) {
    const arg = stmt.arguments[index]
    const param = stmt.command.parameters[index]
    pcode.push(...expression(arg, program, options, param.isReferenceParameter))
  }

  // next: code for the command
  if (stmt.command instanceof Subroutine) {
    // custom commands
    const startLine = (program.language === 'BASIC')
      ? stmt.command.index     // in BASIC, we don't know the start line yet,
      : stmt.command.startLine // so this will be backpatched later
    pcode.push(PCode.subr, startLine)
  } else {
    // native commands
    if (stmt.command.code[0] === PCode.oldt) {
      // this is a special case, because compilation requires knowing the original turtle address
      pcode.push(PCode.ldin, program.turtleAddress, PCode.ldin, 0, PCode.sptr)
    } else {
      pcode.push(...stmt.command.code)
    }
  }

  return pcode
}

/** generates the pcode for an IF statement */
function ifStatement (stmt: IfStatement, program: Program, startLine: number, options: Options): number[][] {
  // inner lines: pcode for all IF substatements
  const ifPcode = []
  for (const subStmt of stmt.ifStatements) {
    const subStartLine = startLine + ifPcode.length + 1
    ifPcode.push(...statement(subStmt, program, subStartLine, options))
  }

  // more inner lines: pcode for all ELSE statements
  const elsePcode = []
  for (const subStmt of stmt.elseStatements) {
    const subStartLine = startLine + ifPcode.length + elsePcode.length + 2
    elsePcode.push(...statement(subStmt, program, subStartLine, options))
  }

  // plain IF statement
  if (elsePcode.length === 0) {
    // first lines: evaluate condition; if false, jump past all IF statements
    const firstLine = expression(stmt.condition, program, options)
    firstLine.push(PCode.ifno, startLine + ifPcode.length + 1)
    ifPcode.unshift(firstLine)
    return ifPcode
  }
  
  // IF-ELSE statement
  // first lines: evaluate condition; if false, jump past all IF statements and ELSE jump
  const firstLine = expression(stmt.condition, program, options)
  firstLine.push(PCode.ifno, startLine + ifPcode.length + 2)

  // middle line: jump past ELSE statements (at end of IF statements)
  const middleLine = [PCode.jump, startLine + ifPcode.length + elsePcode.length + 2]

  ifPcode.unshift(firstLine)
  ifPcode.push(middleLine)
  return ifPcode.concat(elsePcode)
}

/** generates the pcode for a FOR statement */
function forStatement (stmt: ForStatement, program: Program, startLine: number, options: Options): number[][] {
  const pcode = []

  // middle lines: pcode for all substatements
  for (const subStmt of stmt.statements) {
    const subStartLine = startLine + pcode.length + 2
    pcode.push(...statement(subStmt, program, subStartLine, options))
  }

  // second line: loop test
  pcode.unshift(expression(stmt.condition, program, options))
  pcode[0].push(PCode.ifno, startLine + pcode.length + 2)

  // first line: initialise loop variable
  pcode.unshift(variableAssignment(stmt.initialisation, program, options))

  // last line: modify loop variable, then jump back to second line (loop test)
  pcode.push(variableAssignment(stmt.change, program, options))
  pcode[pcode.length - 1].push(PCode.jump, startLine + 1)

  return pcode
}

/** generates the pcode for a REPEAT statement */
function repeatStatement (stmt: RepeatStatement, program: Program, startLine: number, options: Options): number[][] {
  const pcode = []

  // first lines: pcode for all substatements
  for (const subStmt of stmt.statements) {
    const subStartLine = startLine + pcode.length
    pcode.push(...statement(subStmt, program, subStartLine, options))
  }

  // last line: evaluate boolean expression; if false, jump back to start
  pcode.push(expression(stmt.condition, program, options))
  pcode[pcode.length - 1].push(PCode.ifno, startLine)

  // return the pcode
  return pcode
}

/** generates the pcode for a WHILE statement */
function whileStatement (stmt: WhileStatement, program: Program, startLine: number, options: Options): number[][] {
  const pcode = []

  // middle lines: pcode for all substatements
  for (const subStmt of stmt.statements) {
    const subStartLine = startLine + pcode.length + 1
    pcode.push(...statement(subStmt, program, subStartLine, options))
  }

  // first line: evalutate boolean expression; if false, jump out of the loop
  const nextLine = startLine + pcode.length + 2 // +2 for first line and last line
  pcode.unshift(expression(stmt.condition, program, options))
  pcode[0].push(PCode.ifno, nextLine)

  // last line: jump back to first line
  pcode.push([PCode.jump, startLine])

  return pcode
}
