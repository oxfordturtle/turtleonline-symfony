import type { Language } from '../../constants/languages'

/** constant */
export type Constant = IntegerConstant|StringConstant

/** integer constant */
export class IntegerConstant {
  readonly type = 'boolint'
  readonly name: string
  readonly language: Language
  value: number

  constructor (language: Language, name: string, value: number) {
    this.name = (language === 'Pascal') ? name.toLowerCase() : name
    this.language = language
    this.value = value
  }
}

/** string constant */
export class StringConstant {
  readonly type = 'string'
  readonly name: string
  readonly language: Language
  value: string

  constructor (language: Language, name: string, value: string) {
    this.name = (language === 'Pascal') ? name.toLowerCase() : name
    this.language = language
    this.value = value
  }
}
