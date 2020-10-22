import constant from './constant'
import variable from './variable'
import { procedureCall } from '../call'
import { expression, typeCheck } from '../expression'
import * as find from '../find'
import { CompoundExpression, VariableValue } from '../definitions/expression'
import { Program } from '../definitions/program'
import { Subroutine } from '../definitions/subroutine'
import { Type } from '../definitions/type'
import { Variable } from '../definitions/variable'
import { Statement, IfStatement, ForStatement, RepeatStatement, ReturnStatement, WhileStatement, VariableAssignment, ProcedureCall } from '../definitions/statement'
import { CompilerError } from '../../tools/error'
import { PCode } from '../../constants/pcodes'
import { PassStatement } from '../../parser/statement'

/** parses a statement */
export function statement (subroutine: Subroutine): Statement {
  let statement: Statement

  switch (subroutine.lex()?.type) {
    // identifiers (variable assignment or procedure call)
    case 'identifier':
      statement = simpleStatement(subroutine)
      eosCheck(subroutine)
      break

    // keywords
    default:
      switch (subroutine.lex()?.content) {
        case 'final': // fallthrough
        case 'boolean': // fallthrough
        case 'char': // fallthrough
        case 'int': // fallthrough
        case 'String':
          statement = simpleStatement(subroutine)
          eosCheck(subroutine)
          break

        // start of RETURN statement
        case 'return':
          subroutine.lexemeIndex += 1
          statement = returnStatement(subroutine)
          break

        // start of IF statement
        case 'if':
          subroutine.lexemeIndex += 1
          statement = ifStatement(subroutine)
          break

        // else is an error
        case 'else':
          throw new CompilerError('Statement cannot begin with "else". If you have an "if" above, you may be missing a closing bracket "}".', subroutine.lex())

        // start of FOR statement
        case 'for':
          subroutine.lexemeIndex += 1
          statement = forStatement(subroutine)
          break

        // start of DO (REPEAT) statement
        case 'do':
          subroutine.lexemeIndex += 1
          statement = doStatement(subroutine)
          break

        // start of WHILE statement
        case 'while':
          subroutine.lexemeIndex += 1
          statement = whileStatement(subroutine)
          break

        // anything else is an error
        default:
          throw new CompilerError('Statement cannot begin with {lex}.', subroutine.lex())
      }
      break
  }

  // all good
  return statement
}

/** checks for semicolon at the end of a statement */
export function eosCheck (routine: Program|Subroutine): void {
  if (!routine.lex() || routine.lex()?.content !== ';') {
    throw new CompilerError('Statement must be followed by a semicolon.', routine.lex(-1))
  }
  routine.lexemeIndex += 1
}

/** parses a simple statement (variable declaration/assignment or procedure call) */
export function simpleStatement (routine: Program|Subroutine): VariableAssignment|ProcedureCall|PassStatement {
  // "final" means constant definition
  if (routine.lex()?.content === 'final') {
    routine.constants.push(constant(routine))
    eosCheck(routine)
    return new PassStatement()
  }

  // type specification means a variable declaration
  if (routine.lex()?.subtype === 'type') {
    const foo = variable(routine)
    routine.variables.push(foo)
    if (routine.lex()?.content === '=') {
      return variableAssignment(routine, foo)
    } else {
      return new PassStatement()
    }
  }

  // identifier means variable assignment or procedure call
  if (routine.lex()?.type === 'identifier') {
    const foo = find.variable(routine, routine.lex()?.content as string)
    const bar = find.command(routine, routine.lex()?.content as string)
    if (foo) {
      routine.lexemeIndex += 1
      return variableAssignment(routine, foo)
    } else if (bar) {
      routine.lexemeIndex += 1
      const statement = procedureCall(routine, bar)
      return statement
    } else {
      throw new CompilerError('{lex} is not defined.', routine.lex())
    }
  }

  throw new CompilerError('Statement cannot begin with {lex}.', routine.lex())
}

