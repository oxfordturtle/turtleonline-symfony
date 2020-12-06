import constant from './constant'
import variable from './variable'
import { procedureCall } from '../call'
import { expression, typeCheck } from '../expression'
import * as find from '../find'
import Lexemes from '../definitions/lexemes'
import { CompoundExpression, Expression, VariableValue } from '../definitions/expression'
import Program from '../definitions/program'
import { Subroutine } from '../definitions/subroutine'
import Variable from '../definitions/variable'
import { IdentifierLexeme, KeywordLexeme, Lexeme, OperatorLexeme, Type } from '../../lexer/lexeme'
import {
  Statement,
  IfStatement,
  ForStatement,
  RepeatStatement,
  ReturnStatement,
  WhileStatement,
  PassStatement,
  VariableAssignment,
  ProcedureCall
} from '../definitions/statement'
import { CompilerError } from '../../tools/error'
import { Token } from '../../lexer/token'

/** checks for semicolon or new line at the end of a statement */
export function eosCheck (lexemes: Lexemes): void {
  if (lexemes.get()) {
    if (lexemes.get()?.content !== ';' && lexemes.get()?.type !== 'newline') {
      throw new CompilerError('Statement must be followed by a semicolon or placed on a new line.', lexemes.get(-1))
    }
    while (lexemes.get()?.content === ';' || lexemes.get()?.type === 'newline') {
      lexemes.next()
    }
  }
}

/** parses a statement */
export function statement (lexeme: Lexeme, lexemes: Lexemes, routine: Program|Subroutine): Statement {
  let statement: Statement

  switch (lexeme.type) {
    // new line
    case 'newline':
      // in general this should be impossible (new lines should be eaten up at
      // the end of the previous statement), but it can happen at the start of
      // of the program or the start of a block, if there's a comment on the
      // first line
      lexemes.next()
      statement = new PassStatement()
      break

    // identifiers (variable assignment or procedure call)
    case 'identifier':
      statement = simpleStatement(lexeme, lexemes, routine)
      eosCheck(lexemes)
      break

    // keywords
    case 'keyword':
      switch (lexeme.subtype) {
        // function
        case 'function':
          // the subroutine will have been defined in the first pass
          const sub = find.subroutine(routine, lexemes.get(1)?.content as string) as Subroutine
          // so here, just jump past its lexemes
          // N.B. lexemes[sub.end] is the final "}" lexeme; here we want to move
          // past it, hence sub.end + 1
          lexemes.index = sub.end + 1
          statement = new PassStatement()
          break

        // start of variable declaration/assignment
        case 'const': // fallthrough
        case 'var':
          statement = simpleStatement(lexeme, lexemes, routine)
          eosCheck(lexemes)
          break

        // start of RETURN statement
        case 'return':
          lexemes.next()
          statement = returnStatement(lexeme, lexemes, routine)
          break

        // start of IF statement
        case 'if':
          lexemes.next()
          statement = ifStatement(lexeme, lexemes, routine)
          break

        // else is an error
        case 'else':
          throw new CompilerError('Statement cannot begin with "else". If you have an "if" above, you may be missing a closing bracket "}".', lexeme)

        // start of FOR statement
        case 'for':
          lexemes.next()
          statement = forStatement(lexeme, lexemes, routine)
          break

        // start of DO (REPEAT) statement
        case 'do':
          lexemes.next()
          statement = doStatement(lexeme, lexemes, routine)
          break

        // start of WHILE statement
        case 'while':
          lexemes.next()
          statement = whileStatement(lexeme, lexemes, routine)
          break

        // any other keyword is an error
        default:
          throw new CompilerError('Statement cannot begin with {lex}.', lexeme)
      }
      break

    // any other lexeme is an error
    default:
      throw new CompilerError('Statement cannot begin with {lex}.', lexeme)
  }

  // all good
  return statement
}

