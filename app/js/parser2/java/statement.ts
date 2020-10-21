/**
 * Statement parser for Java.
 */
import { simpleStatement, expression, typeCheck } from '../common'
import { CompoundExpression } from '../definitions/expression'
import { Program } from '../definitions/program'
import { Subroutine } from '../definitions/subroutine'
import { Type } from '../definitions/type'
import { Statement, IfStatement, ForStatement, RepeatStatement, ReturnStatement, WhileStatement, VariableAssignment } from '../definitions/statement'
import { CompilerError } from '../../tools/error'
import { PCode } from '../../constants/pcodes'
import { Lex } from '../lex'

/** parses a statement */
export function statement (routine: Program|Subroutine): Statement {
  const program = (routine instanceof Program) ? routine : routine.program
  const lexemes = program.lexemes
  let statement: Statement

  switch (lexemes[program.lex].type) {
    // identifiers (variable assignment or procedure call)
    case 'identifier':
      statement = simpleStatement(routine)
      eosCheck(routine)
      break

    // keywords
    default:
      switch (lexemes[program.lex].content) {
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
          program.lex += 1
          statement = returnStatement(routine)
          break

        // start of IF statement
        case 'if':
          program.lex += 1
          statement = ifStatement(routine)
          break

        // else is an error
        case 'else':
          throw new CompilerError('Statement cannot begin with "else". If you have an "if" above, you may be missing a closing bracket "}".', lexemes[program.lex])

        // start of FOR statement
        case 'for':
          program.lex += 1
          statement = forStatement(routine)
          break

        // start of DO (REPEAT) statement
        case 'do':
          program.lex += 1
          statement = doStatement(routine)
          break

        // start of WHILE statement
        case 'while':
          program.lex += 1
          statement = whileStatement(routine)
          break

        // anything else is an error
        default:
          throw new CompilerError('Statement cannot begin with {lex}.', lexemes[program.lex])
      }
      break
  }

  // all good
  return statement
}

/** checks for semicolon at the end of a statement */
export function eosCheck (lex: Lex): void {
  if (!lex.get() || lex.content() !== ';') {
    throw new CompilerError('Statement must be followed by a semicolon.', lex.get(-1))
  }
  lex.step()
}

/** parses a RETURN statement */
function returnStatement (routine: Program|Subroutine): ReturnStatement {
  const program = (routine instanceof Program) ? routine : routine.program
  const lexemes = program.lexemes

  // check a return statement is allowed
  if (routine instanceof Program) {
    throw new CompilerError('"RETURN" statements are only valid within the body of a function.', lexemes[program.lex])
  }
  if (routine.type !== 'function') {
    throw new CompilerError('Procedures cannot return a value.', lexemes[program.lex])
  }

  // create the statement
  const returnStatement = new ReturnStatement(routine)

  // expecting an expression of the right type, followed by semicolon
  returnStatement.value = expression(routine)
  returnStatement.value = typeCheck(returnStatement.value, routine.returns as Type, lexemes[program.lex])
  eosCheck(routine)

  // mark that this function has a return statement
  routine.hasReturnStatement = true

  // return the statement
  return returnStatement
}

/** parses an IF statement */
function ifStatement (routine: Program|Subroutine): IfStatement {
  const program = (routine instanceof Program) ? routine : routine.program
  const lexemes = program.lexemes
  const ifStatement = new IfStatement()

  // expecting an opening bracket
  if (!lexemes[program.lex] || lexemes[program.lex].content !== '(') {
    throw new CompilerError('"if" must be followed by an opening bracket "(".', lexemes[program.lex - 1])
  }
  program.lex += 1

  // expecting a boolean expression
  if (!lexemes[program.lex]) {
    throw new CompilerError('"if (" must be followed by a Boolean expression.', lexemes[program.lex - 1])
  }
  ifStatement.condition = expression(routine)
  ifStatement.condition = typeCheck(ifStatement.condition, 'boolean', lexemes[program.lex - 1])

  // expecting a closing bracket
  if (!lexemes[program.lex] || lexemes[program.lex].content !== ')') {
    throw new CompilerError('"if (..." must be followed by a closing bracket ")".', lexemes[program.lex - 1])
  }
  program.lex += 1

  // expecting an opening curly bracket
  if (!lexemes[program.lex] || lexemes[program.lex].content !== "{") {
    throw new CompilerError('"if (...)" must be followed by an opening curly bracket "{".', lexemes[program.lex - 1])
  }
  program.lex += 1

  // expecting a block of statements
  ifStatement.ifStatements.push(...block(routine))

  // happy with an "else" here (but it's optional)
  if (lexemes[program.lex] && (lexemes[program.lex].content === 'else')) {
    program.lex += 1

    // expecting an opening bracket
    if (!lexemes[program.lex] || lexemes[program.lex].content !== "{") {
      throw new CompilerError('"else" must be followed by an opening bracket "{".', lexemes[program.lex - 1])
    }
    program.lex += 1

    // expecting a block of statements
    ifStatement.elseStatements.push(...block(routine))
  }

  // now we have everything we need
  return ifStatement
}

