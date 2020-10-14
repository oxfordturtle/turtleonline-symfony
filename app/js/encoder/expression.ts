/**
 * Generates the pcode for loading the value of expressions onto the stack.
 */
import { Options } from './options'
import { PCode } from '../constants/pcodes'
import { Program, Subroutine } from '../parser/routine'
import {
  Expression,
  LiteralValue,
  VariableValue,
  CommandCall,
  CompoundExpression
} from '../parser/expression'

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
  let pcode: number[][] = []

  // base expression
  if (exp instanceof LiteralValue) {
    pcode = [literalValue(exp, program, options)]
  } else if (exp instanceof VariableValue) {
    pcode = reference
      ? [variableAddress(exp, program, options)]
      : variableValue(exp, program, options)
  } else if (exp instanceof CommandCall) {
    pcode = functionValue(exp, program, options)
  } else {
    pcode = compoundExpression(exp, program, options)
  }

  // type casting as necessary
  if (exp.type === 'character' && exp.as === 'string') {
    merge(pcode, [[PCode.ctos]])
  }
  if (exp.type === 'integer' && exp.as === 'string') {
    merge(pcode, [[PCode.itos]])
  }
  if (exp.type === 'string' && exp.as === 'integer') {
    merge(pcode, [[PCode.ldin, 0, PCode.sval]])
  }

  // return the pcode
  return pcode
}

/** generates the pcode for loading a literal value onto the stack */
function literalValue (exp: LiteralValue, program: Program, options: Options): number[] {
  switch (exp.type) {
    case 'character':
      return (exp.string)
        ? [PCode.ldin, (exp.value as number), PCode.ctos]
        : [PCode.ldin, (exp.value as number)]

    case 'string':
      return [PCode.lstr, (exp.value as string).length].concat(Array.from(exp.value as string).map(x => x.charCodeAt(0)))

    default:
      return exp.input
        ? [PCode.ldin, (exp.value as number), PCode.inpt]
        : [PCode.ldin, (exp.value as number)]
  }
}

/** generates the pcode for loading the address of a variable onto the stack */
function variableAddress (exp: VariableValue, program: Program, options: Options): number[] {
  let pcode: number[] = []

  // predefined turtle property
  if (exp.variable.turtle) {
    pcode = [PCode.ldag, program.turtleAddress + exp.variable.turtle]
  }

  // global variable
  else if (exp.variable.routine.index === 0) {
    pcode = [PCode.ldag, program.turtleAddress + program.turtleVariables.length + exp.variable.index]
  }

  // local variable
  else {
    pcode = [PCode.ldav, exp.variable.routine.index + program.baseOffset, exp.variable.index]
  }

  // return the pcode
  return pcode
}

/** generates the pcode for loading a variable value onto the stack */
function variableValue (exp: VariableValue, program: Program, options: Options): number[][] {
  let pcode: number[][] = []

  // array element / string character
  if (exp.indexes.length > 0) {
    const index = exp.indexes[0] // TODO: multi-dimensions
    const indexExp = expression(index, program, options)

    // array variable
    if (exp.variable.isArray) {
      pcode.push(...indexExp)
      if (exp.variable.arrayDimensions[0][0] > 0) {
        merge(pcode, [[PCode.ldin, exp.variable.arrayDimensions[0][0], PCode.subt]])
      }
      const baseVariableExp = new VariableValue(exp.variable) // same variable, no indexes
      merge(pcode, expression(baseVariableExp, program, options))
      merge(pcode, [[PCode.test, PCode.plus, PCode.incr, PCode.lptr]])
    }

    // string variable
    else if (exp.variable.type === 'string') {
      pcode.push(...indexExp)
      if (program.language === 'Pascal') {
        // Pascal string indexes start from 1 instead of 0
        merge(pcode, [[PCode.ldin, 1, PCode.subt]])
      }
      const baseVariableExp = new VariableValue(exp.variable) // same variable, no indexes
      merge(pcode, expression(baseVariableExp, program, options))
      merge(pcode, [[PCode.test, PCode.plus, PCode.incr, PCode.lptr]])
    }
  }

  // TODO: turtle properties when NEWTURTLE has been called

  // predefined turtle property
  else if (exp.variable.turtle) {
    pcode.push([PCode.ldvg, program.turtleAddress + exp.variable.turtle])
  }

  // global variable
  else if (exp.variable.routine.index === 0) {
    pcode.push([PCode.ldvg, program.turtleAddress + program.turtleVariables.length + exp.variable.index])
  }

  // local reference variable
  else if (exp.variable.isReferenceParameter) {
    pcode.push([PCode.ldvr, exp.variable.routine.index + program.baseOffset, exp.variable.index])
  }

  // local value variable
  else {
    pcode.push([PCode.ldvv, exp.variable.routine.index + program.baseOffset, exp.variable.index])
  }

  // maybe convert characters to strings
  if (exp.variable.type === 'character' || (exp.variable.type === 'string' && exp.indexes.length > 0)) {
    if (exp.string) {
      merge(pcode, [[PCode.ctos]])
    }
  }

  // return the pcode
  return pcode
}

/** generates the pcode for loading the result of a function onto the stack */
function functionValue (exp: CommandCall, program: Program, options: Options): number[][] {
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
    const startLine = (program.language === 'BASIC')
      ? exp.command.index     // in BASIC, we don't know the start line yet,
      : exp.command.startLine // so this will be backpatched later
    merge(pcode, [[PCode.subr, startLine]])
  } else {
    // native functions
    merge(pcode, [exp.command.code])
  }

  // custom functions: load the result variable onto the stack
  if (exp.command instanceof Subroutine) {
    // push, don't merge; anything after the subroutine call must be on a new line
    pcode.push([PCode.ldvv, program.resultAddress, 1])
    if (exp.command.returns === 'string') {
      merge(pcode, [[PCode.hstr]])
    }
  }

  // maybe convert characters to strings
  if (exp.type === 'character' && exp.string) {
    merge(pcode, [[PCode.ctos]])
  }

  // return the pcode
  return pcode
}

/** generates the pcode for loading the value of a compound expression onto the stack */
function compoundExpression (exp: CompoundExpression, program: Program, options: Options): number[][] {
  // generate left hand side code
  const left = exp.left ? expression(exp.left, program, options) : null

  // treat +/- 1 as a special case
  if (left && exp.right instanceof LiteralValue && exp.right.value === 1) {
    if (exp.operator === PCode.plus) {
      merge(left, [[PCode.incr]])
      return left
    }
    if (exp.operator === PCode.subt) {
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

/** generates the pcode for an operator */
function operator (op: PCode, program: Program, options: Options): number[] {
  switch (op) {
    case PCode.not:
      if (program.language === 'C' || program.language === 'Python') {
        // PCode.not assumes TRUE is -1, but in C and Python TRUE is 1
        return [PCode.ldin, 0, PCode.eqal]
      }
      return [PCode.not]

    default:
      return [op]
  }
}
