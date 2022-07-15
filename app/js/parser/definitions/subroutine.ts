import type Variable from './variable'
import type { KeywordLexeme, Type, TypeLexeme } from '../../lexer/lexeme'
import Routine from './routine'
import Program from './program'

/** subroutine */
export class Subroutine extends Routine {
  readonly lexeme: KeywordLexeme|TypeLexeme // the routine's initial (defining) lexeme
  readonly parent: Program|Subroutine
  readonly level: -1 = -1 // needed for the usage data table
  hasReturnStatement = false // for C, Java, Python, and TypeScript
  typeIsCertain: boolean
  globals: string[] = [] // for Python
  nonlocals: string[] = [] // for Python
  indent = 0 // for Python
  startLine = 0 // first line in PCode (fixed later by the encoder module)

  /** constructor */
  constructor (lexeme: KeywordLexeme|TypeLexeme, parent: Program|Subroutine, name?: string) {
    super(parent.language, name)
    this.lexeme = lexeme
    this.parent = parent
    this.typeIsCertain = parent.language === 'Python' ? false : true
  }

  /** gets the program this subroutine belongs to */
  get program (): Program {
    return (this.parent instanceof Program) ? this.parent : this.parent.program
  }

  /** gets the routines result variable (if any) */
  get result (): Variable | undefined {
    return this.variables.find(x => this.language === 'Pascal' ? x.name === 'result' : x.name === '!result')
  }

  /** gets the return type of the subroutine (null for procedures) */
  get returns (): Type | null {
    return this.result ? this.result.type : null
  }

  /** gets whether this subroutine is a procedure or a function */
  get type (): SubroutineType {
    return this.result === undefined ? 'procedure' : 'function'
  }

  /** gets this subroutine's address in memory */
  get address (): number {
    return this.index + this.program.baseOffset
  }
}

/** subroutine type definition */
export type SubroutineType = 'procedure'|'function'