/** parses a FOR statement */
function forStatement (routine: Program|Subroutine): ForStatement {
  const program = (routine instanceof Program) ? routine : routine.program
  const lexemes = program.lexemes
  const forStatement = new ForStatement()

  // expecting opening bracket
  if (!lexemes[program.lex] || lexemes[program.lex].content !== '(') {
    throw new CompilerError('"for" must be followed by an opening bracket "(".', lexemes[program.lex - 1])
  }
  program.lex += 1

  // expecting a variable assignment
  const initialisation = simpleStatement(routine)
  if (!(initialisation instanceof VariableAssignment)) {
    throw new CompilerError('"for" conditions must begin with a variable assignment.', lexemes[program.lex - 1])
  }
  if (initialisation.variable.type !== 'integer') {
    throw new CompilerError('Loop variable must be an integer.', lexemes[program.lex])
  }
  forStatement.initialisation = initialisation
  eosCheck(routine)

  // expecting boolean expression
  if (!lexemes[program.lex]) {
    throw new CompilerError('"for (...;" must be followed by a loop condition.', lexemes[program.lex - 1])
  }
  forStatement.condition = expression(routine)
  forStatement.condition = typeCheck(forStatement.condition, 'boolean', lexemes[program.lex - 1])
  eosCheck(routine)

  // expecting a variable assignment
  const change = simpleStatement(routine)
  if (!(change instanceof VariableAssignment)) {
    throw new CompilerError('"for" loop variable must be changed on each loop.', lexemes[program.lex - 1])
  }
  forStatement.change = change
  if (change.variable !== initialisation.variable) {
    throw new CompilerError('Initial loop variable and change loop variable must be the same.', lexemes[program.lex - 1])
  }

  // expecting a closing bracket
  if (!lexemes[program.lex] || lexemes[program.lex].content !== ')') {
    throw new CompilerError('Closing bracket ")" missing after "for" loop initialisation.', lexemes[program.lex - 1])
  }
  program.lex += 1

  // expecting an opening curly bracket
  if (!lexemes[program.lex] || lexemes[program.lex].content !== '{') {
    throw new CompilerError('"for (...)" must be followed by an opening bracket "{".', lexemes[program.lex - 1])
  }
  program.lex += 1

  // expecting a block of statements
  forStatement.statements.push(...block(routine))

  // now we have everything we need
  return forStatement
}

/** parses a DO (REPEAT) statement */
function doStatement (routine: Program|Subroutine): RepeatStatement {
  const program = (routine instanceof Program) ? routine : routine.program
  const lexemes = program.lexemes
  const repeatStatement = new RepeatStatement()

  // expecting an opening bracket
  if (!lexemes[program.lex] || lexemes[program.lex].content !== '{') {
    throw new CompilerError('"do" must be followed by an opening bracket "{".', lexemes[program.lex - 1])
  }
  program.lex += 1

  // expecting a block of code
  repeatStatement.statements.push(...block(routine))

  // expecting "while"
  if (!lexemes[program.lex] || lexemes[program.lex].content !== 'while') {
    throw new CompilerError('"do { ... }" must be followed by "while".', lexemes[program.lex - 1])
  }
  program.lex += 1

  // expecting an opening bracket
  if (!lexemes[program.lex] || lexemes[program.lex].content !== '(') {
    throw new CompilerError('"while" must be followed by an opening bracket "(".', lexemes[program.lex - 1])
  }
  program.lex += 1

  // expecting a boolean expression
  if (!lexemes[program.lex]) {
    throw new CompilerError('"while (" must be followed by a boolean expression.', lexemes[program.lex - 1])
  }
  repeatStatement.condition = expression(routine)
  repeatStatement.condition = typeCheck(repeatStatement.condition, 'boolean', lexemes[program.lex - 1])
  // negate the condition
  repeatStatement.condition = new CompoundExpression(null, repeatStatement.condition, PCode.not)

  // expecting a closing bracket
  if (!lexemes[program.lex] || lexemes[program.lex].content !== ')') {
    throw new CompilerError('"while (..." must be followed by a closing bracket ")".', lexemes[program.lex - 1])
  }
  program.lex += 1

  // expecting a semicolon
  eosCheck(routine)

  // now we have everything we need
  return repeatStatement
}

/** parses a WHILE statement */
function whileStatement (routine: Program|Subroutine): WhileStatement {
  const program = (routine instanceof Program) ? routine : routine.program
  const lexemes = program.lexemes
  const whileStatement = new WhileStatement()

  // expecting an opening bracket
  if (!lexemes[program.lex] || lexemes[program.lex].content !== '(') {
    throw new CompilerError('"while" must be followed by an opening bracket "(".', lexemes[program.lex - 1])
  }
  program.lex += 1

  // expecting a boolean expression
  if (!lexemes[program.lex]) {
    throw new CompilerError('"while (" must be followed by a Boolean expression.', lexemes[program.lex - 1])
  }
  whileStatement.condition = expression(routine)
  whileStatement.condition = typeCheck(whileStatement.condition, 'boolean', lexemes[program.lex - 1])

  // expecting a closing bracket
  if (!lexemes[program.lex] || lexemes[program.lex].content !== ')') {
    throw new CompilerError('"while (..." must be followed by a closing bracket ")".', lexemes[program.lex - 1])
  }
  program.lex += 1

  // expecting an opening curly bracket
  if (!lexemes[program.lex] || lexemes[program.lex].content !== '{') {
    throw new CompilerError('"while (...)" must be followed by an opening curly bracket "{".', lexemes[program.lex - 1])
  }
  program.lex += 1

  // expecting a block of statements
  whileStatement.statements.push(...block(routine))

  // now we have everything we need
  return whileStatement
}

/** parses a block of statements */
function block (routine: Program|Subroutine): Statement[] {
  const program = (routine instanceof Program) ? routine : routine.program
  const lexemes = program.lexemes
  const statements: Statement[] = []

  // loop through until the end of the block (or we run out of lexemes)
  while (lexemes[program.lex] && lexemes[program.lex].content !== '}') {
    statements.push(statement(routine))
  }

  // check we came out of the loop for the right reason
  if (lexemes[program.lex]?.content === '}') {
    program.lex += 1
  } else {
    throw new CompilerError('Closing bracket "}" missing after statement block.', lexemes[program.lex - 1])
  }

  return statements
}
