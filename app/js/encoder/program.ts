// type imports
import type Program from '../parser/definitions/program'
import type { Options } from './options'

// submodule imports
import { defaultOptions } from './options'
import statement from './statement'

// other module imports
import Variable from '../parser/definitions/variable'
import { Subroutine } from '../parser/definitions/subroutine'
import { PCode, pcodeArgs } from '../constants/pcodes'

/** generates the pcode for a turtle program */
export default function program (program: Program, options: Options = defaultOptions): number[][] {
  // get start code and end code
  const startCode = programStart(program, options)

  // calculate the start line of the first subroutine
  const subroutinesStartLine = (program.allSubroutines.length > 0)
    ? startCode.length + 2 // + 1 for jump line past subroutines
    : startCode.length + 1

  // get the pcode for all (any) subroutines
  // N.B. this also saves the start line of each subroutine, required for
  // back-patching BASIC programs below
  const subroutinesCode = compileSubroutines(program.allSubroutines, subroutinesStartLine, options)

  // calculate the start line of the main program
  const programStartLine = subroutinesStartLine + subroutinesCode.length

  // generate the pcode for the main program
  const innerCode = compileInnerCode(program, programStartLine, options)

  // stitch the program and subroutines pcode together
  const jumpLine = [[PCode.jump, startCode.length + subroutinesCode.length + 2]]
  const pcode = (subroutinesCode.length > 1)
    ? startCode.concat(jumpLine).concat(subroutinesCode).concat(innerCode)
    : startCode.concat(innerCode)

  // backpatch subroutine jump codes
  backpatchSubroutineCalls(program, pcode)

  // add call to the "main" subroutine for C and Java
  if (program.language === 'C' || program.language === 'Java') {
    // we know the main routine exists at this stage; parser1 for C will have
    // thrown an error if it doesn't
    const main = program.subroutines.find(x => x.name === 'main') as Subroutine
    pcode.push([PCode.subr, main.startLine])
  }

  // add HCLR codes where necessary
  addHCLR(pcode)

  // add final HALT command
  pcode.push([PCode.halt])

  // return the pcode
  return pcode
}

