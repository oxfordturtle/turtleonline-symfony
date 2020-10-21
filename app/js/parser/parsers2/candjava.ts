/**
 * Parser 2 for Turtle C and Java.
 */
import { simpleStatement, expression, typeCheck } from './common'
import { CompoundExpression } from '../expression'
import { Program, Subroutine } from '../routine'
import { Type } from '../type'
import { Statement, IfStatement, ForStatement, RepeatStatement, ReturnStatement, WhileStatement, VariableAssignment } from '../statement'
import { CompilerError } from '../../tools/error'
import { PCode } from '../../constants/pcodes'

/** parses the whole program */
export default function CandJava (program: Program): void {
  // parse the main program (which will parse its subroutines first)
  parseStatements(program)
}

/** parses the statements of a routine */
function parseStatements (routine: Program|Subroutine): void {
  // parse the lexemes for any subroutines first
  for (const subroutine of routine.subroutines) {
    parseStatements(subroutine)
  }

  // parse the lexemes for the given routine
  routine.lex = 0
  while (routine.lex < routine.lexemes.length) {
    routine.statements.push(statement(routine))
  }

  // check functions include at least one RETURN statement
  if (routine instanceof Subroutine && routine.type === 'function') {
    if (!routine.hasReturnStatement) {
      throw new CompilerError(`Function ${routine.name} does not contain any return statements.`)
    }
  }
}

