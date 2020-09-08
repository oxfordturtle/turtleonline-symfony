/**
 * Functions for generating the PCode for a statement.
 */
import * as misc from './misc'
import { Options } from '../coder/options'
import { Command } from '../constants/commands'
import { PCode } from '../constants/pcodes'
import { Routine, Subroutine, Variable } from '../parser/routine'

/** generates PCode for a variable assignment */
export function variableAssignment (variable: Variable, value: number[], options: Options): number[] {
  return []
}

/** generates PCode for a command call (applied after any arguments have been loaded onto the stack) */
export function commandCall (command: Command|Subroutine, routine: Routine, options: Options): number[] {
  // custom commands
  if (command instanceof Subroutine) {
    return (routine.program.language === 'BASIC')   // in BASIC, we don't know the start line yet
      ? [PCode.subr, command.index]                 // so this will be back-patched later
      : [PCode.subr, command.startLine]
  }

  // native commands
  if (command.code[0] === PCode.oldt) {
    // this is a special case, because compilation requires knowing the original turtle address
    return [PCode.ldin, routine.program.turtleAddress, PCode.ldin, 0, PCode.sptr]
  }

  // otherwise just return the pcodes defined for the command
  return command.code
}

/** generates PCode for a conditional statement */
export function conditional (startLine: number, testCode: number[][], ifCode: number[][], elseCode: number[][], options: Options): number[][] {
  const offset = (elseCode.length > 0) ? 2 : 1
  const startCode = misc.merge(testCode, [[PCode.ifno, ifCode.length + startLine + offset]])
  const middleCode = [[PCode.jump, ifCode.length + elseCode.length + startLine + offset]]

  return elseCode.length > 0
    ? startCode.concat(ifCode).concat(middleCode).concat(elseCode)
    : startCode.concat(ifCode)
}

/** generates PCode for a for loop */
export function forLoop (startLine: number, variable: Variable, initial: number[], final: number[], compare: PCode, change: PCode, innerCode: number[][], options: Options): number[][] {
  const ifnoLine = innerCode.length + startLine + 4
  const startCode = [
    initial,
    misc.storeVariableValue(variable, options).concat(final),
    misc.loadVariableValue(variable, options).concat([compare, PCode.ifno, ifnoLine])
  ]
  const endCode = [misc.loadVariableValue(variable, options).concat([change, PCode.jump, startLine + 1])]

  return startCode.concat(innerCode).concat(endCode)
}

/** generates PCode for a repeat loop */
export function repeatLoop (startLine: number, testCode: number[][], innerCode: number[][], options: Options): number[][] {
  const endCode = misc.merge(testCode, [[PCode.ifno, startLine]])

  return innerCode.concat(endCode)
}

/** generates PCode for a while loop */
export function whileLoop (startLine: number, testCode: number[][], innerCode: number[][], options: Options): number[][] {
  const startCode = misc.merge(testCode, [[PCode.ifno, innerCode.length + startLine + 2]])
  const endCode = [[PCode.jump, startLine]]

  return startCode.concat(innerCode).concat(endCode)
}
