import { Routine } from './routine'
import { Program } from './program'
import { Type } from './type'

/** subroutine */
export class Subroutine extends Routine {
  readonly parent: Program|Subroutine
  readonly level: -1 = -1 // needed for the usage data table
  type: SubroutineType = 'procedure'
  returns: Type|null = null
  hasReturnStatement: boolean = false // for C, Java, Python, and TypeScript
  globals: string[] = []
  nonlocals: string[] = []
  startLine: number = 0 // first line in PCode (fixed later by the encoder module)

  /** constructor */
  constructor (parent: Program|Subroutine, name?: string) {
    super(parent.language, name)
    this.parent = parent
  }

  /** gets the program this subroutine belongs to */
  get program (): Program {
    return (this.parent instanceof Program) ? this.parent : this.parent.program
  }

  /** gets this subroutine's address in memory */
  get address (): number {
    return this.index + this.program.baseOffset
  }
}

/** subroutine type definition */
export type SubroutineType = 'procedure'|'function'
