import './style.scss'
import setImage from '../common/setImage.js'
import './toggle-menu.js'
import './toggle-sub-menu.js'
import turtleLogo from './turtle.png'

function init () {
  setImage('.logo > img', turtleLogo)
}

document.addEventListener('DOMContentLoaded', init)
