/**
 * Coder for Turtle Python.
 *
 * This function compiles a "command structure" for Turtle Python. A command
 * structure is either a single command (i.e. a variable assignment or a
 * procedure call) or some more complex structure (conditional, loop) containing
 * a series of such commands; in the latter case, the exported function calls
 * itself recusrively, allowing for structures of arbitrary complexity.
 *
 * A program or subroutine is a sequence of command structures; this function
 * comiles a single one, returning the pcode and the index of the next lexeme -
 * the function calling this function (in the main coder module) loops through
 * the lexemes until all command structures have been compiled.
 */
import { simpleStatement, variableAssignment, expression, typeCheck } from './common'
import { CompoundExpression, VariableValue, LiteralValue } from '../expression'
import { Program, Routine } from '../routine'
import { Statement, IfStatement, ForStatement, RepeatStatement, WhileStatement, VariableAssignment } from '../statement'
import { Lexeme } from '../../lexer/lexeme'
import { PCode } from '../../constants/pcodes'
import { CompilerError } from '../../tools/error'

/** parses the whole program */
export default function Python (program: Program): void {
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
    // identifiers (variable declaration, variable assignment, or procedure call)
    case 'identifier':
      statement = simpleStatement(routine)
      eosCheck(routine)
      break

    // keywords
    default:
      switch (routine.lexemes[routine.lex].content) {
        // return (assign return variable of a function)
        case 'return':
          routine.lex += 1
          statement = variableAssignment(routine, routine.variables[0])
          break

        // start of IF structure
        case 'if':
          routine.lex += 1
          statement = ifStatement(routine)
          break

        // else is an error
        case 'else':
          throw new CompilerError('Statement cannot begin with "else". If you have an "if" above, this line may need to be indented more.', routine.lexemes[routine.lex])

        // start of FOR structure
        case 'for':
          routine.lex += 1
          statement = forStatement(routine)
          break

        // start of WHILE structure
        case 'while':
          routine.lex += 1
          statement = whileStatement(routine)
          break

        // PASS
        case 'pass':
          routine.lex += 1
          eosCheck(routine)
          break

        // anything else is an error
        default:
          throw new CompilerError('Statement cannot begin with {lex}.', routine.lexemes[routine.lex])
      }
      break
  }

  // all good
  return statement
}

/** checks for semi colon or new line at the end of a statement */
function eosCheck (routine: Routine): void {
  if (routine.lexemes[routine.lex]) {
    if (routine.lexemes[routine.lex].content === ';') {
      routine.lex += 1
      if (routine.lexemes[routine.lex].type === 'newline') {
        routine.lex += 1
      }
    } else if (routine.lexemes[routine.lex].type === 'newline') {
      routine.lex += 1
    } else {
      throw new CompilerError('Statement must be separated by a semicolon or placed on a new line.', routine.lexemes[routine.lex])
    }
  }
}

/** parses an if statement */
function ifStatement (routine: Routine): IfStatement {
  const ifStatement = new IfStatement()

  // expecting a boolean expression
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('"if" must be followed by a Boolean expression.', routine.lexemes[routine.lex - 1])
  }
  ifStatement.condition = expression(routine)
  typeCheck(ifStatement.condition, 'boolean', routine.lexemes[routine.lex - 1])

  // expecting a colon
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('"if <expression>" must be followed by a colon.', routine.lexemes[routine.lex - 1])
  }
  routine.lex += 1

  // expecting newline
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('No statements found after "if <expression>:".', routine.lexemes[routine.lex - 1])
  }
  if (routine.lexemes[routine.lex].type !== 'newline') {
    throw new CompilerError('Statements following "if <expression>:" must be on a new line.', routine.lexemes[routine.lex])
  }
  routine.lex += 1

  // expecting indent
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('No statements found after "if <expression>:".', routine.lexemes[routine.lex - 1])
  }
  if (routine.lexemes[routine.lex].type !== 'indent') {
    throw new CompilerError('Statements following "if <expression>:" must be indented.', routine.lexemes[routine.lex])
  }
  routine.lex += 1

  // expecting some statements
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('No statements found after "if <expression>:".', routine.lexemes[routine.lex - 1])
  }
  ifStatement.ifStatements.push(...block(routine))

  // happy with an "else" here (but it's optional)
  // TODO: support "elif" keyword
  if (routine.lexemes[routine.lex] && (routine.lexemes[routine.lex].content === 'else')) {
    routine.lex += 1

    // expecting a colon
    if (!routine.lexemes[routine.lex]) {
      throw new CompilerError('"else" must be followed by a colon.', routine.lexemes[routine.lex - 1])
    }
    if (routine.lexemes[routine.lex].content !== ':') {
      throw new CompilerError('"else" must be followed by a colon.', routine.lexemes[routine.lex])
    }
    routine.lex += 1

    // expecting newline
    if (!routine.lexemes[routine.lex]) {
      throw new CompilerError('No statements found after "else:".', routine.lexemes[routine.lex - 1])
    }
    if (routine.lexemes[routine.lex].type !== 'newline') {
      throw new CompilerError('Statements following "else:" must be on a new line.', routine.lexemes[routine.lex])
    }
    routine.lex += 1

    // expecting indent
    if (!routine.lexemes[routine.lex]) {
      throw new CompilerError('No statements found after "else:".', routine.lexemes[routine.lex - 1])
    }
    if (routine.lexemes[routine.lex].type !== 'indent') {
      throw new CompilerError('Statements following "else:" must be indented.', routine.lexemes[routine.lex])
    }
    routine.lex += 1

    // expecting some statements
    if (!routine.lexemes[routine.lex]) {
      throw new CompilerError('No statements found after "else:".', routine.lexemes[routine.lex - 1])
    }
    ifStatement.elseStatements.push(...block(routine))
  }

  // now we have everything we need
  return ifStatement
}

