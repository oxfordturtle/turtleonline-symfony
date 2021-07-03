import type { Subroutine } from './subroutine'
import type Variable from './variable'
import type { Constant } from './constant'
import type { Type, Operator } from '../../lexer/lexeme'
import type { Command } from '../../constants/commands'
import type { Input } from '../../constants/inputs'
import type { Colour } from '../../constants/colours'
import type {
  Lexeme,
  BooleanLexeme,
  CharacterLexeme,
  IdentifierLexeme,
  IntegerLexeme,
  InputcodeLexeme,
  OperatorLexeme,
  QuerycodeLexeme,
  StringLexeme
} from '../../lexer/lexeme'
import { type } from './operators'

/** expression */
export type Expression =
  | IntegerValue
  | StringValue
  | InputValue
  | ColourValue
  | ConstantValue
  | VariableAddress
  | VariableValue
  | FunctionCall
  | CompoundExpression
  | CastExpression

/** integer value (including booleans and characters) */
export class IntegerValue {
  readonly expressionType = 'integer'
  readonly lexeme: BooleanLexeme|CharacterLexeme|IntegerLexeme
  readonly value: number

  constructor (lexeme: BooleanLexeme|CharacterLexeme|IntegerLexeme) {
    this.lexeme = lexeme
    this.value = lexeme.value
  }

  get type (): Type {
    return this.lexeme.subtype
  }
}

/** string value */
export class StringValue {
  readonly expressionType = 'string'
  readonly lexeme: StringLexeme
  readonly value: string
  readonly type: Type = 'string'

  constructor (lexeme: StringLexeme) {
    this.lexeme = lexeme
    this.value = lexeme.value
  }
}

/** input value */
export class InputValue {
  readonly expressionType = 'input'
  readonly lexeme: InputcodeLexeme|QuerycodeLexeme
  readonly input: Input
  readonly type: Type = 'integer'

  constructor (lexeme: InputcodeLexeme|QuerycodeLexeme, input: Input) {
    this.lexeme = lexeme
    this.input = input
  }
}

/** colour value */
export class ColourValue {
  readonly expressionType = 'colour'
  readonly lexeme: IdentifierLexeme
  readonly colour: Colour
  readonly type: Type = 'integer'

  constructor (lexeme: IdentifierLexeme, colour: Colour) {
    this.lexeme = lexeme
    this.colour = colour
  }
}

/** constant value */
export class ConstantValue {
  readonly expressionType = 'constant'
  readonly lexeme: IdentifierLexeme
  readonly constant: Constant
  readonly indexes: Expression[] = [] // for indexing characters in string constants

  constructor (lexeme: IdentifierLexeme, constant: Constant) {
    this.lexeme = lexeme
    this.constant = constant
  }

  get type (): Type {
    // type is not known in advance, as it depends on this.indexes.length
    switch (this.constant.language) {
      case 'C':
      case 'Java':
      case 'Pascal':
        return (this.constant.type === 'string' && this.indexes.length > 0) ? 'character' : this.constant.type
      default:
        return this.constant.type
    }
  }
}

/** variable address */
export class VariableAddress {
  readonly expressionType = 'address'
  readonly lexeme: IdentifierLexeme
  readonly variable: Variable
  readonly indexes: Expression[] = [] // for array variables
  readonly type: Type = 'integer'

  constructor (lexeme: IdentifierLexeme, variable: Variable) {
    this.lexeme = lexeme
    this.variable = variable
  }
}

/** variable value */
export class VariableValue {
  readonly expressionType = 'variable'
  readonly lexeme: IdentifierLexeme
  readonly variable: Variable
  readonly indexes: Expression[] = [] // for array variables

  constructor (lexeme: IdentifierLexeme, variable: Variable) {
    this.lexeme = lexeme
    this.variable = variable
  }

  get type (): Type {
    // type is not known in advance, as it depends on this.indexes.length
    switch (this.variable.routine.language) {
      case 'C':
      case 'Java':
      case 'Pascal':
        return (this.variable.type === 'string' && this.indexes.length > this.variable.arrayDimensions.length)
          ? 'character'
          : this.variable.type
      default:
        return this.variable.type
    }
  }
}

/** function call */
export class FunctionCall {
  readonly expressionType = 'function'
  readonly lexeme: IdentifierLexeme
  readonly command: Subroutine|Command
  readonly type: Type
  readonly arguments: Expression[] = []

  constructor (lexeme: IdentifierLexeme, command: Subroutine|Command) {
    this.lexeme = lexeme
    this.command = command
    // give 'boolint' type by default to satisfy the compiler; but function
    // calls should only ever be created with functions (that have a non-null
    // 'returns' property)
    this.type = command.returns || 'boolint'
  }
}

/** compound expression */
export class CompoundExpression {
  readonly expressionType = 'compound'
  readonly lexeme: OperatorLexeme
  readonly left: Expression|null // left hand side optional (for unary operators 'not' and 'minus')
  readonly right: Expression
  readonly operator: Operator
  readonly type: Type

  constructor (lexeme: OperatorLexeme, left: Expression|null, right: Expression, operator: Operator) {
    this.lexeme = lexeme
    this.left = left
    this.right = right
    this.operator = operator
    this.type = type(operator)
  }
}

/** cast expression */
export class CastExpression {
  readonly expressionType = 'cast'
  readonly lexeme: Lexeme
  readonly type: Type
  readonly expression: Expression

  constructor (lexeme: Lexeme, type: Type, expression: Expression) {
    this.lexeme = lexeme
    this.type = type
    this.expression = expression
  }
}
