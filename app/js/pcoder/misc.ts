/**
 * Assorted functions for generating PCode.
 */
import { Options } from '../coder/options'
import { Input } from '../constants/inputs'
import { Language } from '../constants/languages'
import { PCode } from '../constants/pcodes'
import { Subroutine, Variable, VariableType } from '../parser/routine'

// merge two arrays of pcode into one, without a line break in between
export function merge (pcode1: number[][], pcode2: number[][]): number[][] {
  // corner case: INPT followed by ICLR (from e.g. "reset(?key)"), INPT should be deleted
  if (pcode2[0] && pcode2[0][0] && pcode2[0][0] === PCode.iclr) {
    const last1 = pcode1.length - 1
    const last2 = pcode1[last1] ? pcode1[last1].length - 1 : 0
    if (pcode1[last1] && pcode1[last1][last2] && pcode1[last1][last2] === PCode.inpt) {
      pcode1[last1].pop() // delete PCode.inpt
    }
  }
  // return the merged arrays
  return pcode1.slice(0, -1)
    .concat([pcode1[pcode1.length - 1].concat(pcode2[0])])
    .concat(pcode2.slice(1))
}

// pcode for loading a literal value onto the stack
export function loadLiteralValue (needed: VariableType|null, type: VariableType, value: number|string, options: Options): number[] {
  switch (type) {
    case 'character':
      return (needed === 'string')
        ? [PCode.ldin, (value as string).charCodeAt(0), PCode.ctos]
        : [PCode.ldin, (value as string).charCodeAt(0)]
    case 'string':
      return [PCode.lstr, (value as string).length].concat(Array.from(value as string).map(x => x.charCodeAt(0)))
    default:
      return [PCode.ldin, (value as number)]
  }
}

// pcode for loading an input keycode onto the stack
export function loadInputValue (input: Input, options: Options): number[] {
  return (input.value < 0)
    ? loadLiteralValue(null, 'integer', input.value, options).concat(PCode.inpt)
    : loadLiteralValue(null, 'integer', input.value, options)
}

// pcode for loading the value of a variable onto the stack
export function loadVariableValue (variable: Variable, options: Options): number[] {
  const program = variable.routine.program

  // predefined turtle property
  if (variable.turtle) {
    return [PCode.ldvg, program.turtleAddress + variable.turtle]
  }

  // global variable
  if (variable.routine.index === 0) {
    return [PCode.ldvg, program.turtleAddress + program.turtleVariables.length + variable.index]
  }

  // local reference variable
  if (variable.isReferenceParameter) {
    return [PCode.ldvr, variable.routine.index + program.baseOffset, variable.index]
  }

  // local value variable
  return [PCode.ldvv, variable.routine.index + program.baseOffset, variable.index]
}

// pcode for loading the address of a variable onto the stack
export function loadVariableAddress (variable: Variable, options: Options): number[] {
  const program = variable.routine.program

  // predefined turtle property
  if (variable.turtle) {
    // return [PCode.ldin, 0, PCode.lptr, PCode.ldin, variable.turtle, PCode.plus]
    return [PCode.ldag, program.turtleAddress + variable.turtle]
  }

  // global variable
  if (variable.routine.index === 0) {
    return [PCode.ldag, program.turtleAddress + program.turtleVariables.length + variable.index]
  }

  // local variable
  return [PCode.ldav, variable.routine.index + program.baseOffset, variable.index]
}

// pcode for storing the value of a variable in memory
export function storeVariableValue (variable: Variable, options: Options, parameter: boolean = false): number[] {
  const program = variable.routine.program

  // predefined turtle property
  if (variable.turtle) {
    return [PCode.stvg, variable.routine.program.turtleAddress + variable.turtle]
  }

  // global variable
  if (variable.routine.index === 0) {
    const address = program.turtleAddress + program.turtleVariables.length + variable.index
    return (variable.type === 'string')
      ? [PCode.ldvg, address, PCode.cstr]
      : [PCode.stvg, address]
  }

  // local string variable
  if (variable.type === 'string') {
    return [PCode.ldvv, variable.routine.index + program.baseOffset, variable.index, PCode.cstr]
  }

  // local (non-string) reference variable (not as a parameter)
  if (variable.isReferenceParameter && !parameter) {
    return [PCode.stvr, variable.routine.index + program.baseOffset, variable.index]
  }

  // local non-string variable
  return [PCode.stvv, variable.routine.index + program.baseOffset, variable.index]
}

export function storeArrayVariableValue (variable: Variable, indexes: number[], options: Options): number[] {
  // TODO
  return []
}

// pcode for loading return value of a function onto the stack
export function loadFunctionReturnValue (routine: Subroutine, options: Options): number[] {
  return (routine.returns === 'string')
    ? [PCode.ldvv, routine.program.resultAddress, 1, PCode.hstr]
    : [PCode.ldvv, routine.program.resultAddress, 1]
}

// pcode for an expression operator
export function applyOperator (type: PCode, language: Language, options: Options): number[] {
  switch (type) {
    case PCode.subt:
      return [PCode.neg]

    case PCode.not:
      return (language === 'Python') ? [PCode.ldin, 0, PCode.eqal] : [PCode.not]
  }
}
