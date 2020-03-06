/**
 * The main component.
 *
 * This wraps up most of the other components, specifically everything underneath the system controls.
 */
import './style.scss'
import * as dom from '../dom'
import code from '../code'
import * as file from '../file'
import usage from '../usage'
import lexemes from '../lexemes'
import * as pcode from '../pcode'
import turtle from '../turtle'
import canvas from '../canvas'
import console from '../console'
import output from '../output'
import * as memory from '../memory'
import * as settings from '../settings'
import { on, send } from '../../state'

// the various blocks
const fileBlock = dom.createElement('div', {
  classes: 'turtle-block',
  content: [file.currentFile, file.newFile, file.openFile, file.openExample]
})

const codeBlock = dom.createElement('div', {
  classes: 'turtle-block turtle-active',
  content: [code]
})

const usageBlock = dom.createElement('div', {
  classes: 'turtle-block',
  content: [usage]
})

const lexemesBlock = dom.createElement('div', {
  classes: 'turtle-block',
  content: [lexemes]
})

const pcodeBlock = dom.createElement('div', {
  classes: 'turtle-block',
  content: [pcode.options, pcode.list]
})

const canvasBlock = dom.createElement('div', {
  classes: 'turtle-block turtle-active',
  content: [turtle, canvas, console]
})

const outputBlock = dom.createElement('div', {
  classes: 'turtle-block',
  content: [output]
})

const memoryBlock = dom.createElement('div', {
  classes: 'turtle-block',
  content: [memory.buttons, memory.stack, memory.heap]
})

const settingsBlock = dom.createElement('div', {
  classes: 'turtle-block',
  content: [settings.buttons, settings.showOptions, settings.drawCountMax, settings.codeCountMax, settings.stackSize]
})

// the left hand side blocks
const leftBlocksArray = [fileBlock, codeBlock, usageBlock, lexemesBlock, pcodeBlock]
const leftBlocks = dom.createElement('div', { classes: 'turtle-blocks', content: leftBlocksArray })

// the right hand side blocks
const rightBlocksArray = [canvasBlock, outputBlock, memoryBlock, settingsBlock]
const rightBlocks = dom.createElement('div', { classes: 'turtle-blocks turtle-active', content: rightBlocksArray })

// the main component (exported)
export default dom.createElement('main', {
  classes: 'turtle-main',
  content: [leftBlocks, rightBlocks]
})

// register to stay in sync with the system state
on('show-component', (data) => {
  switch (data) {
    case 'file': // fallthrough
    case 'code': // fallthrough
    case 'usage': // fallthrough
    case 'lexemes': // fallthrough
    case 'pcode':
      leftBlocksArray.forEach(x => { x.classList.remove('turtle-active') })
      leftBlocks.classList.add('turtle-active')
      rightBlocks.classList.remove('turtle-active')
      break
    case 'canvas': // fallthrough
    case 'output': // fallthrough
    case 'memory': // fallthrough
    case 'settings':
      rightBlocksArray.forEach(x => { x.classList.remove('turtle-active') })
      rightBlocks.classList.add('turtle-active')
      leftBlocks.classList.remove('turtle-active')
      break
  }
  switch (data) {
    case 'file':
      fileBlock.classList.add('turtle-active')
      break
    case 'code':
      codeBlock.classList.add('turtle-active')
      break
    case 'usage':
      usageBlock.classList.add('turtle-active')
      break
    case 'lexemes':
      lexemesBlock.classList.add('turtle-active')
      break
    case 'pcode':
      pcodeBlock.classList.add('turtle-active')
      break
    case 'canvas':
      canvasBlock.classList.add('turtle-active')
      break
    case 'output':
      outputBlock.classList.add('turtle-active')
      break
    case 'memory':
      memoryBlock.classList.add('turtle-active')
      break
    case 'settings':
      settingsBlock.classList.add('turtle-active')
      break
  }
})

on('file-changed', () => {
  code.scrollTop = 0
  code.scrollLeft = 0
  send('show-component', 'code')
})

// function for resizing the canvas component depending on the screen size
function resizeCanvas () {
  canvas.style.maxWidth = `${window.innerHeight - 200}px`
}

// resize the canvas initially, and register to resize it when the window size changes
window.addEventListener('resize', resizeCanvas)
resizeCanvas()
