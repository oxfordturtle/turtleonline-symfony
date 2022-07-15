import { array, variable, variables } from './variable'
import type Lexemes from '../definitions/lexemes'
import constant from './constant'
import Program from '../definitions/program'
import type { Subroutine } from '../definitions/subroutine'
import type Variable from '../definitions/variable'
import { Statement, IfStatement, ForStatement, RepeatStatement, ReturnStatement, WhileStatement, VariableAssignment, ProcedureCall, PassStatement } from '../definitions/statement'
import { IntegerValue, VariableValue, CompoundExpression, Expression } from '../definitions/expression'
import { typeCheck, expression } from '../expression'
import evaluate from '../evaluate'
import { procedureCall } from '../call'
import * as find from '../find'
import { Type, Lexeme, IdentifierLexeme, OperatorLexeme, KeywordLexeme, IntegerLexeme } from '../../lexer/lexeme'
import { CompilerError } from '../../tools/error'
import { Token } from '../../lexer/token'

/** checks for new lines and moves past them */
export function newLine (lexemes: Lexemes): void {
  if (lexemes.get() && lexemes.get()?.type !== 'newline') {
    throw new CompilerError('Statement must be on a new line.', lexemes.get())
  }
  while (lexemes.get()?.type === 'newline') {
    lexemes.next()
  }
}

/** parses lexemes as a statement */
export function statement (lexeme: Lexeme, lexemes: Lexemes, routine: Program|Subroutine, oneLine: boolean = false): Statement {
  let statement: Statement

  switch (lexeme.type) {
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
      if (lexeme.subtype === 'eqal') {
        lexeme.subtype = 'asgn'
        lexemes.next()
        statement = returnStatement(lexeme, lexemes, routine)
      } else {
        throw new CompilerError('Statement cannot begin with {lex}.', lexeme)
      }
      break

    // identifiers (variable assignment or procedure call)
    case 'identifier':
      statement = simpleStatement(lexeme, lexemes, routine)
      break

    // keywords
    case 'keyword':
      switch (lexeme.subtype) {
        // CONST statement
        case 'const':
          lexemes.next()
          routine.constants.push(constant(lexemes, routine))
          statement = new PassStatement()
          break

        // DIM statement
        case 'dim':
          lexemes.next()
          routine.variables.push(array(lexemes, routine))
          statement = new PassStatement()
          break

        // LOCAL statement
        case 'local':
          if (routine instanceof Program) {
            throw new CompilerError('Main program cannot declare any LOCAL variables.', lexemes.get())
          }
          lexemes.next()
          routine.variables.push(...variables(lexemes, routine))
          statement = new PassStatement()
          break

        // PRIVATE statement
        case 'private': {
          if (routine instanceof Program) {
            throw new CompilerError('Main program cannot declare any PRIVATE variables.', lexemes.get())
          }
          lexemes.next()
          const privateVariables = variables(lexemes, routine)
          for (const privateVariable of privateVariables) {
            privateVariable.private = routine
          }
          routine.program.variables.push(...privateVariables)
          statement = new PassStatement()
          break
        }

        // start of IF structure
        case 'if':
          lexemes.next()
          statement = ifStatement(lexeme, lexemes, routine)
          break

        // start of FOR structure
        case 'for':
          lexemes.next()
          statement = forStatement(lexeme, lexemes, routine)
          break

        // start of REPEAT structure
        case 'repeat':
          lexemes.next()
          statement = repeatStatement(lexeme, lexemes, routine)
          break

        // start of WHILE structure
        case 'while':
          lexemes.next()
          statement = whileStatement(lexeme, lexemes, routine)
          break

        case 'def':
          if (routine instanceof Program) {
            throw new CompilerError('Subroutines must be defined after program "END".', lexeme)
          }
          throw new CompilerError('Subroutines cannot contain any nested subroutine definitions.', lexeme)

        default:
          throw new CompilerError('Statement cannot begin with {lex}.', lexemes.get())
      }
      break

    // anything else is an error
    default:
      throw new CompilerError('Statement cannot begin with {lex}.', lexemes.get())
  }

  // end of statement check
  // bypass within oneLine IF...THEN...ELSE statement (check occurs at the end of the whole statement)
  if (!oneLine && lexemes.get()) {
    if (lexemes.get()?.content === ':' || lexemes.get()?.type === 'newline') {
      while (lexemes.get()?.content === ':' || lexemes.get()?.type === 'newline') {
        lexemes.next()
      }
    } else {
      throw new CompilerError('Statements must be separated by a colon or placed on different lines.', lexemes.get())
    }
  }

  // return the statement
  return statement
}