/** creates the pcode for the start of a program */
function programStart (program: Program, options: Options): number[][] {
  // initialise start code
  const pcode = [
    // line 1: global memory
    [
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
    ],
    // line 2: turtle and keybuffer setup
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

  // next: setup variables
  for (const variable of program.variables) {
    const setup = setupGlobalVariable(variable)
    if (setup.length > 0) {
      pcode.push(...setup)
    }
  }

  return pcode
}

/** generates pcode for setting up a global variable */
function setupGlobalVariable (variable: Variable): number[][] {
  const pcode: number[][] = []

  if (variable.isArray) {
    pcode.push([
      PCode.ldag,
      variable.lengthByteAddress,
      PCode.stvg,
      variable.address,
      PCode.ldin,
      variable.elementCount,
      PCode.stvg,
      variable.lengthByteAddress
    ])
    for (const subVariable of variable.subVariables) {
      const subPcode = setupGlobalVariable(subVariable)
      if (subPcode.length > 0) {
        pcode.push(...subPcode)
      }
    }
  }

  else if (variable.type === 'string') {
    pcode.push([
      PCode.ldag,
      variable.lengthByteAddress + 1,
      PCode.stvg,
      variable.address,
      PCode.ldin,
      variable.stringLength + 1, // +1 for the actual length byte (??)
      PCode.stvg,
      variable.lengthByteAddress
    ])
  }

  return pcode
}

/** generates pcode for all subroutines */
function compileSubroutines (subroutines: Subroutine[], startLine: number, options: Options): number[][] {
  const pcode: number[][] = []

  // generate the pcode for each subroutine in turn, concatenating the results
  for (const subroutine of subroutines) {
    // at this point, we know where the code for this subroutine starts; add this
    // information to the subroutine object so we can call it from now on
    subroutine.startLine = startLine

    // generate the code for the subroutine
    const startCode = subroutineStartCode(subroutine, options)
    const innerCode = compileInnerCode(subroutine, startLine + startCode.length, options)
    const subroutineCode = startCode.concat(innerCode)

    if ((subroutine.type === 'procedure') || (subroutine.program.language === 'Pascal')) {
      // all procedures need end code, as do functions in Pascal
      // (functions in other languages include at least one RETURN statement)
      const endCode = subroutineEndCode(subroutine, options)
      subroutineCode.push(...endCode)
    }

    // increment the start line for the next subroutine
    startLine += subroutineCode.length

    // add the code for the subroutine
    pcode.push(...subroutineCode)
  }

  // return the pcode
  return pcode
}

/** creates pcode for the body of a routine */
function compileInnerCode (routine: Program|Subroutine, startLine: number, options: Options): number[][] {
  const program = (routine instanceof Subroutine) ? routine.program : routine
  const pcode: number[][] = []
  for (const stmt of routine.statements) {
    pcode.push(...statement(stmt, program, startLine + pcode.length, options))
  }
  return pcode
}

/** creates pcode for the start of a subroutine */
function subroutineStartCode (subroutine: Subroutine, options: Options): number[][] {
  const pcode: number[][] = []

  pcode.push([PCode.pssr, subroutine.index])

  // initialise variables
  if (subroutine.variables.length > 0) {
    // claim memory
    pcode.push([PCode.memc, subroutine.address, subroutine.memoryNeeded])

    // zero memory
    if (options.initialiseLocals) {
      if (subroutine.variables.length > subroutine.parameters.length) {
        // TODO: speak to Peter about this - his latest compiler doesn't appear to be doing this in every case
        pcode.push([PCode.ldav, subroutine.address, 1, PCode.ldin, subroutine.memoryNeeded, PCode.zptr])
      }
    }

    // setup local variables
    for (const variable of subroutine.variables) {
      const setup = setupLocalVariable(variable)
      if (setup.length > 0) {
        pcode.push(...setup)
      }
    }

    // store values of parameters
    // (these should have been loaded onto the stack before the subroutine call)
    if (subroutine.parameters.length > 0) {
      pcode.push([])
      for (const parameter of subroutine.parameters.reverse()) {
        const lastStartLine = pcode[pcode.length - 1]
        if (parameter.isArray && !parameter.isReferenceParameter) {
          // TODO: copy the array
        } else if (parameter.type === 'string' && !parameter.isReferenceParameter) {
          // copy the string
          lastStartLine.push(PCode.ldvv, subroutine.address, parameter.address, PCode.cstr)
        } else {
          // for booleans and integers, or longer reference parameters, just store the value/address
          lastStartLine.push(PCode.stvv, subroutine.address, parameter.address)
        }
      }
    }
  }

  return pcode
}

/** generates pcode for setting up a local variable */
function setupLocalVariable(variable: Variable): number[][] {
  const subroutine = variable.routine as Subroutine
  const pcode: number[][] = []

  if (variable.isArray && !variable.isReferenceParameter) {
    pcode.push([
      PCode.ldav,
      subroutine.address,
      variable.lengthByteAddress,
      PCode.stvv,
      subroutine.address,
      variable.address,
      PCode.ldin,
      variable.elementCount,
      PCode.stvv,
      subroutine.address,
      variable.lengthByteAddress
    ])
    for (const subVariable of variable.subVariables) {
      const subPcode = setupLocalVariable(subVariable)
      if (subPcode.length > 0) {
        pcode.push(...subPcode)
      }
    }
    return pcode
  }

  if (variable.type === 'string') {
    pcode.push([
      PCode.ldav,
      subroutine.address,
      variable.lengthByteAddress + 1,
      PCode.stvv,
      subroutine.address,
      variable.address,
      PCode.ldin,
      variable.stringLength + 1, // +1 for the actual length byte (??)
      PCode.stvv,
      subroutine.address,
      variable.lengthByteAddress
    ])
  }

  return pcode
}

/** creates pcode for the end of a subroutine */
function subroutineEndCode (subroutine: Subroutine, options: Options): number[][] {
  const pcode: number[] = []
  if (subroutine.type === 'function') {
    // store function result
    pcode.push(PCode.ldvg, subroutine.address, PCode.stvg, subroutine.program.resultAddress)
  }
  if (subroutine.variables.length > 0) {
    // release memory
    pcode.push(PCode.memr, subroutine.address)
  }
  pcode.push(PCode.plsr, PCode.retn)

  return [pcode]
}

/** backpatches pcode for subroutine calls */
function backpatchSubroutineCalls (program: Program, pcode: number[][]): void {
  for (let i = 0; i < pcode.length; i += 1) {
    for (let j = 0; j < pcode[i].length; j += 1) {
      if (pcode[i][j - 1] && pcode[i][j - 1] === PCode.subr) {
        const subroutine = program.allSubroutines.find(x => x.index === pcode[i][j])
        if (subroutine) {
          pcode[i][j] = subroutine.startLine
        }
      }
    }
  }
}

/** adds PCode.hclr codes where necessary */
function addHCLR (pcode: number[][]): void {
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
    let heapStringMade: boolean = false
    let heapStringNeeded: boolean = false
    let lastJumpIndex: number|null = null
    let i: number = 0
    while (i < line.length) {
      if (heapStringCodes.indexOf(line[i]) >= 0) {
        heapStringMade = true
      }
      if (line[i] === PCode.subr) { // maybe more cases will be needed
        heapStringNeeded = true
      }
      if (line[i] === PCode.jump || line[i] === PCode.ifno) {
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
}
