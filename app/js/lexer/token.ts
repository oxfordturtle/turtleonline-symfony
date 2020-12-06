/** token class definition */
export class Token {
  readonly type: TokenType
  readonly content: string
  readonly line: number
  readonly character: number

  constructor (type: TokenType, content: string, line: number, character: number) {
    this.type = type
    this.content = content
    this.line = line
    this.character = character
  }
}

/** token types */
export type TokenType =
  | 'spaces'
  | 'newline'
  | 'comment'
  | 'unterminated-comment'
  | 'keyword'
  | 'type'
  | 'operator'
  | 'delimiter'
  | 'string'
  | 'unterminated-string'
  | 'boolean'
  | 'binary'
  | 'bad-binary'
  | 'octal'
  | 'bad-octal'
  | 'hexadecimal'
  | 'bad-hexadecimal'
  | 'decimal'
  | 'real'
  | 'keycode'
  | 'bad-keycode'
  | 'query'
  | 'bad-query'
  | 'turtle'
  | 'command'
  | 'colour'
  | 'identifier'
  | 'illegal'
