/*
 * The system state is a load of variables, representing the current state of
 * the system (not including the virtual machine, which for clarity has its own
 * module). Getters and setters for these state variables are defined here, as
 * well as other more complex methods for changing the system state. This module
 * also initializes the variables and saves them to local storage, so that the
 * state is maintained between sessions.
 */
import { SystemError } from '../definitions/errors'
import { examples } from '../definitions/examples'
import { File } from '../definitions/file'
import { Language, languages, extensions, skeletons } from '../definitions/languages'
import { Mode } from '../definitions/modes'
import compile from '../compile/index'
import lexer from '../compile/lexer/index'
import * as machine from '../machine/index'
import { Message, Reply } from './messages'
import { load, save } from './storage'
import { input } from '../tools/elements'

// define the system state object
class State {
  // record of callbacks to execute on state change
  #replies: Partial<Record<Message, Reply[]>>
  // system settings
  #language: Language
  #mode: Mode
  #editorFontFamily: string
  #editorFontSize: number
  #outputFontFamily: string
  #outputFontSize: number
  #includeCommentsInExamples: boolean
  #loadCorrespondingExample: boolean
  #assembler: boolean
  #decimal: boolean
  #autoCompileOnLoad: boolean
  #autoRunOnLoad: boolean
  #autoFormatOnLoad: boolean
  // help page properties
  #commandsCategoryIndex: number
  #showSimpleCommands: boolean
  #showIntermediateCommands: boolean
  #showAdvancedCommands: boolean
  // file memory
  #files: File[]
  #currentFileIndex: number
  #lexemes: any[]
  #usage: any[]
  #routines: any[]
  #pcode: number[][]
  // machine runtime options
  #showCanvasOnRun: boolean
  #showOutputOnWrite: boolean
  #showMemoryOnDump: boolean
  #drawCountMax: number
  #codeCountMax: number
  #smallSize: number
  #stackSize: number
  #traceOnRun: boolean
  #activateHCLR: boolean
  #preventStackCollision: boolean
  #rangeCheckArrays: boolean
  // compiler options
  #canvasStartSize: number
  #setupDefaultKeyBuffer: boolean
  #turtleAttributesAsGlobals: boolean
  #initialiseLocals: boolean
  #allowCSTR: boolean
  #separateReturnStack: boolean
  #separateMemoryControlStack: boolean
  #separateSubroutineRegisterStack: boolean

  // constructor
  constructor () {
    // record of callbacks to execute on state change
    this.#replies = {}
    // system settings
    this.#language = load('language', 'Pascal')
    this.#mode = load('mode', 'normal')
    this.#editorFontFamily = load('editorFontFamily', 'Courier')
    this.#editorFontSize = load('editorFontSize', 13)
    this.#outputFontFamily = load('outputFontFamily', 'Courier')
    this.#outputFontSize = load('outputFontSize', 13)
    this.#includeCommentsInExamples = load('includeCommentsInExamples', true)
    this.#loadCorrespondingExample = load('loadCorrespondingExample', true)
    this.#assembler = load('assembler', true)
    this.#decimal = load('decimal', true)
    this.#autoCompileOnLoad = load('autoCompileOnLoad', false)
    this.#autoRunOnLoad = load('autoRunOnLoad', false)
    this.#autoFormatOnLoad = load('autoFormatOnLoad', false)
    // help page properties
    this.#commandsCategoryIndex = load('commandsCategoryIndex', 0)
    this.#showSimpleCommands = load('showSimpleCommands', true)
    this.#showIntermediateCommands = load('showIntermediateCommands', false)
    this.#showAdvancedCommands = load('showAdvancedCommands', false)
    // file memory
    this.#files = load('files', [new File(this.language)])
    this.#currentFileIndex = load('currentFileIndex', 0)
    this.#lexemes = load('lexemes', [])
    this.#usage = load('usage', [])
    this.#routines = load('routines', [])
    this.#pcode = load('pcode', [])
    // machine runtime options
    this.#showCanvasOnRun = load('showCanvasOnRun', true)
    this.#showOutputOnWrite = load('showOutputOnWrite', false)
    this.#showMemoryOnDump = load('showMemoryOnDump', true)
    this.#drawCountMax = load('drawCountMax', 4)
    this.#codeCountMax = load('codeCountMax', 100000)
    this.#smallSize = load('smallSize', 60)
    this.#stackSize = load('stackSize', 20000)
    this.#traceOnRun = load('traceOnRun', false)
    this.#activateHCLR = load('activateHCLR', true)
    this.#preventStackCollision = load('preventStackCollision', true)
    this.#rangeCheckArrays = load('rangeCheckArrays', true)
    // compiler options
    this.#canvasStartSize = load('canvasStartSize', 1000)
    this.#setupDefaultKeyBuffer = load('setupDefaultKeyBuffer', true)
    this.#turtleAttributesAsGlobals = load('turtleAttributesAsGlobals', true)
    this.#initialiseLocals = load('initialiseLocals', true)
    this.#allowCSTR = load('allowCSTR', true)
    this.#separateReturnStack = load('separateReturnStack', true)
    this.#separateMemoryControlStack = load('separateMemoryControlStack', true)
    this.#separateSubroutineRegisterStack = load('separateSubroutineRegisterStack', true)

    // register to pass some machine signals on from here
    machine.on('showCanvas', () => { this.send('selectTab', 'canvas') })
    machine.on('showOutput', () => { this.send('selectTab', 'output') })
    machine.on('showMemory', () => { this.send('selectTab', 'memory') })
  }

