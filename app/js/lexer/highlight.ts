/**
 * Syntax highlighting function.
 */
import tokenize from './tokenize'
import { Language } from '../constants/languages'
import hex from '../tools/hex'

/** returns highlighted code */
export default function highlight (code: string, language: Language): string {
  const tokens = tokenize(code, language)
  return tokens.map((token) => {
    switch (token.type) {
      case 'newline': // fallthrough
      case 'spaces': // fallthrough
      case 'delimiter':
        return token.content

      case 'comment': // fallthrough
      case 'operator': // fallthrough
      case 'keyword': // fallthrough
      case 'character': // fallthrough
      case 'string': // fallthrough
      case 'boolean': // fallthrough
      case 'integer': // fallthrough
      case 'keycode': // fallthrough
      case 'query': // fallthrough
      case 'illegal':
        return `<span class="${token.type}${token.ok ? '' : ' error'}">${token.content}</span>`

      case 'identifier':
        switch (token.subtype) {
          case 'colour':
            return `<span class="colour" style="border-color:${hex(token.value as number)};">${token.content}</span>`

          default:
            return `<span class="${token.subtype}">${token.content}</span>`
        }
    }
  }).join('')
}
