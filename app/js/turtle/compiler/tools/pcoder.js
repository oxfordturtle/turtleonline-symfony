/*
assorted functions for generating the pcode
*/
import pc from '../../constants/pc.js'
import * as find from './find.js'

// machine constants
const turtleProperties = 6
const baseGlobals = 10 // keybuffer, turtle, and 8 file handles
const baseOffset = baseGlobals - 1

// merge two arrays of pcode into one, without a line break in between
export function merge (pcode1, pcode2) {
  // corner case: INPT followed by ICLR (from e.g. "reset(?key)"), INPT should be deleted
  if (pcode2[0] && pcode2[0][0] && pcode2[0][0] === pc.iclr) {
    const last1 = pcode1.length - 1
    const last2 = pcode1[last1] ? pcode1[last1].length - 1 : 0
    if (pcode1[last1] && pcode1[last1][last2] && pcode1[last1][last2] === pc.inpt) {
      pcode1[last1].pop() // delete pc.inpt
    }
  }
  // return the merged arrays
  return pcode1.slice(0, -1)
    .concat([pcode1[pcode1.length - 1].concat(pcode2[0])])
    .concat(pcode2.slice(1))
}

// merge two things with an operator at the end
export function mergeWithOperator (sofar, next, operator, makeAbsolute = false) {
  const pcode2 = merge(sofar, next.pcode)
  const pcode3 = makeAbsolute
    ? merge(pcode2, [[pc[operator], pc.abs]])
    : merge(pcode2, [[pc[operator]]])
  return Object.assign(next, { pcode: pcode3 })
}

// pcode for loading a literal value onto the stack
export function loadLiteralValue (type, value) {
  return (type === 'string')
    ? [pc.lstr, value.length].concat(Array.from(value).map(x => x.charCodeAt(0)))
    : [pc.ldin, value]
}

// pcode for loading an input keycode onto the stack
export function loadInputValue (input) {
  return (input.value < 0)
    ? loadLiteralValue('integer', input.value).concat(pc.inpt)
    : loadLiteralValue('integer', input.value)
}

// pcode for loading the value of a variable onto the stack
export function loadVariableValue (variable) {
  // predefined turtle property
  if (variable.turtle) {
    return [pc.ldvg, variable.routine.turtleAddress + variable.turtle]
  }

  // global variable
  if (variable.routine.index === 0) {
    return [pc.ldvg, variable.routine.turtleAddress + turtleProperties + variable.index]
  }

  // local reference variable
  if (variable.byref) {
    return [pc.ldvr, variable.routine.index + baseOffset, variable.index]
  }

  // local value variable
  return [pc.ldvv, variable.routine.index + baseOffset, variable.index]
}

// pcode for loading the address of a variable onto the stack
export function loadVariableAddress (variable) {
  // predefined turtle property
  if (variable.turtle) {
    return [pc.ldin, 0, pc.lptr, pc.ldin, variable.turtle, pc.plus]
  }

  // global variable
  if (variable.routine.index === 0) {
    return [pc.ldag, variable.routine.turtleAddress + turtleProperties + variable.index]
  }

  // local variable
  return [pc.ldav, variable.routine.index + baseOffset, variable.index]
}

// pcode for storing the value of a variable in memory
export function storeVariableValue (variable, parameter = false) {
  // predefined turtle property
  if (variable.turtle) {
    return [pc.ldin, 0, pc.lptr, pc.ldin, variable.turtle, pc.plus, pc.sptr]
  }

  // global variable
  if (variable.routine.index === 0) {
    const address = variable.routine.turtleAddress + turtleProperties + variable.index
    return (variable.fulltype.type === 'string')
      ? [pc.ldvg, address, pc.cstr]
      : [pc.stvg, address]
  }

  // local string variable
  if (variable.fulltype.type === 'string') {
    return [pc.ldvv, variable.routine.index + baseOffset, variable.index, pc.cstr, pc.hclr]
  }

  // local (non-string) reference variable (not as a parameter)
  if (variable.byref && !parameter) {
    return [pc.stvr, variable.routine.index + baseOffset, variable.index]
  }

  // local non-string variable
  return [pc.stvv, variable.routine.index + baseOffset, variable.index]
}

