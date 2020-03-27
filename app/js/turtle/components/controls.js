/*
 * The system control bar.
 */
import * as dom from './dom.js'
import { languages } from '../definitions/languages.ts'
import state from '../state/index.ts'
import * as machine from '../machine/index.js'

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
  state.menu = !state.menu
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
state.on('language-changed', (language) => {
  languageSelect.value = language
})

state.on('fullscreen-changed', (fullscreen) => {
  if (fullscreen) {
    dom.setContent(maxMinButton, [dom.createElement('i', { classes: 'fa fa-compress' })])
    maxMinButton.setAttribute('title', 'Restore down')
  } else {
    dom.setContent(maxMinButton, [dom.createElement('i', { classes: 'fa fa-expand' })])
    maxMinButton.setAttribute('title', 'Maximize')
  }
})

machine.on('machine-started', () => {
  dom.setContent(runButton, [dom.createElement('i', { classes: 'fa fa-pause' })])
  runButton.setAttribute('title', 'PAUSE')
  haltButton.removeAttribute('disabled')
})

machine.on('machine-paused', () => {
  dom.setContent(runButton, [dom.createElement('i', { classes: 'fa fa-play' })])
  runButton.setAttribute('title', 'RUN')
})

machine.on('machine-unpaused', () => {
  dom.setContent(runButton, [dom.createElement('i', { classes: 'fa fa-pause' })])
  runButton.setAttribute('title', 'PAUSE')
})

machine.on('machine-stopped', () => {
  dom.setContent(runButton, [dom.createElement('i', { classes: 'fa fa-play' })])
  runButton.setAttribute('title', 'RUN')
  haltButton.setAttribute('disabled', 'disabled')
})
