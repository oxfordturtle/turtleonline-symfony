import { simpleStatement, variableAssignment, expression, typeCheck } from './common'
import { CompoundExpression, VariableValue, LiteralValue } from '../expression'
import { Program, Routine } from '../routine'
import { Statement, IfStatement, ForStatement, RepeatStatement, WhileStatement, VariableAssignment } from '../statement'
import { Lexeme } from '../../lexer/lexeme'
import { PCode } from '../../constants/pcodes'
import { CompilerError } from '../../tools/error'

export default function C (program: Program): void {}
