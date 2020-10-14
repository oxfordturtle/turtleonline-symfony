import state from '../state/index'
import * as machine from '../machine/index'
import { fill, i } from '../tools/elements'
import { on, send } from '../tools/hub'
import {
  toggleMenu,
  openMenu,
  closeMenu,
  toggleSystemMenu,
  openSystemMenu,
  closeSystemMenu,
  selectTab
} from './view'
import { SystemError } from '../tools/error'

const notImplemented = new SystemError('This feature has not yet been implemented in the online system.')

for (const element of document.querySelectorAll('[data-action]')) {
  const el = element as HTMLButtonElement
  switch (el.dataset.action) {
    // general actions
    case 'toggleMenu':
      el.addEventListener('click', function (): void {
        el.blur()
        if (el.dataset.arg) {
          toggleMenu(el.dataset.arg)
        }
      })
      on('toggleMenu', toggleMenu)
      break

    case 'openMenu':
      el.addEventListener('click', function (): void {
        el.blur()
        if (el.dataset.arg) {
          openMenu(el.dataset.arg)
        }
      })
      on('openMenu', openMenu)
      break

    case 'closeMenu':
      el.addEventListener('click', function (): void {
        el.blur()
        if (el.dataset.arg) {
          closeMenu(el.dataset.arg)
        }
      })
      on('closeMenu', closeMenu)
      break

    case 'closeSiteMenus':
      el.addEventListener('click', function (): void {
        closeMenu('site')
        closeMenu('documentation')
        closeMenu('user')
      })
      break

    case 'toggleSystemMenu':
      el.addEventListener('click', function (): void {
        el.blur()
        if (el.dataset.arg) {
          toggleSystemMenu(el.dataset.arg)
        }
      })
      on('toggleSystemMenu', toggleSystemMenu)
      break

    case 'openSystemMenu':
      el.addEventListener('click', function (): void {
        el.blur()
        if (el.dataset.arg) {
          openSystemMenu(el.dataset.arg)
        }
      })
      on('openSystemMenu', openSystemMenu)
      break

    case 'closeSystemMenu':
      el.addEventListener('click', function (): void {
        el.blur()
        if (el.dataset.arg) {
          closeSystemMenu(el.dataset.arg)
        }
      })
      on('closeSystemMenu', closeSystemMenu)
      break

    case 'selectTab':
      el.addEventListener('change', function (): void {
        el.blur()
        selectTab(el.value)
      })
      on('selectTab', selectTab)
      break

    case 'maximize':
      el.addEventListener('click', function (): void {
        el.blur()
        document.body.classList.toggle('fullscreen')
        if (document.body.classList.contains('fullscreen')) {
          fill(el, [i({ className: 'fa fa-compress', title: 'Expand down' })])
        } else {
          fill(el, [i({ className: 'fa fa-expand', title: 'Maximize' })])
        }
      })
      break
  
    // file menu actions
    case 'newProgram':
      el.addEventListener('click', function () {
        state.newFile()
      })
      break

    case 'newSkeletonProgram':
      el.addEventListener('click', function () {
        state.newFile(true)
      })
      break

    case 'openProgram':
      el.addEventListener('click', function () {
        state.openLocalFile()
      })
      break

    case 'saveProgram':
      el.addEventListener('click', function () {
        state.saveLocalFile()
      })
      break

    case 'saveExportFile':
      el.addEventListener('click', function () {
        send('error', notImplemented)
      })
      break

    case 'closeProgram':
      el.addEventListener('click', function () {
        state.closeCurrentFile()
      })
      break

    case 'copyCanvasGraphic':
      el.addEventListener('click', function () {
        send('error', notImplemented)
      })
      break

    case 'saveCanvasGraphic':
      el.addEventListener('click', function () {
        send('error', notImplemented)
      })
      break

    case 'printProgram':
      el.addEventListener('click', function () {
        send('error', notImplemented)
      })
      break

    case 'printOutputText':
      el.addEventListener('click', function () {
        send('error', notImplemented)
      })
      break

    case 'printConsoleText':
      el.addEventListener('click', function () {
        send('error', notImplemented)
      })
      break

    // edit actions
    case 'undo':
      el.addEventListener('click', function () {
        state.undo()
      })
      break

    case 'redo':
      el.addEventListener('click', function () {
        state.redo()
      })
      break

    case 'cut':
      el.addEventListener('click', function () {
        state.cut()
      })
      break

    case 'copy':
      el.addEventListener('click', function () {
        state.copy()
      })
      break

    case 'paste':
      el.addEventListener('click', function () {
        state.paste()
      })
      break

    case 'selectAll':
      el.addEventListener('click', function () {
        state.selectAll()
      })
      break

    case 'findAndReplace':
      el.addEventListener('click', function () {
        send('error', notImplemented)
      })
      break

    case 'autoFormat':
      el.addEventListener('click', function () {
        send('error', notImplemented)
      })
      break

    case 'storeCopy':
      el.addEventListener('click', function () {
        state.backupCode()
      })
      break

    case 'restoreCopy':
      el.addEventListener('click', function () {
        state.restoreCode()
      })
      break

    // compile actions
    case 'compile':
      el.addEventListener('click', function () {
        state.compileCurrentFile()
      })
      break

    case 'savePCodeJson':
      el.addEventListener('click', function () {
        send('error', notImplemented)
      })
      break

    case 'savePCodeBinary':
      el.addEventListener('click', function () {
        send('error', notImplemented)
      })
      break

    // run actions
    case 'run':
      el.addEventListener('click', function (): void {
        el.blur()
        state.playPauseMachine()
      })
      break

    case 'halt':
      el.addEventListener('click', function (): void {
        el.blur()
        machine.halt()
      })
      break

    case 'pause':
      el.addEventListener('click', function (): void {
        el.blur()
        machine.pause()
      })
      break

    case 'resetMachine':
      el.addEventListener('click', function (): void {
        el.blur()
        machine.reset()
        closeMenu('system')
      })
      break

    case 'viewMachineOptions':
      el.addEventListener('click', function (): void {
        send('selectTab', 'options')
        closeMenu('system')
      })
      break

    case 'loadAndRunPCode':
      el.addEventListener('click', function (): void {
        send('error', notImplemented)
      })
      break

    // options actions
    case 'saveSettings':
      el.addEventListener('click', function (): void {
        state.saveSettings()
      })
      break

    case 'resetSettings':
      el.addEventListener('click', function (): void {
        state.resetDefaults()
      })
      break

    // other actions
    case 'dumpMemory':
      el.addEventListener('click', function () {
        el.blur()
        state.dumpMemory()
      })
      break

    default:
      console.error(`Unknown action '${el.dataset.action}'.`)
      break
  }
}
