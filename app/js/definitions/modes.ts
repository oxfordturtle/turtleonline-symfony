/*
 * System view modes.
 */
export type Mode = typeof modes[number]

export const modes = [
  'simple',
  'normal',
  'expert',
  'machine'
] as const
