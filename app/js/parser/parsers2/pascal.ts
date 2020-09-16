/**
 * Coder for Turtle Pascal.
 *
 * This function compiles a statement for Turtle Pascal. A statement is either a
 * single command (i.e. a variable assignment or a procedure call) or some more
 * complex structure (conditional, loop) containing a series of such commands;
 * in the latter case, the exported function calls itself recusrively, allowing
 * for structures of arbitrary complexity.
 */
import { simpleStatement, variableAssignment, expression, typeCheck } from './common'
import { CompoundExpression, VariableValue, LiteralValue } from '../expression'
import { Program, Routine } from '../routine'
import { Statement, IfStatement, ForStatement, RepeatStatement, WhileStatement, VariableAssignment } from '../statement'
import { Lexeme } from '../../lexer/lexeme'
import { PCode } from '../../constants/pcodes'
import { CompilerError } from '../../tools/error'

/** parses the whole program */
export default function Pascal (program: Program): void {
  // parse the main program (which will parse its subroutines first)
  parseStatements(program)
}

/** parses the statements of a routine */
function parseStatements (routine: Routine): void {
  // parse the lexemes for any subroutines first
  for (const subroutine of routine.subroutines) {
    parseStatements(subroutine)
  }

  // parse the lexemes for the given routine
  routine.lex = 0
  while (routine.lex < routine.lexemes.length) {
    routine.statements.push(statement(routine))
  }
}

/** parses a statement */
function statement (routine: Routine): Statement {
  let statement: Statement

  switch (routine.lexemes[routine.lex].type) {
    // identifiers (variable assignment or procedure call)
    case 'identifier':
      statement = simpleStatement(routine)
      break

    // keywords
    case 'keyword':
      switch (routine.lexemes[routine.lex].content.toLowerCase()) {
        // start of IF structure
        case 'if':
          routine.lex += 1
          statement = ifStatement(routine)
          break

        // start of FOR structure
        case 'for':
          routine.lex += 1
          statement = forStatement(routine)
          break

        // start of REPEAT structure
        case 'repeat':
          routine.lex += 1
          statement = repeatStatement(routine)
          break

        // start of WHILE structure
        case 'while':
          routine.lex += 1
          statement = whileStatement(routine)
          break

        default:
          throw new CompilerError('Command cannot begin with {lex}.', routine.lexemes[routine.lex])
      }
      break

    // any thing else is a mistake
    default:
      throw new CompilerError('Command cannot begin with {lex}.', routine.lexemes[routine.lex])
  }

  // semicolon check
  const noSemiAfter = ['begin', 'do', '.', 'repeat', ';', 'then']
  const noSemiBefore = ['else', 'end', ';', 'until']
  if (routine.lexemes[routine.lex]) {
    if (routine.lexemes[routine.lex].content !== ';') {
      if (noSemiAfter.indexOf(routine.lexemes[routine.lex - 1].content.toLowerCase()) === -1) {
        if (noSemiBefore.indexOf(routine.lexemes[routine.lex].content.toLowerCase()) === -1) {
          throw new CompilerError('Semicolon needed after command.', routine.lexemes[routine.lex])
        }
      }
    } else {
      while (routine.lexemes[routine.lex] && routine.lexemes[routine.lex].content === ';') {
        routine.lex += 1
      }
    }
  }

  // all good
  return statement
}

/** parses an if statement */
function ifStatement (routine: Routine): IfStatement {
  const ifStatement = new IfStatement()

  // expecting a boolean expression
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('"IF" must be followed by a boolean expression.', routine.lexemes[routine.lex - 1])
  }
  ifStatement.condition = expression(routine)
  typeCheck(ifStatement.condition, 'boolean', routine.lexemes[routine.lex - 1])

  // expecting "then"
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('"IF ..." must be followed by "THEN".', routine.lexemes[routine.lex - 1])
  }
  if (routine.lexemes[routine.lex].content.toLowerCase() !== 'then') {
    throw new CompilerError('"IF ..." must be followed by "THEN".', routine.lexemes[routine.lex])
  }
  routine.lex += 1

  // expecting a command or a block of commands
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('No commands found after "IF ... THEN".', routine.lexemes[routine.lex - 1])
  }
  if (routine.lexemes[routine.lex].content.toLowerCase() === 'begin') {
    routine.lex += 1
    ifStatement.ifStatements.push(...block(routine, 'begin'))
  } else {
    ifStatement.ifStatements.push(statement(routine))
  }

  // happy with an "else" here (but it's optional)
  if (routine.lexemes[routine.lex] && routine.lexemes[routine.lex].content.toLowerCase() === 'else') {
    // expecting a command or a block of commands
    routine.lex += 1
    if (!routine.lexemes[routine.lex]) {
      throw new CompilerError('No commands found after "ELSE".', routine.lexemes[routine.lex - 1])
    }
    if (routine.lexemes[routine.lex].content.toLowerCase() === 'begin') {
      routine.lex += 1
      ifStatement.elseStatements.push(...block(routine, 'begin'))
    } else {
      ifStatement.elseStatements.push(statement(routine))
    }
  }

  // now we have everything we need
  return ifStatement
}

