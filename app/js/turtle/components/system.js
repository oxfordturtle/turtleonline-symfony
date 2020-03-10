/*
 * The turtle system component.
 */
import * as dom from './dom.js'
import main from './main.js'
import menu from './menu.js'
import { on, send } from '../state/index.js'

export default dom.createElement('div', {
  classes: 'turtle-system',
  content: [menu, main]
})

main.addEventListener('click', (e) => {
  send('close-menu')
})

// function for resizing the canvas component depending on the screen size
function resizeCanvas () {
  main.style.gridTemplateColumns = `auto ${main.offsetHeight - 136}px`
}

// resize the canvas initially, and register to resize it when the window size changes
window.addEventListener('resize', resizeCanvas)
on('resize-canvas', resizeCanvas)