/** parses a simple statement (variable declaration/assignment or procedure call) */
export function simpleStatement (lexeme: KeywordLexeme|IdentifierLexeme, lexemes: Lexemes, routine: Program|Subroutine): VariableAssignment|ProcedureCall|PassStatement {
  switch (lexeme.type) {
    case 'keyword':
      switch (lexeme.subtype) {
        // "const" means constant definition
        case 'const':
          lexemes.next()
          // bypass duplicate check on the second pass (and forget about the result)
          constant(lexemes, routine, false)
          return new PassStatement()

        // "var" means a variable declaration
        case 'var':
          lexemes.next()
          // on the second pass, we know the next lexeme is an identifier, and that it
          // names a variable that has been defined
          const variableLexeme = lexemes.get() as IdentifierLexeme
          const foo = find.variable(routine, variableLexeme.content) as Variable
          // bypass duplicate check on the second pass (and forget about the result)
          variable(lexemes, routine, false)
          if (lexemes.get()?.content === '=') {
            return variableAssignment(variableLexeme, lexemes, routine, foo)
          } else {
            return new PassStatement()
          }

        // any other keyword is an error
        default:
          // this should never happen, as this function should only be called
          // with "const" or "var" keyword
          throw new CompilerError('Simple statement cannot begin with {lex}.', lexeme)
      }

    // identifier means variable assignment or procedure call
    case 'identifier':
      const foo = find.constant(routine, lexeme.value)
      const bar = find.variable(routine, lexeme.value)
      const baz = find.command(routine, lexeme.value)
      if (foo) {
        throw new CompilerError('{lex} is a constant and cannot be assined a new value.', lexeme)
      } else if (bar) {
        lexemes.next()
        return variableAssignment(lexeme, lexemes, routine, bar)
      } else if (baz) {
        lexemes.next()
        const statement = procedureCall(lexeme, lexemes, routine, baz)
        return statement
      } else {
        throw new CompilerError('{lex} is not defined.', lexemes.get())
      }
    }
}

/** parses a variable assignment */
function variableAssignment (variableLexeme: IdentifierLexeme, lexemes: Lexemes, routine: Program|Subroutine, variable: Variable): VariableAssignment {
  // strings and array variables permit element indexes at this point
  const indexes: Expression[] = []
  if (lexemes.get()?.content === '[') {
    if (variable.isArray) {
      lexemes.next()
      while (lexemes.get() && lexemes.get()?.content !== ']') {
        // expecting integer expression for the element index
        let exp = expression(lexemes, routine)
        exp = typeCheck(exp, 'integer')
        indexes.push(exp)
        // maybe move past "]["
        if (lexemes.get()?.content === ']' && lexemes.get(1)?.content === '[') {
          lexemes.next()
          lexemes.next()
        }
      }
      // check we came out of the loop above for the right reason
      if (!lexemes.get()) {
        throw new CompilerError('Closing bracket "]" needed after array indexes.', lexemes.get(-1))
      }
      // move past the closing bracket
      lexemes.next()
    } else if (variable.type === 'string') {
      lexemes.next()
      // expecting integer expression for the character index
      let exp = expression(lexemes, routine)
      exp = typeCheck(exp, 'integer')
      indexes.push(exp)
      // expecting closing bracket
      if (!lexemes.get() || (lexemes.get()?.content !== ']')) {
        throw new CompilerError('Closing bracket "]" missing after string variable index.', exp.lexeme)
      }
      lexemes.next()
    } else {
      throw new CompilerError('{lex} is not a string or array variable.', variableLexeme)
    }
  }

  // check the right number of array variable indexes have been given
  if (variable.isArray) {
    const allowedIndexes = (variable.type === 'string')
      ? variable.arrayDimensions.length + 1 // one more for characters within strings
      : variable.arrayDimensions.length
    if (indexes.length > allowedIndexes) {
      throw new CompilerError('Too many indexes for array variable {lex}.', variableLexeme)
    }
  }

  // expecting "="
  const assignmentOperator = lexemes.get()
  if (!assignmentOperator) {
    throw new CompilerError('Variable must be followed by assignment operator "=".', lexemes.get(-1))
  }
  if (assignmentOperator.content === ':') {
    throw new CompilerError('Type of variable {lex} has already been given.', assignmentOperator)
  }
  if (assignmentOperator.content === '[') {
    throw new CompilerError('{lex} is not a string or array variable.', assignmentOperator)
  }
  if (assignmentOperator.type !== 'operator' || assignmentOperator.subtype !== 'asgn') {
    throw new CompilerError('Variable must be followed by assignment operator "=".', assignmentOperator)
  }
  lexemes.next()

  // expecting an expression as the value to assign to the variable
  if (!lexemes.get()) {
    throw new CompilerError(`Variable "${variable.name}" must be assigned a value.`, lexemes.get(-1))
  }
  let value = expression(lexemes, routine)
  const variableValue = new VariableValue(variableLexeme, variable)
  variableValue.indexes.push(...indexes)
  value = typeCheck(value, variableValue.type)

  // create and return the variable assignment statement
  return new VariableAssignment(assignmentOperator, variable, indexes, value)
}

/** parses a RETURN statement */
function returnStatement (returnLexeme: KeywordLexeme, lexemes: Lexemes, routine: Program|Subroutine): ReturnStatement {
  // check a return statement is allowed
  if (routine instanceof Program) {
    throw new CompilerError('"RETURN" statements are only valid within the body of a function.', lexemes.get())
  }
  if (routine.type !== 'function') {
    throw new CompilerError('Procedures cannot return a value.', lexemes.get())
  }

  // expecting an expression of the right type, followed by semicolon
  let value = expression(lexemes, routine)
  value = typeCheck(value, routine.returns as Type)
  eosCheck(lexemes)

  // mark that this function has a return statement
  routine.hasReturnStatement = true

  // create and return the return statement
  return new ReturnStatement(returnLexeme, routine, value)
}

