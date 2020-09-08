/**
 * Functions for generating the PCode for a program.
 */
import { Options } from '../coder/options'
import { PCode } from '../constants/pcodes'
import { Program, Variable } from '../parser/routine'

/** generates PCode for the main program */
export function program (routine: Program, subroutinesCode: number[][], innerCode: number[][], options: Options): number[][] {
  const startCode = programStart(routine, options)
  const jumpLine = [[PCode.jump, startCode.length + subroutinesCode.length + 2]]
  const endCode = [[PCode.halt]]

  return (subroutinesCode.length > 1)
    ? startCode.concat(jumpLine).concat(subroutinesCode).concat(innerCode).concat(endCode)
    : startCode.concat(innerCode).concat(endCode)
}

/** generates PCode for the start of the main program (exported so that the
 * coder can determine its length) */
export function programStart (routine: Program, options: Options): number[][] {
  const startCode = [
    setupGlobalMemory(routine, options),
    [
      PCode.home,
      PCode.ldin,
      2,
      PCode.thik,
      PCode.ldin,
      360,
      PCode.angl,
      PCode.ldin,
      32,
      PCode.bufr,
      PCode.ldin,
      1, // address of the keybuffer pointer
      PCode.sptr,
      PCode.hfix,
      PCode.ldin,
      0,
      PCode.dupl,
      PCode.ldin,
      1000,
      PCode.dupl,
      PCode.dupl,
      PCode.dupl,
      PCode.reso,
      PCode.canv
    ]
  ]

  // maybe setup global string variables
  const stringVariables = routine.variables.filter(x => x.type === 'string')
  if (stringVariables.length > 0) {
    return startCode.concat(stringVariables.map(x => setupGlobalString(x, options)))
  }

  return startCode
}

/** generates PCode for initialising a global string variable */
function setupGlobalString (variable: Variable, options: Options): number[] {
  const program = variable.routine.program
  const index = program.turtleAddress + program.turtleVariables.length + variable.index

  return [
    PCode.ldag,
    index + 2,
    PCode.stvg,
    index,
    PCode.ldin,
    variable.length - 2, // 2 = pointer + max length byte
    PCode.stvg,
    index + 1
  ]
}

/** generates PCode for the first line of a program (global memory setup) */
function setupGlobalMemory (program: Program, options: Options): number[] {
  return [
    PCode.ldin,
    program.turtleAddress,
    PCode.dupl,
    PCode.dupl,
    PCode.ldin,
    0, // address of the turtle pointer
    PCode.sptr,
    PCode.ldin,
    program.turtleVariables.length,
    PCode.swap,
    PCode.sptr,
    PCode.incr,
    PCode.ldin,
    program.memoryNeeded + program.turtleVariables.length,
    PCode.zptr,
    PCode.ldin,
    program.turtleAddress + program.memoryNeeded + program.turtleVariables.length,
    PCode.stmt
  ]
}
