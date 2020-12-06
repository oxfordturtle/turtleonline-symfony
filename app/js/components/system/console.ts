// module imports
import { on } from '../../tools/hub'

// get relevant elements
const console = document.querySelector('[data-component="console"]') as HTMLPreElement

if (console) {
  // log text in the console
  on('log', function (text: string): void {
    console.innerHTML += text
    console.scrollTop = console.scrollHeight
  })

  // delete a character from the console
  on('backspace', function (): void {
    console.innerHTML = console.innerHTML.slice(0, -1)
    console.scrollTop = console.scrollHeight
  })

  // clear and change the colour of the console
  on('console', function (data: { clear: boolean, colour: string }) {
    if (data.clear) {
      console.innerHTML = ''
    }
    console.style.background = data.colour
  })
}
