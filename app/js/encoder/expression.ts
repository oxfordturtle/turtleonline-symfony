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

/** generates the pcode for loading the value of any expression onto the stack */
export default function expression (exp: Expression, program: Program, options: Options, reference: boolean = false): number[] {
  if (exp instanceof LiteralValue) {
    return literalValue(exp, program, options)
  } else if (exp instanceof VariableValue) {
    return variableValue(exp, program, options, reference)
  } else if (exp instanceof CommandCall) {
    return functionValue(exp, program, options)
  } else if (exp instanceof CompoundExpression) {
    return compoundExpression(exp, program, options)
  }
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

/** generates the pcode for loading a variable value onto the stack */
function variableValue (exp: VariableValue, program: Program, options: Options, reference: boolean): number[] {
  let pcode: number[] = []

  // TODO: consider whether array variables and variables passed as reference parameters
  // need to be handled differently

  // TODO: turtle properties when NEWTURTLE has been called

  // predefined turtle property
  if (exp.variable.turtle) {
    pcode = [PCode.ldvg, program.turtleAddress + exp.variable.turtle]
  }

  // global variable
  else if (exp.variable.routine.index === 0) {
    pcode = [PCode.ldvg, program.turtleAddress + program.turtleVariables.length + exp.variable.index]
  }

  // local reference variable
  else if (exp.variable.isReferenceParameter) {
    pcode = [PCode.ldvr, exp.variable.routine.index + program.baseOffset, exp.variable.index]
  }

  // local value variable
  else {
    pcode = [PCode.ldvv, exp.variable.routine.index + program.baseOffset, exp.variable.index]
  }

  // maybe convert characters to strings
  if (exp.variable.type === 'character' && exp.string) {
    pcode.push(PCode.ctos)
  }

  // return the pcode
  return pcode
}

/** generates the pcode for loading the result of a function onto the stack */
function functionValue (exp: CommandCall, program: Program, options: Options): number[] {
  const pcode = []

  // first: load arguments onto stack
  for (let index = 0; index < exp.command.parameters.length; index += 1) {
    const arg = exp.arguments[index]
    const param = exp.command.parameters[index]
    pcode.push(...expression(arg, program, options, param.isReferenceParameter))
  }

  // next: code for the function
  if (exp.command instanceof Subroutine) {
    // custom functions
    const startLine = (program.language === 'BASIC')
      ? exp.command.index     // in BASIC, we don't know the start line yet,
      : exp.command.startLine // so this will be backpatched later
    pcode.push(PCode.subr, startLine)
  } else {
    // native functions
    pcode.push(...exp.command.code)
  }

  // custom functions: load the result variable onto the stack
  if (exp.command instanceof Subroutine) {
    pcode.push(PCode.ldvv, program.resultAddress, 1)
    if (exp.command.returns === 'string') {
      pcode.push(PCode.hstr)
    }
  }

  // maybe convert characters to strings
  if (exp.type === 'character' && exp.string) {
    pcode.push(PCode.ctos)
  }

  // return the pcode
  return pcode
}

/** generates the pcode for loading the value of a compound expression onto the stack */
function compoundExpression (exp: CompoundExpression, program: Program, options: Options): number[] {
  const left = exp.left ? expression(exp.left, program, options) : null
  const right = expression(exp.right, program, options)
  const op = operator(exp.operator, program, options)
  return left ? left.concat(right).concat(op) : right.concat(op)
}

/** generates the pcode for an operator */
function operator (op: PCode, program: Program, options: Options): number[] {
  switch (op) {
    case PCode.not:
      return (program.language === 'Python') ? [PCode.ldin, 0, PCode.eqal] : [PCode.not]

    default:
      return [op]
  }
}
