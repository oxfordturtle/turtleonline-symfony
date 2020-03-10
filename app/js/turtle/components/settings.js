/*
 * The machine settings component.
 */
import * as dom from './dom.js'
import { send, on } from '../state/index.js'

// the reset defaults button
const resetButton = dom.createElement('button', { content: 'Reset Defaults' })

// the options inputs
const showCanvasInput = dom.createElement('input', { type: 'checkbox' })
const showOutputInput = dom.createElement('input', { type: 'checkbox' })
const showMemoryInput = dom.createElement('input', { type: 'checkbox' })
const drawCountMaxInput = dom.createElement('input', { type: 'number', min: '1', max: '100' })
const codeCountMaxInput = dom.createElement('input', { type: 'number', min: '0', max: '10000000' })
const smallSizeInput = dom.createElement('input', { type: 'number', min: '0', max: '100' })
const stackSizeInput = dom.createElement('input', { type: 'number', min: '100', max: '1000000' })

// the buttons div (exported)
export const buttons = dom.createElement('div', { classes: 'turtle-buttons', content: [resetButton] })

// the options elements (exported)
export const showOptions = dom.createElement('div', {
  classes: 'turtle-checkboxes',
  content: [
    dom.createElement('label', { content: [showCanvasInput, dom.createTextNode('Show canvas on run')] }),
    dom.createElement('label', { content: [showOutputInput, dom.createTextNode('Show output on write')] }),
    dom.createElement('label', { content: [showMemoryInput, dom.createTextNode('Show memory on dump')] })
  ]
})

export const drawCountMax = dom.createElement('div', {
  classes: 'turtle-option',
  content: [
    dom.createElement('label', { content: [dom.createTextNode('Default number of simultaneous drawing commands:'), drawCountMaxInput] }),
    dom.createElement('p', { content: 'Performing more than one drawing command at a time greatly increases drawing speed. Set to 1 to see every drawing change individually (slower). The pause and update/noupdate commands override this default.' })
  ]
})

export const codeCountMax = dom.createElement('div', {
  classes: 'turtle-option',
  content: [
    dom.createElement('label', { content: [dom.createTextNode('Maximum number of commands before forced update:'), codeCountMaxInput] }),
    dom.createElement('p', { content: 'This number sets how many commands to allow before forcing the canvas to update. A higher number generally results in faster program execution, but some programs can cause the system to hang if they execute a large number of commands without ever updating the canvas.' })
  ]
})

export const smallSize = dom.createElement('div', {
  classes: 'turtle-option',
  content: [
    dom.createElement('label', { content: [dom.createTextNode('Resolution at which to scale up the canvas:'), smallSizeInput] }),
    dom.createElement('p', { content: 'When a program sets the canvas resolution to this value or less (in either dimension), the machine will artificially double the resolution, and make everything twice as big. This helps very low resolution images to display more clearly and accurately. Set to 0 to disable.' })
  ]
})

export const stackSize = dom.createElement('div', {
  classes: 'turtle-option',
  content: [
    dom.createElement('label', { content: [dom.createTextNode('Memory Stack size, after which Memory Heap starts:'), stackSizeInput] }),
    dom.createElement('p', { content: 'The Memory Stack stores the variables of the program and subroutines, with string variables represented as pointers to the Memory Heap. The Memory Heap lies directly above the Memory Stack, and stores the actual strings. The Memory Stack should be sufficiently large to avoid the storage of program variables overflowing into the Memory Heap.' })
  ]
})

// add event listeners to interactive elements
resetButton.addEventListener('click', (e) => {
  send('reset-machine-options')
  e.currentTarget.blur()
})

showCanvasInput.addEventListener('change', (e) => {
  send('toggle-show-canvas')
})

showOutputInput.addEventListener('change', (e) => {
  send('toggle-show-output')
})

showMemoryInput.addEventListener('change', (e) => {
  send('toggle-show-memory')
})

drawCountMaxInput.addEventListener('change', (e) => {
  send('set-draw-count-max', drawCountMaxInput.value)
})

codeCountMaxInput.addEventListener('change', (e) => {
  send('set-code-count-max', codeCountMaxInput.value)
})

smallSizeInput.addEventListener('change', (e) => {
  send('set-small-size', smallSizeInput.value)
})

stackSizeInput.addEventListener('change', (e) => {
  send('set-stack-size', stackSizeInput.value)
})

// register to keep in sync with system state
on('show-canvas-changed', (value) => { showCanvasInput.checked = value })
on('show-output-changed', (value) => { showOutputInput.checked = value })
on('show-memory-changed', (value) => { showMemoryInput.checked = value })
on('draw-count-max-changed', (value) => { drawCountMaxInput.value = value })
on('code-count-max-changed', (value) => { codeCountMaxInput.value = value })
on('small-size-changed', (value) => { smallSizeInput.value = value })
on('stack-size-changed', (value) => { stackSizeInput.value = value })
