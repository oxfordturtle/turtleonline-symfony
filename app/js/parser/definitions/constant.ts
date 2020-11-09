import type { Language } from '../../constants/languages'

/** constant */
export type Constant = IntegerConstant|StringConstant

/** integer constant */
export class IntegerConstant {
  readonly type = 'boolint'
  readonly name: string
  value: number

  constructor (language: Language, name: string, value: number) {
    this.name = (language === 'Pascal') ? name.toLowerCase() : name
    this.value = value
  }
}

/** string constant */
export class StringConstant {
  readonly type = 'string'
  readonly name: string
  value: string

  constructor (language: Language, name: string, value: string) {
    this.name = (language === 'Pascal') ? name.toLowerCase() : name
    this.value = value
  }
}