/** parses a statement */
function statement (routine: Program|Subroutine): Statement {
  let statement: Statement

  switch (routine.lexemes[routine.lex].type) {
    // identifiers (variable assignment or procedure call)
    case 'identifier':
      statement = simpleStatement(routine)
      eosCheck(routine)
      break

    // keywords
    default:
      switch (routine.lexemes[routine.lex].content) {
        case 'const': // fallthrough
        case 'final': // fallthrough
        case 'bool': // fallthrough
        case 'boolean': // fallthrough
        case 'char': // fallthrough
        case 'int': // fallthrough
        case 'string': // fallthrough
        case 'String':
          statement = simpleStatement(routine)
          eosCheck(routine)
          break

        // start of RETURN statement
        case 'return':
          routine.lex += 1
          statement = returnStatement(routine)
          break

        // start of IF statement
        case 'if':
          routine.lex += 1
          statement = ifStatement(routine)
          break

        // else is an error
        case 'else':
          throw new CompilerError('Statement cannot begin with "else". If you have an "if" above, you may be missing a closing bracket "}".', routine.lexemes[routine.lex])

        // start of FOR statement
        case 'for':
          routine.lex += 1
          statement = forStatement(routine)
          break

        // start of DO (REPEAT) statement
        case 'do':
          routine.lex += 1
          statement = doStatement(routine)
          break

        // start of WHILE statement
        case 'while':
          routine.lex += 1
          statement = whileStatement(routine)
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

/** checks for semicolon at the end of a statement */
function eosCheck (routine: Program|Subroutine): void {
  if (!routine.lexemes[routine.lex] || routine.lexemes[routine.lex].content !== ';') {
    throw new CompilerError('Statement must be followed by a semicolon.', routine.lexemes[routine.lex - 1])
  }
  routine.lex += 1
}

/** parses a RETURN statement */
function returnStatement (routine: Program|Subroutine): ReturnStatement {
  // check a return statement is allowed
  if (routine instanceof Program) {
    throw new CompilerError('"RETURN" statements are only valid within the body of a function.', routine.lexemes[routine.lex])
  }
  if (routine.type !== 'function') {
    throw new CompilerError('Procedures cannot return a value.', routine.lexemes[routine.lex])
  }

  // create the statement
  const returnStatement = new ReturnStatement(routine)

  // expecting an expression of the right type, followed by semicolon
  returnStatement.value = expression(routine)
  returnStatement.value = typeCheck(returnStatement.value, routine.returns as Type, routine.lexemes[routine.lex])
  eosCheck(routine)

  // mark that this function has a return statement
  routine.hasReturnStatement = true

  // return the statement
  return returnStatement
}

/** parses an IF statement */
function ifStatement (routine: Program|Subroutine): IfStatement {
  const ifStatement = new IfStatement()

  // expecting an opening bracket
  if (!routine.lexemes[routine.lex] || routine.lexemes[routine.lex].content !== '(') {
    throw new CompilerError('"if" must be followed by an opening bracket "(".', routine.lexemes[routine.lex - 1])
  }
  routine.lex += 1

  // expecting a boolean expression
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('"if (" must be followed by a Boolean expression.', routine.lexemes[routine.lex - 1])
  }
  ifStatement.condition = expression(routine)
  ifStatement.condition = typeCheck(ifStatement.condition, 'boolean', routine.lexemes[routine.lex - 1])

  // expecting a closing bracket
  if (!routine.lexemes[routine.lex] || routine.lexemes[routine.lex].content !== ')') {
    throw new CompilerError('"if (..." must be followed by a closing bracket ")".', routine.lexemes[routine.lex - 1])
  }
  routine.lex += 1

  // expecting an opening curly bracket
  if (!routine.lexemes[routine.lex] || routine.lexemes[routine.lex].content !== "{") {
    throw new CompilerError('"if (...)" must be followed by an opening curly bracket "{".', routine.lexemes[routine.lex - 1])
  }
  routine.lex += 1

  // expecting a block of statements
  ifStatement.ifStatements.push(...block(routine))

  // happy with an "else" here (but it's optional)
  if (routine.lexemes[routine.lex] && (routine.lexemes[routine.lex].content === 'else')) {
    routine.lex += 1

    // expecting an opening bracket
    if (!routine.lexemes[routine.lex] || routine.lexemes[routine.lex].content !== "{") {
      throw new CompilerError('"else" must be followed by an opening bracket "{".', routine.lexemes[routine.lex - 1])
    }
    routine.lex += 1

    // expecting a block of statements
    ifStatement.elseStatements.push(...block(routine))
  }

  // now we have everything we need
  return ifStatement
}

/** parses a FOR statement */
function forStatement (routine: Program|Subroutine): ForStatement {
  const forStatement = new ForStatement()

  // expecting opening bracket
  if (!routine.lexemes[routine.lex] || routine.lexemes[routine.lex].content !== '(') {
    throw new CompilerError('"for" must be followed by an opening bracket "(".', routine.lexemes[routine.lex - 1])
  }
  routine.lex += 1

  // expecting a variable assignment
  const initialisation = simpleStatement(routine)
  if (!(initialisation instanceof VariableAssignment)) {
    throw new CompilerError('"for" conditions must begin with a variable assignment.', routine.lexemes[routine.lex - 1])
  }
  if (initialisation.variable.type !== 'integer') {
    throw new CompilerError('Loop variable must be an integer.', routine.lexemes[routine.lex])
  }
  forStatement.initialisation = initialisation
  eosCheck(routine)

  // expecting boolean expression
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('"for (...;" must be followed by a loop condition.', routine.lexemes[routine.lex - 1])
  }
  forStatement.condition = expression(routine)
  forStatement.condition = typeCheck(forStatement.condition, 'boolean', routine.lexemes[routine.lex - 1])
  eosCheck(routine)

  // expecting a variable assignment
  const change = simpleStatement(routine)
  if (!(change instanceof VariableAssignment)) {
    throw new CompilerError('"for" loop variable must be changed on each loop.', routine.lexemes[routine.lex - 1])
  }
  forStatement.change = change
  if (change.variable !== initialisation.variable) {
    throw new CompilerError('Initial loop variable and change loop variable must be the same.', routine.lexemes[routine.lex - 1])
  }

  // expecting a closing bracket
  if (!routine.lexemes[routine.lex] || routine.lexemes[routine.lex].content !== ')') {
    throw new CompilerError('Closing bracket ")" missing after "for" loop initialisation.', routine.lexemes[routine.lex - 1])
  }
  routine.lex += 1

  // expecting an opening curly bracket
  if (!routine.lexemes[routine.lex] || routine.lexemes[routine.lex].content !== '{') {
    throw new CompilerError('"for (...)" must be followed by an opening bracket "{".', routine.lexemes[routine.lex - 1])
  }
  routine.lex += 1

  // expecting a block of statements
  forStatement.statements.push(...block(routine))

  // now we have everything we need
  return forStatement
}

/** parses a DO (REPEAT) statement */
function doStatement (routine: Program|Subroutine): RepeatStatement {
  const repeatStatement = new RepeatStatement()

  // expecting an opening bracket
  if (!routine.lexemes[routine.lex] || routine.lexemes[routine.lex].content !== '{') {
    throw new CompilerError('"do" must be followed by an opening bracket "{".', routine.lexemes[routine.lex - 1])
  }
  routine.lex += 1

  // expecting a block of code
  repeatStatement.statements.push(...block(routine))

  // expecting "while"
  if (!routine.lexemes[routine.lex] || routine.lexemes[routine.lex].content !== 'while') {
    throw new CompilerError('"do { ... }" must be followed by "while".', routine.lexemes[routine.lex - 1])
  }
  routine.lex += 1

  // expecting an opening bracket
  if (!routine.lexemes[routine.lex] || routine.lexemes[routine.lex].content !== '(') {
    throw new CompilerError('"while" must be followed by an opening bracket "(".', routine.lexemes[routine.lex - 1])
  }
  routine.lex += 1

  // expecting a boolean expression
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('"while (" must be followed by a boolean expression.', routine.lexemes[routine.lex - 1])
  }
  repeatStatement.condition = expression(routine)
  repeatStatement.condition = typeCheck(repeatStatement.condition, 'boolean', routine.lexemes[routine.lex - 1])
  // negate the condition
  repeatStatement.condition = new CompoundExpression(null, repeatStatement.condition, PCode.not)

  // expecting a closing bracket
  if (!routine.lexemes[routine.lex] || routine.lexemes[routine.lex].content !== ')') {
    throw new CompilerError('"while (..." must be followed by a closing bracket ")".', routine.lexemes[routine.lex - 1])
  }
  routine.lex += 1

  // expecting a semicolon
  eosCheck(routine)

  // now we have everything we need
  return repeatStatement
}

