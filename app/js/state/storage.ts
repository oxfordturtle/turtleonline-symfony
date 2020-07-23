/**
 * This module facilitates saving/loading the state of the application to
 * session storage.
 */

// session property type
export type Property = typeof properties[number]

// session properties
export const properties = [
  // system settings
  'language',
  'mode',
  'loadCorrespondingExample',
  'assembler',
  'decimal',
  // help page properties
  'commandsCategoryIndex',
  'showSimpleCommands',
  'showIntermediateCommands',
  'showAdvancedCommands',
  // file memory
  'files',
  'currentFileIndex',
  'lexemes',
  'usage',
  'routines',
  'pcode',
  // machine runtime options
  'showCanvas',
  'showOutput',
  'showMemory',
  'drawCountMax',
  'codeCountMax',
  'smallSize',
  'stackSize'
  // compiler options
  // TODO ...
] as const

// load a property from local/session storage
export function load (property: Property, defaultValue: any): any {
  return (sessionStorage.getItem(property) === null)
    ? defaultValue
    : JSON.parse(sessionStorage.getItem(property))
}

// save a property to local/session storage
export function save (property: Property, value: any): void {
  sessionStorage.setItem(property, JSON.stringify(value))
}