/** parses a for statement */
function forStatement (routine: Routine): ForStatement {
  const forStatement = new ForStatement()

  // expecting an integer variable
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('"for" must be followed by an integer variable.', routine.lexemes[routine.lex - 1])
  }
  if (routine.lexemes[routine.lex].type !== 'identifier') {
    throw new CompilerError('{lex} is not a valid variable name.', routine.lexemes[routine.lex])
  }
  const variable = routine.findVariable(routine.lexemes[routine.lex].content)
  if (!variable) {
    throw new CompilerError('Variable {lex} could not be found.', routine.lexemes[routine.lex])
  }
  if (variable.type !== 'integer') {
    throw new CompilerError('Loop variable must be an integer.', routine.lexemes[routine.lex])
  }
  routine.lex += 1

  // expecting 'in'
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('"for <variable>" must be followed by "in".', routine.lexemes[routine.lex - 1])
  }
  if (routine.lexemes[routine.lex].content !== 'in') {
    throw new CompilerError('"for <variable>" must be followed by "in".', routine.lexemes[routine.lex])
  }
  routine.lex += 1

  // expecting 'range'
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('"for <variable> in" must be followed by a range specification.', routine.lexemes[routine.lex - 1])
  }
  if (routine.lexemes[routine.lex].content !== 'range') {
    throw new CompilerError('"for <variable> in" must be followed by a range specification.', routine.lexemes[routine.lex])
  }
  routine.lex += 1

  // expecting a left bracket
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('"range" must be followed by an opening bracket.', routine.lexemes[routine.lex - 1])
  }
  if (routine.lexemes[routine.lex].content !== '(') {
    throw new CompilerError('"range" must be followed by an opening bracket.', routine.lexemes[routine.lex])
  }
  routine.lex += 1

  // expecting an integer expression (for the initial value)
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('Missing first argument to the "range" function.', routine.lexemes[routine.lex - 1])
  }
  const initialValue = expression(routine)
  typeCheck(initialValue, 'integer', routine.lexemes[routine.lex - 1])
  forStatement.initialisation = new VariableAssignment(variable)
  forStatement.initialisation.value = initialValue

  // expecting a comma
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('Argument must be followed by a comma.', routine.lexemes[routine.lex - 1])
  }
  if (routine.lexemes[routine.lex].content === ')') {
    throw new CompilerError('Too few arguments for "range" function.', routine.lexemes[routine.lex])
  }
  if (routine.lexemes[routine.lex].content !== ',') {
    throw new CompilerError('Argument must be followed by a comma.', routine.lexemes[routine.lex])
  }
  routine.lex += 1

  // expecting an integer expression (for the final value)
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('Too few arguments for "range" function.', routine.lexemes[routine.lex - 1])
  }
  const finalValue = expression(routine)
  typeCheck(finalValue, 'integer', routine.lexemes[routine.lex - 1])

  // now expecting another comma
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('Argument must be followed by a comma.', routine.lexemes[routine.lex - 1])
  }
  if (routine.lexemes[routine.lex].content === ')') {
    throw new CompilerError('Too few arguments for "range" function.', routine.lexemes[routine.lex])
  }
  if (routine.lexemes[routine.lex].content !== ',') {
    throw new CompilerError('Argument must be followed by a comma.', routine.lexemes[routine.lex])
  }
  routine.lex += 1

  // expecting either '1' or '-1'
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('Too few arguments for "range" function.', routine.lexemes[routine.lex - 1])
  }
  if (routine.lexemes[routine.lex].type === 'integer') {
    // only 1 is allowed
    if (routine.lexemes[routine.lex].value !== 1) {
      throw new CompilerError('Step value for "range" function must be 1 or -1.', routine.lexemes[routine.lex])
    }
    // otherwise ok
    forStatement.change = new VariableAssignment(variable)
    const left = new VariableValue(variable)
    const right = new LiteralValue('integer', 1)
    const operator = PCode.plus
    forStatement.change.value = new CompoundExpression(left, right, operator)
    forStatement.condition = new CompoundExpression(left, finalValue, PCode.less)
  } else if (routine.lexemes[routine.lex].content === '-') {
    routine.lex += 1
    // now expecting '1'
    if (!routine.lexemes[routine.lex]) {
      throw new CompilerError('Step value for "range" function must be 1 or -1.', routine.lexemes[routine.lex - 1])
    }
    if (routine.lexemes[routine.lex].type !== 'integer') {
      throw new CompilerError('Step value for "range" function must be 1 or -1.', routine.lexemes[routine.lex])
    }
    if (routine.lexemes[routine.lex].value !== 1) {
      throw new CompilerError('Step value for "range" function must be 1 or -1.', routine.lexemes[routine.lex])
    }
    forStatement.change = new VariableAssignment(variable)
    const left = new VariableValue(variable)
    const right = new LiteralValue('integer', 1)
    const operator = PCode.subt
    forStatement.change.value = new CompoundExpression(left, right, operator)
    forStatement.condition = new CompoundExpression(left, finalValue, PCode.more)
  } else {
    throw new CompilerError('Step value for "range" function must be 1 or -1.', routine.lexemes[routine.lex])
  }
  routine.lex += 1

  // expecting a right bracket
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('Closing bracket needed after "range" function arguments.', routine.lexemes[routine.lex - 1])
  }
  if (routine.lexemes[routine.lex].content === ',') {
    throw new CompilerError('Too many arguments for "range" function.', routine.lexemes[routine.lex])
  }
  if (routine.lexemes[routine.lex].content !== ')') {
    throw new CompilerError('Closing bracket needed after "range" function arguments.', routine.lexemes[routine.lex])
  }
  routine.lex += 1

  // expecting a colon
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('"for <variable> in range(...)" must be followed by a colon.', routine.lexemes[routine.lex - 1])
  }
  if (routine.lexemes[routine.lex].content !== ':') {
    throw new CompilerError('"for <variable> in range(...)" must be followed by a colon.', routine.lexemes[routine.lex])
  }
  routine.lex += 1

  // expecting newline
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('No statements found after "for <variable> in range(...):".', routine.lexemes[routine.lex - 1])
  }
  if (routine.lexemes[routine.lex].type !== 'newline') {
    throw new CompilerError('Statements following "for <variable> in range(...):" must be on a new line.', routine.lexemes[routine.lex])
  }
  routine.lex += 1

  // expecting indent
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('No statements found after "for <variable> in range(...):".', routine.lexemes[routine.lex - 1])
  }
  if (routine.lexemes[routine.lex].type !== 'indent') {
    throw new CompilerError('Statements following "for <variable> in range(...):" must be indented.', routine.lexemes[routine.lex])
  }
  routine.lex += 1

  // now expecting a block of statements
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('No statements found after "for <variable> in range(...):', routine.lexemes[routine.lex - 1])
  }
  forStatement.statements.push(...block(routine))

  // now we have everything we need
  return forStatement
}