/** parses a WHILE statement */
function whileStatement (routine: Program|Subroutine): WhileStatement {
  const whileStatement = new WhileStatement()

  // expecting an opening bracket
  if (!routine.lexemes[routine.lex] || routine.lexemes[routine.lex].content !== '(') {
    throw new CompilerError('"while" must be followed by an opening bracket "(".', routine.lexemes[routine.lex - 1])
  }
  routine.lex += 1

  // expecting a boolean expression
  if (!routine.lexemes[routine.lex]) {
    throw new CompilerError('"while (" must be followed by a Boolean expression.', routine.lexemes[routine.lex - 1])
  }
  whileStatement.condition = expression(routine)
  whileStatement.condition = typeCheck(whileStatement.condition, 'boolean', routine.lexemes[routine.lex - 1])

  // expecting a closing bracket
  if (!routine.lexemes[routine.lex] || routine.lexemes[routine.lex].content !== ')') {
    throw new CompilerError('"while (..." must be followed by a closing bracket ")".', routine.lexemes[routine.lex - 1])
  }
  routine.lex += 1

  // expecting an opening curly bracket
  if (!routine.lexemes[routine.lex] || routine.lexemes[routine.lex].content !== '{') {
    throw new CompilerError('"while (...)" must be followed by an opening curly bracket "{".', routine.lexemes[routine.lex - 1])
  }
  routine.lex += 1

  // expecting a block of statements
  whileStatement.statements.push(...block(routine))

  // now we have everything we need
  return whileStatement
}

/** parses a block of statements */
function block (routine: Program|Subroutine): Statement[] {
  const statements: Statement[] = []

  // loop through until the end of the block (or we run out of lexemes)
  while (routine.lexemes[routine.lex] && routine.lexemes[routine.lex].content !== '}') {
    statements.push(statement(routine))
  }

  // check we came out of the loop for the right reason
  if (routine.lexemes[routine.lex]?.content === '}') {
    routine.lex += 1
  } else {
    throw new CompilerError('Closing bracket "}" missing after statement block.', routine.lexemes[routine.lex - 1])
  }

  return statements
}
