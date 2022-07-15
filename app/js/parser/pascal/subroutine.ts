import identifier from './identifier'
import type from './type'
import { semicolon, statement } from './statement'
import { variables } from './variable'
import type Lexemes from '../definitions/lexemes'
import Program from '../definitions/program'
import { Subroutine } from '../definitions/subroutine'
import Variable from '../definitions/variable'
import { CompilerError } from '../../tools/error'
import type { KeywordLexeme, Lexeme } from '../../lexer/lexeme'

/** parses lexemes as a subroutine definition */
export default function subroutine (lexeme: KeywordLexeme, lexemes: Lexemes, parent: Program|Subroutine): Subroutine {
  // save whether it should be a function or a procedure
  const isFunction = lexeme.subtype === 'function'

  // expecting identifier
  const name = identifier(lexemes, parent)

  // create the subroutine
  const sub = new Subroutine(lexeme, parent, name)
  sub.index = subroutineIndex(sub)

  // optionally expecting parameters
  if (lexemes.get()?.content === '(') {
    lexemes.next()
    sub.variables.push(...parameters(lexemes, sub))
  }

  // for functions, expecting return type
  if (isFunction) {
    const [returnType, stringLength, arrayDimensions] = type(lexemes, sub, false)
    if (arrayDimensions.length > 0) {
      throw new CompilerError('Functions cannot return arrays.', lexemes.get(-1))
    }
    const foo = new Variable('result', sub)
    foo.type = returnType
    foo.stringLength = stringLength
    sub.variables.unshift(foo)
  }

  // semicolon check
  semicolon(lexemes, true, `${sub.type} definition`)

  // expecting variable declarations, subroutine definitions, or subroutine body
  let begun = false
  while (lexemes.get() && lexemes.get()?.content?.toLowerCase() !== 'end') {
    const lexeme = lexemes.get() as Lexeme
    switch (lexeme.type) {
      case 'keyword':
        switch (lexeme.subtype) {
          // variable declarations
          case 'var':
            lexemes.next()
            sub.variables.push(...variables(lexemes, sub))
            break

          // procedure/function definition
          case 'procedure': // fallthrough
          case 'function':
            lexemes.next()
            sub.subroutines.push(subroutine(lexeme, lexemes, sub))
            break

          // start of subroutine statements
          case 'begin':
            begun = true
            lexemes.next()
            while (lexemes.get() && lexemes.get()?.content?.toLowerCase() !== 'end') {
              const lexeme = lexemes.get() as Lexeme
              sub.statements.push(statement(lexeme, lexemes, sub))
            }
            break

          // any other keyword is an error
          default:
            if (!begun) {
              throw new CompilerError(`Keyword "begin" missing for ${sub.type} ${sub.name}.`, lexemes.get())
            }
            throw new CompilerError('{lex} makes no sense here.', lexemes.get())
        }
        break

        // anything else is an error
        default:
          if (!begun) {
            throw new CompilerError(`Keyword "begin" missing for ${sub.type} ${sub.name}.`, lexemes.get())
          }
          throw new CompilerError('{lex} makes no sense here.', lexemes.get())
    }
  }

  // final error checking
  if (!begun) {
    throw new CompilerError(`Keyword "begin" missing for ${sub.type} ${sub.name}.`, lexemes.get(-1))
  }
  if (!lexemes.get()) {
    throw new CompilerError(`Keyword "end" missing for ${sub.type} ${sub.name}.`, lexemes.get(-1))
  }
  lexemes.next()
  semicolon(lexemes, true, `${sub.type} end`)

  // return the subroutine
  return sub
}

/** calculates the index of a subroutine (before it and its parents have been added to the program) */
function subroutineIndex (subroutine: Subroutine): number {
  return (subroutine.parent instanceof Program)
    ? subroutine.parent.allSubroutines.length + 1
    : subroutineIndex(subroutine.parent) + subroutine.allSubroutines.length + 1
}

/** parses lexemes as subroutine parameters */
function parameters (lexemes: Lexemes, subroutine: Subroutine): Variable[] {
  const parameters: Variable[] = []

  // scoop up parameters
  while (lexemes.get() && lexemes.get()?.content !== ')') {
    subroutine.variables.push(...parameterSet(lexemes, subroutine))
    // move past semicolon
    if (lexemes.get() && lexemes.get()?.content === ';')  {
      lexemes.next()
      // throw error for trailing semicolons
      if (lexemes.get()?.content === ')') {
        throw new CompilerError('Trailing semicolon at end of parameter list.', lexemes.get())
      }
    } else if (lexemes.get()?.type === 'identifier') {
      throw new CompilerError('Semicolon missing between parameters.', lexemes.get())
    }
  }

  // check for closing bracket
  if (lexemes.get()?.content !== ')') {
    throw new CompilerError(`Closing bracket missing after ${subroutine.type} parameters.`, lexemes.get(-1))
  }
  lexemes.next()

  // return the parameters
  return parameters
}

/** parses lexemes as a set of parameter declarations */
function parameterSet (lexemes: Lexemes, subroutine: Subroutine): Variable[] {
  const parameters: Variable[] = []

  // "var" is permissable here (for reference parameters)
  let isReferenceParameter = false
  if (lexemes.get()?.content === 'var') {
    isReferenceParameter = true
    lexemes.next()
  }

  // expecting comma separated list of identifiers
  while (lexemes.get() && lexemes.get()?.content !== ':') {
    const name = identifier(lexemes, subroutine)
    parameters.push(new Variable(name, subroutine))
    if (lexemes.get()?.content === ',') {
      lexemes.next()
    } else if (lexemes.get()?.type === 'identifier') {
      throw new CompilerError('Comma missing between parameter names.', lexemes.get())
    }
  }

  // expecting type specification
  const [parameterType, stringLength, arrayDimensions] = type(lexemes, subroutine, true)
  for (const foo of parameters) {
    foo.type = parameterType
    foo.stringLength = stringLength
    foo.arrayDimensions = arrayDimensions
    foo.isParameter = true
    foo.isReferenceParameter = isReferenceParameter
  }

  // return the parameters
  return parameters
}
