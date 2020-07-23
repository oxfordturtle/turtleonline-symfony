/*
 * tokenizer; program code (a string) goes in, an array of tokens comes out; these are used both
 * for syntax highlighting, and as a basis for the lexical analysis part of the compilation
 */
import BASIC from './basic'
import Pascal from './pascal'
import Python from './python'
import { Token } from './token'
import { Language } from '../../definitions/languages'

export default function (code: string, language: Language): Token[] {
  const tokenizers = { BASIC, Pascal, Python }
  return tokenizers[language](code)
}
