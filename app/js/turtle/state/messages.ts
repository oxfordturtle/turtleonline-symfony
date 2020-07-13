export const messages = [
  'menu-open-changed',
  'tab-changed',
  'fullscreen-changed',
  'machine-played',
  'machine-paused',
  'machine-unpaused',
  'machine-halted'
] as const

export type Message = typeof messages[number]

export type Reply = (data: any) => void
