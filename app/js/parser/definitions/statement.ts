import type { Expression } from './expression'
import type { Subroutine } from './subroutine'
import type { Constant } from './constant'
import type Variable from './variable'
import type { Command } from '../../constants/commands'
import type { IdentifierLexeme, KeywordLexeme, OperatorLexeme } from '../../lexer/lexeme'

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
  readonly statementType = 'variableAssignment'
  readonly lexeme: OperatorLexeme
  readonly variable: Variable
  readonly indexes: Expression[]
  readonly value: Expression

  /** constructor */
  constructor (lexeme: OperatorLexeme, variable: Variable, indexes: Expression[], value: Expression) {
    this.lexeme = lexeme
    this.variable = variable
    this.indexes = indexes
    this.value = value
  }
}

/** procedure call */
export class ProcedureCall {
  readonly statementType = 'procedureCall'
  readonly lexeme: IdentifierLexeme
  readonly command: Subroutine|Command
  readonly arguments: Expression[] = []

  constructor (lexeme: IdentifierLexeme, command: Subroutine|Command) {
    this.lexeme = lexeme
    this.command = command
  }
}

/** if statement */
export class IfStatement {
  readonly statementType = 'ifStatement'
  readonly lexeme: KeywordLexeme
  readonly condition: Expression
  readonly ifStatements: Statement[] = []
  readonly elseStatements: Statement[] = []
  readonly variables: Variable[] = []
  readonly constants: Constant[] = []

  constructor (lexeme: KeywordLexeme, condition: Expression) {
    this.lexeme = lexeme
    this.condition = condition
  }
}

/** for statement */
export class ForStatement {
  readonly statementType = 'forStatement'
  readonly lexeme: KeywordLexeme
  readonly initialisation: VariableAssignment
  readonly condition: Expression
  readonly change: VariableAssignment
  readonly statements: Statement[] = []
  readonly variables: Variable[] = []
  readonly constants: Constant[] = []

  constructor (lexeme: KeywordLexeme, initialisation: VariableAssignment, condition: Expression, change: VariableAssignment) {
    this.lexeme = lexeme
    this.initialisation = initialisation
    this.condition = condition
    this.change = change
  }
}

/** repeat statement */
export class RepeatStatement {
  readonly statementType = 'repeatStatement'
  readonly lexeme: KeywordLexeme
  readonly condition: Expression
  readonly statements: Statement[] = []
  readonly variables: Variable[] = []
  readonly constants: Constant[] = []

  constructor (lexeme: KeywordLexeme, condition: Expression) {
    this.lexeme = lexeme
    this.condition = condition
  }
}

/** while statement */
export class WhileStatement {
  readonly statementType = 'whileStatement'
  readonly lexeme: KeywordLexeme
  readonly condition: Expression
  readonly statements: Statement[] = []
  readonly variables: Variable[] = []
  readonly constants: Constant[] = []

  constructor (lexeme: KeywordLexeme, condition: Expression) {
    this.lexeme = lexeme
    this.condition = condition
  }
}

/** return statement */
export class ReturnStatement {
  readonly statementType = 'returnStatement'
  readonly lexeme: KeywordLexeme|OperatorLexeme // "=" operator in BASIC, "return" keyword in other languages
  readonly routine: Subroutine
  readonly value: Expression

  constructor (lexeme: KeywordLexeme|OperatorLexeme, routine: Subroutine, value: Expression) {
    this.lexeme = lexeme
    this.routine = routine
    this.value = value
  }
}

/** pass statement */
export class PassStatement {
  readonly statementType = 'passStatement'
}
