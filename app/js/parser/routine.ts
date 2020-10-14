/**
 * Definitions for routines (programs and subroutines).
 */
import { Constant } from './constant'
import { Statement } from './statement'
import { Type } from './type'
import { turt, Variable } from './variable'
import { Colour, colours } from '../constants/colours'
import { Command, commands } from '../constants/commands'
import { Input, inputs } from '../constants/inputs'
import { Language } from '../constants/languages'
import { Lexeme } from '../lexer/lexeme'

/** routine class (extended by Program and Subroutine) */
export class Routine {
  readonly name: string // the name of the routine
  index: number = 0 // the routine's index
  indent: number = 0 // the routine's indentation level (Python only)
  constants: Constant[] = [] // the routine's constants
  variables: Variable[] = [] // the routine's variables
  subroutines: Subroutine[] = [] // the routine's subroutines
  statements: Statement[] = [] // the sequence of statements that makes up the routine
  lexemes: Lexeme[] = [] // the lexemes in the routine's main body
  lex: number = 0 // index of the current lexeme (used by parsers2)

  /** constructor */
  constructor (name: string) {
    this.name = name
  }

  /** gets this routine's program */
  get program (): Program {
    if (this instanceof Program) {
      return this
    }

    if (this instanceof Subroutine) {
      return this.parent.program
    }

    // this will never happen, since all routines will be either programs or subroutines
    // (TODO: modify things so that the compiler knows this...)
    return new Program('BASIC', '')
  }

  /** gets all subroutines of this routine flattened into one array */
  get allSubroutines (): Subroutine[] {
    const allSubroutines: Subroutine[] = []
    for (const subroutine of this.subroutines) {
      allSubroutines.push(...subroutine.allSubroutines)
      allSubroutines.push(subroutine)
    }
    return allSubroutines
  }

  /** gets this routine's parameters */
  get parameters (): Variable[] {
    return this.variables.filter(x => x.isParameter)
  }

  /** returns how much memory this routine needs (i.e. the length of all variables) */
  get memoryNeeded (): number {
    return this.variables.reduce((x, y) => x + y.length, 0)
  }

  /** looks for a constant visible to this routine */
  findConstant (name: string): Constant|undefined {
    if (this.program.language === 'Pascal') name = name.toLowerCase()
    const constant = this.constants.find(x => x.name === name)
    if (constant) {
      return constant
    }
    if (this instanceof Subroutine) {
      return this.parent.findConstant(name)
    }
  }

  /** looks for a colour */
  findColour (name: string): Colour|undefined {
    if (this.program.language === 'Pascal') name = name.toLowerCase()
    name = name.replace(/gray$/, 'grey').replace(/GRAY$/, 'GREY') // allow American spelling
    return colours.find(x => x.names[this.program.language] === name)
  }

  /** looks for an input query code */
  findInput (name: string): Input|undefined {
    if (this.program.language === 'Pascal') name = name.toLowerCase()
    return inputs.find(x => x.names[this.program.language] === name)
  }

  /** looks for a variable visible to this routine */
  findVariable (name: string): Variable|undefined {
    if (this.program.language === 'Pascal') {
      name = name.toLowerCase()
    }

    // look for turtle variable first
    const turtleVariable = this.program.turtleVariables.find(x => x.name === name)
    if (turtleVariable) {
      return turtleVariable
    }

    // for Python subroutines, look up global variables if the name is declared as global
    if (this.program.language === 'Python' && this instanceof Subroutine) {
      const isGlobal = this.globals.indexOf(name) > -1
      if (isGlobal) {
        return this.program.findVariable(name)
      }
    }

    // otherwise search this routine, then its ancestors recursively
    const variable = this.variables.find(x => x.name === name)
    if (variable) {
      return variable
    }
    if (this instanceof Subroutine) {
      return this.parent.findVariable(name)
    }
  }

  /** tests whether a potential variable/constant/subroutine name would clash in this routine's scope */
  isDuplicate (name: string): boolean {
    if (this.program.language === 'Pascal') name = name.toLowerCase()
    if (this.constants.some(x => x.name === name)) return true
    if (this.program.language === 'Python' && this instanceof Subroutine) {
      if (this.globals.some(x => x === name)) return true
      if (this.nonlocals.some(x => x === name)) return true
    }
    if (this.variables.some(x => x.name === name)) return true
    if (this.subroutines.some(x => x.name === name)) return true
    return false
  }

  /** looks for a subroutine visible to this routine */
  findSubroutine (name: string): Subroutine|undefined {
    if (this.program.language === 'Pascal') name = name.toLowerCase()
    // search this routine, then its parents recursively
    const subroutine = this.subroutines.find(x => x.name === name)
    if (subroutine) return subroutine
    if (this instanceof Subroutine) return this.parent.findSubroutine(name)
  }

  /** looks for a native turtle command */
  findNativeCommand (name: string): Command|undefined {
    if (this.program.language === 'Pascal') name = name.toLowerCase()
    return commands.find(x => x.names[this.program.language] === name)
  }

  /** looks for a command (native or custom) visible to this routine */
  findCommand (name: string): Command|Subroutine|undefined {
    if (this.program.language === 'Pascal') name = name.toLowerCase()
    // N.B. custom subroutines have priority
    return this.findSubroutine(name) || this.findNativeCommand(name)
  }
}

/** program definition */
export class Program extends Routine {
  readonly language: Language
  readonly baseGlobals: number
  readonly baseOffset: number

  /** constructor */
  constructor (language: Language, name: string) {
    super((language === 'Pascal') ? name.toLowerCase() : name)
    this.language = language
    this.baseGlobals = 12 // keybuffer, turtle, and 10 file handles
    this.baseOffset = this.baseGlobals - 1
  }

  /** address of the turtle in memory */
  get turtleAddress (): number {
    const subroutinePointers = this.allSubroutines.some(x => x.type === 'function')
      ? this.allSubroutines.length + 1
      : this.allSubroutines.length
    return subroutinePointers + this.baseGlobals
  }

  /** get built-in turtle variables */
  get turtleVariables (): Variable[] {
    return [
      turt('x', this),
      turt('y', this),
      turt('d', this),
      turt('a', this),
      turt('t', this),
      turt('c', this)
    ]
  }

  /** address of the function result variable */
  get resultAddress (): number {
    return this.allSubroutines.length + this.baseGlobals
  }
}

/** subroutine definition */
export class Subroutine extends Routine {
  readonly parent: Routine
  readonly level: -1 = -1 // needed for the usage data table
  type: SubroutineType
  returns: Type|null = null
  hasReturnStatement: boolean = false // for C, Python, and TypeScript
  globals: string[] = []
  nonlocals: string[] = []
  startLine: number = 0 // fixed later by the main coder module

  /** constructor */
  constructor (parent: Routine, name: string, type: SubroutineType = 'procedure') {
    super((parent.program.language === 'Pascal') ? name.toLowerCase() : name)
    this.parent = parent
    this.type = type
  }

  /** subroutine memory address */
  get address (): number {
    return this.index + this.program.baseOffset
  }
}

/** subroutine type definition */
export type SubroutineType = 'procedure'|'function'
