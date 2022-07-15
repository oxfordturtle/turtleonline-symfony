import Routine from './routine'
import Variable from './variable'
import type { Language } from '../../constants/languages'

/** program */
export default class Program extends Routine {
  readonly baseGlobals: number = 12 // turtle, keybuffer, and 10 file handles
  readonly baseOffset: number = 11 // baseGlobals - 1

  /** constructor */
  constructor (language: Language, name?: string) {
    super(language, name)
  }

  /** address of the turtle in memory */
  get turtleAddress (): number {
    const subroutinePointers = this.allSubroutines.some(x => x.type === 'function')
      ? this.allSubroutines.length + 1
      : this.allSubroutines.length
    return subroutinePointers + this.baseGlobals
  }

  /** creates a built-in turtle variable */
  turt (name: 'x'|'y'|'d'|'a'|'t'|'c'): Variable {
    const fullname = (this.language === 'BASIC') ? `turt${name}%` : `turt${name}`
    const variable = new Variable(fullname, this)
    variable.type = 'integer'
    variable.typeIsCertain = true
    variable.turtle = ['x', 'y', 'd', 'a', 't', 'c'].indexOf(name) + 1
    return variable
  }

  /** gets all built-in turtle variables */
  get turtleVariables (): Variable[] {
    return [
      this.turt('x'),
      this.turt('y'),
      this.turt('d'),
      this.turt('a'),
      this.turt('t'),
      this.turt('c')
    ]
  }

  /** gets the address of the function result variable */
  get resultAddress (): number {
    return this.allSubroutines.length + this.baseGlobals
  }
}
