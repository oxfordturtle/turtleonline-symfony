import { Subroutine } from './routine'
import { Variable } from './variable'
import { Type } from './type'
import { Command } from '../constants/commands'
import { PCode } from '../constants/pcodes'

export type Expression = LiteralValue|VariableValue|CommandCall|CompoundExpression

export class LiteralValue {
  readonly type: Type
  readonly value: string|number
  as: Type|null = null // set if value is to be cast to a different type
  string: boolean = false // true for characters that need to be converted to strings
  input: boolean = false // true for input query codes

  constructor (type: Type, value: string|number) {
    this.type = type
    this.value = value
  }
}

export class VariableValue {
  readonly variable: Variable
  readonly indexes: Expression[] = [] // for array variables
  as: Type|null = null // set if variable is to be cast to a different type
  string: boolean = false // true for character variables that need to be converted to strings

  constructor (variable: Variable) {
    this.variable = variable
  }

  get type (): Type {
    if (this.variable.type === 'string' && this.indexes.length > 0) {
      return 'character'
    }
    return this.variable.type
  }
}

export class CommandCall {
  readonly command: Subroutine|Command
  readonly arguments: Expression[] = []
  as: Type|null = null // set if result is to be cast to a different type
  string: boolean = false // true for character return values that need to be converted to strings

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
  as: Type|null = null // set if expression is to be cast to a different type

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
      PCode.sneq
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