/** parses lexemes as a simple statement (variable assignment or procedure call) */
function simpleStatement (lexeme: IdentifierLexeme, lexemes: Lexemes, routine: Program|Subroutine): VariableAssignment|ProcedureCall {
  // check for command
  const foo = find.command(routine, lexeme.content)
  if (foo) {
    lexemes.next()
    return procedureCall(lexeme, lexemes, routine, foo)
  }

  // check for variable
  const bar = find.variable(routine, lexeme.content)
  if (bar) {
    lexemes.next()
    return variableAssignment(lexeme, lexemes, routine, bar)
  }

  // otherwise create the variable as a global
  const program = (routine instanceof Program) ? routine : routine.program
  const baz = variable(lexemes, program)
  program.variables.push(baz)
  return variableAssignment(lexeme, lexemes, routine, baz)
}

/** parses lexemes as a variable assignment */
function variableAssignment (variableLexeme: IdentifierLexeme, lexemes: Lexemes, routine: Program|Subroutine, variable: Variable): VariableAssignment {
  // array variables permit element indexes at this point
  const indexes: Expression[] = []
  if (lexemes.get()?.content === '(') {
    if (variable.isArray) {
      lexemes.next()
      while (lexemes.get() && lexemes.get()?.content !== ')') {
        // expecting integer expression for the element index
        let exp = expression(lexemes, routine)
        exp = typeCheck(exp, 'integer')
        indexes.push(exp)
        // maybe move past comma
        if (lexemes.get()?.content === ',') {
          lexemes.next()
          // check for trailing comma
          if (lexemes.get()?.content === ')') {
            throw new CompilerError('Trailing comma at the end of array indexes.', lexemes.get(-1))
          }
        }
      }
      // check we came out of the loop above for the right reason
      if (!lexemes.get()) {
        throw new CompilerError('Closing bracket ")" needed after array indexes.', lexemes.get(-1))
      }
      // move past the closing bracket
      lexemes.next()
    } else {
      throw new CompilerError('{lex} is not an array variable.', variableLexeme)
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
  if (assignmentLexeme.type !== 'operator' || assignmentLexeme.content !== '=') {
    throw new CompilerError('Variable must be followed by assignment operator "=".', assignmentLexeme)
  }
  lexemes.next()

  // expecting an expression as the value to assign to the variable
  if (!lexemes.get()) {
    throw new CompilerError(`Variable "${variable.name}" must be assigned a value.`, lexemes.get(-1))
  }
  let value = expression(lexemes, routine)
  value = typeCheck(value, variable.type)

  // create and return the variable assignment statement
  return new VariableAssignment(assignmentLexeme, variable, indexes, value)
}

/** parses lexemes as a RETURN statement */
function returnStatement (lexeme: OperatorLexeme, lexemes: Lexemes, routine: Program|Subroutine): ReturnStatement {
  // check a return statement is allowed
  if (routine instanceof Program) {
    throw new CompilerError('Statement in the main program cannot begin with {lex}.', lexeme)
  }
  if (routine.type !== 'function') {
    throw new CompilerError('Procedures cannot return a value.', lexeme)
  }

  // expecting an expression of the right type
  let value = expression(lexemes, routine)
  value = typeCheck(value, routine.returns as Type)

  // create and return the statement
  return new ReturnStatement(lexeme, routine, value)
}

/** parses lexemes as an IF statement */
function ifStatement (lexeme: KeywordLexeme, lexemes: Lexemes, routine: Program|Subroutine): IfStatement {
  let oneLine: boolean

  // expecting a boolean expression
  if (!lexemes.get()) {
    throw new CompilerError('"IF" must be followed by a boolean expression.', lexeme)
  }
  let condition = expression(lexemes, routine)
  condition = typeCheck(condition, 'boolean')

  // expecting "then"
  if (!lexemes.get()) {
    throw new CompilerError('"IF ..." must be followed by "THEN".', lexemes.get(-1))
  }
  if (lexemes.get()?.content !== 'THEN') {
    throw new CompilerError('"IF ..." must be followed by "THEN".', lexemes.get())
  }
  lexemes.next()

  // ok, create the IF statement
  const ifStatement = new IfStatement(lexeme, condition)

  // expecting a statement on the same line or a block of statements on a new line
  const firstInnerLexeme = lexemes.get()
  if (!firstInnerLexeme) {
    throw new CompilerError('No statements found after "IF ... THEN".', lexemes.get())
  }
  if (firstInnerLexeme.type === 'newline') {
    while (lexemes.get()?.type === 'newline') {
      lexemes.next()
    }
    ifStatement.ifStatements.push(...block(lexemes, routine, 'IF'))
    oneLine = false
  } else {
    oneLine = true
    ifStatement.ifStatements.push(statement(firstInnerLexeme, lexemes, routine, oneLine))
  }

  // happy with an "else" here (but it's optional)
  if (lexemes.get() && lexemes.get()?.content === 'ELSE') {
    lexemes.next()
    const firstInnerLexeme = lexemes.get()
    if (!firstInnerLexeme) {
      throw new CompilerError('No statements found after "ELSE".', lexemes.get(-1))
    }
    if (oneLine) {
      if (firstInnerLexeme.type === 'newline') {
        throw new CompilerError('Statement following "ELSE" cannot be on a new line.', lexemes.get(1))
      }
      ifStatement.elseStatements.push(statement(firstInnerLexeme, lexemes, routine, oneLine))
    } else {
      if (firstInnerLexeme.type !== 'newline') {
        throw new CompilerError('Statement following "ELSE" must be on a new line.', firstInnerLexeme)
      }
      // move past all line breaks
      while (lexemes.get()?.type === 'newline') {
        lexemes.next()
      }
      ifStatement.elseStatements.push(...block(lexemes, routine, 'ELSE'))
    }
  }

  // return the statement
  return ifStatement
}

/** parses lexemes as a FOR statement */
function forStatement (lexeme: KeywordLexeme, lexemes: Lexemes, routine: Program|Subroutine): ForStatement {
  // expecting an integer variable
  const variableLexeme = lexemes.get()
  if (!variableLexeme) {
    throw new CompilerError('"FOR" must be followed by an integer variable.', lexeme)
  }
  if (variableLexeme.type !== 'identifier') {
    throw new CompilerError('"FOR" must be followed by an integer variable.', variableLexeme)
  }
  if (variableLexeme.subtype === 'turtle') {
    throw new CompilerError('Turtle attribute cannot be used as a "FOR" variable.', variableLexeme)
  }
  let foo = find.variable(routine, variableLexeme.content)
  if (!foo) {
    // create the variable as a global
    const program = (routine instanceof Program) ? routine : routine.program
    foo = variable(lexemes, program)
    program.variables.push(foo)
  } else {
    lexemes.next()
  }
  if (foo.type !== 'integer' && foo.type !== 'boolint') {
    throw new CompilerError('{lex} is not an integer variable.', lexemes.get())
  }

  // expecting variable assignment
  const initialisation = variableAssignment(variableLexeme, lexemes, routine, foo)

  // expecting "to"
  if (!lexemes.get()) {
    throw new CompilerError('"FOR" loop initialisation must be followed by "TO".', lexemes.get(-1))
  }
  if (lexemes.get()?.content !== 'TO') {
    throw new CompilerError('"FOR" loop initialisation must be followed by "TO".', lexemes.get())
  }
  lexemes.next()

  // expecting integer expression (for the final value)
  if (!lexemes.get()) {
    throw new CompilerError('"TO" must be followed by an integer (or integer constant).', lexemes.get(-1))
  }
  let finalValue = expression(lexemes, routine)
  finalValue = typeCheck(finalValue, 'integer')

  // create some dummy lexemes for the condition and step change
  const oneToken = new Token('decimal', '1', lexeme.line, -1)
  const assignmentToken = new Token('operator', '=', lexeme.line, -1)
  const plusToken = new Token('operator', '+', lexeme.line, -1)
  const lseqToken = new Token('operator', '<=', lexeme.line, -1)
  const mreqToken = new Token('operator', '>=', lexeme.line, -1)
  const oneLexeme = new IntegerLexeme(oneToken, 10)
  const assignmentLexeme = new OperatorLexeme(assignmentToken, 'BASIC')
  const plusLexeme = new OperatorLexeme(plusToken, 'BASIC')
  const lseqLexeme = new OperatorLexeme(lseqToken, 'BASIC')
  const mreqLexeme = new OperatorLexeme(mreqToken, 'BASIC')

  // define default condition and step change
  const left = new VariableValue(variableLexeme, foo)
  const right = new IntegerValue(oneLexeme)
  let change = new VariableAssignment(assignmentLexeme, foo, [], new CompoundExpression(plusLexeme, left, right, 'plus'))
  let condition = new CompoundExpression(lseqLexeme, left, finalValue, 'lseq')

  // "STEP" permissible here
  if (lexemes.get() && lexemes.get()?.content === 'STEP') {
    lexemes.next()
    if (!lexemes.get()) {
      throw new CompilerError('"STEP" instruction must be followed by an integer value.', lexemes.get(-1))
    }
    const stepValue = typeCheck(expression(lexemes, routine), 'integer')
    const evaluatedStepValue = evaluate(stepValue, 'BASIC', 'step') as number
    if (evaluatedStepValue === 0) {
      throw new CompilerError('Step value cannot be zero.', stepValue.lexeme)
    }
    change = new VariableAssignment(assignmentLexeme, foo, [], new CompoundExpression(plusLexeme, left, stepValue, 'plus'))
    if (evaluatedStepValue < 0) {
      condition = new CompoundExpression(mreqLexeme, left, finalValue, 'mreq')
    } else {
      condition = new CompoundExpression(lseqLexeme, left, finalValue, 'lseq')
    }
  }

  // now we can create the FOR statement
  const forStatement = new ForStatement(lexeme, initialisation, condition, change)

  // expecting a statement on the same line or a block of statements on a new line
  const firstInnerLexeme = lexemes.get()
  if (!firstInnerLexeme) {
    throw new CompilerError('No statements found after "FOR" loop initialisation.', lexeme)
  }
  if (firstInnerLexeme.type === 'newline') {
    while (lexemes.get()?.type === 'newline') {
      lexemes.next()
    }
    forStatement.statements.push(...block(lexemes, routine, 'FOR'))
  } else {
    forStatement.statements.push(statement(firstInnerLexeme, lexemes, routine))
  }

  // now we have everything we need
  return forStatement
}

/** parses lexemes as a REPEAT statement */
function repeatStatement (lexeme: KeywordLexeme, lexemes: Lexemes, routine: Program|Subroutine): RepeatStatement {
  let repeatStatements: Statement[]

  // expecting a statement on the same line or a block of statements on a new line
  const firstInnerLexeme = lexemes.get()
  if (!firstInnerLexeme) {
    throw new CompilerError('No statements found after "REPEAT".', lexeme)
  }
  if (firstInnerLexeme.type === 'newline') {
    while (lexemes.get()?.type === 'newline') {
      lexemes.next()
    }
    repeatStatements = block(lexemes, routine, 'REPEAT')
  } else {
    repeatStatements = [statement(firstInnerLexeme, lexemes, routine)]
  }

  // expecting a boolean expression
  if (!lexemes.get()) {
    throw new CompilerError('"UNTIL" must be followed by a boolean expression.', lexemes.get(-1))
  }
  let condition = expression(lexemes, routine)
  condition = typeCheck(condition, 'boolean')

  // now we have everything we need
  const repeatStatement = new RepeatStatement(lexeme, condition)
  repeatStatement.statements.push(...repeatStatements)
  return repeatStatement
}

/** parses lexemes as a WHILE statement */
function whileStatement (lexeme: KeywordLexeme, lexemes: Lexemes, routine: Program|Subroutine): WhileStatement {
  // expecting a boolean expression
  if (!lexemes.get()) {
    throw new CompilerError('"WHILE" must be followed by a boolean expression.', lexemes.get(-1))
  }
  let condition = expression(lexemes, routine)
  condition = typeCheck(condition, 'boolean')

  // create the statement
  const whileStatement = new WhileStatement(lexeme, condition)

  // expecting a statement on the same line or a block of statements on a new line
  const firstInnerLexeme = lexemes.get()
  if (!firstInnerLexeme) {
    throw new CompilerError('No commands found after "WHILE ... DO".', lexemes.get(-1))
  }
  if (firstInnerLexeme.type === 'newline') {
    while (lexemes.get()?.type === 'newline') {
      lexemes.next()
    }
    whileStatement.statements.push(...block(lexemes, routine, 'WHILE'))
  } else {
    whileStatement.statements.push(statement(firstInnerLexeme, lexemes, routine))
  }

  // now we have everything we need to generate the pcode
  return whileStatement
}

/** start lexemes */
type Start = 'IF'|'ELSE'|'FOR'|'REPEAT'|'WHILE'

/** parses lexemes as a block of statements */
function block (lexemes: Lexemes, routine: Program|Subroutine, start: Start): Statement[] {
  const statements: Statement[] = []
  let end: boolean = false

  // expecting something
  if (!lexemes.get()) {
    throw new CompilerError(`No commands found after "${start}".`, lexemes.get(-1))
  }

  // loop through until the end of the block (or we run out of lexemes)
  while (!end && (lexemes.index < routine.end)) {
    const lexeme = lexemes.get() as Lexeme
    end = blockEndCheck(start, lexeme)
    if (end) {
      // move past the next lexeme, unless it's "else"
      if (lexeme.content !== 'ELSE') {
        lexemes.next()
      }
    } else {
      // compile the structure
      statements.push(statement(lexeme, lexemes, routine))
    }
  }

  // final checks
  if (!end) {
    throw new CompilerError(`Unterminated "${start}" statement.`, lexemes.get(-1))
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
