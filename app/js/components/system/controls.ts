// module imorts
import { on } from '../../tools/hub'

// get relevant elements
const playButton = document.querySelector('[data-component="runButton"]') as HTMLButtonElement
const haltButton = document.querySelector('[data-component="haltButton"]') as HTMLButtonElement

if (playButton && haltButton) {
  // register to keep in sync with system state
  on('played', () => {
    playButton.innerHTML = '<i class="fa fa-pause"></i>'
    haltButton.removeAttribute('disabled')
  })

  on('paused', () => {
    playButton.innerHTML = '<i class="fa fa-play"></i>'
  })

  on('unpaused', () => {
    playButton.innerHTML = '<i class="fa fa-pause"></i>'
  })

  on('halted', () => {
    playButton.innerHTML = '<i class="fa fa-play"></i>'
    haltButton.setAttribute('disabled', 'disabled')
  })
}
