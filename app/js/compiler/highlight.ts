/*
 * code highlighter
 */
import tokenizer from './tokenizer/index'
import { Language } from '../state/languages'

export default function (code: string, language: Language): string {
  return tokenizer(code, language)
    .map(token => `<span class="${token.type}">${token.content}</span>`)
    .join('')
}
