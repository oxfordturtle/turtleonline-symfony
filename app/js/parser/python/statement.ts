import identifiers from './identifiers'
import { procedureCall } from '../call'
import { expression, typeCheck } from '../expression'
import evaluate from '../evaluate'
import * as find from '../find'
import { IntegerLexeme } from '../../lexer/lexeme'
import Lexemes from '../definitions/lexemes'
import { CompoundExpression, VariableValue, Expression, IntegerValue } from '../definitions/expression'
import Program from '../definitions/program'
import { Subroutine } from '../definitions/subroutine'
import Variable from '../definitions/variable'
import {
  Statement,
  IfStatement,
  ForStatement,
  WhileStatement,
  PassStatement,
  VariableAssignment,
  ReturnStatement
} from '../definitions/statement'
import { IdentifierLexeme, KeywordLexeme, Lexeme, OperatorLexeme } from '../../lexer/lexeme'
import { CompilerError } from '../../tools/error'
import variable from './variable'
import { Constant } from '../definitions/constant'
import { Token } from '../../lexer/token'

/** checks for semi colon or new line at the end of a statement */
export function eosCheck (lexemes: Lexemes): void {
  if (lexemes.get()) {
    if (lexemes.get()?.content === ';') {
      lexemes.next()
      while (lexemes.get()?.type === 'newline') {
        lexemes.next()
      }
    } else if (lexemes.get()?.type === 'newline') {
      while (lexemes.get()?.type === 'newline') {
        lexemes.next()
      }
    } else {
      throw new CompilerError('Statement must be separated by a semicolon or placed on a new line.', lexemes.get())
    }
  }
}

/** parses lexemes as a statement */
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

    // identifiers (variable declaration, variable assignment, or procedure call)
    case 'identifier': {
      const foo = find.variable(routine, lexemes.get()?.content as string)
      const bar = find.command(routine, lexemes.get()?.content as string)
      if (foo) {
        lexemes.next()
        statement = variableAssignment(lexeme, lexemes, routine, foo)
      } else if (bar) {
        lexemes.next()
        statement = procedureCall(lexeme, lexemes, routine, bar)
      } else {
        statement = variableDeclaration(lexeme, lexemes, routine)
      }
      eosCheck(lexemes)
      break
    }

    // keywords
    case 'keyword':
      switch (lexeme.subtype) {
        // def
        case 'def': {
          // the subroutine will have been defined in the first pass
          const sub = find.subroutine(routine, lexemes.get(1)?.content as string) as Subroutine
          // so here, just jump past its lexemes
          // N.B. lexemes[sub.end] is the final DEDENT lexeme; here we want to
          // move past it, hence sub.end + 1
          lexemes.index = sub.end + 1
          statement = new PassStatement()
          break
        }

        // global/nonlocal statement
        case 'global':
        case 'nonlocal':
          lexemes.next()
          if (routine instanceof Program) {
            throw new CompilerError('{lex} statements can only occur inside a subroutine.', lexemes.get(-1))
          }
          if (lexemes.get(-1)?.content === 'global') {
            routine.globals.push(...identifiers(lexemes, routine, 'global'))
          } else {
            routine.nonlocals.push(...identifiers(lexemes, routine, 'nonlocal'))
          }
          statement = new PassStatement()
          eosCheck(lexemes)
          break

        // return statement
        case 'return':
          lexemes.next()
          statement = returnStatement(lexeme, lexemes, routine)
          break

        // start of IF structure
        case 'if':
          lexemes.next()
          statement = ifStatement(lexeme, lexemes, routine)
          break

        // else is an error
        case 'else':
          throw new CompilerError('Statement cannot begin with "else". If you have an "if" above, this line may need to be indented more.', lexemes.get())

        // start of FOR structure
        case 'for':
          lexemes.next()
          statement = forStatement(lexeme, lexemes, routine)
          break

        // start of WHILE structure
        case 'while':
          lexemes.next()
          statement = whileStatement(lexeme, lexemes, routine)
          break

        // PASS
        case 'pass':
          lexemes.next()
          eosCheck(lexemes)
          statement = new PassStatement()
          break

        // any other keyword is an error
        default:
          throw new CompilerError('Statement cannot begin with {lex}.', lexeme)
      }
      break

    // an indent is an error
    case 'indent':
      throw new CompilerError('Statement cannot be indented.', lexeme)

    // any other lexeme is an error
    default:
      throw new CompilerError('Statement cannot begin with {lex}.', lexeme)
  }

  // return the statement
  return statement
}

