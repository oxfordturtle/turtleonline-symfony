/**
 * Type definitions for tokens and their components.
 */
import { colours } from '../constants/colours'
import { inputs } from '../constants/inputs'
import { Language } from '../constants/languages'
import { PCode } from '../constants/pcodes'

/** token class definition */
export class Token {
  readonly type: TokenType
  readonly subtype: TokenSubtype|null
  readonly ok: boolean
  readonly content: string|null
  readonly value: string|number|null

  constructor (
    type: TokenType,
    subtype: TokenSubtype|null,
    ok: boolean,
    content: string|null,
    language: Language
  ) {
    this.type = type
    this.subtype = subtype
    this.ok = ok
    this.content = content
    this.value = null
    switch (this.type) {
      case 'comment':
        switch (language) {
          case 'BASIC':
            this.value = this.content.slice(3).trim()
            break
          case 'C': // fallthrough
          case 'TypeScript':
            this.value = this.content.slice(2).trim()
            break
          case 'Pascal':
            this.value = this.content.slice(1, -1).trim()
            break
          case 'Python':
            this.value = this.content.slice(1).trim()
            break
        }
        break

      case 'operator':
        switch (this.content.toLowerCase()) {
          case '+':
            this.value = PCode.plus
            break
          case '-':
            this.value = PCode.subt
            break
          case '*':
            this.value = PCode.mult
            break
          case '/':
            this.value = PCode.divr
            break
          case 'div': // fallthrough
          case '//':
            this.value = PCode.div
            break
          case 'mod': // fallthrough
          case '%':
            this.value = PCode.mod
            break
          case '=':
            switch (language) {
              case 'BASIC':
                this.value = PCode.eqal // could also be the assignment operator; the coder will decide later
                break
              case 'Pascal':
                this.value = PCode.eqal
                break
              case 'C': // fallthrough
              case 'Python': // fallthrough
              case 'TypeScript':
                this.value = null // this is the assignment operator in these languages
            }
            break
          case '==':
            this.value = PCode.eqal
            break
          case '<>': // fallthrough
          case '!=':
            this.value = PCode.noeq
            break
          case '<=':
            this.value = PCode.lseq
            break
          case '>=':
            this.value = PCode.mreq
            break
          case '<':
            this.value = PCode.less
            break
          case '>':
            this.value = PCode.more
            break
          case 'not': // fallthrough
          case '~':
            this.value = PCode.not
            break
          case 'and':
            this.value = (language === 'Python') ? PCode.andl : PCode.and
            break
          case '&':
            this.value = PCode.and
            break
          case 'or':
            this.value = (language === 'Python') ? PCode.orl : PCode.or
            break
          case '|':
            this.value = PCode.or
            break
          case 'xor': // fallthrough
          case 'eor': // fallthrough
          case '^':
            this.value = PCode.xor
            break
        }
        break

      case 'string':
        switch (language) {
          case 'BASIC':
            this.value = this.content.slice(1, -1).replace(/""/g, '"')
            break
          case 'Pascal':
            if (this.content[0] === '\'') {
              this.value = this.content.slice(1, -1).replace(/''/g, '\'')
            } else {
              this.value = this.content.slice(1, -1).replace(/""/g, '"')
            }
            if (this.value.length === 1) {
              this.type = 'character'
              this.value = this.value.charCodeAt(0)
            }
            break
          case 'C': // fallthrough
          case 'Python': // fallthrough
          case 'TypeScript':
            this.value = this.content.slice(1, -1).replace(/\\('|")/g, '$1')
            break
        }
        break

      case 'boolean':
        if (language === 'C' || language === 'Python') {
          this.value = (this.content.toLowerCase() === 'true') ? 1 : 0
        } else {
          this.value = (this.content.toLowerCase() === 'true') ? -1 : 0
        }
        break

      case 'integer':
        switch (this.subtype) {
          case 'binary':
            this.value = (language === 'Python')
              ? parseInt(this.content.slice(2), 2)
              : parseInt(this.content.slice(1), 2)
            break
          case 'octal':
            this.value = (language === 'Python')
              ? parseInt(this.content.slice(2), 8)
              : parseInt(this.content.slice(1), 8)
            break
          case 'decimal':
            this.value = parseInt(this.content)
            break
          case 'hexadecimal':
            this.value = (language === 'Python')
              ? parseInt(this.content.slice(2), 16)
              : parseInt(this.content.slice(1), 16)
            break
        }
        break

      case 'keycode': // fallthrough
      case 'query':
        const input = (language === 'Pascal')
          ? inputs.find(x => x.names[language] === this.content.toLowerCase())
          : inputs.find(x => x.names[language] === this.content)
        this.value = input ? input.value : null
        break

      case 'identifier':
        switch (this.subtype) {
          case 'turtle':
            this.value = ['x', 'y', 'd', 'a', 't', 'c'].indexOf(this.content[4].toLowerCase()) + 1
            break
          case 'colour':
            this.value = colours.find(x => x.names[language] === this.content).value
            break
        }
        break
    }
  }
}

/** token types */
export type TokenType =
  | 'newline'
  | 'spaces'
  | 'indent'
  | 'dedent'
  | 'comment'
  | 'keyword'
  | 'operator'
  | 'delimiter'
  | 'string'
  | 'character'
  | 'boolean'
  | 'integer'
  | 'keycode'
  | 'query'
  | 'identifier'
  | 'illegal'

/** token sub types */
export type TokenSubtype =
  | 'single'
  | 'double'
  | 'binary'
  | 'octal'
  | 'hexadecimal'
  | 'decimal'
  | 'turtle'
  | 'command'
  | 'colour'
  | 'custom'
  | 'variable'
