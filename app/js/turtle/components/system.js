/*
 * The turtle system component.
 */
import * as dom from './dom.js'
import main from './main.js'
import menu from './menu.js'
import state from '../state/index.ts'

export default dom.createElement('div', {
  classes: 'turtle-system',
  content: [menu, main]
})

main.addEventListener('click', (e) => {
  state.menu = false
})

// function for resizing the canvas component depending on the screen size
function resizeCanvas () {
  main.style.gridTemplateColumns = `auto ${main.offsetHeight - 130}px`
}

// resize the canvas initially, and register to resize it when the window size changes
window.addEventListener('resize', resizeCanvas)
state.on('resize-canvas', resizeCanvas)
