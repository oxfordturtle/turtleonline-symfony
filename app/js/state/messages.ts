/*
 * Messages sent out by the state module (following changes of state), and signature for
 * the reply functions.
 */
export type Message = typeof messages[number]

export const messages = [
  // temporary properties changed
  'menuOpenChanged',
  'fullscreenChanged',
  // system settings changed
  'languageChanged',
  'modeChanged',
  'loadCorrespondingExampleChanged',
  'assemblerChanged',
  'decimalChanged',
  // help page properties changed
  'commandsCategoryIndexChanged',
  'showSimpleCommandsChanged',
  'showIntermediateCommandsChanged',
  'showAdvancedCommandsChanged',
  // file memory changed
  'filesChanged',
  'currentFileIndexChanged',
  'fileChanged',
  'nameChanged',
  'codeChanged',
  'lexemesChanged',
  'routinesChanged',
  'usageChanged',
  'pcodeChanged',
  // machine runtime options changed
  'showCanvasChanged',
  'showOutputChanged',
  'showMemoryChanged',
  'drawCountMaxChanged',
  'codeCountMaxChanged',
  'smallSizeChanged',
  'stackSizeChanged',
  // compiler options changed
  // TODO ...
  // other messages (not involving state change)
  'dumpMemory',
  'error',
  'showComponent'
] as const

// signature for reply functions
export type Reply = (data: any) => void
