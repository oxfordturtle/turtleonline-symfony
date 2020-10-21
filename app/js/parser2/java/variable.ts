import { Program } from '../definitions/program'
import { Subroutine } from '../definitions/subroutine'
import { Variable } from '../definitions/variable'
import { Type } from '../definitions/type'
import { VariableAssignment } from '../definitions/statement'
import { Lex } from '../lex'

/** parses lexemes as a variable declaration */
export function variable (lex: Lex, routine: Program|Subroutine, name: string, type: Type|null, arrayDimensions: number): Variable {
  return new Variable(name, routine)
}

/** parses lexemes as a variable declaration or assignment */
export function varStatement (lex: Lex, variable: Variable): VariableAssignment|null {
  return null
}
