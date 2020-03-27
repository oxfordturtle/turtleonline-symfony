/*
 * Turtle languages.
 */
export type Language = 'BASIC' | 'Pascal' | 'Python'

export const languages: Language[] = ['BASIC', 'Pascal', 'Python']

export const extensions = {
  'BASIC': 'tbas',
  'Pascal': 'tpas',
  'Python': 'tpy'
}

export const skeletons = {
  'BASIC': 'REM progname\n\nvar1% = 100\nCOLOUR(GREEN)\nBLOT(var1%)\nEND',
  'Pascal': 'PROGRAM progname;\nVAR var1: integer;\nBEGIN\n  var1 := 100;\n  colour(green);\n  blot(var1)\nEND.',
  'Python': '# progname\n\nvar1: int = 100\ncolour(green)\nblot(var1)'
}

export type Names = {
  readonly 'BASIC': string,
  readonly 'Pascal': string,
  readonly 'Python': string
}