  // initialise the app (i.e. send all property changed messages)
  init (): void {
    // system settings
    this.send('languageChanged')
    this.send('modeChanged')
    this.send('editorFontFamilyChanged')
    this.send('editorFontSizeChanged')
    this.send('outputFontFamilyChanged')
    this.send('outputFontSizeChanged')
    this.send('includeCommentsInExamplesChanged')
    this.send('loadCorrespondingExampleChanged')
    this.send('assemblerChanged')
    this.send('decimalChanged')
    this.send('autoCompileOnLoadChanged')
    this.send('autoRunOnLoadChanged')
    this.send('autoFormatOnLoadChanged')
    // help page properties
    this.send('commandsCategoryIndexChanged')
    this.send('showSimpleCommandsChanged')
    this.send('showIntermediateCommandsChanged')
    this.send('showAdvancedCommandsChanged')
    // file memory
    this.send('filesChanged')
    this.send('currentFileIndexChanged')
    this.send('lexemesChanged')
    this.send('usageChanged')
    this.send('routinesChanged')
    this.send('pcodeChanged')
    // machine runtime options
    this.send('showCanvasOnRunChanged')
    this.send('showOutputOnWriteChanged')
    this.send('showMemoryOnDumpChanged')
    this.send('drawCountMaxChanged')
    this.send('codeCountMaxChanged')
    this.send('smallSizeChanged')
    this.send('stackSizeChanged')
    this.send('traceOnRunChanged')
    this.send('activateHCLRChanged')
    this.send('preventStackCollisionChanged')
    this.send('rangeCheckArraysChanged')
    // compiler options
    this.send('canvasStartSizeChanged')
    this.send('setupDefaultKeyBufferChanged')
    this.send('turtleAttributesAsGlobalsChanged')
    this.send('initialiseLocalsChanged')
    this.send('allowCSTRChanged')
    this.send('separateReturnStackChanged')
    this.send('separateMemoryControlStackChanged')
    this.send('separateSubroutineRegisterStackChanged')
  }

