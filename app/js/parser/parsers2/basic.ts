/**
 * Parser 2 for Turtle BASIC.
 */
import { simpleStatement, variableAssignment, expression, typeCheck } from './common'
import { CompoundExpression, VariableValue, LiteralValue } from '../expression'
import { Program, Subroutine } from '../routine'
import { Type } from '../type'
import { Statement, IfStatement, ForStatement, RepeatStatement, ReturnStatement, WhileStatement, VariableAssignment, PassStatement } from '../statement'
import { Variable } from '../variable'
import { Lexeme } from '../../lexer/lexeme'
import { PCode } from '../../constants/pcodes'
import { CompilerError } from '../../tools/error'

/** parses the whole program */
export default function BASIC (program: Program): void {
  // parse the main program first (since the lexemes for this come first in BASIC)
  parseStatements(program)

  // parse the subroutines next (N.B. there are no nested subroutines in BASIC)
  for (const subroutine of program.subroutines) {
    parseStatements(subroutine)
  }
}

/** parses the statements of a routine */
function parseStatements (routine: Program|Subroutine): void {
  routine.lex = 0
  while (routine.lex < routine.lexemes.length) {
    routine.statements.push(statement(routine))
  }
  routine.statements = routine.statements.filter(x => !(x instanceof PassStatement))
}

/** parses a statement */
function statement (routine: Program|Subroutine, oneLine: boolean = false): Statement {
  let statement: Statement

  switch (routine.lexemes[routine.lex].type) {
    // new line
    case 'newline':
      // in general this should be impossible (new lines should be eaten up at
      // the end of the previous statement), but it can happen at the start of
      // of the program or the start of a block, if there's a comment on the
      // first line (which is necessarily followed by a line break)
      statement = new PassStatement()
      break

    // '=' (at the end of a function)
    case 'operator':
      if (routine.lexemes[routine.lex].content === '=') {
        routine.lex += 1
        statement = returnStatement(routine)
      } else {
        throw new CompilerError('Statement cannot begin with {lex}.', routine.lexemes[routine.lex])
      }
      break

    // identifiers (variable assignment or procedure call)
    case 'identifier':
      statement = simpleStatement(routine)
      break

    // keywords
    case 'keyword':
      switch (routine.lexemes[routine.lex].content) {
        // start of IF structure
        case 'IF':
          routine.lex += 1
          statement = ifStatement(routine)
          break

        // start of FOR structure
        case 'FOR':
          routine.lex += 1
          statement = forStatement(routine)
          break

        // start of REPEAT structure
        case 'REPEAT':
          routine.lex += 1
          statement = repeatStatement(routine)
          break

        // start of WHILE structure
        case 'WHILE':
          routine.lex += 1
          statement = whileStatement(routine)
          break

        default:
          throw new CompilerError('Statement cannot begin with {lex}.', routine.lexemes[routine.lex])
      }
      break

    // anything else is an error
    default:
      throw new CompilerError('Statement cannot begin with {lex}.', routine.lexemes[routine.lex])
  }

  // end of statement check
  // bypass within oneLine IF...THEN...ELSE statement (check occurs at the end of the whole statement)
  if (!oneLine && routine.lexemes[routine.lex]) {
    if (routine.lexemes[routine.lex].content === ':' || routine.lexemes[routine.lex].type === 'newline') {
      while (routine.lexemes[routine.lex]?.content === ':' || routine.lexemes[routine.lex]?.type === 'newline') {
        routine.lex += 1
      }
    } else {
      throw new CompilerError('Statements must be separated by a colon or placed on different lines.', routine.lexemes[routine.lex])
    }
  }

  // return the statement
  return statement
}

/** parses a RETURN statement */
function returnStatement (routine: Program|Subroutine): ReturnStatement {
  // check a return statement is allowed
  if (routine instanceof Program) {
    throw new CompilerError('Statement in the main program cannot begin with {lex}.', routine.lexemes[routine.lex - 1])
  }
  if (routine.type !== 'function') {
    throw new CompilerError('Procedures cannot return a value.', routine.lexemes[routine.lex - 1])
  }

  // create the statement
  const returnStatement = new ReturnStatement(routine)

  // expecting an expression of the right type
  returnStatement.value = expression(routine)
  typeCheck(returnStatement.value, routine.returns as Type, routine.lexemes[routine.lex])

  // return the statement
  return returnStatement
}

