/*
 * The machine output component.
 */
import { on } from '../../tools/hub'

// get relevant elements
const output = document.querySelector('[data-component="output"]') as HTMLPreElement

if (output) {
  // write text to the textual output
  on('write', function (text: string): void {
    output.innerHTML += text
  })

  // clear and change the colour of the textual output
  on('output', function (data: { clear: boolean, colour: string}): void {
    if (data.clear) {
      output.innerHTML = ''
    }
    output.style.background = data.colour
  })
}
