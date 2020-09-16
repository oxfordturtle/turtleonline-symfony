/**
 * Definition of a program constant.
 */
import { Type } from './type'
import { Language } from '../constants/languages'

/** constant definition */
export class Constant {
  readonly name: string
  readonly type: Type
  readonly value: string|number

  constructor (language: Language, name: string, type: Type, value: string|number) {
    this.name = (language === 'Pascal') ? name.toLowerCase() : name
    this.type = type
    this.value = value
  }
}

