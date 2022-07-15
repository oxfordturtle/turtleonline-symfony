import type { Expression } from '../parser/definitions/expression'
import type { Language } from '../constants/languages'
import type from './type'
import { Command } from '../constants/commands'

/** formats an expression as a code string */
export default function expression (exp: Expression, language: Language): string {
  switch (exp.expressionType) {
    case 'colour':
    case 'constant':
    case 'input':
    case 'integer':
    case 'string':
      return exp.lexeme.content
    
    case 'address':
      return `&${exp.variable.name}`

    case 'cast':
      if (language === 'C' || language === 'Java') {
        return `(${type(exp.type, language)}) ${expression(exp.expression, language)}`
      }
      return expression(exp.expression, language)

    case 'compound':
      if (exp.left) {
        return `(${expression(exp.left, language)} ${exp.lexeme.content} ${expression(exp.right, language)})`
      }
      if (exp.lexeme.content.toLowerCase() === 'not') {
        return `${exp.lexeme.content} ${expression(exp.right, language)}`
      }
      return `${exp.lexeme.content}${expression(exp.right, language)}`

    case 'function': {
      const name = (exp.command instanceof Command)
        ? exp.command.names[language] as string
        : exp.command.name
      if ((language === 'BASIC' || language === 'Pascal') && exp.arguments.length === 0) {
        return name
      }
      return `${name}(${exp.arguments.map(x => expression(x, language)).join(', ')})`
    }
  
    case 'variable':
      if (exp.indexes.length > 0) {
        switch (language) {
          case 'BASIC':
            return `${exp.lexeme.content}(${exp.indexes.map(x => expression(x, language)).join(', ')})`
          case 'Pascal':
            return `${exp.lexeme.content}[${exp.indexes.map(x => expression(x, language)).join(', ')}]`
          default:
            return `${exp.lexeme.content}[${exp.indexes.map(x => expression(x, language)).join('][')}]`
          }
      }
      return exp.lexeme.content
  }
}
