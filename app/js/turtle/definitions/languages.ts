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

export type Names = {
  readonly 'BASIC': string,
  readonly 'Pascal': string,
  readonly 'Python': string
}
