/*
 * The machine output component.
 */
import * as dom from './dom.js'
import { on } from '../state/machine.js'

// the output element (exported)
const output = dom.createElement('pre', { classes: 'turtle-output' })
export default output

// register to keep in sync with the turtle machine...

// write text to the textual output
on('write', function (text) {
  output.innerHTML += text
})

// clear and change the colour of the textual output
on('output', function ({ clear, colour }) {
  if (clear) {
    output.innerHTML = ''
  }
  output.style.background = colour
})
