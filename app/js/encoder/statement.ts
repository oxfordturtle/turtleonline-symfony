/**
 * Generates the pcode for a statement.
 */
import { Options } from './options'
import { merge, expression } from './expression'
import { PCode } from '../constants/pcodes'
import { Program, Subroutine } from '../parser/routine'
import { CommandCall, VariableAddress, VariableValue } from '../parser/expression'
import { Statement, VariableAssignment, IfStatement, ForStatement, RepeatStatement, WhileStatement, ReturnStatement } from '../parser/statement'

/** generates the pcode for a statement of any kind */
export default function statement (stmt: Statement, program: Program, startLine: number, options: Options): number[][] {
  if (stmt instanceof VariableAssignment) {
    return variableAssignment(stmt, program, options)
  }
  
  if (stmt instanceof CommandCall) {
    return procedureCall(stmt, program, options)
  }
  
  if (stmt instanceof IfStatement) {
    return ifStatement(stmt, program, startLine, options)
  }
  
  if (stmt instanceof ForStatement) {
    return forStatement(stmt, program, startLine, options)
  }
  
  if (stmt instanceof RepeatStatement) {
    return repeatStatement(stmt, program, startLine, options)
  }
  
  if (stmt instanceof WhileStatement) {
    return whileStatement(stmt, program, startLine, options)
  }

  if (stmt instanceof ReturnStatement) {
    return returnStatement(stmt, program, options)
  }

  // pass statement - do nothing
  return []
}

/** generates the pcode for a variable assignment */
function variableAssignment (stmt: VariableAssignment, program: Program, options: Options): number[][] {
  if (stmt.variable.turtle) {
    return turtleVariableAssignment(stmt, program, options)
  }

  if (stmt.variable.isGlobal) {
    return globalVariableAssignment(stmt, program, options)
  }

  if (stmt.variable.isPointer) {
    return pointerVariableAssignment(stmt, program, options)
  }

  if (stmt.variable.isReferenceParameter) {
    return referenceVariableAssignment(stmt, program, options)
  }

  return localVariableAssignment(stmt, program, options)
}

/** generates the pcode for a turtle variable assignment */
function turtleVariableAssignment (stmt: VariableAssignment, program: Program, options: Options): number[][] {
  const pcode = expression(stmt.value, program, options)

  // TODO: after NEWTURTLE??
  merge(pcode, [[PCode.stvg, program.turtleAddress + (stmt.variable.turtle as number)]])

  return pcode
}

/** generates the pcode for a global variable assignment */
function globalVariableAssignment (stmt: VariableAssignment, program: Program, options: Options): number[][] {
  const address = program.turtleAddress + program.turtleVariables.length + stmt.variable.index
  const pcode = expression(stmt.value, program, options)

  // global array
  if (stmt.variable.isArray || (stmt.variable.type === 'string' && stmt.indexes.length > 0)) {
    // TODO: multi dimensional stuff
    const exp = new VariableValue(stmt.variable)
    exp.indexes.push(...stmt.indexes)
    const element = expression(exp, program, options)
    const lastLine = element[element.length - 1]
    lastLine[lastLine.length - 1] = PCode.sptr // change LPTR to SPTR
    merge(pcode, element)
  }

  // global string
  else if (stmt.variable.type === 'string') {
    merge(pcode, [[PCode.ldvg, address, PCode.cstr]])
  }

  // global boolean/character/integer
  else {
    merge(pcode, [[PCode.stvg, address]])
  }

  return pcode
}

/** generates the pcode for a pointer variable assignment */
function pointerVariableAssignment (stmt: VariableAssignment, program: Program, options: Options): number[][] {
  const pcode = expression(stmt.value, program, options)

  const variableAddress = new VariableAddress(stmt.variable)
  merge(pcode, expression(variableAddress, program, options))

  if (stmt.variable.type === 'string') {
    merge(pcode, [[PCode.cstr]])
  } else {
    merge(pcode, [[PCode.poke]])
  }

  return pcode
}

/** generates the pcode for a reference variable assignment */
function referenceVariableAssignment (stmt: VariableAssignment, program: Program, options: Options): number[][] {
  const pcode = expression(stmt.value, program, options)

  // TODO: array reference parameters
  merge(pcode, [[PCode.stvr, stmt.variable.routine.index + program.baseOffset, stmt.variable.index]])

  return pcode
}

/** generates the pcode for a local variable assignment */
function localVariableAssignment (stmt: VariableAssignment, program: Program, options: Options): number[][] {
  const pcode = expression(stmt.value, program, options)

  // local array
  if (stmt.variable.isArray || (stmt.variable.type === 'string' && stmt.indexes.length > 0)) {
    // TODO: multi dimensional stuff
    const exp = new VariableValue(stmt.variable)
    exp.indexes.push(...stmt.indexes)
    const element = expression(exp, program, options)
    const lastLine = element[element.length - 1]
    lastLine[lastLine.length - 1] = PCode.sptr // change LPTR to SPTR
    merge(pcode, element)
  }

  // local string
  else if (stmt.variable.type === 'string') {
    merge(pcode, [[PCode.ldvv, stmt.variable.routine.index + program.baseOffset, stmt.variable.index, PCode.cstr]])
  }

  // local boolean/character/integer
  else {
    merge(pcode, [[PCode.stvv, stmt.variable.routine.index + program.baseOffset, stmt.variable.index]])
  }

  return pcode
}

