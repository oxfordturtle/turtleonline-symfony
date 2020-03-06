import './style.scss'
import * as dom from '../dom.js'
import controls from '../controls/index.js'
import main from '../main/index.js'
import { on, send } from '../../state/index.js'

const system = dom.createElement('div', {
  classes: 'turtle-system',
  content: [controls, main]
})

export default system

system.addEventListener('click', (e) => {
  send('close-menu')
})

on('error', (error) => {
  console.error(error)
})
