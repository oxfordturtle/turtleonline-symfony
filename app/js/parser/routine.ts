/**
 * Definitions for the objects that result from parsing.
 */
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
  subroutines: Subroutine[] = [] // the routine's subroutines
  lexemes: Lexeme[] = [] // the lexemes in the routine's main body
  variables: Variable[] = [] // the routine's (local) variables

  /** constructor */
  constructor (name: string) {
    this.name = name
  }

  /** gets this routine's program */
  get program (): Program {
    if (this instanceof Program) return this
    if (this instanceof Subroutine) return this.parent.program
  }

  /** gets all subroutines of this routine flattened into one array */
  get allSubroutines (): Subroutine[] {
    const allSubroutines: Subroutine[] = []
    for (const subroutine of this.subroutines) {
      allSubroutines.push(subroutine)
      allSubroutines.push(...subroutine.allSubroutines)
    }
    return allSubroutines
  }

  /** getsthis routines parameters */
  get parameters (): Variable[] {
    return this.variables.filter(x => x.isParameter)
  }

  /** returns how much memory this routine needs (i.e. length of all variables) */
  get memoryNeeded (): number {
    return this.variables.reduce((x, y) => x + y.length, 0)
  }

  /** looks for a constant visible to this routine */
  findConstant (name: string): Constant|undefined {
    if (this.program.language === 'Pascal') name = name.toLowerCase()
    return this.program.constants.find(x => x.name === name)
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
    if (this.program.language === 'Pascal') name = name.toLowerCase()

    // look for turtle variable first
    const turtleVariable = this.program.turtleVariables.find(x => x.name === name)
    if (turtleVariable) return turtleVariable

    // for Python subroutines, look up global variables if the name is declared as global
    if (this.program.language === 'Python' && this instanceof Subroutine) {
      const isGlobal = this.globals.indexOf(name) > -1
      if (isGlobal) return this.program.findVariable(name)
    }

    // otherwise search this routine, then its parents recursively
    const variable = this.variables.find(x => x.name === name)
    if (variable) return variable
    if (this instanceof Subroutine) return this.parent.findVariable(name)
  }

  /** tests whether a potential variable/constant/subroutine name would clash in this routine's scope */
  isDuplicate (name: string): boolean {
    if (this.program.language === 'Pascal') name = name.toLowerCase()
    if (this.program.constants.some(x => x.name === name)) return true
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
  constants: Constant[] = []

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
  returns: VariableType|null = null
  globals: string[] = []
  nonlocals: string[] = []
  startLine: number = 0 // fixed later by the main coder module

  /** constructor */
  constructor (parent: Routine, name: string, type: SubroutineType = 'procedure') {
    super((parent.program.language === 'Pascal') ? name.toLowerCase() : name)
    this.parent = parent
    this.type = type
  }
}

/** subroutine type definition */
export type SubroutineType = 'procedure'|'function'

/** constant definition */
export class Constant {
  readonly name: string
  readonly type: VariableType
  readonly value: string|number

  constructor (language: Language, name: string, type: VariableType, value: string|number) {
    this.name = (language === 'Pascal') ? name.toLowerCase() : name
    this.type = type
    this.value = value
  }
}

/** variable definition */
export class Variable {
  readonly name: string
  readonly lexeme: Lexeme // keep this around in case type cannot be deduced and an error message is needed
  readonly routine: Routine
  readonly isParameter: boolean
  #isReferenceParameter: boolean
  type: VariableType // set after initial construction
  turtle: number // index of turtle variable (if this is one)
  stringLength: number = 32
  isArray: boolean = false
  arrayDimensions: [number, number][] = [] // for array variables (BASIC and Pascal only)
  private: Subroutine|null // subroutine for private variables (BASIC only)

  constructor (lexemeOrName: Lexeme|string, routine: Routine, isParameter: boolean = false, isReferenceParameter: boolean = false) {
    if (lexemeOrName instanceof Lexeme) {
      this.name = (routine.program.language === 'Pascal') ? lexemeOrName.content.toLowerCase() : lexemeOrName.content
      this.lexeme = lexemeOrName
    } else {
      this.name = lexemeOrName
    }
    this.routine = routine
    this.isParameter = isParameter
    this.#isReferenceParameter = isReferenceParameter
  }

  get isReferenceParameter (): boolean {
    return (this.routine.program.language === 'Python') ? this.isArray : this.#isReferenceParameter
  }

  get baseLength (): number {
    if (this.type === 'string') {
      return this.stringLength + 3 // 3 = pointer + max length byte + actual length byte
    }
    return 1
  }

  get length (): number {
    if (this.isArray) {
      let length = this.baseLength
      for (const dimensions of this.arrayDimensions) {
        const size = dimensions[1] - dimensions[0]
        length = (length * size) + 2
      }
      return length
    }
    return this.baseLength
  }

  get index (): number {
    const arrayIndex = this.routine.variables.indexOf(this)
    const routine = new Routine('!')
    routine.variables = this.routine.variables.slice(0, arrayIndex)
    return routine.memoryNeeded + 1
  }
}

/** constant/variable type definition */
export type VariableType = 'boolean'|'integer'|'boolint'|'string'|'character'

/** creates a built-in turtle variable */
function turt (name: 'x'|'y'|'d'|'a'|'t'|'c', program: Program): Variable {
  const fullname = (program.language === 'BASIC') ? `turt${name}%` : `turt${name}`
  const variable = new Variable(fullname, program, false)
  variable.type = 'integer'
  variable.turtle = ['x', 'y', 'd', 'a', 't', 'c'].indexOf(name) + 1
  return variable
}
