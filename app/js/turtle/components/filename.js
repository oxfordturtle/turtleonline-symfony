/*
 * The filename component.
 */
import * as dom from './dom.js'
import state from '../state/index.ts'

// current file select
const currentFileSelect = dom.createElement('select', { 'aria-label': 'Current file' })

// filename input
const filenameInput = dom.createElement('input', {
  type: 'text',
  placeholder: 'filename',
  'aria-label': 'Filename'
})

// close current file button
const closeFileButton = dom.createElement('button', {
  content: '<i class="fa fa-times"></i>',
  title: 'Close current file'
})

// the exported filename component
export default dom.createElement('div', {
  classes: 'turtle-filename',
  content: [currentFileSelect, filenameInput, closeFileButton]
})

// subscribe to keep in sync with the system state
state.on('files-changed', ({ files, currentFileIndex }) => {
  dom.setContent(currentFileSelect, files.map((file, index) => {
    return dom.createElement('option', { value: index, content: `${index + 1} [${file.language}]` })
  }))
  currentFileSelect.value = currentFileIndex
})

state.on('name-changed', (name) => {
  filenameInput.value = name
})

// setup event listeners on interactive elements
currentFileSelect.addEventListener('change', () => {
  state.currentFileIndex = currentFileSelect.value
})

filenameInput.addEventListener('keyup', () => {
  state.setFileName(filenameInput.value)
})

closeFileButton.addEventListener('click', () => {
  state.closeCurrentFile()
})
