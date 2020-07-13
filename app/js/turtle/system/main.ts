import { div } from '../tools'
import editor from '../components/editor'
import display from '../components/display'
import tabs from './tabs'
import state from '../state/index'

export default div(
  {
    className: 'turtle-main',
    on: ['click', () => { state.menuOpen = false }]
  },
  [
    editor,
    div({}, [display, tabs])]
)
