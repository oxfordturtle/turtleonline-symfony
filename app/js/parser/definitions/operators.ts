import type { Type, Operator, Lexeme } from '../../lexer/lexeme'

/** gets the type of an expression with the given operator */
export function type (operator: Operator): Type {
  switch (operator) {
    case 'plus': return 'integer'
    case 'scat': return 'string'
    case 'subt': return 'integer'
    case 'or': return 'boolint'
    case 'orl': return 'boolint'
    case 'xor': return 'boolint'
    case 'and': return 'boolint'
    case 'andl': return 'boolint'
    case 'div': return 'integer'
    case 'divr': return 'integer'
    case 'mod': return 'integer'
    case 'mult': return 'integer'
    case 'neg': return 'integer'
    default: return 'boolean'
  }
}

/** arrays of all operators */
export const operators: [Operator[], Operator[], Operator[], Operator[]] = [
  ['eqal', 'less', 'lseq', 'more', 'mreq', 'noeq', 'seql', 'sles', 'sleq', 'smor', 'smeq', 'sneq'],
  ['plus', 'scat', 'subt', 'or', 'orl', 'xor'],
  ['and', 'andl', 'div', 'divr', 'mod', 'mult'],
  ['neg', 'not']
]

/** gets an operator of the given level from a lexeme */
export function operator (lexeme: Lexeme, level: number): Operator|undefined {
  return operators[level].find(x => lexeme.type === 'operator' && lexeme.subtype === x)
}

/** maps boolean or integer operators to their string equivalents */
export function stringOperator (operator: Operator): Operator {
  switch (operator) {
    case 'eqal':
      return 'seql'
    case 'less':
      return 'sles'
    case 'lseq':
      return 'sleq'
    case 'more':
      return 'smor'
    case 'mreq':
      return 'smeq'
    case 'noeq':
      return 'sneq'
    case 'plus':
      return 'scat'
    default:
      return operator
  }
}
