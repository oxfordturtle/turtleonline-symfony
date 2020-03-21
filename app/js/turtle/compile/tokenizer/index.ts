/*
 * tokenizer; program code (a string) goes in, an array of tokens comes out; these are used both
 * for syntax highlighting, and as a basis for the lexical analysis part of the compilation
 */
import BASIC from './basic.ts'
import Pascal from './pascal.ts'
import Python from './python.ts'

export default function (code: string, language: string) {
  const tokenizers = { BASIC, Pascal, Python }
  return tokenizers[language](code)
}
