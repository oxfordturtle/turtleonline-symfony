/*
 * The system state is a load of variables, representing the current state of
 * the system (not including the virtual machine, which for clarity has its own
 * module). Getters and setters for these state variables are defined here, as
 * well as other more complex methods for changing the system state. This module
 * also initializes the variables and saves them to local storage, so that the
 * state is maintained between sessions.
 */
import { SystemError } from '../definitions/errors'
import { names } from '../definitions/examples'
import { File } from '../definitions/file'
import { Language, languages, extensions } from '../definitions/languages'
import { Mode } from '../definitions/modes'
import compile from '../compile/index'
import lexer from '../compile/lexer/index'
import * as machine from '../machine/index'
import { Message, Reply } from './messages'
import { load, save } from './storage'

// define the system state object
class State {
  // record of callbacks to execute on state change
  #replies: Partial<Record<Message, Reply[]>>
  // temporary properties (not saved to session)
  #menuOpen: boolean
  #fullscreen: boolean
  // system settings
  #language: Language
  #mode: Mode
  #loadCorrespondingExample: boolean
  #assembler: boolean
  #decimal: boolean
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
  #showCanvas: boolean
  #showOutput: boolean
  #showMemory: boolean
  #drawCountMax: number
  #codeCountMax: number
  #smallSize: number
  #stackSize: number
  // compiler options
  // TODO ...

  // constructor
  constructor () {
    // record of callbacks to execute on state change
    this.#replies = {}
    // temporary properties
    this.#menuOpen = false
    this.#fullscreen = false
    // system settings
    this.#language = load('language', 'Pascal')
    this.#mode = load('mode', 'normal')
    this.#loadCorrespondingExample = load('loadCorrespondingExample', true)
    this.#assembler = load('assembler', true)
    this.#decimal = load('decimal', true)
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
    this.#showCanvas = load('showCanvas', true)
    this.#showOutput = load('showOutput', false)
    this.#showMemory = load('showMemory', true)
    this.#drawCountMax = load('drawCountMax', 4)
    this.#codeCountMax = load('codeCountMax', 100000)
    this.#smallSize = load('smallSize', 60)
    this.#stackSize = load('stackSize', 20000)
    // compiler options
    // TODO ...

    // register to pass some machine signals on from here
    machine.on('showCanvas', () => { this.send('showComponent', 'canvas') })
    machine.on('showOutput', () => { this.send('showComponent', 'output') })
    machine.on('showMemory', () => { this.send('showComponent', 'memory') })
  }

  // initialise the app (i.e. send all property changed messages)
  init (): void {
    // system settings
    this.send('languageChanged')
    this.send('modeChanged')
    this.send('loadCorrespondingExampleChanged')
    this.send('assemblerChanged')
    this.send('decimalChanged')
    // help page properties
    this.send('commandsCategoryIndexChanged')
    this.send('showSimpleCommandsChanged')
    this.send('showIntermediateCommandsChanged')
    this.send('showAdvancedCommandsChanged')
    // file memory
    this.send('filesChanged')
    this.send('currentFileIndexChanged')
    this.send('fileChanged')
    // machine runtime options
    this.send('showCanvasChanged')
    this.send('showOutputChanged')
    this.send('showMemoryChanged')
    this.send('drawCountMaxChanged')
    this.send('codeCountMaxChanged')
    this.send('smallSizeChanged')
    this.send('stackSizeChanged')
  }

  // getters for temporary properties
  get menuOpen (): boolean {
    return this.#menuOpen
  }

  get fullscreen (): boolean {
    return this.#fullscreen
  }

  // getters for system settings
  get language (): Language {
    return this.#language
  }

  get mode (): Mode {
    return this.#mode
  }

  get loadCorrespondingExample (): boolean {
    return this.#loadCorrespondingExample
  }

  get assembler (): boolean {
    return this.#assembler
  }

  get decimal (): boolean {
    return this.#decimal
  }

  // getters for help page properties
  get commandsCategoryIndex (): number {
    return this.#commandsCategoryIndex
  }

  get showSimpleCommands (): boolean {
    return this.#showSimpleCommands
  }

  get showIntermediateCommands (): boolean {
    return this.#showIntermediateCommands
  }

  get showAdvancedCommands (): boolean {
    return this.#showAdvancedCommands
  }

  // getters for file memory
  get files (): File[] {
    return this.#files
  }

  get currentFileIndex (): number {
    return this.#currentFileIndex
  }

