import type { Constant } from './constant'
import type Variable from './variable'
import type { Subroutine } from './subroutine'
import type { Statement } from './statement'
import type { Language } from '../../constants/languages'

/** routine (extended by program and subroutine) */
export default class Routine {
  readonly language: Language // the routine's language
  name: string = '!' // the routine's name
  index: number = 0 // the routine's index (0 for main program, > 0 for subroutines)
  start: number = 0 // index of the first (inner) lexeme
  end: number = 0 // index of the last (inner) lexeme + 1
  constants: Constant[] = [] // the routine's constants
  variables: Variable[] = [] // the routine's variables
  subroutines: Subroutine[] = [] // the routine's subroutines
  statements: Statement[] = [] // the sequence of statements that makes up the routine

  /** constructor */
  constructor (language: Language, name?: string) {
    this.language = language
    if (name) {
      this.name = (language === 'Pascal') ? name.toLowerCase() : name
    }
  }

  /** this routine's parameters */
  get parameters (): Variable[] {
    return this.variables.filter(x => x.isParameter)
  }

  /** how much memory this routine needs (i.e. the length of all variables) */
  get memoryNeeded (): number {
    return this.variables.reduce((x, y) => x + y.length, 0)
  }

  /** all subroutines of this routine (collapsed into one array) */
  get allSubroutines (): Subroutine[] {
    const allSubroutines: Subroutine[] = []
    for (const subroutine of this.subroutines) {
      allSubroutines.push(...subroutine.allSubroutines)
      allSubroutines.push(subroutine)
    }
    return allSubroutines
  }
}
