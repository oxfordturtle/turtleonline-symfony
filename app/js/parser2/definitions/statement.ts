import { Constant } from './constant'
import { Expression, LiteralValue } from './expression'
import { Program } from './program'
import { Subroutine } from './subroutine'
import { Variable } from './variable'
import { Command } from '../../constants/commands'

/** statement */
export type Statement =
  | VariableAssignment
  | ProcedureCall
  | IfStatement
  | ForStatement
  | RepeatStatement
  | WhileStatement
  | ReturnStatement
  | PassStatement

/** variable assignment */
export class VariableAssignment {
  variable: Variable
  indexes: Expression[] = []
  value: Expression = placeholderExpression

  /** constructor */
  constructor (variable: Variable) {
    this.variable = variable
  }
}

/** procedure call */
export class ProcedureCall {
  readonly command: Subroutine|Command
  readonly arguments: Expression[] = []

  constructor (command: Subroutine|Command) {
    this.command = command
  }
}

/** if statement */
export class IfStatement {
  variables: Variable[] = []
  constants: Constant[] = []
  condition: Expression = placeholderExpression
  ifStatements: Statement[] = []
  elseStatements: Statement[] = []
}

/** for statement */
export class ForStatement {
  variables: Variable[] = []
  constants: Constant[] = []
  initialisation: VariableAssignment = placeholderVariableAssigment
  condition: Expression = placeholderExpression
  change: VariableAssignment = placeholderVariableAssigment
  statements: Statement[] = []
}

/** repeat statement */
export class RepeatStatement {
  variables: Variable[] = []
  constants: Constant[] = []
  condition: Expression = placeholderExpression
  statements: Statement[] = []
}

/** while statement */
export class WhileStatement {
  variables: Variable[] = []
  constants: Constant[] = []
  condition: Expression = placeholderExpression
  statements: Statement[] = []
}

/** return statement */
export class ReturnStatement {
  routine: Subroutine
  value: Expression = placeholderExpression

  /** constructor */
  constructor (routine: Subroutine) {
    this.routine = routine
  }
}

/** pass statement */
export class PassStatement {}

/** placeholders for use in constructors */
const placeholderExpression = new LiteralValue('boolint', 0)
const placeHolderProgram = new Program('C', [])
const placeholderRoutine = new Subroutine(placeHolderProgram)
const placeholderVariable = new Variable('foo', placeholderRoutine)
const placeholderVariableAssigment = new VariableAssignment(placeholderVariable)
