/**
 * The system menu.
 */
import { nav } from '../tools'
import compile from './compile'
import edit from './edit'
import examples from './examples'
import file from './file'
import options from './options'
import run from './run'
import tabs from './tabs'
import view from './view'
import state from '../state/index'

const menu = nav({ className: 'turtle-menu' }, [
  file,
  edit,
  view,
  tabs,
  compile,
  run,
  options,
  examples
])

export default menu

// register to keep in sync with system state
state.on('menu-open-changed', (menuOpen: boolean) => {
  if (menuOpen) {
    menu.classList.add('active')
  } else {
    menu.classList.remove('active')
  }
})