/** parses an IF statement */
function ifStatement (ifLexeme: KeywordLexeme, lexemes: Lexemes, routine: Program|Subroutine): IfStatement {
  // expecting an opening bracket
  if (!lexemes.get() || lexemes.get()?.content !== '(') {
    throw new CompilerError('"if" must be followed by an opening bracket "(".', lexemes.get(-1))
  }
  lexemes.next()

  // expecting a boolean expression
  if (!lexemes.get()) {
    throw new CompilerError('"if (" must be followed by a Boolean expression.', lexemes.get(-1))
  }
  let condition = expression(lexemes, routine)
  condition = typeCheck(condition, 'boolean')

  // expecting a closing bracket
  if (!lexemes.get() || lexemes.get()?.content !== ')') {
    throw new CompilerError('"if (..." must be followed by a closing bracket ")".', lexemes.get(-1))
  }
  lexemes.next()

  // create the if statement
  const ifStatement = new IfStatement(ifLexeme, condition)

  // expecting an opening curly bracket
  if (!lexemes.get() || lexemes.get()?.content !== "{") {
    throw new CompilerError('"if (...)" must be followed by an opening curly bracket "{".', lexemes.get(-1))
  }
  lexemes.next()

  // expecting a block of statements
  ifStatement.ifStatements.push(...block(lexemes, routine))

  // happy with an "else" here (but it's optional)
  if (lexemes.get() && (lexemes.get()?.content === 'else')) {
    lexemes.next()

    // expecting an opening bracket
    if (!lexemes.get() || lexemes.get()?.content !== "{") {
      throw new CompilerError('"else" must be followed by an opening bracket "{".', lexemes.get(-1))
    }
    lexemes.next()

    // expecting a block of statements
    ifStatement.elseStatements.push(...block(lexemes, routine))
  }

  // now we have everything we need
  return ifStatement
}

/** parses a FOR statement */
function forStatement (forLexeme: KeywordLexeme, lexemes: Lexemes, routine: Program|Subroutine): ForStatement {
  // expecting opening bracket
  if (!lexemes.get() || lexemes.get()?.content !== '(') {
    throw new CompilerError('"for" must be followed by an opening bracket "(".', lexemes.get(-1))
  }
  lexemes.next()

  // expecting a variable assignment
  const firstInitialisationLexeme = lexemes.get()
  if (!firstInitialisationLexeme) {
    throw new CompilerError('"for" conditions must begin with a variable assignment.', lexemes.get(-1))
  }
  if (firstInitialisationLexeme.type !== 'keyword' && firstInitialisationLexeme.type !== 'identifier') {
    throw new CompilerError('"for" conditions must begin with a variable assignment.', firstInitialisationLexeme)
  }
  const initialisation = simpleStatement(firstInitialisationLexeme, lexemes, routine)
  if (!(initialisation instanceof VariableAssignment)) {
    throw new CompilerError('"for" conditions must begin with a variable assignment.', lexemes.get(-1))
  }
  if (initialisation.variable.type !== 'integer') {
    throw new CompilerError('Loop variable must be an integer.', lexemes.get())
  }

  // expecting a semicolon
  if (!lexemes.get() || lexemes.get()?.content !== ';') {
    throw new CompilerError('"for (..." must be followed by a semicolon.', lexemes.get(-1))
  }
  lexemes.next()

  // expecting a boolean expression
  if (!lexemes.get()) {
    throw new CompilerError('"for (...; ...;" must be followed by a loop condition.', lexemes.get(-1))
  }
  let condition = expression(lexemes, routine)
  condition = typeCheck(condition, 'boolean')

  // expecting a semicolon
  if (!lexemes.get() || lexemes.get()?.content !== ';') {
    throw new CompilerError('"for (...; ..." must be followed by a semicolon.', lexemes.get(-1))
  }
  lexemes.next()

  // expecting a variable assignment
  const firstChangeLexeme = lexemes.get()
  if (!firstChangeLexeme) {
    throw new CompilerError('"for (...;" must be followed by a loop variable reassignment.', lexemes.get(-1))
  }
  if (firstChangeLexeme.type !== 'keyword' && firstChangeLexeme.type !== 'identifier') {
    throw new CompilerError('"for (...;" must be followed by a loop variable reassignment.', lexemes.get(-1))
  }
  const change = simpleStatement(firstChangeLexeme, lexemes, routine)
  if (!(change instanceof VariableAssignment)) {
    throw new CompilerError('"for (...;" must be followed by a loop variable reassignment.', lexemes.get(-1))
  }
  if (change.variable !== initialisation.variable) {
    throw new CompilerError('Initial loop variable and change loop variable must be the same.', lexemes.get(-1))
  }

  // expecting a closing bracket
  if (!lexemes.get() || lexemes.get()?.content !== ')') {
    throw new CompilerError('"for (...; ...; ..." must be followed by a closing bracket ")".', lexemes.get(-1))
  }
  lexemes.next()

  // expecting an opening curly bracket
  if (!lexemes.get() || lexemes.get()?.content !== '{') {
    throw new CompilerError('"for (...; ...; ...)" must be followed by an opening bracket "{".', lexemes.get(-1))
  }
  lexemes.next()

  // create the for statement
  const forStatement = new ForStatement(forLexeme, initialisation, condition, change)

  // expecting a block of statements
  forStatement.statements.push(...block(lexemes, routine))

  // return the for statement
  return forStatement
}

