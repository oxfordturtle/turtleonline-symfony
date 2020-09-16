import { Expression, CommandCall } from './expression'
import { Variable } from './variable'

export type Statement =
  | VariableAssignment
  | CommandCall
  | IfStatement
  | ForStatement
  | RepeatStatement
  | WhileStatement

export class VariableAssignment {
  variable: Variable
  indexes: number[] = []
  value: Expression

  constructor (variable: Variable) {
    this.variable = variable
  }
}

export class IfStatement {
  condition: Expression
  ifStatements: Statement[] = []
  elseStatements: Statement[] = []
}

export class ForStatement {
  initialisation: VariableAssignment
  condition: Expression
  change: VariableAssignment
  statements: Statement[] = []
}

export class RepeatStatement {
  condition: Expression
  statements: Statement[] = []
}

export class WhileStatement {
  condition: Expression
  statements: Statement[] = []
}