/** generates the pcode for a procedure call */
function procedureCall (stmt: CommandCall, program: Program, options: Options): number[][] {
  const pcode: number[][] = []

  // first: load arguments onto the stack
  for (let index = 0; index < stmt.command.parameters.length; index += 1) {
    const arg = stmt.arguments[index]
    const param = stmt.command.parameters[index]
    merge(pcode, expression(arg, program, options, param.isReferenceParameter))
  }

  // next: code for the command
  if (stmt.command instanceof Subroutine) {
    // custom commands
    // N.B. use command index as placeholder for now; this will be backpatched
    // when compilation is otherwise complete
    merge(pcode, [[PCode.subr, stmt.command.index]])
  } else {
    // native commands
    if (stmt.command.code[0] === PCode.oldt) {
      // this is a special case, because compilation requires knowing the original turtle address
      merge(pcode, [[PCode.ldin, program.turtleAddress, PCode.ldin, 0, PCode.sptr]])
    } else {
      // copy the command.code array so it isn't modified subsequently
      merge(pcode, [stmt.command.code.slice()])
    }
  }

  return pcode
}

/** generates the pcode for an IF statement */
function ifStatement (stmt: IfStatement, program: Program, startLine: number, options: Options): number[][] {
  const firstLines = expression(stmt.condition, program, options)

  // inner lines: pcode for all IF substatements
  const ifPcode: number[][] = []
  for (const subStmt of stmt.ifStatements) {
    const subStartLine = startLine + ifPcode.length + firstLines.length
    ifPcode.push(...statement(subStmt, program, subStartLine, options))
  }

  // more inner lines: pcode for all ELSE statements
  const elsePcode: number[][] = []
  for (const subStmt of stmt.elseStatements) {
    const subStartLine = startLine + ifPcode.length + elsePcode.length + firstLines.length + 1
    elsePcode.push(...statement(subStmt, program, subStartLine, options))
  }

  // plain IF statement
  if (elsePcode.length === 0) {
    // first lines: evaluate condition; if false, jump past all IF statements
    merge(firstLines, [[PCode.ifno, startLine + ifPcode.length + firstLines.length]])
    ifPcode.unshift(...firstLines)
    return ifPcode
  }
  
  // IF-ELSE statement
  // first lines: evaluate condition; if false, jump past all IF statements and ELSE jump
  merge(firstLines, [[PCode.ifno, startLine + ifPcode.length + firstLines.length + 1]])

  // middle line: jump past ELSE statements (at end of IF statements)
  const middleLine = [PCode.jump, startLine + ifPcode.length + elsePcode.length + firstLines.length + 1]

  ifPcode.unshift(...firstLines)
  ifPcode.push(middleLine)
  return ifPcode.concat(elsePcode)
}

/** generates the pcode for a FOR statement */
function forStatement (stmt: ForStatement, program: Program, startLine: number, options: Options): number[][] {
  const pcode: number[][] = []

  // middle lines: pcode for all substatements
  for (const subStmt of stmt.statements) {
    const subStartLine = startLine + pcode.length + 2
    pcode.push(...statement(subStmt, program, subStartLine, options))
  }

  // second lines: loop condition
  const condition = expression(stmt.condition, program, options)
  merge(condition, [[PCode.ifno, startLine + pcode.length + condition.length + 2]])
  pcode.unshift(...condition)

  // first lines: initialise loop variable
  pcode.unshift(...variableAssignment(stmt.initialisation, program, options))

  // last lines: modify loop variable, then jump back to second lines (loop test)
  pcode.push(...variableAssignment(stmt.change, program, options))
  merge(pcode, [[PCode.jump, startLine + 1]])

  return pcode
}

/** generates the pcode for a REPEAT statement */
function repeatStatement (stmt: RepeatStatement, program: Program, startLine: number, options: Options): number[][] {
  const pcode: number[][] = []

  // first lines: pcode for all substatements
  for (const subStmt of stmt.statements) {
    const subStartLine = startLine + pcode.length
    pcode.push(...statement(subStmt, program, subStartLine, options))
  }

  // last line: evaluate boolean expression; if false, jump back to start
  const condition = expression(stmt.condition, program, options)
  merge(condition, [[PCode.ifno, startLine]])
  pcode.push(...condition)

  // return the pcode
  return pcode
}

/** generates the pcode for a WHILE statement */
function whileStatement (stmt: WhileStatement, program: Program, startLine: number, options: Options): number[][] {
  const pcode: number[][] = []

  // middle lines: pcode for all substatements
  for (const subStmt of stmt.statements) {
    const subStartLine = startLine + pcode.length + 1
    pcode.push(...statement(subStmt, program, subStartLine, options))
  }

  // first lines: evalutate boolean expression; if false, jump out of the loop
  const condition = expression(stmt.condition, program, options)
  const nextLine = startLine + pcode.length + condition.length + 1 // +1 for last line
  merge(condition, [[PCode.ifno, nextLine]])
  pcode.unshift(...condition)

  // last line: jump back to first line
  pcode.push([PCode.jump, startLine])

  return pcode
}

/** generates the pcode for a RETURN statement */
function returnStatement (stmt: ReturnStatement, program: Program, options: Options): number[][] {
  const variableAssignment = new VariableAssignment(stmt.routine.variables[0])
  variableAssignment.value = stmt.value

  const pcode = localVariableAssignment(variableAssignment, program, options)
  pcode.push([
    PCode.ldvg,
    stmt.routine.address,
    PCode.stvg,
    program.resultAddress,
    PCode.memr,
    stmt.routine.address,
    PCode.plsr,
    PCode.retn
  ])

  return pcode
}
