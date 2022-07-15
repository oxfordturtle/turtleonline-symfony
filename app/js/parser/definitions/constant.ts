import type { Language } from '../../constants/languages'
import type { Type } from '../../lexer/lexeme'

/** constant */
export class Constant {
  readonly name: string
  readonly language: Language
  value: number | string

  constructor (language: Language, name: string, value: number | string) {
    this.name = (language === 'Pascal') ? name.toLowerCase() : name
    this.language = language
    this.value = value
  }

  get type (): Type {
    return typeof this.value === 'number'
      ? 'boolint'
      : 'string'
  }
}
