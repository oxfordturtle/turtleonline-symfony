import { fill, div } from './tools'
import controls from './system/controls'
import body from './system/body'
import state from './state/index'

const turtle = document.getElementById('turtle')

if (turtle) {
  (window as any).state = state
  turtle.classList.add('ready')
  fill(turtle, [controls, body])
  state.ready()
}