/** parses lexemes as a variable assignment */
export function variableAssignment (variableLexeme: IdentifierLexeme, lexemes: Lexemes, routine: Program|Subroutine, variable: Variable): VariableAssignment|PassStatement {
  // strings and array variables permit element indexes at this point
  const indexes: Expression[] = []
  if (lexemes.get()?.content === '[') {
    if (variable.isArray) {
      lexemes.next()
      while (lexemes.get() && lexemes.get()?.content !== ']') {
        // expecting integer expression for the element index
        let exp = expression(lexemes, routine)
        exp = typeCheck(exp, variable)
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
      exp = typeCheck(exp, variable)
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
  const assignmentLexeme = lexemes.get()
  if (!assignmentLexeme) {
    throw new CompilerError('Variable must be followed by assignment operator "=".', lexemes.get(-1))
  }
  if (assignmentLexeme.content === ':') {
    if (variable.turtle) {
      throw new CompilerError('{lex} is the name of a predefined Turtle attribute, and cannot be given a type hit.', lexemes.get(-1))
    }
    throw new CompilerError('Type of variable {lex} has already been given.', lexemes.get(-1))
  }
  if (assignmentLexeme.content === '[') {
    throw new CompilerError('{lex} is not a string or list variable.', lexemes.get(-1))
  }
  if (assignmentLexeme.type !== 'operator' || assignmentLexeme.subtype !== 'asgn') {
    throw new CompilerError('Variable must be followed by assignment operator "=".', lexemes.get())
  }
  lexemes.next()

  // expecting an expression as the value to assign to the variable
  if (!lexemes.get()) {
    throw new CompilerError(`Variable "${variable.name}" must be assigned a value.`, lexemes.get(-1))
  }
  let value = expression(lexemes, routine)
  const variableValue = new VariableValue(variableLexeme, variable)
  variableValue.indexes.push(...indexes)

  // type checking
  value = typeCheck(value, variable)

  // create and return the variable assignment statement
  return new VariableAssignment(assignmentLexeme, variable, indexes, value)
}

/** parses lexemes as a variable declaration (with or without initial assignment) */
export function variableDeclaration (variableLexeme: IdentifierLexeme, lexemes: Lexemes, routine: Program|Subroutine): VariableAssignment|PassStatement {
  // expecting constant or variable declaration
  const foo = variable(lexemes, routine)

  // constants
  if (foo instanceof Constant) {
    // expecting '='
    if (!lexemes.get()) {
      throw new CompilerError('Constant must be assigned a value.', lexemes.get(-1))
    }
    if (lexemes.get()?.content !== '=') {
      throw new CompilerError('Constant must be assigned a value.', lexemes.get())
    }
    lexemes.next()

    // expecting an expression
    const exp = expression(lexemes, routine)
    foo.value = evaluate(exp, 'Python', 'constant')

    // add the constant to the routine
    routine.constants.push(foo)

    // return a pass statement
    return new PassStatement()
  }

  // otherwise it's a variable
  routine.variables.push(foo)

  // check for initial assignment
  if (lexemes.get()?.content === '=') {
    return variableAssignment(variableLexeme, lexemes, routine, foo)
  }

  // otherwise pass
  return new PassStatement()
}

/** parses lexemes as a RETURN statement */
function returnStatement (returnLexeme: KeywordLexeme, lexemes: Lexemes, routine: Program|Subroutine): ReturnStatement {
  // check a return statement is allowed
  if (routine instanceof Program) {
    throw new CompilerError('Programs cannot return a value.', lexemes.get())
  }

  // expecting an expression of the right type, followed by end of statement
  let value = expression(lexemes, routine)
  if (routine.returns !== null) {
    // check against previous return statements
    value = typeCheck(value, routine.returns)
  } else {
    // otherwise create a return variable
    const result = new Variable('!result', routine)
    result.type = value.type
    result.typeIsCertain = true
    routine.typeIsCertain = true
    routine.variables.unshift(result)
  }
  eosCheck(lexemes)

  // mark that this function has a return statement
  routine.hasReturnStatement = true

  // create and return the return statement
  return new ReturnStatement(returnLexeme, routine, value)
}

/** parses lexemes as an IF statement */
function ifStatement (ifLexeme: KeywordLexeme, lexemes: Lexemes, routine: Program|Subroutine): IfStatement {
  // expecting a boolean expression
  if (!lexemes.get()) {
    throw new CompilerError('"if" must be followed by a Boolean expression.', ifLexeme)
  }
  let condition = expression(lexemes, routine)
  condition = typeCheck(condition, 'boolean')

  // expecting a colon
  if (!lexemes.get()) {
    throw new CompilerError('"if <expression>" must be followed by a colon.', condition.lexeme)
  }
  lexemes.next()

  // expecting newline
  if (!lexemes.get()) {
    throw new CompilerError('No statements found after "if <expression>:".', lexemes.get(-1))
  }
  if (lexemes.get()?.type !== 'newline') {
    throw new CompilerError('Statements following "if <expression>:" must be on a new line.', lexemes.get())
  }
  lexemes.next()

  // create the if statement
  const ifStatement = new IfStatement(ifLexeme, condition)

  // expecting indent
  if (!lexemes.get()) {
    throw new CompilerError('No statements found after "if <expression>:".', lexemes.get(-1))
  }
  if (lexemes.get()?.type !== 'indent') {
    throw new CompilerError('Statements following "if <expression>:" must be indented.', lexemes.get())
  }
  lexemes.next()

  // expecting some statements
  if (!lexemes.get()) {
    throw new CompilerError('No statements found after "if <expression>:".', lexemes.get(-1))
  }
  ifStatement.ifStatements.push(...block(lexemes, routine))

  // happy with an "else" here (but it's optional)
  // TODO: support "elif" keyword
  if (lexemes.get() && (lexemes.get()?.content === 'else')) {
    lexemes.next()

    // expecting a colon
    if (!lexemes.get()) {
      throw new CompilerError('"else" must be followed by a colon.', lexemes.get(-1))
    }
    if (lexemes.get()?.content !== ':') {
      throw new CompilerError('"else" must be followed by a colon.', lexemes.get())
    }
    lexemes.next()

    // expecting newline
    if (!lexemes.get()) {
      throw new CompilerError('No statements found after "else:".', lexemes.get(-1))
    }
    if (lexemes.get()?.type !== 'newline') {
      throw new CompilerError('Statements following "else:" must be on a new line.', lexemes.get())
    }
    lexemes.next()

    // expecting indent
    if (!lexemes.get()) {
      throw new CompilerError('No statements found after "else:".', lexemes.get(-1))
    }
    if (lexemes.get()?.type !== 'indent') {
      throw new CompilerError('Statements following "else:" must be indented.', lexemes.get())
    }
    lexemes.next()

    // expecting some statements
    if (!lexemes.get()) {
      throw new CompilerError('No statements found after "else:".', lexemes.get(-1))
    }
    ifStatement.elseStatements.push(...block(lexemes, routine))
  }

  // now we have everything we need
  return ifStatement
}

/** parses lexemes as a FOR statement */
function forStatement (forLexeme: KeywordLexeme, lexemes: Lexemes, routine: Program|Subroutine): ForStatement {
  // expecting an integer variable
  const variableLexeme = lexemes.get()
  if (!variableLexeme) {
    throw new CompilerError('"for" must be followed by an integer variable.', lexemes.get(-1))
  }
  if (variableLexeme.type !== 'identifier') {
    throw new CompilerError('{lex} is not a valid variable name.', lexemes.get())
  }
  let variable = find.variable(routine, lexemes.get()?.content as string)
  if (!variable) {
    // create the variable now
    variable = new Variable(lexemes.get()?.content as string, routine)
    variable.type = 'integer'
    variable.typeIsCertain = true
    routine.variables.push(variable)
  }
  if (!variable.typeIsCertain) {
    variable.type = 'integer'
    variable.typeIsCertain = true
  }
  if (variable.type !== 'integer') {
    throw new CompilerError('Loop variable must be an integer.', lexemes.get())
  }
  lexemes.next()

  // expecting 'in'
  if (!lexemes.get()) {
    throw new CompilerError('"for <variable>" must be followed by "in".', lexemes.get(-1))
  }
  if (lexemes.get()?.content !== 'in') {
    throw new CompilerError('"for <variable>" must be followed by "in".', lexemes.get())
  }
  lexemes.next()

  // expecting 'range'
  if (!lexemes.get()) {
    throw new CompilerError('"for <variable> in" must be followed by a range specification.', lexemes.get(-1))
  }
  if (lexemes.get()?.content !== 'range') {
    throw new CompilerError('"for <variable> in" must be followed by a range specification.', lexemes.get())
  }
  lexemes.next()

  // expecting a left bracket
  if (!lexemes.get()) {
    throw new CompilerError('"range" must be followed by an opening bracket.', lexemes.get(-1))
  }
  if (lexemes.get()?.content !== '(') {
    throw new CompilerError('"range" must be followed by an opening bracket.', lexemes.get())
  }
  lexemes.next()

  // expecting an integer expression
  if (!lexemes.get()) {
    throw new CompilerError('Missing first argument to the "range" function.', lexemes.get(-1))
  }
  const providedValues: [Expression, Expression?, Expression?] = [typeCheck(expression(lexemes, routine), 'integer')]

  // expecting a comma or closing bracket
  if (!lexemes.get()) {
    throw new CompilerError('Argument must be followed by a comma.', lexemes.get(-1))
  }
  if (lexemes.get()?.content !== ')' && lexemes.get()?.content !== ',') {
    throw new CompilerError('Argument must be followed by a comma or a closing bracket.', lexemes.get())
  }

  // second argument allowed here
  if (lexemes.get()?.content === ',') {
    lexemes.next()
    if (!lexemes.get()) {
      throw new CompilerError('Too few arguments for "range" function.', lexemes.get(-1))
    }
    providedValues.push(typeCheck(expression(lexemes, routine), 'integer'))
  }

  // expecting a comma or closing bracket
  if (!lexemes.get()) {
    throw new CompilerError('Argument must be followed by a comma.', lexemes.get(-1))
  }
  if (lexemes.get()?.content !== ')' && lexemes.get()?.content !== ',') {
    throw new CompilerError('Argument must be followed by a comma or a closing bracket.', lexemes.get())
  }

  // third argument allowed here
  if (lexemes.get()?.content === ',') {
    lexemes.next()
    if (!lexemes.get()) {
      throw new CompilerError('Too few arguments for "range" function.', lexemes.get(-1))
    }
    providedValues.push(typeCheck(expression(lexemes, routine), 'integer'))
  }

  // the things we want to know
  let initialisation: VariableAssignment
  let condition: Expression
  let change: VariableAssignment

  // some dummy things we need to create the things we want to know
  const zeroToken = new Token('decimal', '0', forLexeme.line, -1)
  const zeroLexeme = new IntegerLexeme(zeroToken, 10)
  const zero = new IntegerValue(zeroLexeme)
  const oneToken = new Token('decimal', '1', forLexeme.line, -1)
  const oneLexeme = new IntegerLexeme(oneToken, 10)
  const one = new IntegerValue(oneLexeme)
  const assignmentToken = new Token('operator', '=', forLexeme.line, -1)
  const assignmentLexeme = new OperatorLexeme(assignmentToken, 'Python')
  const left = new VariableValue(variableLexeme, variable)
  const plusToken = new Token('operator', '+', forLexeme.line, -1)
  const lessToken = new Token('operator', '<', forLexeme.line, -1)
  const moreToken = new Token('operator', '>', forLexeme.line, -1)
  const plusLexeme = new OperatorLexeme(plusToken, 'Python')
  const lessLexeme = new OperatorLexeme(lessToken, 'Python')
  const moreLexeme = new OperatorLexeme(moreToken, 'Python')

  // the values of the things we need to know depend on how many arguments were provided
  switch (providedValues.length) {
    case 1:
      // initial value is zero
      initialisation = new VariableAssignment(assignmentLexeme, variable, [], zero)
      // change is +1
      change = new VariableAssignment(assignmentLexeme, variable, [], new CompoundExpression(plusLexeme, left, one, 'plus'))
      // termination condition is < providedValues[0]
      condition = new CompoundExpression(lessLexeme, left, providedValues[0], 'less')
      break
    case 2:
      // initial value is providedValues[0]
      initialisation = new VariableAssignment(assignmentLexeme, variable, [], providedValues[0])
      // change is +1
      change = new VariableAssignment(assignmentLexeme, variable, [], new CompoundExpression(plusLexeme, left, one, 'plus'))
      // termination condition is < providedValues[1]
      condition = new CompoundExpression(lessLexeme, left, providedValues[1]!, 'less')
      break
    case 3: {
      // initial value is providedValues[0]
      initialisation = new VariableAssignment(assignmentLexeme, variable, [], providedValues[0])
      // change is +/- providedValues[1]
      const stepValue = evaluate(providedValues[2]!, 'Python', 'step') as number
      change = new VariableAssignment(assignmentLexeme, variable, [], new CompoundExpression(plusLexeme, left, providedValues[2]!, 'plus'))
      // termination condition is >/< providedValues[2]
      condition = (stepValue < 0)
        ? new CompoundExpression(moreLexeme, left, providedValues[1]!, 'more')
        : new CompoundExpression(lessLexeme, left, providedValues[1]!, 'less')
      break
    }
  }

  // expecting a closing bracket
  if (!lexemes.get()) {
    throw new CompilerError('Closing bracket needed after "range" function arguments.', lexemes.get(-1))
  }
  if (lexemes.get()?.content === ',') {
    throw new CompilerError('Too many arguments for "range" function.', lexemes.get())
  }
  if (lexemes.get()?.content !== ')') {
    throw new CompilerError('Closing bracket needed after "range" function arguments.', lexemes.get())
  }
  lexemes.next()

  // expecting a colon
  if (!lexemes.get()) {
    throw new CompilerError('"for <variable> in range(...)" must be followed by a colon.', lexemes.get(-1))
  }
  if (lexemes.get()?.content !== ':') {
    throw new CompilerError('"for <variable> in range(...)" must be followed by a colon.', lexemes.get())
  }
  lexemes.next()

  // expecting newline
  if (!lexemes.get()) {
    throw new CompilerError('No statements found after "for <variable> in range(...):".', lexemes.get(-1))
  }
  if (lexemes.get()?.type !== 'newline') {
    throw new CompilerError('Statements following "for <variable> in range(...):" must be on a new line.', lexemes.get())
  }
  lexemes.next()

  // create the for statement
  const forStatement = new ForStatement(forLexeme, initialisation, condition, change)

  // expecting indent
  if (!lexemes.get()) {
    throw new CompilerError('No statements found after "for <variable> in range(...):".', lexemes.get(-1))
  }
  if (lexemes.get()?.type !== 'indent') {
    throw new CompilerError('Statements following "for <variable> in range(...):" must be indented.', lexemes.get())
  }
  lexemes.next()

  // now expecting a block of statements
  if (!lexemes.get()) {
    throw new CompilerError('No statements found after "for <variable> in range(...):', lexemes.get(-1))
  }
  forStatement.statements.push(...block(lexemes, routine))

  // now we have everything we need
  return forStatement
}

/** parses lexemes as a WHILE statement */
function whileStatement (whileLexeme: KeywordLexeme, lexemes: Lexemes, routine: Program|Subroutine): WhileStatement {
  // expecting a boolean expression
  if (!lexemes.get()) {
    throw new CompilerError('"while" must be followed by a Boolean expression.', whileLexeme)
  }
  let condition = expression(lexemes, routine)
  condition = typeCheck(condition, 'boolean')

  // expecting a colon
  if (!lexemes.get()) {
    throw new CompilerError('"while <expression>" must be followed by a colon.', lexemes.get(-1))
  }
  if (lexemes.get()?.content !== ':') {
    throw new CompilerError('"while <expression>" must be followed by a colon.', lexemes.get())
  }
  lexemes.next()

  // expecting newline
  if (!lexemes.get()) {
    throw new CompilerError('No statements found after "while <expression>:".', lexemes.get(-1))
  }
  if (lexemes.get()?.type !== 'newline') {
    throw new CompilerError('Statements following "while <expression>:" must be on a new line.', lexemes.get())
  }
  lexemes.next()

  // create the while statement
  const whileStatement = new WhileStatement(whileLexeme, condition)

  // expecting indent
  if (!lexemes.get()) {
    throw new CompilerError('No statements found after "while <expression>:".', lexemes.get(-1))
  }
  if (lexemes.get()?.type !== 'indent') {
    throw new CompilerError('Statements following "while <expression>:" must be indented.', lexemes.get())
  }
  lexemes.next()

  // expecting a block of statements
  if (!lexemes.get()) {
    throw new CompilerError('No statements found after "while <expression>:".', lexemes.get(-1))
  }
  whileStatement.statements.push(...block(lexemes, routine))

  // now we have everything we need
  return whileStatement
}

/** parses lexemes as a block of statements */
function block (lexemes: Lexemes, routine: Program|Subroutine): Statement[] {
  const statements: Statement[] = []

  // loop through until the end of the block (or we run out of lexemes)
  while (lexemes.get() && lexemes.get()?.type !== 'dedent') {
    statements.push(statement(lexemes.get() as Lexeme, lexemes, routine))
  }

  // move past the dedent lexeme
  if (lexemes.get()) {
    lexemes.next()
  }

  return statements
}
