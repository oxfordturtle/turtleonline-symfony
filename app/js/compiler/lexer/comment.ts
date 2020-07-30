import { Token } from '../tokenizer/token'

export default class Comment {
  readonly line: number
  readonly index: number
  readonly content: string

  constructor (token: Token, line: number, index: number) {
    this.line = line
    this.index = index
    this.content = token.content
  }
}
