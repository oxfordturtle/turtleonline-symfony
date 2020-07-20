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
