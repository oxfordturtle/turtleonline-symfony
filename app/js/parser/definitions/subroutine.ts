import type { Type, KeywordLexeme, TypeLexeme } from '../../lexer/lexeme'
import Routine from './routine'
import Program from './program'

/** subroutine */
export class Subroutine extends Routine {
  readonly lexeme: KeywordLexeme|TypeLexeme // the routine's initial (defining) lexeme
  readonly parent: Program|Subroutine
  readonly level: -1 = -1 // needed for the usage data table
  type: SubroutineType = 'procedure'
  returns: Type|null = null
  hasReturnStatement: boolean = false // for C, Java, Python, and TypeScript
  globals: string[] = [] // for Python
  nonlocals: string[] = [] // for Python
  indent: number = 0 // for Python
  startLine: number = 0 // first line in PCode (fixed later by the encoder module)

  /** constructor */
  constructor (lexeme: KeywordLexeme|TypeLexeme, parent: Program|Subroutine, name?: string) {
    super(parent.language, name)
    this.lexeme = lexeme
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
