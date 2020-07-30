/*
 * Messages sent out by the state module (following changes of state), and signature for
 * the reply functions.
 */

/** signature for reply functions */
export type Reply = (data: any) => void

/** message type */
export type Message = typeof messages[number]

/** array of messages */
export const messages = [
  // system settings changed
  'languageChanged',
  'modeChanged',
  'editorFontFamilyChanged',
  'editorFontSizeChanged',
  'outputFontFamilyChanged',
  'outputFontSizeChanged',
  'includeCommentsInExamplesChanged',
  'loadCorrespondingExampleChanged',
  'assemblerChanged',
  'decimalChanged',
  'autoCompileOnLoadChanged',
  'autoRunOnLoadChanged',
  'autoFormatOnLoadChanged',
  'alwaysSaveSettingsChanged',
  // help page properties changed
  'commandsCategoryIndexChanged',
  'showSimpleCommandsChanged',
  'showIntermediateCommandsChanged',
  'showAdvancedCommandsChanged',
  // file memory changed
  'filesChanged',
  'currentFileIndexChanged',
  'filenameChanged',
  'codeChanged',
  'lexemesChanged',
  'commentsChanged',
  'routinesChanged',
  'usageChanged',
  'pcodeChanged',
  // machine runtime options changed
  'showCanvasOnRunChanged',
  'showOutputOnWriteChanged',
  'showMemoryOnDumpChanged',
  'drawCountMaxChanged',
  'codeCountMaxChanged',
  'smallSizeChanged',
  'stackSizeChanged',
  'traceOnRunChanged',
  'activateHCLRChanged',
  'preventStackCollisionChanged',
  'rangeCheckArraysChanged',
  // compiler options changed
  'canvasStartSizeChanged',
  'setupDefaultKeyBufferChanged',
  'turtleAttributesAsGlobalsChanged',
  'initialiseLocalsChanged',
  'allowCSTRChanged',
  'separateReturnStackChanged',
  'separateMemoryControlStackChanged',
  'separateSubroutineRegisterStackChanged',
  // other messages (not involving state change)
  'systemReady',
  'toggleMenu',
  'openMenu',
  'closeMenu',
  'selectTab',
  'memoryDumped',
  'selectAll',
  'error'
] as const
