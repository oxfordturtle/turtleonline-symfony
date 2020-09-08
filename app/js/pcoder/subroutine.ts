/**
 * Functions for generating the PCode for a subroutine.
 */
import * as misc from './misc'
import { Options } from '../coder/options'
import { PCode } from '../constants/pcodes'
import { Subroutine } from '../parser/routine'

/** generates PCode for a subroutine */
export function subroutine (routine: Subroutine, innerCode: number[][], options: Options): number[][] {
  const subroutineCode: number[][] = []
  subroutineCode.push(...subroutineStart(routine, options))
  subroutineCode.push(...innerCode)
  subroutineCode.push(...subroutineEnd(routine, options))

  return subroutineCode
}

/** generates PCode for the start of a subroutine (exported so that the coder
 * can determine its length) */
export function subroutineStart (routine: Subroutine, options: Options): number[][] {
  const subroutineStartCode: number[][] = []
  subroutineStartCode.push([PCode.pssr, routine.index])
  if (routine.variables.length > 0) {
    // claim memory
    subroutineStartCode.push([PCode.memc, routine.address, routine.memoryNeeded])
    // zero memory
    if (options.initialiseLocals) {
      if (routine.variables.length > routine.parameters.length) {
        // TODO: speak to Peter about this - his latest compiler doesn't appear to be doing this (but it did before)
        subroutineStartCode.push([PCode.ldav, routine.address, 1, PCode.ldin, routine.memoryNeeded, PCode.zptr])
      }
    }
    // save parameters
    if (routine.parameters.length > 0) {
      subroutineStartCode.push([])
      for (const parameter of routine.parameters.reverse()) {
        subroutineStartCode[subroutineStartCode.length - 1].push(...misc.storeVariableValue(parameter, options, true))
      }
    }
    // setup local string variables
    for (const stringVariable of routine.variables.filter(x => x.type === 'string')) {
      subroutineStartCode.push([
        PCode.ldav,
        routine.address,
        stringVariable.index + 2,
        PCode.stvv,
        routine.address,
        stringVariable.index,
        PCode.ldin,
        stringVariable.length - 2, // 2 = pointer + max length byte
        PCode.stvv,
        routine.address,
        stringVariable.index + 1
      ])
    }
  }

  return subroutineStartCode
}

/** generates PCode for the end of a subroutine */
function subroutineEnd (routine: Subroutine, options: Options): number[][] {
  const subroutineEndCode: number[] = []
  if (routine.type === 'function') {
    // store function result
    subroutineEndCode.push(PCode.ldvg, routine.address, PCode.stvg, routine.program.resultAddress)
  }
  if (routine.variables.length > 0) {
    // release memory
    subroutineEndCode.push(PCode.memr, routine.address)
  }
  subroutineEndCode.push(PCode.plsr, PCode.retn)

  return [subroutineEndCode]
}
