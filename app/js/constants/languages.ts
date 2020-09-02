/*
 * Turtle languages.
 */
export type Language = typeof languages[number]

export const languages = [
  'BASIC',
  'C',
  'Pascal',
  'Python',
  'TypeScript'
] as const

export const extensions = {
  'BASIC': 'tbas',
  'C': 'tc',
  'Pascal': 'tpas',
  'Python': 'tpy',
  'TypeScript': 'tts'
}
