/*
 * definition of a token
 */
export type Token = {
  type: TokenType,
  content: string
}

export type TokenType = 'linebreak'
                      | 'spaces'
                      | 'comment'
                      | 'unterminated-comment'
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
                      | 'bad-decimal'
                      | 'keyword'
                      | 'type'
                      | 'command'
                      | 'custom'
                      | 'turtle'
                      | 'colour'
                      | 'keycode'
                      | 'query'
                      | 'identifier'
                      | 'subroutine'
                      | 'variable'
                      | 'illegal'