// pcode for loading return value of a function onto the stack
export function loadFunctionReturnValue (routine) {
  return routine.returns === 'string'
    ? [pc.ldvv, find.program(routine).resultAddress, 1, pc.ldin, 0, pc.case]
    : [pc.ldvv, find.program(routine).resultAddress, 1]
}

// pcode for an expression operator
export function applyOperator (type) {
  switch (type) {
    case 'subt':
      return [pc.neg]

    case 'not':
      return [pc.not]

    case 'bnot': // Python only
      return [pc.ldin, 0, pc.eqal]
  }
}

// pcode for a command call (applied after any arguments have been loaded onto the stack)
export function callCommand (command, routine, language) {
  const program = find.program(routine)

  // custom commands
  if (command.code === undefined) {
    return [pc.subr, command.startLine || `SUBR${command.index}`]
  }

  // native commands
  if (command.code[0] === pc.oldt) {
    // this is a special case, because compilation requires knowing the original turtle address
    return [pc.ldin, program.turtleAddress, pc.ldin, 0, pc.sptr]
  }

  // otherwise just return the pcodes defined for the command
  return command.code
}

// pcode for a conditional structure
export function conditional (startLine, testCode, ifCode, elseCode = []) {
  const offset = (elseCode.length > 0) ? 2 : 1
  const startCode = merge(testCode, [[pc.ifno, ifCode.length + startLine + offset]])
  const middleCode = [[pc.jump, ifCode.length + elseCode.length + startLine + offset]]

  return elseCode.length > 0
    ? startCode.concat(ifCode).concat(middleCode).concat(elseCode)
    : startCode.concat(ifCode)
}

// pcode for a FOR loop structure
export function forLoop (startLine, variable, initial, final, compare, change, innerCode) {
  const ifnoLine = innerCode.length + startLine + 4
  const startCode = [
    initial,
    storeVariableValue(variable).concat(final),
    loadVariableValue(variable).concat([pc[compare], pc.ifno, ifnoLine])
  ]
  const endCode = [
    loadVariableValue(variable).concat([pc[change], pc.jump, startLine + 1])
  ]

  return startCode.concat(innerCode).concat(endCode)
}

// pcode for a REPEAT loop structure
export function repeatLoop (startLine, testCode, innerCode) {
  const endCode = merge(testCode, [[pc.ifno, startLine]])

  return innerCode.concat(endCode)
}

// pcode for a WHILE loop structure
export function whileLoop (startLine, testCode, innerCode) {
  const startCode = merge(testCode, [[pc.ifno, innerCode.length + startLine + 2]])
  const endCode = [[pc.jump, startLine]]

  return startCode.concat(innerCode).concat(endCode)
}

// pcode for a subroutine
export function subroutine (routine, innerCode) {
  const startCode = subroutineStartCode(routine)
  const endCode = subroutineEndCode(routine)

  return startCode.concat(innerCode).concat(endCode)
}

// pcode for the start of a subroutine (exported so that the coder can determine its length)
export function subroutineStartCode (routine) {
  const firstLine = [[pc.pssr, routine.index]]
  const firstTwoLines = firstLine.concat(initialiseSubroutineMemory(routine))

  if (routine.variables.length > 0 && routine.parameters.length > 0) {
    return firstTwoLines.concat([loadSubroutineArguments(routine)])
  }

  if (routine.variables.length > 0) {
    return firstTwoLines
  }

  return firstLine
}

// pcode for the main program
export function program (routine, subroutinesCode, innerCode) {
  const startCode = programStartCode(routine)
  const jumpLine = [[pc.jump, startCode.length + subroutinesCode.length + 2]]
  const endCode = [[pc.halt]]
  return (subroutinesCode.length > 1)
    ? startCode.concat(jumpLine).concat(subroutinesCode).concat(innerCode).concat(endCode)
    : startCode.concat(innerCode).concat(endCode)
}

