/*
 * file class
 */
import { Language, extensions, skeletons } from './languages.ts'

export class File {
  language: Language
  example: string|null
  name: string
  code: string
  compiled: boolean
  edited: boolean

  constructor (language: Language, skeleton: boolean = false) {
    this.language = language
    this.example = null
    this.name = ''
    this.code = skeleton ? skeletons[language] : ''
    this.compiled = false
    this.edited = false
  }

  get filename (): string {
    return `${(this.name || 'filename')}.${extensions[this.language]}`
  }
}