  get lexemes (): any[] {
    return this.#lexemes
  }

  get routines (): any[] {
    return this.#routines
  }

  get pcode (): number[][] {
    return this.#pcode
  }

  get usage (): any[] {
    return this.#usage
  }

  // getters for machine runtime options
  get showCanvas (): boolean {
    return this.#showCanvas
  }

  get showOutput (): boolean {
    return this.#showOutput
  }

  get showMemory (): boolean {
    return this.#showMemory
  }

  get drawCountMax (): number {
    return this.#drawCountMax
  }

  get codeCountMax (): number {
    return this.#codeCountMax
  }

  get smallSize (): number {
    return this.#smallSize
  }

  get stackSize (): number {
    return this.#stackSize
  }

  // getters for compiler options
  // TODO ...

  // derivative getters
  get file (): File {
    return this.files[this.currentFileIndex]
  }

  get machineOptions (): object {
    return {
      showCanvas: this.showCanvas,
      showOutput: this.showOutput,
      showMemory: this.showMemory,
      drawCountMax: this.drawCountMax,
      codeCountMax: this.codeCountMax,
      smallSize: this.smallSize,
      stackSize: this.stackSize
    }
  }

  // setters for temporary properties
  set menuOpen (menuOpen: boolean) {
    this.#menuOpen = menuOpen
    this.send('menuOpenChanged')
  }

  set fullscreen (fullscreen: boolean) {
    this.#fullscreen = fullscreen
    this.send('fullscreenChanged')
  }

