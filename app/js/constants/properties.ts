/**
 * State properties and their default values.
 */

/** property type */
export type Property = typeof properties[number]

/** array of property names */
export const properties = [
  // whether user's saved settings have been loaded in this session
  'savedSettingsHaveBeenLoaded',
  // system settings
  'language',
  'mode',
  'editorFontFamily',
  'editorFontSize',
  'outputFontFamily',
  'outputFontSize',
  'includeCommentsInExamples',
  'loadCorrespondingExample',
  'assembler',
  'decimal',
  'autoCompileOnLoad',
  'autoRunOnLoad',
  'autoFormatOnLoad',
  'alwaysSaveSettings',
  // help page properties
  'commandsCategoryIndex',
  'showSimpleCommands',
  'showIntermediateCommands',
  'showAdvancedCommands',
  // file memory
  'files',
  'currentFileIndex',
  'filename',
  'lexemes',
  'usage',
  'routines',
  'pcode',
  // machine runtime options
  'showCanvasOnRun',
  'showOutputOnWrite',
  'showMemoryOnDump',
  'drawCountMax',
  'codeCountMax',
  'smallSize',
  'stackSize',
  'traceOnRun',
  'activateHCLR',
  'preventStackCollision',
  'rangeCheckArrays',
  // compiler options
  'canvasStartSize',
  'setupDefaultKeyBuffer',
  'turtleAttributesAsGlobals',
  'initialiseLocals',
  'allowCSTR',
  'separateReturnStack',
  'separateMemoryControlStack',
  'separateSubroutineRegisterStack'
] as const

/** default values */
export const defaults: Record<Property, any> = {
  // whether user's saved settings have been loaded in this session
  'savedSettingsHaveBeenLoaded': false,
  // system settings
  'language': 'Python',
  'mode': 'normal',
  'editorFontFamily': 'Courier',
  'editorFontSize': 13,
  'outputFontFamily': 'Courier',
  'outputFontSize': 13,
  'includeCommentsInExamples': true,
  'loadCorrespondingExample': true,
  'assembler': true,
  'decimal': true,
  'autoCompileOnLoad': false,
  'autoRunOnLoad': false,
  'autoFormatOnLoad': false,
  'alwaysSaveSettings': false,
  // help page properties
  'commandsCategoryIndex': 0,
  'showSimpleCommands': true,
  'showIntermediateCommands': false,
  'showAdvancedCommands': false,
  // file memory
  'files': [],
  'currentFileIndex': 0,
  'filename': '',
  'lexemes': [],
  'usage': [],
  'routines': [],
  'pcode': [],
  // machine runtime options
  'showCanvasOnRun': true,
  'showOutputOnWrite': false,
  'showMemoryOnDump': true,
  'drawCountMax': 4,
  'codeCountMax': 100000,
  'smallSize': 60,
  'stackSize': 50000,
  'traceOnRun': false,
  'activateHCLR': true,
  'preventStackCollision': true,
  'rangeCheckArrays': true,
  // compiler options
  'canvasStartSize': 1000,
  'setupDefaultKeyBuffer': true,
  'turtleAttributesAsGlobals': true,
  'initialiseLocals': true,
  'allowCSTR': true,
  'separateReturnStack': true,
  'separateMemoryControlStack': true,
  'separateSubroutineRegisterStack': true
} as const
