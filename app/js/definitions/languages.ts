/*
 * Turtle languages.
 */
export type Language = typeof languages[number]

export const languages = [
  'BASIC',
  'Pascal',
  'Python'
] as const

export const extensions = {
  'BASIC': 'tbas',
  'Pascal': 'tpas',
  'Python': 'tpy'
} as const

export const skeletons = {
  'BASIC': 'var1% = 100\nCOLOUR(GREEN)\nBLOT(var1%)\nEND',
  'Pascal': 'PROGRAM progname;\nVAR var1: integer;\nBEGIN\n  var1 := 100;\n  colour(green);\n  blot(var1)\nEND.',
  'Python': 'var1: int = 100\ncolour(green)\nblot(var1)'
} as const

export type Names = {
  readonly 'BASIC': string,
  readonly 'Pascal': string,
  readonly 'Python': string
}
