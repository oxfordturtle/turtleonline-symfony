/*
 * The system menu.
 */
import * as dom from './dom.js'
import { send, on } from '../state/index.js'

// create the clickable menu items
const fileLink = dom.createIconWithText('a', { icon: 'fa fa-folder-open', text: 'File...' })
const codeLink = dom.createIconWithText('a', { icon: 'fa fa-terminal', text: 'Code Editor', active: true })
const usageLink = dom.createIconWithText('a', { icon: 'fa fa-chart-bar', text: 'Command Usage' })
const lexemesLink = dom.createIconWithText('a', { icon: 'fa fa-list', text: 'Program Lexemes' })
const pcodeLink = dom.createIconWithText('a', { icon: 'fa fa-code', text: 'Compiled Code' })
const canvasLink = dom.createIconWithText('a', { icon: 'fa fa-paint-brush', text: 'Canvas and Console', active: true })
const outputLink = dom.createIconWithText('a', { icon: 'fa fa-align-left', text: 'Textual Output' })
const memoryLink = dom.createIconWithText('a', { icon: 'fa fa-memory', text: 'Machine Memory' })
const optionsLink = dom.createIconWithText('a', { icon: 'fa fa-cogs', text: 'Runtime Options' })

// group them
const programLinks = [fileLink, codeLink, usageLink, lexemesLink, pcodeLink]
const machineLinks = [canvasLink, outputLink, memoryLink, optionsLink]

// create the headers
const programHeader = dom.createIconWithText('span', { icon: 'fa fa-laptop-code', text: 'Program' })
const machineHeader = dom.createIconWithText('span', { icon: 'fa fa-hdd', text: 'Machine' })

// create the menu
const menu = dom.createElement('nav', {
  classes: 'turtle-menu',
  content: [
    dom.createElement('div', {
      classes: 'turtle-sub-menu turtle-active',
      content: [programHeader].concat(programLinks)
    }),
    dom.createElement('div', {
      classes: 'turtle-sub-menu turtle-active',
      content: [machineHeader].concat(machineLinks)
    })
  ]
})

// export the menu
export default menu

// add event listeners to send state signals
fileLink.addEventListener('click', (e) => {
  send('close-menu')
  send('show-component', 'file')
  fileLink.classList.add('active')
  codeLink.classList.remove('active')
  usageLink.classList.remove('active')
  lexemesLink.classList.remove('active')
  pcodeLink.classList.remove('active')
})

codeLink.addEventListener('click', (e) => {
  send('close-menu')
  send('show-component', 'code')
  fileLink.classList.remove('active')
  codeLink.classList.add('active')
  usageLink.classList.remove('active')
  lexemesLink.classList.remove('active')
  pcodeLink.classList.remove('active')
})

usageLink.addEventListener('click', (e) => {
  send('close-menu')
  send('show-component', 'usage')
  fileLink.classList.remove('active')
  codeLink.classList.remove('active')
  usageLink.classList.add('active')
  lexemesLink.classList.remove('active')
  pcodeLink.classList.remove('active')
})

lexemesLink.addEventListener('click', (e) => {
  send('close-menu')
  send('show-component', 'lexemes')
  fileLink.classList.remove('active')
  codeLink.classList.remove('active')
  usageLink.classList.remove('active')
  lexemesLink.classList.add('active')
  pcodeLink.classList.remove('active')
})

pcodeLink.addEventListener('click', (e) => {
  send('close-menu')
  send('show-component', 'pcode')
  fileLink.classList.remove('active')
  codeLink.classList.remove('active')
  usageLink.classList.remove('active')
  lexemesLink.classList.remove('active')
  pcodeLink.classList.add('active')
})

canvasLink.addEventListener('click', (e) => {
  send('close-menu')
  send('show-component', 'canvas')
  canvasLink.classList.add('active')
  outputLink.classList.remove('active')
  memoryLink.classList.remove('active')
  optionsLink.classList.remove('active')
})

outputLink.addEventListener('click', (e) => {
  send('close-menu')
  send('show-component', 'output')
  canvasLink.classList.remove('active')
  outputLink.classList.add('active')
  memoryLink.classList.remove('active')
  optionsLink.classList.remove('active')
})

memoryLink.addEventListener('click', (e) => {
  send('close-menu')
  send('show-component', 'memory')
  canvasLink.classList.remove('active')
  outputLink.classList.remove('active')
  memoryLink.classList.add('active')
  optionsLink.classList.remove('active')
})

optionsLink.addEventListener('click', (e) => {
  send('close-menu')
  send('show-component', 'settings')
  canvasLink.classList.remove('active')
  outputLink.classList.remove('active')
  memoryLink.classList.remove('active')
  optionsLink.classList.add('active')
})

// register to update things on state change
on('open-menu', () => {
  menu.classList.add('active')
})

on('close-menu', () => {
  menu.classList.remove('active')
})

on('toggle-menu', () => {
  menu.classList.toggle('active')
})

on('show-component', (component) => {
  const programLinks = {
    file: fileLink,
    code: codeLink,
    usage: usageLink,
    lexemes: lexemesLink,
    pcode: pcodeLink
  }
  const machineLinks = {
    canvas: canvasLink,
    output: outputLink,
    memory: memoryLink,
    options: optionsLink
  }
  if (programLinks[component]) {
    Object.keys(programLinks).forEach((key) => {
      programLinks[key].classList.remove('active')
    })
    programLinks[component].classList.add('active')
  } else if (machineLinks[component]) {
    Object.keys(machineLinks).forEach((key) => {
      machineLinks[key].classList.remove('active')
    })
    machineLinks[component].classList.add('active')
  }
})
