/**
 * Controls component (buttons at the top right of the system).
 */
import state from '../../state/index'
import * as machine from '../../machine/index'

export default init()

/** initialises the controls component */
function init (): void {
  // get relevant elements
  const playButton = document.querySelector('[data-action="run"]') as HTMLAnchorElement
  const haltButton = document.querySelector('[data-action="halt"]') as HTMLAnchorElement
  const maximizeButton = document.querySelector('[data-action="maximize"]') as HTMLAnchorElement

  if (playButton && haltButton && maximizeButton) {
    // add event listeners
    playButton.addEventListener('click', state.playPauseMachine)
    haltButton.addEventListener('click', machine.halt)
    maximizeButton.addEventListener('click', maximize)

    // register to keep in sync with system state
    // machine.on('run', () => {})
    // machine.on('paused', () => {})
    // machine.on('unpaused', () => {})
    // machine.on('halted', () => {})
  }
}

/** maximizes/minimizes the system */
function maximize (): void {
  if (document.body.classList.contains('fullscreen')) {
    const compress = document.querySelector('.fa-compress')
    if (compress) {
      compress.classList.remove('fa-compress')
      compress.classList.add('fa-expand')
      compress.parentElement.setAttribute('title', 'Maximize')
    }
    document.body.classList.remove('fullscreen')
  } else {
    const expand = document.querySelector('.fa-expand')
    if (expand) {
      expand.classList.remove('fa-expand')
      expand.classList.add('fa-compress')
      expand.parentElement.setAttribute('title', 'Expand down')
    }
    document.body.classList.add('fullscreen')
  }
}