// pcode for the start of the main program
export function programStartCode (routine) {
  const startCode = [
    setupGlobalMemory(routine.turtleAddress, routine.memoryNeeded),
    [
      pc.home,
      pc.ldin,
      2,
      pc.thik,
      pc.ldin,
      360,
      pc.angl,
      pc.ldin,
      32,
      pc.bufr,
      pc.ldin,
      1, // address of the keybuffer pointer
      pc.sptr,
      pc.hfix,
      pc.ldin,
      0,
      pc.dupl,
      pc.ldin,
      1000,
      pc.dupl,
      pc.dupl,
      pc.dupl,
      pc.reso,
      pc.canv
    ]
  ]

  // maybe setup global string variables
  if (stringVariables(routine).length > 0) {
    return startCode.concat(stringVariables(routine).map(setupGlobalString))
  }

  return startCode
}

// get string variables from a routine
function stringVariables (routine) {
  return routine.variables.filter(x => x.fulltype.type === 'string')
}

// pcode for initialising a global string variable
function setupGlobalString (variable) {
  const index = variable.routine.turtleAddress + turtleProperties + variable.index

  return [
    pc.ldag,
    index + 2,
    pc.stvg,
    index,
    pc.ldin,
    variable.fulltype.length - 1,
    pc.stvg,
    index + 1
  ]
}

// pcode for initialising a local string variable
function setupLocalString (variable) {
  const routine = variable.routine.index + baseOffset
  const index = variable.index

  return [
    pc.ldav,
    routine,
    index + 2,
    pc.stvv,
    routine,
    index,
    pc.ldin,
    variable.fulltype.length - 1,
    pc.stvv,
    routine,
    index + 1
  ]
}

// pcode for initialising subroutine memory
function initialiseSubroutineMemory (routine) {
  const claimMemory = [pc.memc, routine.index + baseOffset, routine.memoryNeeded]
  const zeroMemory = [pc.ldav, routine.index + baseOffset, 1, pc.ldin, routine.memoryNeeded, pc.zptr]
  const claimAndZero = [claimMemory, zeroMemory]

  return (stringVariables(routine).length > 0)
    ? claimAndZero.concat(stringVariables(routine).map(setupLocalString))
    : claimAndZero
}

// load subroutine arguments from the stack
function loadSubroutineArguments (routine) {
  let result = []

  let pars = routine.parameters.length
  while (pars > 0) {
    pars -= 1
    result = result.concat(storeVariableValue(routine.parameters[pars], true))
  }

  return result
}

// pcode for the end of a subroutine
function subroutineEndCode (routine) {
  const subAddress = routine.index + baseOffset
  const resultAddress = find.program(routine).resultAddress
  const storeFunctionResult = [pc.ldvg, subAddress, pc.stvg, resultAddress]
  const releaseMemory = [pc.memr, subAddress]
  const exit = [pc.plsr, pc.retn]

  if (routine.variables.length > 0 && routine.type === 'function') {
    return [storeFunctionResult, releaseMemory.concat(exit)]
  }

  if (routine.variables.length > 0) {
    return [releaseMemory.concat(exit)]
  }

  return [exit]
}

// pcode for the first line of a program (global memory setup)
function setupGlobalMemory (turtleAddress, memoryNeeded) {
  return [
    pc.ldin,
    turtleAddress,
    pc.dupl,
    pc.dupl,
    pc.ldin,
    0, // address of the turtle pointer
    pc.sptr,
    pc.ldin,
    turtleProperties, // number of turtle properties
    pc.swap,
    pc.sptr,
    pc.incr,
    pc.ldin,
    memoryNeeded + turtleProperties,
    pc.zptr,
    pc.ldin,
    turtleAddress + memoryNeeded + turtleProperties,
    pc.stmt
  ]
}