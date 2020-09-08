/**
 * Miscellaneous definitions and functions for the coder.
 */
import { Options } from '../options'
import { PCode } from '../../constants/pcodes'
import { CompilerError } from '../../tools/error'
import { VariableType } from '../../parser/routine'
import { Lexeme } from '../../lexer/lexeme'

/** working variable */
export type WIP = {
  type: ExpressionType, // type of the current expression
  lex: number, // index of the current lexeme
  pcode: number[][] // generated pcode so far
}

/** an expression type */
export type ExpressionType = {
  variableType: VariableType,
  arrayDimensions: number // 0 for non-array variables
}

/** gets unambiguous operator from ambiguous one */
export function unambiguousOperator (operator: PCode, type: ExpressionType, options: Options): PCode {
  const integerVersions = [PCode.eqal, PCode.less, PCode.lseq, PCode.more, PCode.mreq, PCode.noeq, PCode.plus]
  const stringVersions = [PCode.seql, PCode.sles, PCode.sleq, PCode.smor, PCode.smeq, PCode.sneq, PCode.scat]
  return (type.variableType === 'string' || type.variableType === 'character')
    ? stringVersions[integerVersions.indexOf(operator)]
    : operator
}

/** checks found expression type against needed expression type */
export function check (needed: ExpressionType, found: ExpressionType, lexeme: Lexeme, options: Options): void {
  // if NULL is needed, everything is ok
  if (needed === null){
    return
  }

  if (found.arrayDimensions !== needed.arrayDimensions) {
    throw new CompilerError(`Array of ${needed.arrayDimensions} dimensions expected but array of ${found.arrayDimensions} dimensions found.`, lexeme)
  }

  // found and needed the same is obviously ok
  if (found.variableType === needed.variableType) {
    return
  }

  // if STRING is needed, CHAR is ok
  if ((needed.variableType === 'string') && (found.variableType === 'character')) {
    return
  }

  // if CHAR is needed, STRING of length 1 is ok
  if ((needed.variableType === 'character') && (found.variableType === 'string') && ((lexeme.value as string).length === 1)) {
    return
  }

  // if BOOLINT is needed, either BOOLEAN or INTEGER is ok
  if (needed.variableType === 'boolint' && (found.variableType === 'boolean' || found.variableType === 'integer')) {
    return
  }

  // if BOOLINT is found, either BOOLEAN or INTEGER needed is ok
  if (found.variableType === 'boolint' && (needed.variableType === 'boolean' || needed.variableType === 'integer')) {
    return
  }

  // everything else is an error
  throw new CompilerError(`Type error: '${needed.variableType}' expected but '${found.variableType}' found.`, lexeme)
}
