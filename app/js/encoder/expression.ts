// type imports
import type { Options } from './options'
import type { Operator } from '../lexer/lexeme'
import type {
  Expression,
  InputValue,
  ColourValue,
  ConstantValue,
  VariableAddress,
  CompoundExpression,
  CastExpression,
  FunctionCall
} from '../parser/definitions/expression'

// other module imports
import { PCode } from '../constants/pcodes'
import Program from '../parser/definitions/program'
import { Subroutine } from '../parser/definitions/subroutine'
import { IntegerValue, StringValue, VariableValue } from '../parser/definitions/expression'

/** merges pcode2 into pcode1 */
export function merge (pcode1: number[][], pcode2: number[][]): void {
  if (pcode1.length === 0) {
    // add all pcode2 lines to pcode1
    pcode1.push(...pcode2)
  } else {
    const last1 = pcode1[pcode1.length - 1]
    const first2 = pcode2.shift()
    // add first line of pcode2 to end of last line of pcode1
    if (first2) last1.push(...first2)
    // add other lines of pcode2 to pcode1
    pcode1.push(...pcode2)
  }
}

/** generates the pcode for loading the value of any expression onto the stack */
export function expression (exp: Expression, program: Program, options: Options, reference: boolean = false): number[][] {
  switch (exp.expressionType) {
    case 'integer':
      return [literalIntegerValue(exp, options)]

    case 'string':
      return [literalStringValue(exp, options)]

    case 'input':
      return [inputValue(exp, options)]

    case 'colour':
      return [colourValue(exp, options)]

    case 'constant':
      return constantValue(exp, program, options)

    case 'address':
      return variableAddress(exp, program, options)

    case 'variable':
      if (reference) {
        if (exp.variable.isArray && exp.indexes.length < exp.variable.arrayDimensions.length) {
          // in this case the value is the address
          return variableValue(exp, program, options)
        } else if (exp.variable.type === 'string' && exp.indexes.length === 0) {
          // in this case the value is the address
          return variableValue(exp, program, options)
        } else {
          return variableAddress(exp, program, options)
        }
      }
      return variableValue(exp, program, options)

    case 'function':
      return functionValue(exp, program, options)

    case 'compound':
      return compoundExpression(exp, program, options)

    case 'cast':
      return castExpression(exp, program, options)
  }
}

/** generates the pcode for loading a literal value onto the stack */
function literalIntegerValue (exp: IntegerValue, options: Options): number[] {
  return [PCode.ldin, exp.value]
}

/** generate the pcode for loading a literal string onto the stack */
function literalStringValue (exp: StringValue, options: Options): number[] {
  return [PCode.lstr, exp.value.length].concat(Array.from(exp.value).map(x => x.charCodeAt(0)))
}

/** generates the pcode for loading an input value onto the stack */
function inputValue (exp: InputValue, options: Options): number[] {
  return (exp.input.value < 0)
    ? [PCode.ldin, exp.input.value, PCode.stat]
    : [PCode.ldin, exp.input.value]
}

/** generates the pcode for loading a colour value onto the stack */
function colourValue (exp: ColourValue, options: Options): number[] {
  return [PCode.ldin, exp.colour.value]
}

/** generates the pcode for loading a constant value onto the stack */
function constantValue (exp: ConstantValue, program: Program, options: Options): number[][] {
  const pcode: number[][] = []

  // string constant
  if (exp.constant.type === 'string') {
    const value = exp.constant.value as string
    pcode.push([PCode.lstr, value.length].concat(Array.from(value).map(x => x.charCodeAt(0))))
    if (exp.indexes.length > 0) {
      const indexExp = expression(exp.indexes[0], program, options)
      merge(pcode, indexExp)
      if (program.language === 'Pascal') {
        merge(pcode, [[PCode.decr]]) // Pascal indexes strings from 1 instead of 0
      }
      merge(pcode, [[PCode.swap, PCode.test, PCode.plus, PCode.incr, PCode.lptr]])
    }

  // integer or boolean constant
  } else {
    pcode.push([PCode.ldin, exp.constant.value as number])
  }

  // return the pcode
  return pcode
}