/** parses a variable assignment */
function variableAssignment (routine: Program|Subroutine, variable: Variable): VariableAssignment {
  const variableAssignment = new VariableAssignment(variable)
  const variableLexeme = routine.lex(-1)

  // strings and array variables permit element indexes at this point
  if (variable.isArray || variable.type === 'string') {
    if (routine.lex() && routine.lex()?.content === '[') {
      routine.lexemeIndex += 1
      let exp = expression(routine)
      exp = typeCheck(exp, 'integer', routine.lex())
      variableAssignment.indexes.push(exp)
      // TODO: multi-dimensional stuff
      if (!routine.lex()) {
        throw new CompilerError('Closing bracket "]" missing after string/array index.', routine.lex(-1))
      }
      if (routine.lex()?.content !== ']') {
        throw new CompilerError('Closing bracket "]" missing after string/array index.', routine.lex())
      }
      routine.lexemeIndex += 1
    }
  }

  // expecting "="
  if (!routine.lex()) {
    throw new CompilerError('Variable must be followed by assignment operator "=".', routine.lex(-1))
  }
  if (routine.lex()?.content !== '=') {
    throw new CompilerError('Variable must be followed by assignment operator "=".', routine.lex())
  }
  routine.lexemeIndex += 1

  // expecting an expression as the value to assign to the variable
  if (!routine.lex()) {
    throw new CompilerError(`Variable "${name}" must be assigned a value.`, routine.lex(-1))
  }
  variableAssignment.value = expression(routine)
  const variableValue = new VariableValue(variableAssignment.variable)
  variableValue.indexes.push(...variableAssignment.indexes)
  // check against variableValue.type rather than variableAssignment.variable.type
  // in case string has indexes and should be a character
  variableAssignment.value = typeCheck(variableAssignment.value, variableValue.type, variableLexeme)

  // return the variable assignment statement
  return variableAssignment
}

/** parses a RETURN statement */
function returnStatement (subroutine: Subroutine): ReturnStatement {
  if (subroutine.type !== 'function') {
    throw new CompilerError('Procedures cannot return a value.', subroutine.lex())
  }

  // create the statement
  const returnStatement = new ReturnStatement(subroutine)

  // expecting an expression of the right type, followed by semicolon
  returnStatement.value = expression(subroutine)
  returnStatement.value = typeCheck(returnStatement.value, subroutine.returns as Type, subroutine.lex())
  eosCheck(subroutine)

  // mark that this function has a return statement
  subroutine.hasReturnStatement = true

  // return the statement
  return returnStatement
}

/** parses an IF statement */
function ifStatement (subroutine: Subroutine): IfStatement {
  const ifStatement = new IfStatement()

  // expecting an opening bracket
  if (!subroutine.lex() || subroutine.lex()?.content !== '(') {
    throw new CompilerError('"if" must be followed by an opening bracket "(".', subroutine.lex(-1))
  }
  subroutine.lexemeIndex += 1

  // expecting a boolean expression
  if (!subroutine.lex()) {
    throw new CompilerError('"if (" must be followed by a Boolean expression.', subroutine.lex(-1))
  }
  ifStatement.condition = expression(subroutine)
  ifStatement.condition = typeCheck(ifStatement.condition, 'boolean', subroutine.lex(-1))

  // expecting a closing bracket
  if (!subroutine.lex() || subroutine.lex()?.content !== ')') {
    throw new CompilerError('"if (..." must be followed by a closing bracket ")".', subroutine.lex(-1))
  }
  subroutine.lexemeIndex += 1

  // expecting an opening curly bracket
  if (!subroutine.lex() || subroutine.lex()?.content !== "{") {
    throw new CompilerError('"if (...)" must be followed by an opening curly bracket "{".', subroutine.lex(-1))
  }
  subroutine.lexemeIndex += 1

  // expecting a block of statements
  ifStatement.ifStatements.push(...block(subroutine))

  // happy with an "else" here (but it's optional)
  if (subroutine.lex() && (subroutine.lex()?.content === 'else')) {
    subroutine.lexemeIndex += 1

    // expecting an opening bracket
    if (!subroutine.lex() || subroutine.lex()?.content !== "{") {
      throw new CompilerError('"else" must be followed by an opening bracket "{".', subroutine.lex(-1))
    }
    subroutine.lexemeIndex += 1

    // expecting a block of statements
    ifStatement.elseStatements.push(...block(subroutine))
  }

  // now we have everything we need
  return ifStatement
}

/** parses a FOR statement */
function forStatement (subroutine: Subroutine): ForStatement {
  const forStatement = new ForStatement()

  // expecting opening bracket
  if (!subroutine.lex() || subroutine.lex()?.content !== '(') {
    throw new CompilerError('"for" must be followed by an opening bracket "(".', subroutine.lex(-1))
  }
  subroutine.lexemeIndex += 1

  // expecting a variable assignment
  const initialisation = simpleStatement(subroutine)
  if (!(initialisation instanceof VariableAssignment)) {
    throw new CompilerError('"for" conditions must begin with a variable assignment.', subroutine.lex(-1))
  }
  if (initialisation.variable.type !== 'integer') {
    throw new CompilerError('Loop variable must be an integer.', subroutine.lex())
  }
  forStatement.initialisation = initialisation
  eosCheck(subroutine)

  // expecting boolean expression
  if (!subroutine.lex()) {
    throw new CompilerError('"for (...;" must be followed by a loop condition.', subroutine.lex(-1))
  }
  forStatement.condition = expression(subroutine)
  forStatement.condition = typeCheck(forStatement.condition, 'boolean', subroutine.lex(-1))
  eosCheck(subroutine)

  // expecting a variable assignment
  const change = simpleStatement(subroutine)
  if (!(change instanceof VariableAssignment)) {
    throw new CompilerError('"for" loop variable must be changed on each loop.', subroutine.lex(-1))
  }
  forStatement.change = change
  if (change.variable !== initialisation.variable) {
    throw new CompilerError('Initial loop variable and change loop variable must be the same.', subroutine.lex(-1))
  }

  // expecting a closing bracket
  if (!subroutine.lex() || subroutine.lex()?.content !== ')') {
    throw new CompilerError('Closing bracket ")" missing after "for" loop initialisation.', subroutine.lex(-1))
  }
  subroutine.lexemeIndex += 1

  // expecting an opening curly bracket
  if (!subroutine.lex() || subroutine.lex()?.content !== '{') {
    throw new CompilerError('"for (...)" must be followed by an opening bracket "{".', subroutine.lex(-1))
  }
  subroutine.lexemeIndex += 1

  // expecting a block of statements
  forStatement.statements.push(...block(subroutine))

  // now we have everything we need
  return forStatement
}

