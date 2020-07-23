/*
 * The turtle system component.
 */
import * as dom from './dom'
import main from './main'
import menu from './menu'
import state from '../state/index'

export default dom.createElement('div', {
  classes: 'turtle-system',
  content: [menu, main]
})

main.addEventListener('click', (e) => {
  state.menu = false
})
