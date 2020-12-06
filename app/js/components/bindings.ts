/**
 * Binds select/input elements to state properties.
 */
import state from '../state/index'
import type { Property } from '../constants/properties'
import type { Language } from '../constants/languages'
import { languages } from '../constants/languages'
import type { Mode } from '../constants/modes'
import { option, fill } from '../tools/elements'
import { commandCategories } from '../constants/categories'
import { SystemError } from '../tools/error'
import { on, send } from '../tools/hub'

for (const element of document.querySelectorAll('[data-binding]')) {
  switch ((element as HTMLElement).dataset.binding as Property) {
    // system settings
    case 'language':
      fillLanguage(element as HTMLSelectElement)
      element.addEventListener('change', function (): void {
        state.language = (element as HTMLSelectElement).value as Language
      })
      on('languageChanged', function (): void {
        (element as HTMLSelectElement).value = state.language
      })
      break

    case 'mode':
      element.addEventListener('change', function (): void {
        if ((element as HTMLInputElement).checked) {
          state.mode = (element as HTMLInputElement).value as Mode
        }
      })
      on('modeChanged', function (): void {
        if ((element as HTMLInputElement).value === state.mode) {
          (element as HTMLInputElement).checked = true
        }
      })
      break

    case 'editorFontFamily':
      fillFont(element as HTMLSelectElement)
      element.addEventListener('change', function (): void {
        state.editorFontFamily = (element as HTMLSelectElement).value
      })
      on('editorFontFamilyChanged', function (): void {
        (element as HTMLSelectElement).value = state.editorFontFamily
      })
      break

    case 'editorFontSize':
      element.addEventListener('change', function (): void {
        state.editorFontSize = parseInt((element as HTMLSelectElement).value)
      })
      on('editorFontSizeChanged', function (): void {
        (element as HTMLSelectElement).value = state.editorFontSize.toString(10)
      })
      break

    case 'outputFontFamily':
      fillFont(element as HTMLSelectElement)
      element.addEventListener('change', function (): void {
        state.outputFontFamily = (element as HTMLSelectElement).value
      })
      on('outputFontFamilyChanged', function (): void {
        (element as HTMLSelectElement).value = state.outputFontFamily
      })
      break

    case 'outputFontSize':
      element.addEventListener('change', function (): void {
        state.outputFontSize = parseInt((element as HTMLSelectElement).value)
      })
      on('outputFontSizeChanged', function (): void {
        (element as HTMLSelectElement).value = state.outputFontSize.toString(10)
      })
      break

    case 'includeCommentsInExamples':
      disableInput(element)
      element.addEventListener('change', function (): void {
        state.includeCommentsInExamples = (element as HTMLInputElement).checked
      })
      on('includeCommentsInExamplesChanged', function (): void {
        (element as HTMLInputElement).checked = state.includeCommentsInExamples
      })
      break

    case 'loadCorrespondingExample':
      element.addEventListener('change', function (): void {
        state.loadCorrespondingExample = (element as HTMLInputElement).checked
      })
      on('loadCorrespondingExampleChanged', function (): void {
        (element as HTMLInputElement).checked = state.loadCorrespondingExample
      })
      break

    case 'assembler':
      element.addEventListener('change', function (): void {
        if ((element as HTMLInputElement).checked) {
          state.assembler = ((element as HTMLInputElement).value === 'assembler')
        }
      })
      on('assemblerChanged', function (): void {
        if (state.assembler) {
          (element as HTMLInputElement).checked = (element as HTMLInputElement).value === 'assembler'
        } else {
          (element as HTMLInputElement).checked = (element as HTMLInputElement).value !== 'assembler'
        }
      })
      break

    case 'decimal':
      element.addEventListener('change', function (): void {
        if ((element as HTMLInputElement).checked) {
          state.decimal = ((element as HTMLInputElement).value === 'decimal')
        }
      })
      on('decimalChanged', function (): void {
        if (state.decimal) {
          (element as HTMLInputElement).checked = (element as HTMLInputElement).value === 'decimal'
        } else {
          (element as HTMLInputElement).checked = (element as HTMLInputElement).value !== 'decimal'
        }
      })
      break

    case 'autoCompileOnLoad':
      disableInput(element)
      element.addEventListener('change', function (): void {
        state.autoCompileOnLoad = (element as HTMLInputElement).checked
      })
      on('autoCompileOnLoadChanged', function (): void {
        (element as HTMLInputElement).checked = state.autoCompileOnLoad
      })
      break

    case 'autoRunOnLoad':
      disableInput(element)
      element.addEventListener('change', function (): void {
        state.autoRunOnLoad = (element as HTMLInputElement).checked
      })
      on('autoRunOnLoadChanged', function (): void {
        (element as HTMLInputElement).checked = state.autoRunOnLoad
      })
      break

    case 'autoFormatOnLoad':
      disableInput(element)
      element.addEventListener('change', function (): void {
        state.autoFormatOnLoad = (element as HTMLInputElement).checked
      })
      on('autoFormatOnLoadChanged', function (): void {
        (element as HTMLInputElement).checked = state.autoFormatOnLoad
      })
      break

    case 'alwaysSaveSettings':
      disableInputIfNotLoggedIn(element)
      element.addEventListener('change', function (): void {
        state.alwaysSaveSettings = (element as HTMLInputElement).checked
      })
      on('alwaysSaveSettingsChanged', function (): void {
        (element as HTMLInputElement).checked = state.alwaysSaveSettings
      })
      break
  
    // help page settings
    case 'commandsCategoryIndex':
      fillCommandsCategory(element as HTMLSelectElement)
      element.addEventListener('change', function (): void {
        state.commandsCategoryIndex = parseInt((element as HTMLSelectElement).value)
      })
      on('commandsCategoryIndexChanged', function (): void {
        (element as HTMLSelectElement).value = state.commandsCategoryIndex.toString(10)
      })
      break

    case 'showSimpleCommands':
      element.addEventListener('change', function (): void {
        state.showSimpleCommands = (element as HTMLInputElement).checked
      })
      on('showSimpleCommandsChanged', function (): void {
        (element as HTMLInputElement).checked = state.showSimpleCommands
      })
      break

    case 'showIntermediateCommands':
      element.addEventListener('change', function (): void {
        state.showIntermediateCommands = (element as HTMLInputElement).checked
      })
      on('showIntermediateCommandsChanged', function (): void {
        (element as HTMLInputElement).checked = state.showIntermediateCommands
      })
      break

    case 'showAdvancedCommands':
      element.addEventListener('change', function (): void {
        state.showAdvancedCommands = (element as HTMLInputElement).checked
      })
      on('showAdvancedCommandsChanged', function (): void {
        (element as HTMLInputElement).checked = state.showAdvancedCommands
      })
      break

    // file memory
    case 'currentFileIndex':
      fillFile(element as HTMLSelectElement)
      element.addEventListener('change', function () {
        state.currentFileIndex = parseInt((element as HTMLSelectElement).value)
      })
      on('filesChanged', function () {
        fillFile(element as HTMLSelectElement)
      })
      on('currentFileIndexChanged', function () {
        (element as HTMLSelectElement).value = state.currentFileIndex.toString(10)
      })
      break

    case 'filename':
      element.addEventListener('change', function () {
        state.filename = (element as HTMLInputElement).value
      })
      on('filenameChanged', function () {
        (element as HTMLInputElement).value = state.filename
      })
      break

    // machine runtime options
    case 'showCanvasOnRun':
      element.addEventListener('change', function (): void {
        state.showCanvasOnRun = (element as HTMLInputElement).checked
      })
      on('showCanvasOnRunChanged', function (): void {
        (element as HTMLInputElement).checked = state.showCanvasOnRun
      })
      break

    case 'showOutputOnWrite':
      element.addEventListener('change', function (): void {
        state.showOutputOnWrite = (element as HTMLInputElement).checked
      })
      on('showOutputOnWriteChanged', function (): void {
        (element as HTMLInputElement).checked = state.showOutputOnWrite
      })
      break

    case 'showMemoryOnDump':
      element.addEventListener('change', function (): void {
        state.showMemoryOnDump = (element as HTMLInputElement).checked
      })
      on('showMemoryOnDumpChanged', function (): void {
        (element as HTMLInputElement).checked = state.showMemoryOnDump
      })
      break

    case 'drawCountMax':
      element.addEventListener('change', function (): void {
        state.drawCountMax = parseInt((element as HTMLInputElement).value)
      })
      on('drawCountMaxChanged', function (): void {
        (element as HTMLInputElement).value = state.drawCountMax.toString(10)
      })
      break

    case 'codeCountMax':
      element.addEventListener('change', function (): void {
        state.codeCountMax = parseInt((element as HTMLInputElement).value)
      })
      on('codeCountMaxChanged', function (): void {
        (element as HTMLInputElement).value = state.codeCountMax.toString(10)
      })
      break

    case 'smallSize':
      element.addEventListener('change', function (): void {
        state.smallSize = parseInt((element as HTMLInputElement).value)
      })
      on('smallSizeChanged', function (): void {
        (element as HTMLInputElement).value = state.smallSize.toString(10)
      })
      break

    case 'stackSize':
      element.addEventListener('change', function (): void {
        state.stackSize = parseInt((element as HTMLInputElement).value)
      })
      on('stackSizeChanged', function (): void {
        (element as HTMLInputElement).value = state.stackSize.toString(10)
      })
      break

    case 'traceOnRun':
      disableInput(element)
      element.addEventListener('change', function (): void {
        state.traceOnRun = (element as HTMLInputElement).checked
      })
      on('traceOnRunChanged', function (): void {
        (element as HTMLInputElement).checked = state.traceOnRun
      })
      break

    case 'activateHCLR':
      disableInput(element)
      element.addEventListener('change', function (): void {
        state.activateHCLR = (element as HTMLInputElement).checked
      })
      on('activateHCLRChanged', function (): void {
        (element as HTMLInputElement).checked = state.activateHCLR
      })
      break

    case 'preventStackCollision':
      disableInput(element)
      element.addEventListener('change', function (): void {
        state.preventStackCollision = (element as HTMLInputElement).checked
      })
      on('preventStackCollisionChanged', function (): void {
        (element as HTMLInputElement).checked = state.preventStackCollision
      })
      break

    case 'rangeCheckArrays':
      disableInput(element)
      element.addEventListener('change', function (): void {
        state.rangeCheckArrays = (element as HTMLInputElement).checked
      })
      on('rangeCheckArraysChanged', function (): void {
        (element as HTMLInputElement).checked = state.rangeCheckArrays
      })
      break

    // compiler options
    case 'canvasStartSize':
      element.addEventListener('change', function (): void {
        if ((element as HTMLInputElement).checked) {
          state.canvasStartSize = parseInt((element as HTMLInputElement).value)
        }
      })
      on('canvasStartSizeChanged', function (): void {
        if ((element as HTMLInputElement).value === state.canvasStartSize.toString(10)) {
          (element as HTMLInputElement).checked = true
        }
      })
      break

    case 'setupDefaultKeyBuffer':
      disableInput(element)
      element.addEventListener('change', function (): void {
        state.setupDefaultKeyBuffer = (element as HTMLInputElement).checked
      })
      on('setupDefaultKeyBufferChanged', function (): void {
        (element as HTMLInputElement).checked = state.setupDefaultKeyBuffer
      })
      break

    case 'turtleAttributesAsGlobals':
      disableInput(element)
      element.addEventListener('change', function (): void {
        state.turtleAttributesAsGlobals = (element as HTMLInputElement).checked
      })
      on('turtleAttributesAsGlobalsChanged', function (): void {
        (element as HTMLInputElement).checked = state.turtleAttributesAsGlobals
      })
      break

    case 'initialiseLocals':
      disableInput(element)
      element.addEventListener('change', function (): void {
        state.initialiseLocals = (element as HTMLInputElement).checked
      })
      on('initialiseLocalsChanged', function (): void {
        (element as HTMLInputElement).checked = state.initialiseLocals
      })
      break

    case 'allowCSTR':
      disableInput(element)
      element.addEventListener('change', function (): void {
        state.allowCSTR = (element as HTMLInputElement).checked
      })
      on('allowCSTRChanged', function (): void {
        (element as HTMLInputElement).checked = state.allowCSTR
      })
      break

    case 'separateReturnStack':
      disableInput(element)
      element.addEventListener('change', function (): void {
        state.separateReturnStack = (element as HTMLInputElement).checked
      })
      on('separateReturnStackChanged', function (): void {
        (element as HTMLInputElement).checked = state.separateReturnStack
      })
      break

    case 'separateMemoryControlStack':
      disableInput(element)
      element.addEventListener('change', function (): void {
        state.separateMemoryControlStack = (element as HTMLInputElement).checked
      })
      on('separateMemoryControlStackChanged', function (): void {
        (element as HTMLInputElement).checked = state.separateMemoryControlStack
      })
      break

    case 'separateSubroutineRegisterStack':
      disableInput(element)
      element.addEventListener('change', function (): void {
        state.separateSubroutineRegisterStack = (element as HTMLInputElement).checked
      })
      on('separateSubroutineRegisterStackChanged', function (): void {
        (element as HTMLInputElement).checked = state.separateSubroutineRegisterStack
      })
      break

    default:
      console.error(`Unknown data binding '${(element as HTMLElement).dataset.binding}'.`)
      break
  }
}

