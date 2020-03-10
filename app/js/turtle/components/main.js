/*
 * The main component.
 *
 * This wraps up most of the other components, specifically everything underneath the system controls.
 */
import * as dom from './dom.js'
import code from './code.js'
import * as file from './file.js'
import usage from './usage.js'
import lexemes from './lexemes.js'
import * as pcode from './pcode.js'
import turtle from './turtle.js'
import canvas from './canvas.js'
import console from './console.js'
import output from './output.js'
import * as memory from './memory.js'
import * as settings from './settings.js'
import { on } from '../state/index.js'

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
  content: [settings.buttons, settings.showOptions, settings.drawCountMax, settings.codeCountMax, settings.smallSize, settings.stackSize]
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
})
