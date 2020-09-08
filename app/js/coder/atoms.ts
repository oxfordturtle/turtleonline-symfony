/**
 * Functions for compiling simple statements (i.e. assignment or procedure call)
 * and expressions.
 */
import { Options } from './options'
import * as pcoder from '../pcoder/pcoder'
import { Command } from '../constants/commands'
import { PCode } from '../constants/pcodes'
import { CompilerError } from '../tools/error'
import { Lexeme } from '../lexer/lexeme'
import { Routine, Subroutine, Variable, VariableType } from '../parser/routine'

/** result of the main functions */
type Result = { type?: ExpressionType, lex: number, pcode: number[][] }

/** an expression type */
type ExpressionType = { variableType: VariableType, arrayDimensions: number }

/** compiles a simple statment (assumes current lexeme is an identifier) */
export function simpleStatement (routine: Routine, lex: number, options: Options): Result {
}

/** compiles a variable assignment */
export function variableAssignment (routine: Routine, variable: Variable, lex: number, options: Options): Result {
}

/** compiles a procedure call */
function procedureCall (routine: Routine, command: Command|Subroutine, lex: number, options: Options, procedureCheck: boolean = true): WIP {
}

/** compiles an expression */
export function expression (routine: Routine, lex: number, type: ExpressionType|null, needed: ExpressionType|null, options: Options): Result {
  // expressions are boolean anyway
  if (needed?.arrayDimensions === 0 && needed?.variableType === 'boolean') {
    needed.variableType = null
  }

  // evaluate the first bit
  let result = simple(routine, lex, type, needed, options)

  // evaluate the expression operator and next bit (if any), and merge the results
  const expTypes = [PCode.eqal, PCode.less, PCode.lseq, PCode.more, PCode.mreq, PCode.noeq]
  while (routine.lexemes[result.lex] && (expTypes.indexOf(routine.lexemes[result.lex].value as PCode) > -1)) {
    const operator = unambiguousOperator(routine.lexemes[result.lex].value as PCode, result.type, options)
    const next = simple(routine, result.lex + 1, result.type, needed, options)
    const makeAbsolute = (routine.program.language === 'Python')
    result = mergeWithOperator(result.pcode, next, operator, makeAbsolute)
  }

  // specify current type as boolean
  result.type = { variableType: 'boolean', arrayDimensions: 0 }

  // return the result
  return result
}

/** compiles a simple expression */
function simple (routine: Routine, lex: number, type: ExpressionType|null, needed: ExpressionType|null, options: Options): Result {
  // evaluate the first bit
  let result = term(routine, lex, type, needed, options)

  // evaluate the expression operator and next bit (if any), and merge the results
  const simpleTypes = [PCode.plus, PCode.subt, PCode.or, PCode.orl, PCode.xor]
  while (routine.lexemes[result.lex] && (simpleTypes.indexOf(routine.lexemes[result.lex].value as PCode) > -1)) {
    const operator = unambiguousOperator(routine.lexemes[result.lex].value as PCode, result.type, options)
    const next = term(routine, result.lex + 1, result.type, needed, options)
    const makeAbsolute = (routine.program.language === 'Python' && operator === PCode.orl)
    result = mergeWithOperator(result.pcode, next, operator, makeAbsolute)
  }

  // return the result
  return result
}

/** compiles a term expression */
function term (routine: Routine, lex: number, type: ExpressionType|null, needed: ExpressionType|null, options: Options): Result {
  // evaluate the first bit
  let result = factor(routine, lex, type, needed, options)

  // evaluate the term operator and next bit (if any), and merge the results
  const termTypes = [PCode.and, PCode.andl, PCode.div, PCode.divr, PCode.mod, PCode.mult]
  while (routine.lexemes[result.lex] && termTypes.indexOf(routine.lexemes[result.lex].value as PCode) > -1) {
    const operator = unambiguousOperator(routine.lexemes[result.lex].value as PCode, result.type, options)
    const next = factor(routine, result.lex + 1, result.type, needed, options)
    const makeAbsolute = (routine.program.language === 'Python' && operator === PCode.andl)
    result = mergeWithOperator(result.pcode, next, operator, makeAbsolute)
  }

  // return the result
  return result
}