/** generates the pcode for loading the address of a variable onto the stack */
function variableAddress (exp: VariableAddress|VariableValue, program: Program, options: Options): number[][] {
  const pcode: number[][] = []

  // array element
  if (exp.variable.isArray && exp.indexes.length > 0) {
    const baseVariableExp = new VariableValue(exp.lexeme, exp.variable) // same variable, no indexes
    pcode.push(...expression(baseVariableExp, program, options))
    for (let i = 0; i < exp.indexes.length; i += 1) {
      const index = exp.indexes[i]
      const indexExp = expression(index, program, options)
      merge(pcode, indexExp)
      if (exp.variable.arrayDimensions[i] && exp.variable.arrayDimensions[i][0] !== 0) {
        // substract the start index if not indexed from 0
        merge(pcode, [[PCode.ldin, exp.variable.arrayDimensions[i][0], PCode.subt]])
      } else if (exp.variable.arrayDimensions[i] === undefined) {
        // this means the final index expression is to a character within an array of strings
        if (program.language === 'Pascal') {
          merge(pcode, [[PCode.decr]]) // Pascal strings are indexed from 1 instead of zero
        }
      }
      merge(pcode, [[PCode.swap, PCode.test, PCode.plus, PCode.incr]])
    }
  }

  // character from string variable as array
  else if (exp.variable.type === 'string' && exp.indexes.length > 0) {
    pcode.push(...expression(exp.indexes[0], program, options))
    if (program.language === 'Pascal') {
      // Pascal string indexes start from 1 instead of 0
      merge(pcode, [[PCode.decr]])
    }
    const baseVariableExp = new VariableValue(exp.lexeme, exp.variable) // same variable, no indexes
    merge(pcode, expression(baseVariableExp, program, options))
    merge(pcode, [[PCode.test, PCode.plus, PCode.incr]])
  }

  // predefined turtle property
  else if (exp.variable.turtle) {
    pcode.push([PCode.ldag, program.turtleAddress + exp.variable.turtle])
  }

  // global variable
  else if (exp.variable.routine instanceof Program) {
    pcode.push([PCode.ldag, exp.variable.address])
  }

  // local variable
  else {
    pcode.push([PCode.ldav, exp.variable.routine.address, exp.variable.address])
  }

  // return the pcode
  return pcode
}

/** generates the pcode for loading a variable value onto the stack */
function variableValue (exp: VariableValue, program: Program, options: Options): number[][] {
  let pcode: number[][] = []

  // array element
  if (exp.variable.isArray && exp.indexes.length > 0) {
    const baseVariableExp = new VariableValue(exp.lexeme, exp.variable) // same variable, no indexes
    pcode.push(...expression(baseVariableExp, program, options))
    for (let i = 0; i < exp.indexes.length; i += 1) {
      const index = exp.indexes[i]
      const indexExp = expression(index, program, options)
      merge(pcode, indexExp)
      if (exp.variable.arrayDimensions[i] && exp.variable.arrayDimensions[i][0] !== 0) {
        // substract the start index if not indexed from 0
        merge(pcode, [[PCode.ldin, exp.variable.arrayDimensions[i][0], PCode.subt]])
      } else if (exp.variable.arrayDimensions[i] === undefined) {
        // this means the final index expression is to a character within an array of strings
        if (program.language === 'Pascal') {
          // Pascal string indexes start from 1 instead of 0
          merge(pcode, [[PCode.decr]])
        }
      }
      merge(pcode, [[PCode.swap, PCode.test, PCode.plus, PCode.incr, PCode.lptr]])
    }
  }

  // character from string variable as array
  else if (exp.variable.type === 'string' && exp.indexes.length > 0) {
    pcode.push(...expression(exp.indexes[0], program, options))
    if (program.language === 'Pascal') {
      // Pascal string indexes start from 1 instead of 0
      merge(pcode, [[PCode.decr]])
    }
    const baseVariableExp = new VariableValue(exp.lexeme, exp.variable) // same variable, no indexes
    merge(pcode, expression(baseVariableExp, program, options))
    merge(pcode, [[PCode.test, PCode.plus, PCode.incr, PCode.lptr]])
    if (program.language === 'Python' || program.language === 'TypeScript') {
      // Python and TypeScript don't have character types, so we need to add
      // this here - it won't be picked up with a contextual type cast
      // (N.B. BASIC doesn't have a character type either, but BASIC doesn't
      // allow direct reference to characters within strings, so this
      // situation won't arise for BASIC)
      merge(pcode, [[PCode.ctos]])
    }
  }

  // predefined turtle property
  else if (exp.variable.turtle) {
    pcode.push([PCode.ldvg, program.turtleAddress + exp.variable.turtle])
  }

  // global variable
  else if (exp.variable.routine instanceof Program) {
    pcode.push([PCode.ldvg, exp.variable.address])
  }

  // local reference variable (except arrays and strings)
  else if (exp.variable.isReferenceParameter && !exp.variable.isArray && exp.variable.type !== 'string') {
    pcode.push([PCode.ldvr, exp.variable.routine.address, exp.variable.address])
  }

  // local value variable (and arrays and strings passed by reference)
  else {
    pcode.push([PCode.ldvv, exp.variable.routine.address, exp.variable.address])
  }

  // add peek code for pointer variables
  if (exp.variable.isPointer) {
    merge(pcode, [[PCode.peek]])
  }

  // return the pcode
  return pcode
}

