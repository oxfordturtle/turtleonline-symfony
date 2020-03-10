/*
 * The program code component.
 */
import * as dom from './dom.js'
import highlight from '../compiler/highlight.js'
import { send, on } from '../state/index.js'

// the editor line numbers
const lineNumbers = dom.createElement('ol', { classes: 'turtle-line-numbers' })

// the textarea for inputting code
const plainCode = dom.createElement('textarea', {
  classes: 'turtle-plain-code',
  wrap: 'off',
  spellcheck: false,
  autocapitalize: 'off',
  autocomplete: 'off',
  autocorrect: 'off',
  autofocus: 'true'
})

// the formatted and highlighted code
const prettyCode = dom.createElement('code')

// the pre element for holding the formatted and highlighted code
const prettyCodeWrapper = dom.createElement('pre', { content: [prettyCode] })

// the div element containing the textarea and the formatted code
const turtleCodeWrapper = dom.createElement('div', {
  classes: 'turtle-code-wrapper',
  content: [plainCode, prettyCodeWrapper]
})

// the code editor component (all the above wrapped up and exported)
export default dom.createElement('div', {
  classes: 'turtle-code',
  content: [
    lineNumbers,
    turtleCodeWrapper
  ]
})

// add event listeners to interactive elements
plainCode.addEventListener('keydown', (e) => {
  // catch tab press and insert two spaces at the cursor
  if (e.keyCode === 9) {
    const pos = plainCode.selectionStart
    const left = plainCode.value.slice(0, pos)
    const right = plainCode.value.slice(pos)
    e.preventDefault()
    plainCode.value = [left, right].join('  ')
    send('set-code', plainCode.value)
    plainCode.selectionStart = pos + 2
    plainCode.selectionEnd = pos + 2
  }

  // if return was pressed, scroll the code wrapper all the way to the left
  if (e.keyCode === 13) {
    turtleCodeWrapper.scrollLeft = 0
  }
})

plainCode.addEventListener('input', (e) => {
  send('set-code', plainCode.value)
})

// register to keep in sync with the application state
on('code-changed', ({ code, language }) => {
  const lines = code.split('\n')
  dom.setContent(lineNumbers, lines.map((x, y) => dom.createElement('li', { content: y + 1 })))
  dom.setContent(prettyCode, highlight(code, language))
  window.requestAnimationFrame(() => {
    plainCode.value = code
    plainCode.style.height = `${lines.length * 1.5}em`
    plainCode.style.width = `${prettyCodeWrapper.scrollWidth.toString(10)}px`
    prettyCodeWrapper.style.height = `${lines.length * 1.5}em`
  })
})

// keep line numbers scrolling in sync with the code
turtleCodeWrapper.addEventListener('scroll', () => {
  lineNumbers.scrollTop = turtleCodeWrapper.scrollTop
  if (turtleCodeWrapper.scrollLeft <= 8) {
    turtleCodeWrapper.scrollLeft = 0
  }
})