/** compiles a factor (where expressions bottom out) */
function factor (routine: Routine, lex: number, type: ExpressionType|null, needed: ExpressionType|null, options: Options): Result {
  let result: Result = { type, lex, pcode: [] }

  switch (routine.lexemes[lex].type) {
    // operators
    case 'operator':
      const operator = routine.lexemes[lex].value as PCode
      switch (operator) {
        case PCode.subt: // fallthrough
        case PCode.not:
          type.variableType = (operator === PCode.subt) ? 'integer' : 'boolint'
          // check the type is okay
          check(needed, result.type, routine.lexemes[lex], options)
          // handle what follows (should be a factor)
          result = factor(routine, lex + 1, type, needed, options)
          // append the negation operator
          result.pcode = pcoder.merge(result.pcode, [pcoder.applyOperator(operator, routine.program.language, options)])
          break
        
        default:
          throw new CompilerError('{lex} makes no sense here.', routine.lexemes[lex])
      }

    // literal values
    case 'boolean': // fallthrough
    case 'integer': // fallthrough
    case 'string': // fallthrough
    case 'character':
      // check this type is ok (will throw an error if not)
      result.type = { variableType: routine.lexemes[lex].type as VariableType, arrayDimensions: 0 }
      check(needed, result.type, routine.lexemes[lex], options)
      result.lex += 1
      result.pcode = [pcoder.loadLiteralValue(needed.variableType, routine.lexemes[lex].type as VariableType, routine.lexemes[lex].value, options)]
      break

    // input codes
    case 'keycode': // fallthrough
    case 'query':
      const input = routine.findInput(routine.lexemes[lex].content)
      if (input) {
        result.type = { variableType: 'integer', arrayDimensions: 0 }
        check(needed, result.type, routine.lexemes[lex], options)
        result.lex += 1
        result.pcode = [pcoder.loadInputValue(input, options)]
      } else {
        throw new CompilerError('{lex} is not a valid input code.', routine.lexemes[lex])
      }
      break

    // identifiers
    case 'identifier':
      const constant = routine.findConstant(routine.lexemes[lex].content)
      if (constant) {
        result.type = { variableType: constant.type, arrayDimensions: 0 }
        check(needed, result.type, routine.lexemes[lex], options)
        result.lex += 1
        result.pcode = [pcoder.loadLiteralValue(needed.variableType, constant.type, constant.value, options)]
      }

      const variable = routine.findVariable(routine.lexemes[lex].content)
      if (variable) {
        result = variableValue(routine, variable, lex, needed, options)
      }

      const colour = routine.findColour(routine.lexemes[lex].content)
      if (colour) {
        result.type = { variableType: 'integer', arrayDimensions: 0 }
        check(needed, result.type, routine.lexemes[lex], options)    
        result.lex += 1
        result.pcode = [pcoder.loadLiteralValue(needed.variableType, colour.type, colour.value, options)]
      }

      const command = routine.findCommand(routine.lexemes[lex].content)
      if (command) {
        result = functionCall(routine, command, lex, needed, options)
      }

      if (!constant && !variable && !colour && !command) {
        throw new CompilerError('{lex} is not defined.', routine.lexemes[lex])
      }
      break

    // everything else
    default:
      // look for an open bracket
      if (routine.lexemes[lex].content === '(') {
        // what follows should be an expression
        result = expression(routine, lex + 1, type, needed, options)

        // now check for a closing bracket
        if (routine.lexemes[result.lex] && (routine.lexemes[result.lex].content === ')')) {
          result.lex += 1 // move past it
        } else {
          throw new CompilerError('Closing bracket missing.', routine.lexemes[lex - 1])
        }
      } else {
        // anything else is an error
        throw new CompilerError('{lex} makes no sense here.', routine.lexemes[lex])
      }
      break
  }

  return result
}

/** parses and compiles a variable value */
function variableValue (routine: Routine, variable: Variable, lex: number, needed: ExpressionType|null, options: Options): Result {
  const type = { variableType: variable.type, arrayDimensions: variable.arrayDimensions.length }
  const brackets = (routine.program.language === 'BASIC') ? ['(', ')'] : ['[', ']']
  const indexes: number[][][] = []

  if (routine.lexemes[lex + 1]?.content === brackets[0]) {
    lex += 2
    if (variable.isArray) {
      // expecting an integer expression
      const result = expression(routine, lex, null, { variableType: 'integer', arrayDimensions: 0 }, options)
      lex = result.lex
      indexes.push(result.pcode)
      // expecting closing bracket
      if (!routine.lexemes[lex] || routine.lexemes[lex].content !== brackets[1]) {
        throw new CompilerError()
      }
      lex += 1
      type.variableType = 'character'
    } else if (variable.type === 'string') {
      // expecting an integer expression
      const result = expression(routine, lex, null, { variableType: 'integer', arrayDimensions: 0 }, options)
      lex = result.lex
      indexes.push(result.pcode)
      // expecting closing bracket
      if (!routine.lexemes[lex] || routine.lexemes[lex].content !== brackets[1]) {
        throw new CompilerError()
      }
      lex += 1
      type.variableType = 'character'
    } else {
      throw new CompilerError(`Variable "${variable.name}" is not an array or string variable.`, routine.lexemes[lex + 1])
    }
  }

  // type check
  check(needed, type, routine.lexemes[lex], options)

  // return the stuff
  return { type, lex: lex + 1, pcode: [pcoder.loadVariableValue(variable, indexes, options)] }
}

/** parses and compiles a function call */
function functionCall (routine: Routine, command: Command|Subroutine, lex: number, needed: ExpressionType|null, options: Options): Result {  
}

/** gets an unambiguous operator from ambiguous one */
function unambiguousOperator (operator: PCode, type: ExpressionType, options: Options): PCode {
  const integerVersions = [PCode.eqal, PCode.less, PCode.lseq, PCode.more, PCode.mreq, PCode.noeq, PCode.plus]
  const stringVersions = [PCode.seql, PCode.sles, PCode.sleq, PCode.smor, PCode.smeq, PCode.sneq, PCode.scat]
  return (type.variableType === 'string' || type.variableType === 'character')
    ? stringVersions[integerVersions.indexOf(operator)]
    : operator
}

/** checks found expression type against needed expression type */
function check (needed: ExpressionType, found: ExpressionType, lexeme: Lexeme, options: Options): void {
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

/** merges two blocks of PCode with an operator at the end */
function mergeWithOperator (sofar: number[][], next: Result, operator: PCode, makeAbsolute: boolean = false): Result {
  next.pcode = pcoder.merge(sofar, next.pcode)
  next.pcode = makeAbsolute
    ? pcoder.merge(next.pcode, [[operator, PCode.abs]])
    : pcoder.merge(next.pcode, [[operator]])
  return next
}