function fillLanguage (input: HTMLSelectElement): void {
  fill(input, languages.map(x => option({ value: x, content: `Turtle ${x}` })))
}

function fillFont (input: HTMLSelectElement): void {
  fill(input, [
    option({ value: 'Consolas', content: 'Consolas' }),
    option({ value: 'Courier', content: 'Courier' }),
    option({ value: 'Lucida Sans Typewriter', content: 'Lucida Sans Typewriter' }),
    option({ value: 'Monospace', content: 'Monospace' })
  ])
}

function fillCommandsCategory (input: HTMLSelectElement): void {
  fill(input, commandCategories.map(x => option({ value: x.index.toString(10), content: `${(x.index + 1).toString(10)}. ${x.title}` })))
}

function fillFile (input: HTMLSelectElement): void {
  fill(input, state.files.map((file, index) => option({
    value: index.toString(10),
    content: `${(index + 1).toString(10).padStart(2, '0')} [${file.language}] ${file.name || '[no name]'}`,
    selected: (state.currentFileIndex === index) ? 'selected' : undefined
  })))
}

function disableInput (input: Element): void {
  input.setAttribute('disabled', 'disabled')
  if (input.parentElement) {
    input.parentElement.addEventListener('click', function () {
      send('error', new SystemError('This option cannot yet be modified in the online system.'))
    })
  }
}

async function disableInputIfNotLoggedIn (input: Element): Promise<void> {
  const response = await fetch('/status')
  const user = response.ok ? await response.json() : null
  if (user === null) {
    input.setAttribute('disabled', 'disabled')
    if (input.parentElement) {
      input.parentElement.addEventListener('click', function () {
        send('error', new SystemError('You must be logged in to change this setting.'))
      })
    }
  }
}
