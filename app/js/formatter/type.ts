import { Language } from '../constants/languages';
import { Type } from '../lexer/lexeme'

/** formats a type as a code string */
export default function type (type: Type|null, language: Language): string {
  switch (type) {
    case 'boolint':
    case 'boolean':
      if (language === 'C' || language === 'Python') return 'bool'
      return 'boolean'
    case 'integer':
      if (language === 'Pascal') return 'integer'
      if (language === 'TypeScript') return 'number'
      return 'int'
    case 'character':
      return 'char'
    case 'string':
      if (language === 'Java') return 'String'
      if (language === 'Python') return 'str'
      return 'string'
    case null:
      return 'void'
  }
}