/** parses a DO (REPEAT) statement */
function doStatement (subroutine: Subroutine): RepeatStatement {
  const repeatStatement = new RepeatStatement()

  // expecting an opening bracket
  if (!subroutine.lex() || subroutine.lex()?.content !== '{') {
    throw new CompilerError('"do" must be followed by an opening bracket "{".', subroutine.lex(-1))
  }
  subroutine.lexemeIndex += 1

  // expecting a block of code
  repeatStatement.statements.push(...block(subroutine))

  // expecting "while"
  if (!subroutine.lex() || subroutine.lex()?.content !== 'while') {
    throw new CompilerError('"do { ... }" must be followed by "while".', subroutine.lex(-1))
  }
  subroutine.lexemeIndex += 1

  // expecting an opening bracket
  if (!subroutine.lex() || subroutine.lex()?.content !== '(') {
    throw new CompilerError('"while" must be followed by an opening bracket "(".', subroutine.lex(-1))
  }
  subroutine.lexemeIndex += 1

  // expecting a boolean expression
  if (!subroutine.lex()) {
    throw new CompilerError('"while (" must be followed by a boolean expression.', subroutine.lex(-1))
  }
  repeatStatement.condition = expression(subroutine)
  repeatStatement.condition = typeCheck(repeatStatement.condition, 'boolean', subroutine.lex(-1))
  // negate the condition
  repeatStatement.condition = new CompoundExpression(null, repeatStatement.condition, PCode.not)

  // expecting a closing bracket
  if (!subroutine.lex() || subroutine.lex()?.content !== ')') {
    throw new CompilerError('"while (..." must be followed by a closing bracket ")".', subroutine.lex(-1))
  }
  subroutine.lexemeIndex += 1

  // expecting a semicolon
  eosCheck(subroutine)

  // now we have everything we need
  return repeatStatement
}

/** parses a WHILE statement */
function whileStatement (subroutine: Subroutine): WhileStatement {
  const whileStatement = new WhileStatement()

  // expecting an opening bracket
  if (!subroutine.lex() || subroutine.lex()?.content !== '(') {
    throw new CompilerError('"while" must be followed by an opening bracket "(".', subroutine.lex(-1))
  }
  subroutine.lexemeIndex += 1

  // expecting a boolean expression
  if (!subroutine.lex()) {
    throw new CompilerError('"while (" must be followed by a Boolean expression.', subroutine.lex(-1))
  }
  whileStatement.condition = expression(subroutine)
  whileStatement.condition = typeCheck(whileStatement.condition, 'boolean', subroutine.lex(-1))

  // expecting a closing bracket
  if (!subroutine.lex() || subroutine.lex()?.content !== ')') {
    throw new CompilerError('"while (..." must be followed by a closing bracket ")".', subroutine.lex(-1))
  }
  subroutine.lexemeIndex += 1

  // expecting an opening curly bracket
  if (!subroutine.lex() || subroutine.lex()?.content !== '{') {
    throw new CompilerError('"while (...)" must be followed by an opening curly bracket "{".', subroutine.lex(-1))
  }
  subroutine.lexemeIndex += 1

  // expecting a block of statements
  whileStatement.statements.push(...block(subroutine))

  // now we have everything we need
  return whileStatement
}

/** parses a block of statements */
function block (subroutine: Subroutine): Statement[] {
  const statements: Statement[] = []

  // loop through until the end of the block (or we run out of lexemes)
  while (subroutine.lex() && subroutine.lex()?.content !== '}') {
    statements.push(statement(subroutine))
  }

  // check we came out of the loop for the right reason
  if (subroutine.lex()?.content === '}') {
    subroutine.lexemeIndex += 1
  } else {
    throw new CompilerError('Closing bracket "}" missing after statement block.', subroutine.lex(-1))
  }

  return statements
}