/** generates the pcode for loading the result of a function onto the stack */
function functionValue (exp: FunctionCall, program: Program, options: Options): number[][] {
  const pcode: number[][] = []

  // first: load arguments onto stack
  for (let index = 0; index < exp.command.parameters.length; index += 1) {
    const arg = exp.arguments[index]
    const param = exp.command.parameters[index]
    merge(pcode, expression(arg, program, options, param.isReferenceParameter))
  }

  // next: code for the function
  if (exp.command instanceof Subroutine) {
    // custom functions
    // N.B. use command index as placeholder for now; this will be backpatched
    // when compilation is otherwise complete
    merge(pcode, [[PCode.subr, exp.command.index]])
  } else {
    // native functions
    // copy the command.code array so it isn't modified subsequently
    merge(pcode, [exp.command.code.slice()])
  }

  // custom functions: load the result variable onto the stack
  if (exp.command instanceof Subroutine) {
    // push, don't merge; anything after the subroutine call must be on a new line
    pcode.push([PCode.ldvv, program.resultAddress, 1])
    if (exp.command.returns === 'string') {
      merge(pcode, [[PCode.hstr]])
    }
  }

  // return the pcode
  return pcode
}

/** generates the pcode for loading the value of a compound expression onto the stack */
function compoundExpression (exp: CompoundExpression, program: Program, options: Options): number[][] {
  // generate left hand side code
  const left = exp.left ? expression(exp.left, program, options) : null

  // treat +/- 1 as a special case
  if (left && exp.right.expressionType === 'integer' && exp.right.value === 1) {
    if (exp.operator === 'plus') {
      merge(left, [[PCode.incr]])
      return left
    }
    if (exp.operator === 'subt') {
      merge(left, [[PCode.decr]])
      return left
    }
  }

  // generate right hand side code and operator code
  const right = expression(exp.right, program, options)
  const op = operator(exp.operator, program, options)

  // stitch it all together
  if (left) {
    merge(left, right)
    merge(left, [op])
    return left
  }
  merge(right, [op])
  return right
}

/** generates the pcode for loading the value of a cast expression onto the stack */
function castExpression (exp: CastExpression, program: Program, options: Options): number[][] {
  // generate the code for the underlying expression
  const pcode = expression(exp.expression, program, options)

  // add type casting as necessary
  if (exp.expression.type === 'character' && exp.type === 'string') {
    merge(pcode, [[PCode.ctos]])
  }
  if (exp.expression.type === 'integer' && exp.type === 'string') {
    merge(pcode, [[PCode.itos]])
  }
  if (exp.expression.type === 'string' && exp.type === 'integer') {
    merge(pcode, [[PCode.ldin, 0, PCode.sval]])
  }

  // return the pcode
  return pcode
}

/** generates the pcode for an operator */
function operator (op: Operator, program: Program, options: Options): number[] {
  switch (op) {
    case 'not':
      if (program.language === 'C' || program.language === 'Python') {
        // PCode.not assumes TRUE is -1, but in C and Python TRUE is 1
        return [PCode.ldin, 0, PCode.eqal]
      }
      return [PCode.not]

    default:
      return [PCode[op as any] as any as PCode]
  }
}
