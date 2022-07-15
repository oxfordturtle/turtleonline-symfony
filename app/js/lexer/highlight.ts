// type imports
import type { Language } from '../constants/languages'
import type { Token } from './token'

// submodule imports
import tokenize from './tokenize'

// other module imports
import { colours } from '../constants/colours'

/** returns highlighted code */
export default function highlight (code: string|Token[], language: Language): string {
  const tokens = (typeof code === 'string') ? tokenize(code, language) : code
  return tokens.map((token) => {
    switch (token.type) {
      case 'spaces':
      case 'newline':
        return token.content

      case 'unterminated-comment':
      case 'unterminated-string':
      case 'bad-binary':
      case 'bad-octal':
      case 'bad-hexadecimal':
      case 'real':
      case 'bad-inputcode':
      case 'bad-querycode':
      case 'illegal':
        return `<span class="error">${token.content}</span>`

      case 'binary':
      case 'octal':
      case 'hexadecimal':
      case 'decimal':
        return `<span class="integer">${token.content}</span>`

      case 'colour': {
        const colour = colours.find(x => x.names[language] === token.content)
        return colour
          ? `<span class="colour" style="border-color:#${colour.hex};">${token.content}</span>`
          : `<span class="colour">${token.content}</span>`
      }

      default:
        return `<span class="${token.type}">${token.content}</span>`
    }
  }).join('')
}
