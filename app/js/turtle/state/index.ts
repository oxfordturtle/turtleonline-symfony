/*
 * Getter and setter for system state variables.
 *
 * The system state is a load of variables, representing the current state of the system (not including
 * the virtual machine, which for clarity has its own module). Getters and setters for these state
 * variables are defined here. This module also initializes the variables and saves them to local
 * storage, so that the state is maintained between sessions.
 */
import { SystemError } from '../definitions/errors.ts'
import { names } from '../definitions/examples.ts'
import { File } from '../definitions/file.ts'
import { Language, languages, extensions } from '../definitions/languages.ts'
import compile from '../compile/index.js'
import lexer from '../compile/lexer/index.js'
import * as machine from '../machine/index.js'
import { Message, Reply } from './messages.ts'
import { load, save } from './storage.ts'

// define the system state object
class State {
  #replies: any
  #fullscreen: boolean
  #menu: boolean
  #loadCorrespondingExample: boolean
  #language: Language
  #files: File[]
  #currentFileIndex: number
  #lexemes: any[]
  #usage: any[]
  #routines: any[]
  #pcode: number[][]
  #assembler: boolean
  #decimal: boolean
  #showCanvas: boolean
  #showOutput: boolean
  #showMemory: boolean
  #drawCountMax: number
  #codeCountMax: number
  #smallSize: number
  #stackSize: number

  // constructor
  constructor () {
    // initialise state properties
    this.#replies = {}
    this.#fullscreen = load('fullscreen', false)
    this.#menu = load('menu', false)
    this.#loadCorrespondingExample = load('load-corresponding-example', true)
    this.#language = load('language', 'Pascal')
    this.#files = load('files', [new File(this.language)])
    this.#currentFileIndex = load('current-file-index', 0)
    this.#lexemes = load('lexemes', [])
    this.#usage = load('usage', [])
    this.#routines = load('routines', [])
    this.#pcode = load('pcode', [])
    this.#assembler = load('assembler', true)
    this.#decimal = load('decimal', true)
    this.#showCanvas = load('show-canvas', true)
    this.#showOutput = load('show-output', false)
    this.#showMemory = load('show-memory', true)
    this.#drawCountMax = load('draw-count-max', 4)
    this.#codeCountMax = load('code-count-max', 100000)
    this.#smallSize = load('small-size', 60)
    this.#stackSize = load('stack-size', 20000)

    // register to pass some machine signals on from here
    machine.on('show-canvas', () => { this.send('show-component', 'canvas') })
    machine.on('show-output', () => { this.send('show-component', 'output') })
    machine.on('show-memory', () => { this.send('show-component', 'memory') })
  }

  // function to call when the DOM is ready
  init () {
    this.send('file-changed')
    this.send('fullscreen-changed')
    this.send('show-canvas-changed')
    this.send('show-output-changed')
    this.send('show-memory-changed')
    this.send('draw-count-max-changed')
    this.send('code-count-max-changed')
    this.send('small-size-changed')
    this.send('stack-size-changed')
  }

  // basic getters
  get fullscreen (): boolean {
    return this.#fullscreen
  }

  get menu (): boolean {
    return this.#menu
  }

  get loadCorrespondingExample (): boolean {
    return this.#loadCorrespondingExample
  }

  get language (): Language {
    return this.#language
  }

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

  get assembler (): boolean {
    return this.#assembler
  }

  get decimal (): boolean {
    return this.#decimal
  }

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

  // basic setters
  set fullscreen (fullscreen: boolean) {
    this.#fullscreen = fullscreen
    save('fullscreen', fullscreen)
    this.send('fullscreen-changed')
  }

  set menu (menu: boolean) {
    this.#menu = menu
    save('menu', menu)
    this.send('menu-changed')
  }

  set loadCorrespondingExample (loadCorrespondingExample: boolean) {
    this.#loadCorrespondingExample = loadCorrespondingExample
    save('load-corresponding-example', loadCorrespondingExample)
  }

  set language (language: Language) {
    if (this.#language === language) {
      // stop loop otherwise created when opening corresponding example (which will
      // set the language again)
      return
    }
    // check the input; the compiler cannot always do so, since the language can be set on
    // the HTML page itself
    if (!languages.includes(language)) {
      this.send('error', new SystemError(`Unknown language "${language}".`))
    }
    this.#language = language
    save('language', language)
    this.send('language-changed')

    // maybe load corresponding example
    if (this.file.example && this.loadCorrespondingExample) {
      this.openExampleFile(this.file.example)
    }
  }

  set files (files: File[]) {
    this.#files = files
    save('files', files)
    this.send('files-changed')
  }

  set currentFileIndex (currentFileIndex: number) {
    this.#currentFileIndex = currentFileIndex
    save('current-file-index', currentFileIndex)

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

    this.send('file-changed')
    this.send('show-component', 'code')
  }