/** parses a while statement */
function whileStatement (routine: Routine): WhileStatement {
  const whileStatement = new WhileStatement()

  // expecting a boolean expression
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('"while" must be followed by a Boolean expression.', routine.lexemes[routine.lex - 1])
  }
  whileStatement.condition = expression(routine)
  typeCheck(whileStatement.condition, 'boolean', routine.lexemes[routine.lex - 1])

  // expecting a colon
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('"while <expression>" must be followed by a colon.', routine.lexemes[routine.lex - 1])
  }
  if (routine.lexemes[routine.lex].content !== ':') {
    throw new CompilerError('"while <expression>" must be followed by a colon.', routine.lexemes[routine.lex])
  }
  routine.lex += 1

  // expecting newline
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('No statements found after "while <expression>:".', routine.lexemes[routine.lex - 1])
  }
  if (routine.lexemes[routine.lex].type !== 'newline') {
    throw new CompilerError('Statements following "while <expression>:" must be on a new line.', routine.lexemes[routine.lex])
  }
  routine.lex += 1

  // expecting indent
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('No statements found after "while <expression>:".', routine.lexemes[routine.lex - 1])
  }
  if (routine.lexemes[routine.lex].type !== 'indent') {
    throw new CompilerError('Statements following "while <expression>:" must be indented.', routine.lexemes[routine.lex])
  }
  routine.lex += 1

  // expecting a block of statements
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('No statements found after "while <expression>:".', routine.lexemes[routine.lex - 1])
  }
  whileStatement.statements.push(...block(routine))

  // now we have everything we need
  return whileStatement
}

/** parses a block of statements */
function block (routine: Routine): Statement[] {
  const statements: Statement[] = []

  // loop through until the end of the block (or we run out of lexemes)
  while (routine.lexemes[routine.lex] && routine.lexemes[routine.lex].type !== 'dedent') {
    statements.push(statement(routine))
  }

  // move past the dedent lexeme
  if (routine.lexemes[routine.lex]) {
    routine.lex += 1
  }

  return statements
}
