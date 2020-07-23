/*
 * the online turtle system
 */
import { languages, Language } from './definitions/languages'
import state from './state/index'
import * as machine from './machine/index'
import * as dom from './components/dom'
import controls from './components/controls'
import system from './components/system'

// make the state object available in the console
globalThis.state = state

// look for the turtle element
const turtle = document.getElementById('turtle')

// set up if it's there
if (turtle) {
  // load the content
  turtle.classList.add('ready')
  dom.setContent(turtle, [controls, system])

  // maybe setup state variables based on the app's data properties
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

  // register to handle state and machine errors
  state.on('error', (error) => {
    console.error(error)
    window.alert(error.message)
  })

  machine.on('error', (error) => {
    console.error(error)
    window.alert(error.message)
  })
}

// initialise the page
state.init()
