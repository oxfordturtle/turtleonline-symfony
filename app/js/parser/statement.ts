import { Expression, CommandCall, LiteralValue } from './expression'
import { Routine, Subroutine } from './routine'
import { Variable } from './variable'

export type Statement =
  | VariableAssignment
  | CommandCall
  | IfStatement
  | ForStatement
  | RepeatStatement
  | WhileStatement
  | ReturnStatement
  | PassStatement

export class VariableAssignment {
  variable: Variable
  indexes: Expression[] = []
  value: Expression = placeholderExpression

  constructor (variable: Variable) {
    this.variable = variable
  }
}

export class IfStatement {
  condition: Expression = placeholderExpression
  ifStatements: Statement[] = []
  elseStatements: Statement[] = []
}

export class ForStatement {
  initialisation: VariableAssignment = placeholderVariableAssigment
  condition: Expression = placeholderExpression
  change: VariableAssignment = placeholderVariableAssigment
  statements: Statement[] = []
}

export class RepeatStatement {
  condition: Expression = placeholderExpression
  statements: Statement[] = []
}

export class WhileStatement {
  condition: Expression = placeholderExpression
  statements: Statement[] = []
}

export class ReturnStatement {
  routine: Subroutine
  value: Expression = placeholderExpression

  constructor (routine: Subroutine) {
    this.routine = routine
  }
}

export class PassStatement {}

const placeholderExpression = new LiteralValue('boolint', 0)

const placeholderRoutine = new Routine('foo')

const placeholderVariable = new Variable('foo', placeholderRoutine)

const placeholderVariableAssigment = new VariableAssignment(placeholderVariable)
