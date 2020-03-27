/*
 * The machine console component.
 */
import * as dom from './dom.js'
import { on } from '../machine/index.js'

// the console element
const console = dom.createElement('pre', { classes: 'turtle-console' })
export default console

// register to keep in sync with the turtle machine...

// log text in the console
on('log', function (text) {
  console.innerHTML += text
  console.scrollTop = console.scrollHeight
})

// delete a character from the console
on('backspace', function () {
  console.innerHTML = console.innerHTML.slice(0, -1)
  console.scrollTop = console.scrollHeight
})

// clear and change the colour of the console
on('console', function ({ clear, colour }) {
  if (clear) {
    console.innerHTML = ''
  }
  console.style.background = colour
})
