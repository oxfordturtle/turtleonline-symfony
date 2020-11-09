/*
 * usage data generator - arrays of lexemes and subroutines go in, usage data comes out
 */
import type { UsageCategory, UsageExpression } from './usage'
import { Command } from '../constants/commands'
import type { Keyword } from '../constants/keywords'
import { Category, Expression, commandCategories, keywordCategories } from '../constants/categories'
import type { Language } from '../constants/languages'
import type { Lexeme } from '../lexer/lexeme'
import type Program from '../parser/definitions/program'
import type { Subroutine } from '../parser/definitions/subroutine'

/** analyses program lexemes to produce usage data */
export default function (lexemes: Lexeme[], program: Program): UsageCategory[] {
  const categories = commandCategories
    .concat(keywordCategories[program.language])
  const usageCategories = categories.map(usageCategory.bind(null, program.language, lexemes)) as UsageCategory[]
  const subroutineCategory = new Category(30, 'Subroutine calls', program.allSubroutines.slice(1))
  //const subLexemes = program.allSubroutines.map(x => x.lexemes).flat()
  //subLexemes.unshift(...program.lexemes)
  //const subroutineUsageCategory = usageCategory(program.language, subLexemes, subroutineCategory)
  // TODO: don't count subroutine definitions as subroutine calls
  const subroutineUsageCategory = usageCategory(program.language, lexemes, subroutineCategory)
  return usageCategories.concat(subroutineUsageCategory).filter(category => category.expressions.length > 0)
}

/** generates usage data */
function usageCategory (language: Language, lexemes: Lexeme[], category: Category): UsageCategory {
  const filtered = category.expressions.filter(isUsed.bind(null, language, lexemes))
  const mapped = filtered.map(usageExpression.bind(null, language, lexemes)) as UsageExpression[]
  mapped.sort((a, b) => {
    return (a.level === b.level) ? a.name.localeCompare(b.name) : a.level - b.level
  })
  return {
    category: category.title,
    expressions: mapped,
    total: mapped.reduce((x, y) => x + y.count, 0)
  }
}

// check if an expression is used in the program
function isUsed (language: Language, lexemes: Lexeme[], expression: Expression) {
  const name = (expression instanceof Command)
    ? (expression as Command).names[language]
    : (expression as Keyword|Subroutine).name
  if (!name) {
    return false
  }
  const uses = (language === 'Pascal')
    ? lexemes.filter(lexeme => lexeme.content && lexeme.content.toLowerCase() === name.toLowerCase())
    : lexemes.filter(lexeme => lexeme.content === name)
  return uses.length > 0
}

// generate usage expression object
function usageExpression (language: Language, lexemes: Lexeme[], expression: Expression): UsageExpression {
  const name = (expression instanceof Command)
    ? (expression as Command).names[language] as string
    : (expression as Keyword|Subroutine).name
  const uses = (language === 'Pascal')
    ? lexemes.filter(lexeme => lexeme.content && lexeme.content.toLowerCase() === name.toLowerCase())
    : lexemes.filter(lexeme => lexeme.content === name)
  uses.sort((a, b) => a.line - b.line)
  return {
    name: (language === 'Pascal') ? name.toLowerCase() : name,
    level: expression.level + 1,
    count: uses.length,
    lines: uses.reduce((x, y) => `${x} ${y.line.toString(10)}`, '').trim()
  }
}
