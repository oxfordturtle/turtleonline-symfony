/*
The system control bar.
*/
import './style.scss'
import * as dom from '../dom'
import languages from '../../constants/languages'
import { send, on } from '../../state'
import * as machine from '../../state/machine'

// language select menu
const languageSelect = dom.createElement('select', {
  content: languages.map(language => dom.createElement('option', {
    content: language,
    value: language
  }))
})

// menu button
const menuButton = dom.createElement('button', {
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
  send('open-menu')
})

languageSelect.addEventListener('change', (e) => {
  send('set-language', languageSelect.value)
})

runButton.addEventListener('click', (e) => {
  runButton.blur()
  send('machine-run-pause')
})

haltButton.addEventListener('click', (e) => {
  haltButton.blur()
  send('machine-halt')
})

maxMinButton.addEventListener('click', (e) => {
  maxMinButton.blur()
  send('toggle-fullscreen')
})

// subscribe to keep in sync with system state
on('language-changed', (language) => {
  languageSelect.value = language
})

on('fullscreen-changed', (fullscreen) => {
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
