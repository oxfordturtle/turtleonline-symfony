/**
 * Generates the pcode for loading the value of expressions onto the stack.
 */
import { Options } from './options'
import { PCode } from '../constants/pcodes'
import { Program } from '../parser2/definitions/program'
import { Subroutine } from '../parser2/definitions/subroutine'
import { Expression, LiteralValue, VariableAddress, VariableValue, FunctionCall, CompoundExpression, CastExpression } from '../parser2/definitions/expression'

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
  // literal value
  if (exp instanceof LiteralValue) {
    return [literalValue(exp, options)]
  }

  // variable address
  if (exp instanceof VariableAddress) {
    return variableAddress(exp, program, options)
  }

  // variable value
  if (exp instanceof VariableValue) {
    return reference
      ? variableAddress(exp, program, options)
      : variableValue(exp, program, options)
  }

  // command (i.e. function) call
  if (exp instanceof FunctionCall) {
    return functionValue(exp, program, options)
  }

  // compound expression
  if (exp instanceof CompoundExpression) {
    return compoundExpression(exp, program, options)
  }

  // cast expression
  return castExpression(exp, program, options)
}

/** generates the pcode for loading a literal value onto the stack */
function literalValue (exp: LiteralValue, options: Options): number[] {
  switch (exp.type) {
    case 'string':
      return [PCode.lstr, (exp.value as string).length].concat(Array.from(exp.value as string).map(x => x.charCodeAt(0)))

    default:
      return exp.input
        ? [PCode.ldin, (exp.value as number), PCode.inpt]
        : [PCode.ldin, (exp.value as number)]
  }
}

/** generates the pcode for loading the address of a variable onto the stack */
function variableAddress (exp: VariableAddress|VariableValue, program: Program, options: Options): number[][] {
  const pcode: number[][] = []

  // predefined turtle property
  if (exp.variable.turtle) {
    pcode.push([PCode.ldag, program.turtleAddress + exp.variable.turtle])
  }

  // global variable
  else if (exp.variable.routine.index === 0) {
    pcode.push([PCode.ldag, program.turtleAddress + program.turtleVariables.length + exp.variable.index])
  }

  // local variable
  else {
    pcode.push([PCode.ldav, exp.variable.routine.index + program.baseOffset, exp.variable.index])
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
      if (program.language === 'Python' || program.language === 'TypeScript') {
        // Python and TypeScript don't have character types, so we need to add
        // this here - it won't be picked up with a contextual type cast
        // (N.B. BASIC doesn't have a character type either, but BASIC doesn't
        // allow direct reference to characters within strings, so this
        // situation won't arise for BASIC)
        merge(pcode, [[PCode.ctos]])
      }
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