/** parses an if statement */
function ifStatement (routine: Program|Subroutine): IfStatement {
  const ifStatement = new IfStatement()
  let oneLine: boolean

  // expecting a boolean expression
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('"IF" must be followed by a boolean expression.', routine.lexemes[routine.lex - 1])
  }
  ifStatement.condition = expression(routine)
  typeCheck(ifStatement.condition, 'boolean', routine.lexemes[routine.lex])

  // expecting "then"
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('"IF ..." must be followed by "THEN".', routine.lexemes[routine.lex - 1])
  }
  if (routine.lexemes[routine.lex].content !== 'THEN') {
    throw new CompilerError('"IF ..." must be followed by "THEN".', routine.lexemes[routine.lex])
  }
  routine.lex += 1

  // expecting a statement on the same line or a block of statements on a new line
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('No statements found after "IF ... THEN".', routine.lexemes[routine.lex])
  }
  if (routine.lexemes[routine.lex].type === 'newline') {
    while (routine.lexemes[routine.lex].type === 'newline') {
      routine.lex += 1
    }
    ifStatement.ifStatements.push(...block(routine, 'IF'))
    oneLine = false
  } else {
    oneLine = true
    ifStatement.ifStatements.push(statement(routine, oneLine))
  }

  // happy with an "else" here (but it's optional)
  if (routine.lexemes[routine.lex] && routine.lexemes[routine.lex].content === 'ELSE') {
    routine.lex += 1
    if (!routine.lexemes[routine.lex]) {
      throw new CompilerError('No statements found after "ELSE".', routine.lexemes[routine.lex])
    }
    if (oneLine) {
      if (routine.lexemes[routine.lex].type === 'newline') {
        throw new CompilerError('Statement following "ELSE" cannot be on a new line.', routine.lexemes[routine.lex + 1])
      }
      ifStatement.elseStatements.push(statement(routine, oneLine))
    } else {
      if (routine.lexemes[routine.lex].type !== 'newline') {
        throw new CompilerError('Statement following "ELSE" must be on a new line.', routine.lexemes[routine.lex])
      }
      // move past all line breaks
      while (routine.lexemes[routine.lex].type === 'newline') {
        routine.lex += 1
      }
      ifStatement.elseStatements.push(...block(routine, 'ELSE'))
    }
  }

  // now we have everything we need
  return ifStatement
}

/** parses a for statement */
function forStatement (routine: Program|Subroutine): ForStatement {
  const forStatement = new ForStatement()

  // expecting an integer variable
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('"FOR" must be followed by an integer variable.', routine.lexemes[routine.lex - 1])
  }
  if (routine.lexemes[routine.lex].subtype === 'turtle') {
    throw new CompilerError('Turtle attribute cannot be used as a "FOR" variable.', routine.lexemes[routine.lex])
  }
  if (routine.lexemes[routine.lex].type !== 'identifier') {
    throw new CompilerError('"FOR" must be followed by an integer variable.', routine.lexemes[routine.lex])
  }
  const variable = routine.findVariable(routine.lexemes[routine.lex].content as string)
  if (!variable) {
    throw new CompilerError('Variable {lex} not defined.', routine.lexemes[routine.lex])
  }
  if (variable.type !== 'integer' && variable.type !== 'boolint') {
    throw new CompilerError('{lex} is not an integer variable.', routine.lexemes[routine.lex])
  }
  routine.lex += 1

  // expecting variable assignment
  forStatement.initialisation = variableAssignment(routine, variable) as VariableAssignment

  // expecting "to"
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('"FOR" loop initialisation must be followed by "TO".', routine.lexemes[routine.lex - 1])
  }
  if (routine.lexemes[routine.lex].content !== 'TO') {
    throw new CompilerError('"FOR" loop initialisation must be followed by "TO".', routine.lexemes[routine.lex])
  }
  routine.lex += 1

  // expecting integer expression (for the final value)
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('"TO" must be followed by an integer (or integer constant).', routine.lexemes[routine.lex - 1])
  }
  const finalValue = expression(routine)
  typeCheck(finalValue, 'integer', routine.lexemes[routine.lex])

  // "STEP -1" possible here
  if (routine.lexemes[routine.lex] && routine.lexemes[routine.lex].content === 'STEP') {
    routine.lex += 1
    if (!routine.lexemes[routine.lex]) {
      throw new CompilerError('"STEP" instruction must be of the form "STEP -1".', routine.lexemes[routine.lex - 1])
    }
    if (routine.lexemes[routine.lex].content !== '-') {
      throw new CompilerError('"STEP" instruction must be of the form "STEP -1".', routine.lexemes[routine.lex])
    }
    routine.lex += 1
    if (!routine.lexemes[routine.lex]) {
      throw new CompilerError('"STEP" instruction must be of the form "STEP -1".', routine.lexemes[routine.lex - 1])
    }
    if (routine.lexemes[routine.lex].value !== 1) {
      throw new CompilerError('"STEP" instruction must be of the form "STEP -1".', routine.lexemes[routine.lex])
    }
    routine.lex += 1
    forStatement.change = new VariableAssignment(variable)
    const left = new VariableValue(variable)
    const right = new LiteralValue('integer', 1)
    const operator = PCode.subt
    forStatement.change.value = new CompoundExpression(left, right, operator)
    forStatement.condition = new CompoundExpression(left, finalValue, PCode.mreq)
  } else {
    forStatement.change = new VariableAssignment(variable)
    const left = new VariableValue(variable)
    const right = new LiteralValue('integer', 1)
    const operator = PCode.plus
    forStatement.change.value = new CompoundExpression(left, right, operator)
    forStatement.condition = new CompoundExpression(left, finalValue, PCode.lseq)
  }

  // expecting a statement on the same line or a block of statements on a new line
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('No statements found after "FOR" loop initialisation.', routine.lexemes[routine.lex])
  }
  if (routine.lexemes[routine.lex].type === 'newline') {
    while (routine.lexemes[routine.lex].type === 'newline') {
      routine.lex += 1
    }
    forStatement.statements.push(...block(routine, 'FOR'))
  } else {
    forStatement.statements.push(statement(routine))
  }

  // now we have everything we need
  return forStatement
}

