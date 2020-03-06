/*
The machine output component.
*/
import './style.scss'
import * as dom from '../dom'
import { on } from '../../state/machine'

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
