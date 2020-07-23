/*
 * The system control bar.
 */
import * as dom from './dom'
import { languages } from '../definitions/languages'
import state from '../state/index'
import * as machine from '../machine/index'

// language select menu
const languageSelect = dom.createElement('select', {
  'aria-label': 'language',
  content: languages.map(language => dom.createElement('option', {
    content: language,
    value: language
  }))
})

// menu button
const menuButton = dom.createElement('button', {
  'aria-label': 'system menu',
  content: [dom.createElement('i', { classes: 'fa fa-bars' })]
})

// machine RUN/PAUSE button
const runButton = dom.createElement('button', {
  content: [dom.createElement('i', { classes: 'fa fa-play' })],
  title: 'RUN'
})

// machine HALT button
const haltButton = dom.createElement('button', {
  content: [dom.createElement('i', { classes: 'fa fa-stop' })],
  title: 'HALT',
  disabled: 'disabled'
})

// maximize/minimize button
const maxMinButton = dom.createElement('button', {
  content: [dom.createElement('i', { classes: 'fa fa-expand' })],
  title: 'Maximize'
})

// the controls div
export default dom.createElement('div', {
  classes: 'turtle-controls',
  content: [
    dom.createElement('div', { content: [menuButton] }),
    dom.createElement('div', { content: [languageSelect, runButton, haltButton, maxMinButton] })
  ]
})

// setup event listeners on interactive elements
menuButton.addEventListener('click', (e) => {
  e.stopPropagation()
  menuButton.blur()
  state.menuOpen = !state.menuOpen
})

languageSelect.addEventListener('change', (e) => {
  state.language = languageSelect.value
})

runButton.addEventListener('click', (e) => {
  runButton.blur()
  state.playPauseMachine()
})

haltButton.addEventListener('click', (e) => {
  haltButton.blur()
  state.haltMachine()
})

maxMinButton.addEventListener('click', (e) => {
  maxMinButton.blur()
  state.fullscreen = !state.fullscreen
})

// subscribe to keep in sync with system state
state.on('languageChanged', (language) => {
  languageSelect.value = language
})

state.on('fullscreenChanged', () => {
  if (document.body.classList.contains('fullscreen')) {
    const compress = document.querySelector('.fa-compress')
    if (compress) {
      compress.classList.remove('fa-compress')
      compress.classList.add('fa-expand')
      compress.parentElement.setAttribute('title', 'Maximize')
    }
    document.body.classList.remove('fullscreen')
  } else {
    const expand = document.querySelector('.fa-expand')
    if (expand) {
      expand.classList.remove('fa-expand')
      expand.classList.add('fa-compress')
      expand.parentElement.setAttribute('title', 'Expand down')
    }
    document.body.classList.add('fullscreen')
  }
})

machine.on('machineStarted', () => {
  dom.setContent(runButton, [dom.createElement('i', { classes: 'fa fa-pause' })])
  runButton.setAttribute('title', 'PAUSE')
  haltButton.removeAttribute('disabled')
})

machine.on('machinePaused', () => {
  dom.setContent(runButton, [dom.createElement('i', { classes: 'fa fa-play' })])
  runButton.setAttribute('title', 'RUN')
})

machine.on('machineUnpaused', () => {
  dom.setContent(runButton, [dom.createElement('i', { classes: 'fa fa-pause' })])
  runButton.setAttribute('title', 'PAUSE')
})

machine.on('machineStopped', () => {
  dom.setContent(runButton, [dom.createElement('i', { classes: 'fa fa-play' })])
  runButton.setAttribute('title', 'RUN')
  haltButton.setAttribute('disabled', 'disabled')
})
