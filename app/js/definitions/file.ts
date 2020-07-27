/*
 * file class
 */
import { Language, extensions } from './languages'

export class File {
  language: Language
  example: string|null
  name: string
  code: string
  backup: string
  compiled: boolean
  edited: boolean

  constructor (language: Language, example: string|null = null) {
    this.language = language
    this.example = example
    this.name = ''
    this.code = ''
    this.backup = ''
    this.compiled = false
    this.edited = false
  }

  get filename (): string {
    return `${(this.name || 'filename')}.${extensions[this.language]}`
  }
}
