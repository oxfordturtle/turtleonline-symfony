/*
 * Turtle languages.
 */
export type Language = typeof languages[number]

export const languages = [
  'BASIC',
  'C',
  'Java',
  'Pascal',
  'Python',
  'TypeScript'
] as const

export const extensions = {
  'BASIC': 'tbas',
  'C': 'tc',
  'Java': 'tjav',
  'Pascal': 'tpas',
  'Python': 'tpy',
  'TypeScript': 'tts'
}
