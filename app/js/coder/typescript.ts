import * as molecules from './molecules'
import * as pcoder from './pcoder'
import { Options } from './options'
import { CompilerError } from '../tools/error'
import { Routine, Variable } from '../parser/routine'
import { Lexeme } from '../lexer/lexeme'
import { PCode } from '../constants/pcodes'

type WIP = { lex: number, pcode: number[][] }

export default function coder (routine: Routine, lex: number, startLine: number, options: Options, oneLine: boolean = false): WIP {
  let wip: WIP
  return wip
}
