import { Expression, CommandCall, LiteralValue } from './expression'
import { Routine } from './routine'
import { Variable } from './variable'

export type Statement =
  | VariableAssignment
  | CommandCall
  | IfStatement
  | ForStatement
  | RepeatStatement
  | WhileStatement
  | PassStatement

export class VariableAssignment {
  variable: Variable
  indexes: number[] = []
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

export class PassStatement {}

const placeholderExpression = new LiteralValue('boolint', 0)

const placeholderRoutine = new Routine('foo')

const placeholderVariable = new Variable('foo', placeholderRoutine)

const placeholderVariableAssigment = new VariableAssignment(placeholderVariable)
