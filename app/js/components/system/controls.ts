/**
 * Controls component (buttons at the top right of the system).
 */
import * as machine from '../../machine/index'

// get relevant elements
const playButton = document.querySelector('[data-component="runButton"]') as HTMLButtonElement
const haltButton = document.querySelector('[data-component="haltButton"]') as HTMLButtonElement

if (playButton && haltButton) {
  // register to keep in sync with system state
  machine.on('played', () => {
    playButton.innerHTML = '<i class="fa fa-pause"></i>'
    haltButton.removeAttribute('disabled')
  })

  machine.on('paused', () => {
    playButton.innerHTML = '<i class="fa fa-play"></i>'
  })

  machine.on('unpaused', () => {
    playButton.innerHTML = '<i class="fa fa-pause"></i>'
  })

  machine.on('halted', () => {
    playButton.innerHTML = '<i class="fa fa-play"></i>'
    haltButton.setAttribute('disabled', 'disabled')
  })
}
