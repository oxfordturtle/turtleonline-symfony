/*
 * usage data generator - arrays of lexemes and subroutines go in, usage data comes out
 */
import expressions from '../../constants/expressions.js'

// the analyser function
export default function (lexemes, subroutines, language) {
  return expressions.concat({ title: 'Subroutine calls', expressions: subroutines })
    .map(usageCategory.bind(null, language, lexemes))
    .filter(category => category.expressions.length > 0)
}

// check if an expression is used in the program
function isUsed (language, lexemes, expression) {
  const name = expression.name || expression.names[language]
  const uses = lexemes.filter(lexeme => lexeme.content === name)
  return uses.length > 0
}

// reduce arrays of used expressions to a list of lines where they're used
function linesList (sofar, lexeme) {
  return ` ${lexeme.line.toString(10)}`
}

// generate usage expression object
function usageExpression (language, lexemes, expression) {
  const name = expression.name || expression.names[language]
  const uses = lexemes.filter(lexeme => lexeme.content === name)
  return {
    name,
    level: expression.level + 1,
    count: uses.length,
    lines: uses.reduce(linesList, '').trim()
  }
}

// reduce array of expressions to count total
function countTotal (sofar, expression) {
  return sofar + expression.count
}

// generate usage category object
function usageCategory (language, lexemes, category) {
  const filtered = category.expressions.filter(isUsed.bind(null, language, lexemes))
  const mapped = filtered.map(usageExpression.bind(null, language, lexemes))
  return {
    title: category.title,
    expressions: mapped,
    total: mapped.reduce(countTotal, 0)
  }
}
