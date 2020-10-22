import { Routine } from './routine'
import { Program } from './program'
import { Subroutine } from './subroutine'
import { Type } from './type'

/** variable */
export class Variable {
  readonly name: string
  readonly routine: Program|Subroutine
  isParameter: boolean = false
  isReferenceParameter: boolean = false
  isPointer: boolean = false
  type: Type = 'boolint'
  turtle?: number // index of turtle variable (if this is one)
  stringLength: number = 32
  arrayDimensions: [number, number][] = [] // for array variables
  private?: Subroutine // subroutine for private variables (BASIC only)

  /** constructor */
  constructor (name: string, routine: Program|Subroutine) {
    this.name = (routine.language === 'Pascal') ? name.toLowerCase() : name
    this.routine = routine
  }

  /** whether the variable is an array */
  get isArray (): boolean {
    return this.arrayDimensions.length > 0
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
    // reference parameters and pointers (simply hold the address to the varaiable)
    if (this.isReferenceParameter || this.isPointer) {
      return 1
    }

    // arrays
    if (this.isArray) {
      let length = this.baseLength
      for (const dimensions of this.arrayDimensions) {
        const size = dimensions[1] - dimensions[0] + 1
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
      ? (this.arrayDimensions[0][1] - this.arrayDimensions[0][0] + 1)
      : 0
  }

  /** sub variables (for arrays) */
  get subVariables (): SubVariable[] {
    const subVariables: SubVariable[] = []
    if (this.isArray) {
      for (let i = 0; i < this.arrayLength; i += 1) {
        const subVariable = new SubVariable(this, i)
        subVariables.push(subVariable)
      }
    }
    return subVariables
  }

  /** index of the variable */
  get index (): number {
    const arrayIndex = this.routine.variables.indexOf(this)
    const routine = new Routine(this.routine.language)
    routine.variables = this.routine.variables.slice(0, arrayIndex)
    return routine.memoryNeeded + 1
  }
}

/** subvariable (element of array variable) */
class SubVariable extends Variable {
  readonly variable: Variable|SubVariable

  /** constructor */
  constructor (variable: Variable|SubVariable, depth: number) {
    super(`${variable.name}_${depth.toString(10)}`, variable.routine)
    this.variable = variable
    this.type = variable.type
    this.isParameter = variable.isParameter
    this.isReferenceParameter = variable.isReferenceParameter
    this.stringLength = variable.stringLength
    this.arrayDimensions = variable.arrayDimensions.slice(1)
    this.private = variable.private
  }

  /** index of the subvariable */
  get index (): number {
    const arrayIndex = this.variable.subVariables.indexOf(this)
    const routine = new Routine(this.variable.routine.language)
    routine.variables = this.variable.subVariables.slice(0, arrayIndex)
    return this.variable.index + routine.memoryNeeded + 1
  }
}
