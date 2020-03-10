/*
 * the online turtle system
 */
import * as state from './state/index.js'
import * as machine from './state/machine.js'
import * as dom from './components/dom.js'
import controls from './components/controls.js'
import system from './components/system.js'

// look for the turtle element
const turtle = document.getElementById('turtle')

// set up if it's there
if (turtle) {
  // load the content
  turtle.classList.add('ready')
  dom.setContent(turtle, [controls, system])

  // maybe setup state variables based on the app's data properties
  if (turtle.dataset.language) {
    state.send('set-language', turtle.dataset.language)
  }

  if (turtle.dataset.example) {
    state.send('set-example', turtle.dataset.example)
  }

  if (turtle.dataset.file) {
    state.send('load-remote-file', turtle.dataset.file)
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

  // register to toggle fullscreen
  state.on('fullscreen-changed', (fullscreen) => {
    if (fullscreen) {
      document.body.classList.remove('site')
      document.body.classList.add('pwa')
    } else {
      document.body.classList.remove('pwa')
      document.body.classList.add('site')
    }
    state.send('resize-canvas')
  })

  // send the page ready signal (which will update the components to reflect the initial state)
  state.send('ready')
  state.send('resize-canvas')
}
