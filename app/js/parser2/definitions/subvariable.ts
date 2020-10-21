import { Routine } from './routine'
import { Variable } from './variable'

/** subvariable (element of array variable) */
export class SubVariable extends Variable {
  readonly variable: Variable|SubVariable

  /** constructor */
  constructor (variable: Variable|SubVariable, depth: number) {
    super(`${variable.name}_${depth.toString(10)}`, variable.routine, variable.isParameter, variable.isReferenceParameter)
    this.variable = variable
    this.type = variable.type
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
