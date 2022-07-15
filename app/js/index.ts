// type imports
import type { Language } from './constants/languages'

// module imports
import state from './state/index'
import { languages } from './constants/languages'
import { on } from './tools/hub'

// load general site components
import './components/actions'
import './components/bindings'
import './components/download'
import './components/languages'
import './components/modes'
import './components/preview'

// load help page components
import './components/reference/colours'
import './components/reference/commands'
import './components/reference/cursors'
import './components/reference/fonts'
import './components/reference/keycodes'

// load system components
import './components/system/canvas'
import './components/system/comments'
import './components/system/console'
import './components/system/controls'
import './components/system/editor'
import './components/system/examples'
import './components/system/memory'
import './components/system/output'
import './components/system/pcode'
import './components/system/syntax'
import './components/system/turtle'
import './components/system/usage'
import './components/system/variables'

// register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function (): void {
    navigator.serviceWorker.register('/service-worker.js')
  })
}

// add state to globals (for playing around in the console)
(globalThis as any).state = state

// look for the turtle element
const turtle = document.getElementById('turtle') as HTMLDivElement

// maybe setup state variables based on the turtle element's data properties
if (turtle) {
  if (turtle.dataset.language) {
    if (languages.includes(turtle.dataset.language as Language)) {
      state.language = turtle.dataset.language as Language
    }
  }

  if (turtle.dataset.example) {
    state.openExampleFile(turtle.dataset.example)
  }

  if (turtle.dataset.file) {
    state.openRemoteFile(turtle.dataset.file)
  }

  on('systemReady', function () {
    turtle.classList.remove('hidden')
  })
}

// maybe save settings before pageunload
window.addEventListener('beforeunload', function () {
  if (state.alwaysSaveSettings) {
    state.saveSettings()
  }
})

// register to handle state and machine errors
on('error', function (error: Error): void {
  console.error(error)
  window.alert(error.message)
})

// initialise the page
state.init()