/** parses a DO (REPEAT) statement */
function doStatement (doLexeme: KeywordLexeme, lexemes: Lexemes, routine: Program|Subroutine): RepeatStatement {
  // expecting an opening bracket
  if (!lexemes.get() || lexemes.get()?.content !== '{') {
    throw new CompilerError('"do" must be followed by an opening bracket "{".', lexemes.get(-1))
  }
  lexemes.next()

  // expecting a block of code
  const repeatStatements = block(lexemes, routine)

  // expecting "while"
  if (!lexemes.get() || lexemes.get()?.content !== 'while') {
    throw new CompilerError('"do { ... }" must be followed by "while".', lexemes.get(-1))
  }
  lexemes.next()

  // expecting an opening bracket
  if (!lexemes.get() || lexemes.get()?.content !== '(') {
    throw new CompilerError('"while" must be followed by an opening bracket "(".', lexemes.get(-1))
  }
  lexemes.next()

  // expecting a boolean expression
  if (!lexemes.get()) {
    throw new CompilerError('"while (" must be followed by a boolean expression.', lexemes.get(-1))
  }
  let condition = expression(lexemes, routine)
  condition = typeCheck(condition, 'boolean')
  // negate the condition
  const notToken = new Token('operator', '!', condition.lexeme.line, condition.lexeme.character)
  const notLexeme = new OperatorLexeme(notToken, 'TypeScript')
  condition = new CompoundExpression(notLexeme, null, condition, 'not')

  // expecting a closing bracket
  if (!lexemes.get() || lexemes.get()?.content !== ')') {
    throw new CompilerError('"while (..." must be followed by a closing bracket ")".', lexemes.get(-1))
  }
  lexemes.next()

  // expecting a semicolon
  eosCheck(lexemes)

  // create and return the repeat statement
  const repeatStatement = new RepeatStatement(doLexeme, condition)
  repeatStatement.statements.push(...repeatStatements)
  return repeatStatement
}

/** parses a WHILE statement */
function whileStatement (whileLexeme: KeywordLexeme, lexemes: Lexemes, routine: Program|Subroutine): WhileStatement {
  // expecting an opening bracket
  if (!lexemes.get() || lexemes.get()?.content !== '(') {
    throw new CompilerError('"while" must be followed by an opening bracket "(".', lexemes.get(-1))
  }
  lexemes.next()

  // expecting a boolean expression
  if (!lexemes.get()) {
    throw new CompilerError('"while (" must be followed by a Boolean expression.', lexemes.get(-1))
  }
  let condition = expression(lexemes, routine)
  condition = typeCheck(condition, 'boolean')

  // expecting a closing bracket
  if (!lexemes.get() || lexemes.get()?.content !== ')') {
    throw new CompilerError('"while (..." must be followed by a closing bracket ")".', lexemes.get(-1))
  }
  lexemes.next()

  // create the while statement
  const whileStatement = new WhileStatement(whileLexeme, condition)

  // expecting an opening curly bracket
  if (!lexemes.get() || lexemes.get()?.content !== '{') {
    throw new CompilerError('"while (...)" must be followed by an opening curly bracket "{".', lexemes.get(-1))
  }
  lexemes.next()

  // expecting a block of statements
  whileStatement.statements.push(...block(lexemes, routine))

  // now we have everything we need
  return whileStatement
}

/** parses a block of statements */
function block (lexemes: Lexemes, routine: Program|Subroutine): Statement[] {
  const statements: Statement[] = []

  // loop through until the end of the block (or we run out of lexemes)
  while (lexemes.get() && lexemes.get()?.content !== '}') {
    statements.push(statement(lexemes.get() as Lexeme, lexemes, routine))
  }

  // check we came out of the loop for the right reason
  if (lexemes.get()?.content === '}') {
    lexemes.next()
  } else {
    throw new CompilerError('Closing bracket "}" missing after statement block.', lexemes.get(-1))
  }

  return statements
}
