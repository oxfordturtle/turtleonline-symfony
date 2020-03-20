/*
 * code highlighter
 */
import tokenizer from './tokenizer/index.ts'

export default function (code, language) {
  return tokenizer(code, language)
    .map(token => `<span class="tse-${token.type}">${token.content}</span>`)
    .join('')
}