  set lexemes (lexemes: any[]) {
    this.#lexemes = lexemes
    save('lexemes', lexemes)
    this.send('lexemes-changed')
  }

  set routines (routines: any[]) {
    this.#routines = routines
    save('routines', routines)
    this.send('routines-changed')
  }

  set pcode (pcode: number[][]) {
    this.#pcode = pcode
    save('pcode', pcode)
    this.send('pcode-changed')
  }

  set usage (usage: any[]) {
    this.#usage = usage
    save('usage', usage)
    this.send('usage-changed')
  }

  set assembler (assembler: boolean) {
    this.#assembler = assembler
    save('assembler', assembler)
    this.send('pcode-changed')
  }

  set decimal (decimal: boolean) {
    this.#decimal = decimal
    save('decimal', decimal)
    this.send('pcode-changed')
  }

  set showCanvas (showCanvas: boolean) {
    this.#showCanvas = showCanvas
    save('show-canvas', showCanvas)
    this.send('show-canvas-changed')
  }

  set showOutput (showOutput: boolean) {
    this.#showOutput = showOutput
    save('show-output', showOutput)
    this.send('show-output-changed')
  }

  set showMemory (showMemory: boolean) {
    this.#showMemory = showMemory
    save('show-memory', showMemory)
    this.send('show-memory-changed')
  }

  set drawCountMax (drawCountMax: number) {
    this.#drawCountMax = drawCountMax
    save('draw-count-max', drawCountMax)
    this.send('draw-count-max-changed')
  }

  set codeCountMax (codeCountMax: number) {
    this.#codeCountMax = codeCountMax
    save('code-count-max', codeCountMax)
    this.send('code-count-max-changed')
  }

  set smallSize (smallSize: number) {
    this.#smallSize = smallSize
    save('small-size', smallSize)
    this.send('small-size-changed')
  }

  set stackSize (stackSize: number) {
    this.#stackSize = stackSize
    save('stack-size', stackSize)
    this.send('stack-size-changed')
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
    this.send('file-changed')
    this.send('show-component', 'code')
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
    this.send('file-changed')
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

  openRemoteFile () {
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
    this.send('name-changed')
  }

  setFileCode (code: string) {
    this.file.code = code
    this.file.edited = true
    this.file.compiled = false
    this.files = this.files // to update the session storage
    this.send('code-changed')
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
      this.send('file-changed')
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
    this.send('show-canvas-changed')
    this.send('show-output-changed')
    this.send('show-memory-changed')
    this.send('draw-count-max-changed')
    this.send('code-count-max-changed')
    this.send('small-size-changed')
    this.send('stack-size-changed')
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
        this.send('file-changed')
      }
      machine.run(this.pcode, this.machineOptions)
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
      case 'show-component': // fallthrough
      case 'file-changed':
        // used passed data argument or null
        break

      case 'fullscreen-changed':
        data = this.fullscreen
        break

      case 'menu-changed':
        data = this.menu
        break

      case 'language-changed':
        data = this.language
        break

      case 'files-changed':
        data = {
          files: this.files,
          currentFileIndex: this.currentFileIndex
        }
        break

      case 'current-file-index-changed':
        data = this.currentFileIndex
        break

      case 'name-changed':
        data = this.file.name
        break

      case 'code-changed':
        // send language as well (for syntax highlighting)
        data = {
          code: this.file.code,
          language: this.language
        }
        break

      case 'usage-changed':
        // send language as well (for syntax highlighting)
        data = {
          usage: this.usage,
          language: this.language
        }
        break

      case 'lexemes-changed':
        // send language as well (for syntax highlighting)
        data = {
          lexemes: this.lexemes,
          language: this.language
        }
        break

      case 'pcode-changed':
        data = {
          pcode: this.pcode,
          assembler: this.assembler,
          decimal: this.decimal
        }
        break

      case 'show-canvas-changed':
        data = this.showCanvas
        break

      case 'show-output-changed':
        data = this.showOutput
        break

      case 'show-memory-changed':
        data = this.showMemory
        break

      case 'draw-count-max-changed':
      data = this.drawCountMax
        break

      case 'code-count-max-changed':
        data = this.codeCountMax
        break

      case 'small-size-changed':
        data = this.smallSize
        break

      case 'stack-size-changed':
        data = this.stackSize
        break

      case 'dump-memory':
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
    if (message === 'file-changed') {
      this.send('files-changed')
      this.send('language-changed')
      this.send('current-file-index-changed')
      this.send('name-changed')
      this.send('code-changed')
      this.send('usage-changed')
      this.send('lexemes-changed')
      this.send('pcode-changed')
    }

    // if fullscreen has changed, reply that the code has changed
    // (this ensures the code div resizes itself appropriately)
    if (message === 'fullscreen-changed') {
      this.send('code-changed')
    }
  }
}

// export a new system state object
export default new State()
