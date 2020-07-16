/**
 * Tabs for the right hand side of the system.
 */
export type Tab = typeof tabs[number][0]

export const tabs = [
  ['canvas', 'Canvas &amp; Console'],
  ['output', 'Output'],
  ['usage', 'Usage of Commands'],
  ['comments', 'Comments'],
  ['syntax', 'Syntax Tables'],
  ['variables', 'Variables &amp; Subroutines'],
  ['pcode', 'PCode'],
  ['memory', 'Memory']
] as const
