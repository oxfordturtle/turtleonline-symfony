/**
 * System menus.
 */
export type Menu = typeof menus[number]

export const menus = [
  'File',
  'Edit',
  'View',
  'Compile',
  'Tabs',
  'Run',
  'Options',
  'Examples'
] as const
