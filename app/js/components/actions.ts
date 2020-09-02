import state from '../state/index'
import * as machine from '../machine/index'
import { fill, i } from '../tools/elements'
import { on, send } from '../tools/hub'
import { toggleMenu, openMenu, closeMenu, selectTab } from './view'
import { SystemError } from '../tools/error'

const notImplemented = new SystemError('This feature has not yet been implemented in the online system.')

for (const element of document.querySelectorAll('[data-action]')) {
  switch ((element as HTMLElement).dataset.action) {
    // general actions
    case 'toggleMenu':
      element.addEventListener('click', function (): void {
        (element as HTMLButtonElement).blur()
        for (const arg of (element as HTMLElement).dataset.arg?.split(',')) toggleMenu(arg)
      })
      on('toggleMenu', toggleMenu)
      break

    case 'openMenu':
      element.addEventListener('click', function (): void {
        (element as HTMLElement).blur()
        for (const arg of (element as HTMLElement).dataset.arg?.split(',')) openMenu(arg)
      })
      on('openMenu', openMenu)
      break

    case 'closeMenu':
      element.addEventListener('click', function (): void {
        (element as HTMLElement).blur()
        for (const arg of (element as HTMLElement).dataset.arg?.split(',')) closeMenu(arg)
      })
      on('closeMenu', closeMenu)
      break

    case 'selectTab':
      element.addEventListener('change', function (): void {
        (element as HTMLSelectElement).blur()
        selectTab((element as HTMLSelectElement).value)
      })
      on('selectTab', selectTab)
      break

    case 'maximize':
      element.addEventListener('click', function (): void {
        (element as HTMLButtonElement).blur()
        document.body.classList.toggle('fullscreen')
        if (document.body.classList.contains('fullscreen')) {
          fill(element as HTMLElement, [i({ className: 'fa fa-compress', title: 'Expand down' })])
        } else {
          fill(element as HTMLElement, [i({ className: 'fa fa-expand', title: 'Maximize' })])
        }
      })
      break
  
    // file menu actions
    case 'newProgram':
      element.addEventListener('click', function () {
        state.newFile()
      })
      break

    case 'newSkeletonProgram':
      element.addEventListener('click', function () {
        state.newFile(true)
      })
      break

    case 'openProgram':
      element.addEventListener('click', function () {
        state.openLocalFile()
      })
      break

    case 'saveProgram':
      element.addEventListener('click', function () {
        state.saveLocalFile()
      })
      break

    case 'saveExportFile':
      element.addEventListener('click', function () {
        send('error', notImplemented)
      })
      break

    case 'closeProgram':
      element.addEventListener('click', function () {
        state.closeCurrentFile()
      })
      break

    case 'copyCanvasGraphic':
      element.addEventListener('click', function () {
        send('error', notImplemented)
      })
      break

    case 'saveCanvasGraphic':
      element.addEventListener('click', function () {
        send('error', notImplemented)
      })
      break

    case 'printProgram':
      element.addEventListener('click', function () {
        send('error', notImplemented)
      })
      break

    case 'printOutputText':
      element.addEventListener('click', function () {
        send('error', notImplemented)
      })
      break

    case 'printConsoleText':
      element.addEventListener('click', function () {
        send('error', notImplemented)
      })
      break

    // edit actions
    case 'undo':
      element.addEventListener('click', function () {
        state.undo()
      })
      break

    case 'redo':
      element.addEventListener('click', function () {
        state.redo()
      })
      break

    case 'cut':
      element.addEventListener('click', function () {
        state.cut()
      })
      break

    case 'copy':
      element.addEventListener('click', function () {
        state.copy()
      })
      break

    case 'paste':
      element.addEventListener('click', function () {
        state.paste()
      })
      break

    case 'selectAll':
      element.addEventListener('click', function () {
        state.selectAll()
      })
      break

    case 'findAndReplace':
      element.addEventListener('click', function () {
        send('error', notImplemented)
      })
      break

    case 'autoFormat':
      element.addEventListener('click', function () {
        send('error', notImplemented)
      })
      break

    case 'storeCopy':
      element.addEventListener('click', function () {
        state.backupCode()
      })
      break

    case 'restoreCopy':
      element.addEventListener('click', function () {
        state.restoreCode()
      })
      break

    // compile actions
    case 'compile':
      element.addEventListener('click', function () {
        state.compileCurrentFile()
      })
      break

    case 'savePCodeJson':
      element.addEventListener('click', function () {
        send('error', notImplemented)
      })
      break

    case 'savePCodeBinary':
      element.addEventListener('click', function () {
        send('error', notImplemented)
      })
      break

    // run actions
    case 'run':
      element.addEventListener('click', function (): void {
        (element as HTMLButtonElement).blur()
        state.playPauseMachine()
      })
      break

    case 'halt':
      element.addEventListener('click', function (): void {
        (element as HTMLButtonElement).blur()
        machine.halt()
      })
      break

    case 'pause':
      element.addEventListener('click', function (): void {
        (element as HTMLButtonElement).blur()
        machine.pause()
      })
      break

    case 'resetMachine':
      element.addEventListener('click', function (): void {
        (element as HTMLButtonElement).blur()
        machine.reset()
        closeMenu('system')
      })
      break

    case 'viewMachineOptions':
      element.addEventListener('click', function (): void {
        send('selectTab', 'options')
        closeMenu('system')
      })
      break

    case 'loadAndRunPCode':
      element.addEventListener('click', function (): void {
        send('error', notImplemented)
      })
      break

    // options actions
    case 'saveSettings':
      element.addEventListener('click', function (): void {
        state.saveSettings()
      })
      break

    case 'resetSettings':
      element.addEventListener('click', function (): void {
        state.resetDefaults()
      })
      break

    // other actions
    case 'dumpMemory':
      element.addEventListener('click', function () {
        (element as HTMLButtonElement).blur()
        state.dumpMemory()
      })
      break

    default:
      console.error(`Unknown action '${(element as HTMLElement).dataset.action}'.`)
      break
  }
}