/** parses a for statement */
function forStatement (routine: Routine): ForStatement {
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
  const variable = routine.findVariable(routine.lexemes[routine.lex].content)
  if (!variable) {
    throw new CompilerError('Variable {lex} has not been declared.', routine.lexemes[routine.lex])
  }
  if (variable.type !== 'integer' && variable.type !== 'boolint') {
    throw new CompilerError('{lex} is not an integer variable.', routine.lexemes[routine.lex])
  }
  if (variable.isArray) {
    throw new CompilerError('FOR variable cannot be an array or array element.', routine.lexemes[routine.lex])
  }
  routine.lex += 1

  // expecting variable assignment
  forStatement.initialisation = variableAssignment(routine, variable)

  // expecting "to" or "downto"
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('"FOR ... := ..." must be followed by "TO" or "DOWNTO".', routine.lexemes[routine.lex - 1])
  }
  const toOrDownTo = routine.lexemes[routine.lex].content.toLowerCase()
  if (toOrDownTo !== 'to' && toOrDownTo !== 'downto') {
    throw new CompilerError('"FOR ... := ..." must be followed by "TO" or "DOWNTO".', routine.lexemes[routine.lex])
  }
  forStatement.change = new VariableAssignment(variable)
  const left = new VariableValue(variable)
  const right = new LiteralValue('integer', 1)
  const changeOperator = (toOrDownTo === 'to') ? PCode.plus : PCode.subt
  forStatement.change.value = new CompoundExpression(left, right, changeOperator)
  routine.lex += 1

  // expecting integer expression (for the final value)
  if (!routine.lexemes[routine.lex]) {
    if (toOrDownTo === 'to') {
      throw new CompilerError('"TO" must be followed by an integer (or integer constant).', routine.lexemes[routine.lex - 1])
    } else {
      throw new CompilerError('"DOWNTO" must be followed by an integer (or integer constant).', routine.lexemes[routine.lex - 1])
    }
  }
  const finalValue = expression(routine)
  typeCheck(finalValue, 'integer', routine.lexemes[routine.lex - 1])
  const comparisonOperator = (toOrDownTo === 'to') ? PCode.lseq : PCode.mreq
  forStatement.condition = new CompoundExpression(left, finalValue, comparisonOperator)

  // expecting "do"
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('"FOR" loop range must be followed by "DO".', routine.lexemes[routine.lex - 1])
  }
  if (routine.lexemes[routine.lex].content !== 'do') {
    throw new CompilerError('"FOR" loop range must be followed by "DO".', routine.lexemes[routine.lex])
  }
  routine.lex += 1

  // expecting a command or block of commands
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('No commands found after "FOR" loop initialisation.', routine.lexemes[routine.lex - 1])
  }
  if (routine.lexemes[routine.lex].content.toLowerCase() === 'begin') {
    routine.lex += 1
    forStatement.statements.push(...block(routine, 'begin'))
  } else {
    forStatement.statements.push(statement(routine))
  }

  // now we have everything we need
  return forStatement
}

/** parses a repeat statement */
function repeatStatement (routine: Routine): RepeatStatement {
  const repeatStatement = new RepeatStatement()

  // expecting a block of code
  repeatStatement.statements.push(...block(routine, 'repeat'))

  // expecting a boolean expression
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('"UNTIL" must be followed by a boolean expression.', routine.lexemes[routine.lex - 1])
  }
  repeatStatement.condition = expression(routine)
  typeCheck(repeatStatement.condition, 'boolean', routine.lexemes[routine.lex - 1])

  // now we have everything we need
  return repeatStatement
}

/** parses a while statement */
function whileStatement (routine: Routine): WhileStatement {
  const whileStatement = new WhileStatement()

  // expecting a boolean expression
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('"WHILE" must be followed by a boolean expression.', routine.lexemes[routine.lex - 1])
  }
  whileStatement.condition = expression(routine)
  typeCheck(whileStatement.condition, 'boolean', routine.lexemes[routine.lex - 1])

  // expecting "DO"
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('"WHILE ..." must be followed by "DO".', routine.lexemes[routine.lex - 1])
  }
  if (routine.lexemes[routine.lex].content !== 'do') {
    throw new CompilerError('"WHILE ..." must be followed by "DO".', routine.lexemes[routine.lex])
  }
  routine.lex += 1

  // expecting a block of code
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('No commands found after "WHILE" loop initialisation.', routine.lexemes[routine.lex])
  }
  if (routine.lexemes[routine.lex].content.toLowerCase() === 'begin') {
    routine.lex += 1
    whileStatement.statements.push(...block(routine, 'begin'))
  } else {
    whileStatement.statements.push(statement(routine))
  }

  // now we have everything we need to generate the pcode
  return whileStatement
}

/** start lexemes */
type Start = 'begin'|'repeat'

/** parses a block of statements */
function block (routine: Routine, start: Start): Statement[] {
  const statements: Statement[] = []
  let end: boolean = false

  // expecting something
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('No commands found after "BEGIN".', routine.lexemes[routine.lex - 1])
  }

  // loop through until the end of the block (or we run out of lexemes)
  while (!end && (routine.lex < routine.lexemes.length)) {
    end = blockEndCheck(start, routine.lexemes[routine.lex])
    if (end) {
      // move past the end lexeme
      routine.lex += 1
    } else {
      // compile the statement
      statements.push(statement(routine))
    }
  }

  // if we've run out of lexemes without reaching the end, this is an error
  if (!end) {
    throw new CompilerError('"BEGIN" does not have any matching "END".', routine.lexemes[routine.lex - 1])
  }

  // otherwise all good
  return statements
}

/** checks for the ending to a block, and throws an error if it doesn't match the beginning */
function blockEndCheck (start: Start, lexeme: Lexeme): boolean {
  switch (lexeme.content) {
    case 'end':
      if (start !== 'begin') {
        throw new CompilerError('"END" does not have any matching "BEGIN".', lexeme)
      }
      return true

    case 'until':
      if (start !== 'repeat') {
        throw new CompilerError('"UNTIL" does not have any matching "REPEAT".', lexeme)
      }
      return true

    default:
      return false
  }
}
