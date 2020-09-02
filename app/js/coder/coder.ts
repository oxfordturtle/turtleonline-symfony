/*
 * Coder: array of routines goes in, PCode comes out.
 *
 * This second pass over the lexemes generates the compiled pcode, using the
 * language-independent pcoder module (the only one that outputs pcode
 * directly), and the appropriate language-specific module.
 *
 * The language-specific modules are responsible for running through the lexemes
 * that make up the commands of the individual routines; this module pieces
 * those results together, and wraps them up in the appropriate routine start
 * and end code.
 */
import * as pcoder from './pcoder'
import BASIC from './basic'
import C from './c'
import Pascal from './pascal'
import Python from './python'
import TypeScript from './typescript'
import { Options } from './options'
import { Routine, Program, Subroutine } from '../parser/routine'
import { PCode, pcodeArgs } from '../constants/pcodes'

/** generates pcode from the array of routines */
export default function coder (routines: Routine[], options: Options = null): number[][] {
  // default options if none given
  if (options === null) {
    options = {
      canvasStartSize: 1000,
      setupDefaultKeyBuffer: true,
      turtleAttributesAsGlobals: true,
      initialiseLocals: true,
      allowCSTR: true,
      separateReturnStack: false,
      separateMemoryControlStack: false,
      separateSubroutineRegisterStack: false
    }
  }

  // separate out the program and subroutines
  const program = routines[0] as Program
  const subroutines = routines.slice(1) as Subroutine[]

  // calculate the start line of the first subroutine
  const subroutinesStartLine = programStartLength(program, subroutines, options) + 1

  // get the pcode for all (any) subroutines
  // N.B. this also saves the start line of each subroutine, required for
  // back-patching BASIC programs below
  const subroutinesCode = compileSubroutines(subroutines, subroutinesStartLine, options)

  // calculate the start line of the main program
  const programStartLine = subroutinesStartLine + subroutinesCode.length

  // generate the pcode for the main program
  const innerCode = compileInnerCode(program, programStartLine, options)

  // stitch the program and subroutines pcode together
  const pcode = pcoder.program(program, subroutinesCode, innerCode, options)

  // now we know the start line for all subroutines, do some back-patching for
  // BASIC
  if (routines[0].program.language === 'BASIC') {
    for (let i = 0; i < pcode.length; i += 1) {
      for (let j = 0; j < pcode[i].length; j += 1) {
        if (pcode[i][j - 1] && pcode[i][j - 1] === PCode.subr) {
          const subroutine = subroutines.find(x => x.index === pcode[i][j])
          pcode[i][j] = subroutine.startLine
        }
      }
    }
  }

  // now add HCLR codes where necessary
  // (this could be done more elegantly along the way?)
  const heapStringCodes = [
    PCode.hstr,
    PCode.ctos,
    PCode.itos,
    PCode.hexs,
    PCode.qtos,
    PCode.smax,
    PCode.smin,
    PCode.scat,
    PCode.case,
    PCode.copy,
    PCode.dels,
    PCode.inss,
    PCode.repl,
    PCode.spad,
    PCode.lstr,
    PCode.read,
    PCode.rdln,
    PCode.frds,
    PCode.frln,
    PCode.ffnd,
    PCode.fdir,
    PCode.fnxt
  ]
  for (const line of pcode) {
    let heapStringMade = false
    let heapStringNeeded = false
    let lastJumpIndex = null
    let i = 0
    while (i < line.length) {
      if (heapStringCodes.indexOf(line[i]) >= 0) {
        heapStringMade = true
      }
      if (line[i] === PCode.subr) { // maybe more cases will be needed
        heapStringNeeded = true
      }
      if (line[i] === PCode.jump) {
        lastJumpIndex = i
      }
      const args = pcodeArgs(line[i])
      i += (args === -1) ? line[i + 1] + 2 : args + 1
    }
    if (heapStringMade && !heapStringNeeded) {
      if (lastJumpIndex !== null) {
        line.splice(lastJumpIndex, 0, PCode.hclr)
      } else if (line[line.length - 1] !== PCode.hclr) {
        line.push(PCode.hclr)
      }
    }
  }

  // return the pcode
  return pcode
}

/** calculates the length of pcode at the start of the program */
function programStartLength (program: Program, subroutines: Subroutine[], options: Options): number {
  return (subroutines.length > 0)
    ? pcoder.programStartCode(program, options).length + 1 // + 1 for jump line past subroutines
    : pcoder.programStartCode(program, options).length
}

/** generates the pcode for subroutines (or an empty array if there aren't any) */
function compileSubroutines (routines: Subroutine[], startLine: number, options: Options): number[][] {
  let pcode = []

  // generate the pcode for each subroutine in turn, concatenating the results
  let index = 0
  while (index < routines.length) {
    routines[index].startLine = startLine
    const offset = pcoder.subroutineStartCode(routines[index], options).length
    const innerCode = compileInnerCode(routines[index], startLine + offset, options)
    const subroutineCode = pcoder.subroutine(routines[index], innerCode, options)
    pcode = pcode.concat(subroutineCode)
    index += 1
    startLine += subroutineCode.length
  }

  // return the pcode
  return pcode
}

/** generates the inner pcode for routines (minus start and end stuff) */
function compileInnerCode (routine: Routine, startLine: number, options: Options): number[][] {
  const coders = { BASIC, C, Pascal, Python, TypeScript }
  let pcode = []

  // loop through the routine lexmes, compiling each block of code with the coder, and concatenating
  // the result
  let lex = 0
  while (lex < routine.lexemes.length) {
    const result = coders[routine.program.language](routine, lex, startLine + pcode.length, options)
    pcode = pcode.concat(result.pcode)
    lex = result.lex
  }

  // return the pcode
  return pcode
}
