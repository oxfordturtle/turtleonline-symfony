/**
 * Assorted functions for generating PCode.
 */
import { Options } from './options'
import { Command } from '../constants/commands'
import { Input } from '../constants/inputs'
import { Language } from '../constants/languages'
import { PCode } from '../constants/pcodes'
import { Lexeme } from '../lexer/lexeme'
import { Routine, Program, Subroutine, Variable, VariableType } from '../parser/routine'

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

// merge two things with an operator at the end
export function mergeWithOperator (sofar: number[][], next: { type: VariableType|null, lex: number, pcode: number[][] }, operator: PCode, makeAbsolute: boolean = false): { type: VariableType|null, lex: number, pcode: number[][] } {
  const pcode2 = merge(sofar, next.pcode)
  const pcode3 = makeAbsolute
    ? merge(pcode2, [[operator, PCode.abs]])
    : merge(pcode2, [[operator]])
  return Object.assign(next, { pcode: pcode3 })
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

// pcode for a command call (applied after any arguments have been loaded onto the stack)
export function callCommand (command: Command|Subroutine, routine: Routine, options: Options): number[] {
  // custom commands
  if (command instanceof Subroutine) {
    return (routine.program.language === 'BASIC')   // in BASIC, we don't know the start line yet
      ? [PCode.subr, command.index] // so this will be back-patched later
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

// pcode for a conditional structure
export function conditional (startLine: number, testCode: number[][], ifCode: number[][], elseCode: number[][], options: Options): number[][] {
  const offset = (elseCode.length > 0) ? 2 : 1
  const startCode = merge(testCode, [[PCode.ifno, ifCode.length + startLine + offset]])
  const middleCode = [[PCode.jump, ifCode.length + elseCode.length + startLine + offset]]

  return elseCode.length > 0
    ? startCode.concat(ifCode).concat(middleCode).concat(elseCode)
    : startCode.concat(ifCode)
}

// pcode for a FOR loop structure
export function forLoop (startLine: number, variable: Variable, initial: number[], final: number[], compare: PCode, change: PCode, innerCode: number[][], options: Options): number[][] {
  const ifnoLine = innerCode.length + startLine + 4
  const startCode = [
    initial,
    storeVariableValue(variable, options).concat(final),
    loadVariableValue(variable, options).concat([compare, PCode.ifno, ifnoLine])
  ]
  const endCode = [loadVariableValue(variable, options).concat([change, PCode.jump, startLine + 1])]

  return startCode.concat(innerCode).concat(endCode)
}

// pcode for a REPEAT loop structure
export function repeatLoop (startLine: number, testCode: number[][], innerCode: number[][], options: Options): number[][] {
  const endCode = merge(testCode, [[PCode.ifno, startLine]])

  return innerCode.concat(endCode)
}

// pcode for a WHILE loop structure
export function whileLoop (startLine: number, testCode: number[][], innerCode: number[][], options: Options): number[][] {
  const startCode = merge(testCode, [[PCode.ifno, innerCode.length + startLine + 2]])
  const endCode = [[PCode.jump, startLine]]

  return startCode.concat(innerCode).concat(endCode)
}

// pcode for a subroutine
export function subroutine (routine: Subroutine, innerCode: number[][], options: Options): number[][] {
  const startCode = subroutineStartCode(routine, options)
  const endCode = subroutineEndCode(routine, options)

  return startCode.concat(innerCode).concat(endCode)
}

// pcode for the start of a subroutine (exported so that the coder can determine its length)
export function subroutineStartCode (routine: Subroutine, options: Options): number[][] {
  const firstLine = [[PCode.pssr, routine.index]]
  const firstTwoLines = firstLine.concat(initialiseSubroutineMemory(routine, options))

  if (routine.parameters.length > 0) {
    // I used to put loadSubroutineArguments on a new line; changed here to
    // match Peter's compiler; but maybe suggest Peter changes his instead?
    firstTwoLines[firstTwoLines.length - 1].push(...loadSubroutineArguments(routine, options))
    return firstTwoLines
  }

  if (routine.variables.length > 0) {
    return firstTwoLines
  }

  return firstLine
}

// pcode for the main program
export function program (routine: Program, subroutinesCode: number[][], innerCode: number[][], options: Options): number[][] {
  const startCode = programStartCode(routine, options)
  const jumpLine = [[PCode.jump, startCode.length + subroutinesCode.length + 2]]
  const endCode = [[PCode.halt]]
  return (subroutinesCode.length > 1)
    ? startCode.concat(jumpLine).concat(subroutinesCode).concat(innerCode).concat(endCode)
    : startCode.concat(innerCode).concat(endCode)
}

// pcode for the start of the main program
export function programStartCode (routine: Program, options: Options): number[][] {
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
  if (stringVariables(routine, options).length > 0) {
    return startCode.concat(stringVariables(routine, options).map(x => setupGlobalString(x, options)))
  }

  return startCode
}

// get string variables from a routine
function stringVariables (routine: Routine, options: Options): Variable[] {
  return routine.variables.filter(x => x.type === 'string')
}

// pcode for initialising a global string variable
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

// pcode for initialising a local string variable
function setupLocalString (variable: Variable, options: Options): number[] {
  const program = variable.routine.program
  const routine = variable.routine.index + program.baseOffset
  const index = variable.index

  return [
    PCode.ldav,
    routine,
    index + 2,
    PCode.stvv,
    routine,
    index,
    PCode.ldin,
    variable.length - 2, // 2 = pointer + max length byte
    PCode.stvv,
    routine,
    index + 1
  ]
}

// pcode for initialising subroutine memory
function initialiseSubroutineMemory (routine: Subroutine, options: Options): number[][] {
  const program = routine.program
  const claimMemory = [PCode.memc, routine.index + program.baseOffset, routine.memoryNeeded]
  const zeroMemory = [PCode.ldav, routine.index + program.baseOffset, 1, PCode.ldin, routine.memoryNeeded, PCode.zptr]
  const claimAndZero = [claimMemory, zeroMemory]

  return (stringVariables(routine, options).length > 0)
    ? claimAndZero.concat(stringVariables(routine, options).map(x => setupLocalString(x, options)))
    : claimAndZero
}

// load subroutine arguments from the stack
function loadSubroutineArguments (routine: Subroutine, options: Options): number[] {
  let result = []

  let pars = routine.parameters.length
  while (pars > 0) {
    pars -= 1
    result = result.concat(storeVariableValue(routine.parameters[pars], options, true))
  }

  return result
}

// pcode for the end of a subroutine
function subroutineEndCode (routine: Subroutine, options: Options): number[][] {
  const program = routine.program
  const subAddress = routine.index + program.baseOffset
  const resultAddress = routine.program.resultAddress
  const storeFunctionResult = [PCode.ldvg, subAddress, PCode.stvg, resultAddress]
  const releaseMemory = [PCode.memr, subAddress]
  const exit = [PCode.plsr, PCode.retn]

  if (routine.variables.length > 0 && routine.type === 'function') {
    return [storeFunctionResult.concat(releaseMemory.concat(exit))]
  }

  if (routine.variables.length > 0) {
    return [releaseMemory.concat(exit)]
  }

  return [exit]
}

// pcode for the first line of a program (global memory setup)
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
