/*
 * the compiler module
 *
 * the compiler works in three stages: (1) the lexer gets lexemes from the code; (2) the parser gets
 * an array of routines from the lexemes (with details of variables etc.); (3) the coder generates the
 * actual pcode from the array of routines
 *
 * the compiler also generates command and structure usage data from the lexemes and subroutines
 */
import analyser from './analyser/index'
import lexer from './lexer/index'
import parser from './parser/index'
import coder from './coder/index'

export default function (code, language) {
  // get lexemes from the code
  const lexemes = lexer(code, language)

  // get routines from the lexemes
  const routines = parser(lexemes, language)

  // get pcode from the routines
  const pcode = coder(routines, language)

  // get usage data from the lexemes and subroutines
  const usage = analyser(lexemes, routines.slice(1), language)

  // return usage and pcode
  return { lexemes, routines, pcode, usage }
}