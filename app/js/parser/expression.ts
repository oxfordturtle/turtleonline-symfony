import { Subroutine } from './routine'
import { Variable } from './variable'
import { Type } from './type'
import { Command } from '../constants/commands'
import { PCode } from '../constants/pcodes'

export type Expression = LiteralValue|VariableAddress|VariableValue|CommandCall|CompoundExpression|CastExpression

export class LiteralValue {
  readonly type: Type
  readonly value: string|number
  input: boolean = false // true for input query codes

  constructor (type: Type, value: string|number) {
    this.type = type
    this.value = value
  }
}

export class VariableAddress {
  readonly variable: Variable

  constructor (variable: Variable) {
    this.variable = variable
  }

  get type (): Type {
    return this.variable.type
  }
}

export class VariableValue {
  readonly variable: Variable
  readonly indexes: Expression[] = [] // for array variables

  constructor (variable: Variable) {
    this.variable = variable
  }

  get type (): Type {
    switch (this.variable.routine.program.language) {
      case 'C':
      case 'Java':
      case 'Pascal':
        return (this.variable.type === 'string' && this.indexes.length > 0) ? 'character' : this.variable.type
      default:
        return this.variable.type
    }
  }
}

export class CommandCall {
  readonly command: Subroutine|Command
  readonly arguments: Expression[] = []

  constructor (command: Subroutine|Command) {
    this.command = command
  }

  get type (): Type {
    // give procedures a 'boolint' type; this shouldn't do any harm, and means
    // we don't have to worry about nulls; but should probably tweak this ??
    return this.command.returns || 'boolint'
  }
}

export class CompoundExpression {
  readonly left: Expression|null // left hand side optional (for unary operators 'not' and 'minus')
  readonly right: Expression
  readonly operator: PCode

  constructor (left: Expression|null, right: Expression, operator: PCode) {
    this.left = left
    this.right = right
    this.operator = operator
  }

  get type (): Type {
    const booleans = [
      PCode.not,
      PCode.eqal,
      PCode.less,
      PCode.lseq,
      PCode.more,
      PCode.mreq,
      PCode.noeq,
      PCode.seql,
      PCode.sles,
      PCode.sleq,
      PCode.smor,
      PCode.smeq,
      PCode.sneq,
      PCode.andl,
      PCode.orl
    ]
  
    if (booleans.includes(this.operator)) {
      return 'boolean'
    }

    if (this.operator === PCode.scat) {
      return 'string'
    }

    return 'boolint'
  }
}

export class CastExpression {
  readonly type: Type
  readonly expression: Expression

  constructor (type: Type, expression: Expression) {
    this.type = type
    this.expression = expression
  }
}