  // setters for system settings
  set language (language: Language) {
    // check the input; the compiler cannot always do so, since the language can
    // be set on the HTML page itself
    if (!languages.includes(language)) {
      this.send('error', new SystemError(`Unknown language "${language}".`))
    }
    this.#language = language
    save('language', language)
    this.send('languageChanged')

    // maybe load corresponding example
    if (this.files) { // false when language is set on first page load
      if (this.language !== language) { // stop infinite loop from example setting the language
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

    this.send('fileChanged')
    this.send('showComponent', 'code')
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
  set showCanvas (showCanvas: boolean) {
    this.#showCanvas = showCanvas
    save('showCanvas', showCanvas)
    this.send('showCanvasChanged')
  }

  set showOutput (showOutput: boolean) {
    this.#showOutput = showOutput
    save('showOutput', showOutput)
    this.send('showOutputChanged')
  }

  set showMemory (showMemory: boolean) {
    this.#showMemory = showMemory
    save('showMemory', showMemory)
    this.send('showMemoryChanged')
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

  // add a file to the files array (and update current file index)
  addFile (file: File): void {
    if (this.#files.length === 0 || this.file.edited) {
      this.#files.push(file)
      this.currentFileIndex = this.files.length - 1
    } else {
      this.files[this.currentFileIndex] = file
      this.language = file.language
    }
    this.files = this.files // to update the session storage
    this.send('fileChanged')
    this.send('showComponent', 'code')
  }

  // close the current file (and update current file index)
  closeCurrentFile (): void {
    this.files.splice(this.currentFileIndex, 1)
    if (this.files.length === 0) {
      this.newFile()
    } else if (this.currentFileIndex > this.files.length - 1) {
      this.currentFileIndex = this.currentFileIndex - 1
      this.files = this.files // to update the session storage
    }
    this.send('fileChanged')
  }

  // create a new file
  newFile (skeleton: boolean = false) {
    const file = new File(this.language, skeleton)
    this.addFile(file)
  }

  // open a file from disk
  openFile (filename: string, content: string, example: string|null = null) {
    const file = new File(this.language)
    const bits = filename.split('.')
    const ext = bits.pop()
    const name = bits.join('.')
    switch (ext) {
      case 'tbas': // fallthrough
      case 'tgb': // support old file extension
        file.language = 'BASIC'
        file.example = example
        file.name = name
        file.code = content.trim()
        break

      case 'tpas': // fallthrough
      case 'tgp': // support old file extension
        file.language = 'Pascal'
        file.example = example
        file.name = name
        file.code = content.trim()
        break

      case 'tpy': // fallthrough
      case 'tgy': // support old file extension
        file.language = 'Python'
        file.example = example
        file.name = name
        file.code = content.trim()
        break

      case 'tgx':
        try {
          const json = JSON.parse(content)
          if (json.language && json.name && json.code && json.usage && json.pcode) {
            file.language = json.language
            file.example = example
            file.name = json.name
            file.code = json.code.trim()
            file.compiled = true
            this.usage = json.usage
            this.lexemes = lexer(json.code.trim(), this.language)
            this.pcode = json.pcode
          } else {
            this.send('error', new SystemError('Invalid TGX file.'))
          }
        } catch (ignore) {
          this.send('error', new SystemError('Invalid TGX file.'))
        }
        break

      default:
        throw new SystemError('Invalid file type.')
    }
    this.addFile(file)
  }

  openRemoteFile (url: string) {
    this.send('error', new SystemError('Feature not yet available.'))
  }

  openExampleFile (example: string) {
    if (!names[example]) {
      this.send('error', new SystemError(`Unknown example "${example}".`))
    }
    const filename = `${example}.${extensions[this.language]}`
    window.fetch(`/examples/${this.language}/${filename}`)
      .then(response => {
        if (response.ok) {
          response.text().then(content => {
            this.openFile(filename, content.trim(), example)
          })
        } else {
          this.send('error', new SystemError(`Couldn't retrieve example "${example}".`))
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

  setFileName (name: string) {
    this.file.name = name
    this.file.edited = true
    this.files = this.files // to update the session storage
    this.send('nameChanged')
  }

  setFileCode (code: string) {
    this.file.code = code
    this.file.edited = true
    this.file.compiled = false
    this.files = this.files // to update the session storage
    this.send('codeChanged')
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
      this.send('fileChanged')
    } catch (error) {
      this.send('error', error)
    }
  }

  resetMachineOptions (): void {
    this.showCanvas = true
    this.showOutput = false
    this.showMemory = true
    this.drawCountMax = 4
    this.codeCountMax = 100000
    this.smallSize = 60
    this.stackSize = 20000
    this.send('showCanvasChanged')
    this.send('showOutputChanged')
    this.send('showMemoryChanged')
    this.send('drawCountMaxChanged')
    this.send('codeCountMaxChanged')
    this.send('smallSizeChanged')
    this.send('stackSizeChanged')
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
        this.send('fileChanged')
      }
      if (this.file.compiled) {
        machine.run(this.pcode, this.machineOptions)
      }
    }
  }

  // halt the machine
  haltMachine () {
    if (machine.isRunning()) {
      machine.halt()
    }
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
    // define callback arguments
    switch (message) {
      case 'error': // fallthrough
      case 'showComponent': // fallthrough
      case 'fileChanged':
        // used passed data argument or null
        break

      case 'languageChanged':
        data = this.language
        break

      case 'filesChanged':
        data = {
          files: this.files,
          currentFileIndex: this.currentFileIndex
        }
        break

      case 'currentFileIndexChanged':
        data = this.currentFileIndex
        break

      case 'nameChanged':
        data = this.file.name
        break

      case 'codeChanged':
        // send language as well (for syntax highlighting)
        data = {
          code: this.file.code,
          language: this.language
        }
        break

      case 'usageChanged':
        // send language as well (for syntax highlighting)
        data = {
          usage: this.usage,
          language: this.language
        }
        break

      case 'lexemesChanged':
        // send language as well (for syntax highlighting)
        data = {
          lexemes: this.lexemes,
          language: this.language
        }
        break

      case 'pcodeChanged':
        data = {
          pcode: this.pcode,
          assembler: this.assembler,
          decimal: this.decimal
        }
        break

      case 'showCanvasChanged':
        data = this.showCanvas
        break

      case 'showOutputChanged':
        data = this.showOutput
        break

      case 'showMemoryChanged':
        data = this.showMemory
        break

      case 'drawCountMaxChanged':
      data = this.drawCountMax
        break

      case 'codeCountMaxChanged':
        data = this.codeCountMax
        break

      case 'smallSizeChanged':
        data = this.smallSize
        break

      case 'stackSizeChanged':
        data = this.stackSize
        break

      case 'dumpMemory':
        data = machine.dump()
        break
    }

    // execute any callbacks registered for this message
    if (this.#replies[message]) {
      this.#replies[message].forEach((callback: Reply) => {
        callback(data)
      })
    }

    // if the file has changed, reply that the file properties have changed as well
    if (message === 'fileChanged') {
      this.send('filesChanged')
      this.send('languageChanged')
      this.send('currentFileIndexChanged')
      this.send('nameChanged')
      this.send('codeChanged')
      this.send('usageChanged')
      this.send('lexemesChanged')
      this.send('pcodeChanged')
    }
  }
}

// export a new system state object
export default new State()