  // getters for system settings
  get language (): Language { return this.#language }
  get mode (): Mode { return this.#mode }
  get editorFontFamily (): string { return this.#editorFontFamily }
  get editorFontSize (): number { return this.#editorFontSize }
  get outputFontFamily (): string { return this.#outputFontFamily }
  get outputFontSize (): number { return this.#outputFontSize }
  get includeCommentsInExamples (): boolean { return this.#includeCommentsInExamples }
  get loadCorrespondingExample (): boolean { return this.#loadCorrespondingExample }
  get assembler (): boolean { return this.#assembler }
  get decimal (): boolean { return this.#decimal }
  get autoCompileOnLoad (): boolean { return this.#autoCompileOnLoad }
  get autoRunOnLoad (): boolean { return this.#autoRunOnLoad }
  get autoFormatOnLoad (): boolean { return this.#autoFormatOnLoad }

  // getters for help page properties
  get commandsCategoryIndex (): number { return this.#commandsCategoryIndex }
  get showSimpleCommands (): boolean { return this.#showSimpleCommands }
  get showIntermediateCommands (): boolean { return this.#showIntermediateCommands }
  get showAdvancedCommands (): boolean { return this.#showAdvancedCommands }

  // getters for file memory
  get files (): File[] { return this.#files }
  get currentFileIndex (): number { return this.#currentFileIndex }
  get file (): File { return this.files[this.currentFileIndex] }
  get filename (): string { return this.files[this.currentFileIndex].name }
  get code (): string { return this.files[this.currentFileIndex].code }
  get lexemes (): any[] { return this.#lexemes }
  get routines (): any[] { return this.#routines }
  get pcode (): number[][] { return this.#pcode }
  get usage (): any[] { return this.#usage }

  // getters for machine runtime options
  get showCanvasOnRun (): boolean { return this.#showCanvasOnRun }
  get showOutputOnWrite (): boolean { return this.#showOutputOnWrite }
  get showMemoryOnDump (): boolean { return this.#showMemoryOnDump }
  get drawCountMax (): number { return this.#drawCountMax }
  get codeCountMax (): number { return this.#codeCountMax }
  get smallSize (): number { return this.#smallSize }
  get stackSize (): number { return this.#stackSize }
  get traceOnRun (): boolean { return this.#traceOnRun }
  get activateHCLR (): boolean { return this.#activateHCLR }
  get preventStackCollision (): boolean { return this.#preventStackCollision }
  get rangeCheckArrays (): boolean { return this.#rangeCheckArrays }

  // getters for compiler options
  get canvasStartSize (): number { return this.#canvasStartSize }
  get setupDefaultKeyBuffer (): boolean { return this.#setupDefaultKeyBuffer }
  get turtleAttributesAsGlobals (): boolean { return this.#turtleAttributesAsGlobals }
  get initialiseLocals (): boolean { return this.#initialiseLocals }
  get allowCSTR (): boolean { return this.#allowCSTR }
  get separateReturnStack (): boolean { return this.#separateReturnStack }
  get separateMemoryControlStack (): boolean { return this.#separateMemoryControlStack }
  get separateSubroutineRegisterStack (): boolean { return this.#separateSubroutineRegisterStack }

  // derivative getters
  get machineOptions (): object {
    return {
      showCanvas: this.showCanvasOnRun,
      showOutput: this.showOutputOnWrite,
      showMemory: this.showMemoryOnDump,
      drawCountMax: this.drawCountMax,
      codeCountMax: this.codeCountMax,
      smallSize: this.smallSize,
      stackSize: this.stackSize
    }
  }

  // setters for system settings
  set language (language: Language) {
    const previousLanguage = this.language

    // check the input; the compiler cannot always do so, since the language can
    // be set on the HTML page itself
    if (!languages.includes(language)) {
      this.send('error', new SystemError(`Unknown language "${language}".`))
    }
    this.#language = language
    save('language', language)
    this.send('languageChanged')

    // set file as not compiled
    this.file.compiled = false
    save('files', this.files)
    this.send('codeChanged') // update the syntax highlighting

    // maybe load corresponding example
    if (this.files) { // false when language is set on first page load
      if (previousLanguage !== language) { // stop infinite loop from example setting the language
        if (this.file.example && this.loadCorrespondingExample) {
          this.openExampleFile(this.file.example)
        }
      }
    }
  }

  set mode (mode: Mode) {
    this.#mode = mode
    save('mode', mode)
    this.send('modeChanged')
  }

  set editorFontFamily (editorFontFamily: string) {
    this.#editorFontFamily = editorFontFamily
    save('editorFontFamily', editorFontFamily)
    this.send('editorFontFamilyChanged')
  }

  set editorFontSize (editorFontSize: number) {
    this.#editorFontSize = editorFontSize
    save('editorFontSize', editorFontSize)
    this.send('editorFontSizeChanged')
  }

  set outputFontFamily (outputFontFamily: string) {
    this.#outputFontFamily = outputFontFamily
    save('outputFontFamily', outputFontFamily)
    this.send('outputFontFamilyChanged')
  }

  set outputFontSize (outputFontSize: number) {
    this.#outputFontSize = outputFontSize
    save('outputFontSize', outputFontSize)
    this.send('outputFontSizeChanged')
  }

  set includeCommentsInExamples (includeCommentsInExamples: boolean) {
    this.#includeCommentsInExamples = includeCommentsInExamples
    save('includeCommentsInExamples', includeCommentsInExamples)
    this.send('includeCommentsInExamplesChanged')
  }

  set loadCorrespondingExample (loadCorrespondingExample: boolean) {
    this.#loadCorrespondingExample = loadCorrespondingExample
    save('loadCorrespondingExample', loadCorrespondingExample)
    this.send('loadCorrespondingExampleChanged')
  }

  set assembler (assembler: boolean) {
    this.#assembler = assembler
    save('assembler', assembler)
    this.send('pcodeChanged')
  }

  set decimal (decimal: boolean) {
    this.#decimal = decimal
    save('decimal', decimal)
    this.send('pcodeChanged')
  }

  set autoCompileOnLoad (autoCompileOnLoad: boolean) {
    this.#autoCompileOnLoad = autoCompileOnLoad
    save('autoCompileOnLoad', this.#autoCompileOnLoad)
    this.send('autoCompileOnLoadChanged')
  }

  set autoRunOnLoad (autoRunOnLoad: boolean) {
    this.#autoRunOnLoad = autoRunOnLoad
    save('autoRunOnLoad', this.#autoRunOnLoad)
    this.send('autoRunOnLoadChanged')
  }

  set autoFormatOnLoad (autoFormatOnLoad: boolean) {
    this.#autoFormatOnLoad = autoFormatOnLoad
    save('autoFormatOnLoad', this.#autoFormatOnLoad)
    this.send('autoFormatOnLoadChanged')
  }

  // setters for help page properties
  set commandsCategoryIndex (commandsCategoryIndex: number) {
    this.#commandsCategoryIndex = commandsCategoryIndex
    save('commandsCategoryIndex', commandsCategoryIndex)
    this.send('commandsCategoryIndexChanged')
  }

  set showSimpleCommands (showSimpleCommands: boolean) {
    this.#showSimpleCommands = showSimpleCommands
    save('showSimpleCommands', showSimpleCommands)
    this.send('showSimpleCommandsChanged')
  }

  set showIntermediateCommands (showIntermediateCommands: boolean) {
    this.#showIntermediateCommands = showIntermediateCommands
    save('showIntermediateCommands', showIntermediateCommands)
    this.send('showIntermediateCommandsChanged')
  }

  set showAdvancedCommands (showAdvancedCommands: boolean) {
    this.#showAdvancedCommands = showAdvancedCommands
    save('showAdvancedCommands', showAdvancedCommands)
    this.send('showAdvancedCommandsChanged')
  }

  // setters for file memory
  set files (files: File[]) {
    this.#files = files
    save('files', files)
    this.send('filesChanged')
  }

  set currentFileIndex (currentFileIndex: number) {
    this.#currentFileIndex = currentFileIndex
    save('currentFileIndex', currentFileIndex)

    // update language to match current file language
    this.language = this.file.language

    // update lexemes, pcode, and usage to match current file
    if (this.file.compiled) {
      const { lexemes, pcode, usage } = compile(this.file.code, this.language)
      this.lexemes = lexemes
      this.pcode = pcode
      this.usage = usage
    } else {
      this.lexemes = []
      this.pcode = []
      this.usage = []
    }

    this.send('currentFileIndexChanged')
  }

  set filename (name: string) {
    this.file.name = name
    this.file.edited = true
    save('files', this.files)
    this.send('filenameChanged')
  }

  set code (code: string) {
    this.file.code = code
    this.file.edited = true
    this.file.compiled = false
    save('files', this.files)
    this.send('codeChanged')
  }

  set lexemes (lexemes: any[]) {
    this.#lexemes = lexemes
    save('lexemes', lexemes)
    this.send('lexemesChanged')
  }

  set routines (routines: any[]) {
    this.#routines = routines
    save('routines', routines)
    this.send('routinesChanged')
  }

  set pcode (pcode: number[][]) {
    this.#pcode = pcode
    save('pcode', pcode)
    this.send('pcodeChanged')
  }

  set usage (usage: any[]) {
    this.#usage = usage
    save('usage', usage)
    this.send('usageChanged')
  }

  // setters for machine runtime options
  set showCanvasOnRun (showCanvasOnRun: boolean) {
    this.#showCanvasOnRun = showCanvasOnRun
    save('showCanvasOnRun', showCanvasOnRun)
    this.send('showCanvasOnRunChanged')
  }

  set showOutputOnWrite (showOutputOnWrite: boolean) {
    this.#showOutputOnWrite = showOutputOnWrite
    save('showOutputOnWrite', showOutputOnWrite)
    this.send('showOutputOnWriteChanged')
  }

  set showMemoryOnDump (showMemoryOnDump: boolean) {
    this.#showMemoryOnDump = showMemoryOnDump
    save('showMemoryOnDump', showMemoryOnDump)
    this.send('showMemoryOnDumpChanged')
  }

  set drawCountMax (drawCountMax: number) {
    this.#drawCountMax = drawCountMax
    save('drawCountMax', drawCountMax)
    this.send('drawCountMaxChanged')
  }

  set codeCountMax (codeCountMax: number) {
    this.#codeCountMax = codeCountMax
    save('codeCountMax', codeCountMax)
    this.send('codeCountMaxChanged')
  }

  set smallSize (smallSize: number) {
    this.#smallSize = smallSize
    save('smallSize', smallSize)
    this.send('smallSizeChanged')
  }

  set stackSize (stackSize: number) {
    this.#stackSize = stackSize
    save('stackSize', stackSize)
    this.send('stackSizeChanged')
  }

  set traceOnRun (traceOnRun: boolean) {
    this.#traceOnRun = traceOnRun
    save('traceOnRun', traceOnRun)
    this.send('traceOnRunChanged')
  }

  set activateHCLR (activateHCLR: boolean) {
    this.#activateHCLR = activateHCLR
    save('activateHCLR', activateHCLR)
    this.send('activateHCLRChanged')
  }

  set preventStackCollision (preventStackCollision: boolean) {
    this.#preventStackCollision = preventStackCollision
    save('preventStackCollision', preventStackCollision)
    this.send('preventStackCollisionChanged')
  }

  set rangeCheckArrays (rangeCheckArrays: boolean) {
    this.#rangeCheckArrays = rangeCheckArrays
    save('rangeCheckArrays', rangeCheckArrays)
    this.send('rangeCheckArraysChanged')
  }

  // setters for compiler options
  set canvasStartSize (canvasStartSize: number) {
    this.#canvasStartSize = canvasStartSize
    save('canvasStartSize', canvasStartSize)
    this.send('canvasStartSizeChanged')
  }

  set setupDefaultKeyBuffer (setupDefaultKeyBuffer: boolean) {
    this.#setupDefaultKeyBuffer = setupDefaultKeyBuffer
    save('setupDefaultKeyBuffer', setupDefaultKeyBuffer)
    this.send('setupDefaultKeyBufferChanged')
  }

  set turtleAttributesAsGlobals (turtleAttributesAsGlobals: boolean) {
    this.#turtleAttributesAsGlobals = turtleAttributesAsGlobals
    save('turtleAttributesAsGlobals', turtleAttributesAsGlobals)
    this.send('turtleAttributesAsGlobalsChanged')
  }

  set initialiseLocals (initialiseLocals: boolean) {
    this.#initialiseLocals = initialiseLocals
    save('initialiseLocals', initialiseLocals)
    this.send('initialiseLocalsChanged')
  }

  set allowCSTR (allowCSTR: boolean) {
    this.#allowCSTR = allowCSTR
    save('allowCSTR', allowCSTR)
    this.send('allowCSTRChanged')
  }

  set separateReturnStack (separateReturnStack: boolean) {
    this.#separateReturnStack = separateReturnStack
    save('separateReturnStack', separateReturnStack)
    this.send('separateReturnStackChanged')
  }

  set separateMemoryControlStack (separateMemoryControlStack: boolean) {
    this.#separateMemoryControlStack = separateMemoryControlStack
    save('separateMemoryControlStack', separateMemoryControlStack)
    this.send('separateMemoryControlStackChanged')
  }

  set separateSubroutineRegisterStack (separateSubroutineRegisterStack: boolean) {
    this.#separateSubroutineRegisterStack = separateSubroutineRegisterStack
    save('separateSubroutineRegisterStack', separateSubroutineRegisterStack)
    this.send('separateSubroutineRegisterStackChanged')
  }

  // edit actions
  undo (): void {}

  redo (): void {}

  cut (): void {}

  copy (): void {}

  paste (): void {}

  selectAll (): void {}

  // save settings (requires login)
  saveSettings (): void {}

  // reset default settings
  resetDefaults (): void {}

  // add a file to the files array (and update current file index)
  addFile (file: File): void {
    this.files = this.files.concat([file])
    this.currentFileIndex = this.files.length - 1
    this.send('closeMenu', 'system')
  }

  // close the current file (and update current file index)
  closeCurrentFile (): void {
    this.files = this.files.slice(0, this.currentFileIndex).concat(this.files.slice(this.currentFileIndex + 1))
    if (this.files.length === 0) {
      this.newFile()
    } else if (this.currentFileIndex > this.files.length - 1) {
      this.currentFileIndex = this.currentFileIndex - 1
    }
    this.send('closeMenu', 'system')
  }

  // create a new file
  newFile (skeleton: boolean = false) {
    const file = new File(this.language)
    if (skeleton) {
      file.code = skeletons[this.language]
    }
    this.addFile(file)
  }

  // open a file from disk
  openFile (filename: string, content: string, example: string|null = null) {
    const file = new File(this.language, example)
    const bits = filename.split('.')
    const ext = bits.pop()
    const name = bits.join('.')
    let json: any
    switch (ext) {
      case 'tbas': // fallthrough
      case 'tgb': // support old file extension
        file.language = 'BASIC'
        file.name = name
        file.code = content.trim()
        break

      case 'tpas': // fallthrough
      case 'tgp': // support old file extension
        file.language = 'Pascal'
        file.name = name
        file.code = content.trim()
        break

      case 'tpy': // fallthrough
      case 'tgy': // support old file extension
        file.language = 'Python'
        file.name = name
        file.code = content.trim()
        break

      case 'tmx': // fallthrough
      case 'tgx': // support old file extension
        try {
          json = JSON.parse(content)
          if (json.language && json.name && json.code && json.usage && json.pcode) {
            file.language = json.language
            file.name = json.name
            file.code = json.code.trim()
          } else {
            this.send('error', new SystemError('Invalid TMX file.'))
          }
        } catch (ignore) {
          this.send('error', new SystemError('Invalid TMX file.'))
        }
        break

      case 'tmj': // pcode only; TODO; fallthrough for now
      case 'tmb': // pcode binary file; TODO; fallthrough for now
      default:
        throw new SystemError('Invalid file type.')
    }
    this.addFile(file)
    if (json) {
      this.usage = json.usage
      this.lexemes = lexer(json.code.trim(), this.language)
      this.pcode = json.pcode
      this.file.compiled = true
    }
  }

  openLocalFile () {
    const state = this
    const fileInput = input({
      type: 'file',
      on: ['change', function () {
        const file = fileInput.files[0]
        const fr = new FileReader()
        fr.onload = function () {
          state.openFile(file.name, fr.result as string)
        }
        fr.readAsText(file)
      }]
    })
    fileInput.click()
  }

  openRemoteFile (url: string) {
    this.send('error', new SystemError('Feature not yet available.'))
  }

  openExampleFile (exampleId: string) {
    const example = examples.find(x => x.id === exampleId)
    if (!example) {
      this.send('error', new SystemError(`Unknown example "${exampleId}".`))
    }
    const ext = (this.language === 'Python') ? extensions.Python : 'tmx'
    const filename = `${example.id}.${ext}`
    window.fetch(`/examples/${this.language}/${example.groupId}/${filename}`)
      .then(response => {
        if (response.ok) {
          response.text().then(content => {
            this.openFile(filename, content.trim(), exampleId)
          })
        } else {
          this.send('error', new SystemError(`Couldn't retrieve example "${exampleId}".`))
        }
      })
  }

  saveLocalFile () {
    const a = document.createElement('a')
    const blob = new window.Blob([this.file.code], { type: 'text/plain;charset=utf-8' })
    a.setAttribute('href', URL.createObjectURL(blob))
    a.setAttribute('download', this.file.filename)
    a.click()
  }

  saveRemoteFile () {
    this.send('error', new SystemError('Feature not yet available.'))
  }

  compileCurrentFile (): void {
    try {
      const { lexemes, pcode, usage } = compile(this.file.code, this.language)
      this.file.language = this.language
      this.file.compiled = true
      this.files = this.files // to update the session storage
      this.lexemes = lexemes
      this.pcode = pcode
      this.usage = usage
    } catch (error) {
      this.send('error', error)
    }
  }

  backupCode (): void {
    this.file.backup = this.file.code
  }

  restoreCode (): void {
    if (this.file.code !== this.file.backup) {
      this.file.compiled = false
    }
    this.file.code = this.file.backup
  }

  resetMachineOptions (): void {
    this.showCanvasOnRun = true
    this.showOutputOnWrite = false
    this.showMemoryOnDump = true
    this.drawCountMax = 4
    this.codeCountMax = 100000
    this.smallSize = 60
    this.stackSize = 20000
    this.send('showCanvasOnRunChanged')
    this.send('showOutputOnWriteChanged')
    this.send('showMemoryOnDumpChanged')
    this.send('drawCountMaxChanged')
    this.send('codeCountMaxChanged')
    this.send('smallSizeChanged')
    this.send('stackSizeChanged')
  }

  // TODO: this should be in the machine module
  dumpMemory (): void {
    this.send('memoryDumped', machine.dump())
  }

  // play/pause the machine
  playPauseMachine () {
    if (machine.isRunning()) {
      if (machine.isPaused()) {
        machine.play()
      } else {
        machine.pause()
      }
    } else {
      if (!this.file.compiled) {
        this.compileCurrentFile()
      }
      if (this.file.compiled) {
        machine.run(this.pcode, this.machineOptions)
      }
    }
    this.send('closeMenu', 'system')
  }

  // register callback on the record of outgoing messages
  on (message: Message, callback: Reply) {
    if (this.#replies[message]) {
      this.#replies[message].push(callback)
    } else {
      this.#replies[message] = [callback]
    }
  }

  // function for executing any registered callbacks following a state change
  send (message: Message, data: any = null) {
    // execute any callbacks registered for this message
    if (this.#replies[message]) {
      this.#replies[message].forEach((callback: Reply) => {
        callback(data)
      })
    }

    // if the file has changed, reply that the file properties have changed as well
    if (message === 'currentFileIndexChanged') {
      this.send('filenameChanged')
      this.send('codeChanged')
    }
  }
}

// export a new system state object
export default new State()