/** parses a repeat statement */
function repeatStatement (routine: Program|Subroutine): RepeatStatement {
  const repeatStatement = new RepeatStatement()

  // expecting a statement on the same line or a block of statements on a new line
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('No statements found after "REPEAT".', routine.lexemes[routine.lex])
  }
  if (routine.lexemes[routine.lex].type === 'newline') {
    while (routine.lexemes[routine.lex].type === 'newline') {
      routine.lex += 1
    }
    repeatStatement.statements.push(...block(routine, 'REPEAT'))
  } else {
    repeatStatement.statements.push(statement(routine))
  }

  // expecting a boolean expression
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('"UNTIL" must be followed by a boolean expression.', routine.lexemes[routine.lex - 1])
  }
  repeatStatement.condition = expression(routine)
  typeCheck(repeatStatement.condition, 'boolean', routine.lexemes[routine.lex])

  // now we have everything we need
  return repeatStatement
}

/** parses a while statement */
function whileStatement (routine: Program|Subroutine): WhileStatement {
  const whileStatement = new WhileStatement()

  // expecting a boolean expression
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('"WHILE" must be followed by a boolean expression.', routine.lexemes[routine.lex - 1])
  }
  whileStatement.condition = expression(routine)
  typeCheck(whileStatement.condition, 'boolean', routine.lexemes[routine.lex])

  // expecting a statement on the same line or a block of statements on a new line
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('No commands found after "WHILE ... DO".', routine.lexemes[routine.lex])
  }
  if (routine.lexemes[routine.lex].type === 'newline') {
    while (routine.lexemes[routine.lex].type === 'newline') {
      routine.lex += 1
    }
    whileStatement.statements.push(...block(routine, 'WHILE'))
  } else {
    whileStatement.statements.push(statement(routine))
  }

  // now we have everything we need to generate the pcode
  return whileStatement
}

/** start lexemes */
type Start = 'IF'|'ELSE'|'FOR'|'REPEAT'|'WHILE'

/** parses a block of statements */
function block (routine: Program|Subroutine, start: Start): Statement[] {
  const statements: Statement[] = []
  let end: boolean = false

  // expecting something
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError(`No commands found after "${start}".`, routine.lexemes[routine.lex - 1])
  }

  // loop through until the end of the block (or we run out of lexemes)
  while (!end && (routine.lex < routine.lexemes.length)) {
    end = blockEndCheck(start, routine.lexemes[routine.lex])
    if (end) {
      // move past the next lexeme, unless it's "else"
      if (routine.lexemes[routine.lex].content !== 'ELSE') {
        routine.lex += 1
      }
    } else {
      // compile the structure
      statements.push(statement(routine))
    }
  }

  // final checks
  if (!end) {
    throw new CompilerError(`Unterminated "${start}" statement.`, routine.lexemes[routine.lex - 1])
  }

  // otherwise all good
  return statements
}

/** checks for the ending to a block, and throws an error if it doesn't match the beginning */
function blockEndCheck (start: Start, lexeme: Lexeme): boolean {
  switch (lexeme.content) {
    case 'ELSE':
      if (start !== 'IF') {
        throw new CompilerError('"ELSE" does not have any matching "IF".', lexeme)
      }
      return true

    case 'ENDIF':
      if ((start !== 'IF') && (start !== 'ELSE')) {
        throw new CompilerError('"ENDIF" does not have any matching "IF".', lexeme)
      }
      return true

    case 'NEXT':
      if (start !== 'FOR') {
        throw new CompilerError('"NEXT" does not have any matching "FOR".', lexeme)
      }
      return true

    case 'UNTIL':
      if (start !== 'REPEAT') {
        throw new CompilerError('"UNTIL" does not have any matching "REPEAT".', lexeme)
      }
      return true

    case 'ENDWHILE':
      if (start !== 'WHILE') {
        throw new CompilerError('"ENDWHILE" does not have any matching "WHILE".', lexeme)
      }
      return true

    default:
      return false
  }
}
