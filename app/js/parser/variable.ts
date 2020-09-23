/**
 * Definition of a routine variable.
 */
import { Routine, Subroutine, Program } from './routine'
import { Type } from './type'

/** variable definition */
export class Variable {
  readonly name: string
  readonly routine: Routine
  readonly isParameter: boolean
  #isReferenceParameter: boolean
  type: Type
  turtle?: number // index of turtle variable (if this is one)
  stringLength: number
  arrayDimensions: [number, number][] // for array variables
  private?: Subroutine // subroutine for private variables (BASIC only)

  /** constructor */
  constructor (name: string, routine: Routine, isParameter: boolean = false, isReferenceParameter: boolean = false) {
    this.name = (routine.program.language === 'Pascal') ? name.toLowerCase() : name
    this.routine = routine
    this.isParameter = isParameter
    this.#isReferenceParameter = isReferenceParameter
    this.type = 'boolint' // booling by default; this is set properly after initial construction
    this.stringLength = 32 // default string length, maybe modified later
    this.arrayDimensions = []
  }

  /** whether the variable is an array */
  get isArray (): boolean {
    return this.arrayDimensions.length > 0
  }

  /** whether the variable is a reference parameter */
  get isReferenceParameter (): boolean {
    return this.isParameter
      ? (this.isArray || this.#isReferenceParameter)
      : false
  }

  /** whether the variable is a global */
  get isGlobal (): boolean {
    return this.routine.index === 0
  }

  /** base length of the variable (i.e. how many "bytes" of memory its elements require) */
  get baseLength (): number {
    return (this.type === 'string')
      ? this.stringLength + 3 // 3 = pointer + max length byte + actual length byte
      : 1
  }

  /** full length of the variable (longer than baseLength for arrays) */
  get length (): number {
    // reference parameters (simply hold the address to the varaiable)
    if (this.isReferenceParameter) {
      return 1
    }

    // arrays
    if (this.isArray) {
      let length = this.baseLength
      for (const dimensions of this.arrayDimensions) {
        const size = dimensions[1] - dimensions[0]
        length = (length * size) + 2
      }
      return length
    }

    // all other variables
    return this.baseLength
  }

  /** internal length of an array variable (i.e. how many elements it contains) */
  get arrayLength (): number {
    return this.isArray
      ? (this.arrayDimensions[0][1] - this.arrayDimensions[0][0])
      : 0
  }

  /** sub variables (for arrays) */
  get subVariables (): SubVariable[] {
    const subVariables: SubVariable[] = []
    if (this.isArray) {
      for (let i = 0; i < this.arrayLength; i += 1) {
        const subVariable = new SubVariable(this)
        subVariables.push(subVariable)
      }
    }
    return subVariables
  }

  /** index of the variable */
  get index (): number {
    const arrayIndex = this.routine.variables.indexOf(this)
    const routine = new Routine('!')
    routine.variables = this.routine.variables.slice(0, arrayIndex)
    return routine.memoryNeeded + 1
  }
}

/** subvariable definition */
class SubVariable extends Variable {
  readonly variable: Variable|SubVariable

  /** constructor */
  constructor (variable: Variable|SubVariable) {
    super(`${variable.name}`, variable.routine, variable.isParameter, variable.isReferenceParameter)
    this.variable = variable
    this.type = variable.type
    this.stringLength = variable.stringLength
    this.arrayDimensions = variable.arrayDimensions.slice(1)
    this.private = variable.private
  }

  /** index of the variable */
  get index (): number {
    const arrayIndex = this.variable.subVariables.indexOf(this)
    const routine = new Routine('!')
    routine.variables = this.variable.subVariables.slice(0, arrayIndex)
    return this.variable.index + routine.memoryNeeded + 1
  }
}

/** creates a built-in turtle variable */
export function turt (name: 'x'|'y'|'d'|'a'|'t'|'c', program: Program): Variable {
  const fullname = (program.language === 'BASIC') ? `turt${name}%` : `turt${name}`
  const variable = new Variable(fullname, program, false)
  variable.type = 'integer'
  variable.turtle = ['x', 'y', 'd', 'a', 't', 'c'].indexOf(name) + 1
  return variable
}
