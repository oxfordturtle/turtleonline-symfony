import { Token } from '../tokenizer/token'
import { Language } from '../../state/languages'

export default class Comment {
  readonly line: number
  readonly index: number
  readonly content: string

  constructor (token: Token, line: number, index: number, language: Language) {
    this.line = line
    this.index = index
    switch (language) {
      case 'BASIC':
        this.content = token.content.slice(3).trim()
        break

      case 'Pascal':
        this.content = token.content.slice(1, -1).trim()
        break

      case 'Python':
        this.content = token.content.slice(1).trim()
        break
    }
  }
}
