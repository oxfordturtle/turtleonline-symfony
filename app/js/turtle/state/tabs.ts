export const tabs = [
  ['canvas', 'Canvas &amp; Console'],
  ['output', 'Output'],
  ['usage', 'Usage of Commands'],
  ['comments', 'Comments'],
  ['syntax', 'Syntax Tables'],
  ['vars', 'Variables &amp; Subroutines'],
  ['pcode', 'PCode'],
  ['memory', 'Memory']
] as const

export type Tab = typeof tabs[number][0]
