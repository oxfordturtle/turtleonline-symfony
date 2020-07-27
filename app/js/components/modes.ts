/**
 * System mode toggling.
 */
import { Mode } from '../definitions/modes'
import state from '../state/index'

// register to keep in sync with system state
state.on('modeChanged', mode)

/** updates the page to reflect mode change */
function mode (): void {
  // get relevant elements
  const modeElements = document.querySelectorAll('[data-mode]') as NodeListOf<HTMLElement>
  const guideToc = document.querySelector('[data-component="guide-toc"]') as HTMLSelectElement

  // show/hide elements according to mode
  for (const element of modeElements) {
    const modes = element.dataset.mode.split(',')
    if (modes.includes(state.mode) || element.id === 'turtle') {
      element.classList.remove('hidden')
    } else {
      element.classList.add('hidden')
      if (element.classList.contains('system-tab-pane') && element.classList.contains('active')) {
        state.send('selectTab', 'canvas')
      }
    }
  }

  // update the user guide TOC
  if (guideToc) {
    for (const child of guideToc.children) {
      if (state.mode === 'simple' || state.mode === 'normal') {
        switch ((child as HTMLOptionElement).value) {
          case 'the-compile-menu': // fallthrough
          case 'the-tabs-menu':
            child.classList.add('hidden')
            break
          case 'the-run-menu':
            child.innerHTML = '8. The Run Menu'
            break
          case 'the-options-menu':
            child.innerHTML = '9. The Options Menu'
            break
          case 'the-examples-menu':
            child.innerHTML = '10. The Examples Menu'
            break
        }
      } else {
        switch ((child as HTMLOptionElement).value) {
          case 'the-compile-menu': // fallthrough
          case 'the-tabs-menu':
            child.classList.remove('hidden')
            break
          case 'the-run-menu':
            child.innerHTML = '10. The Run Menu'
            break
          case 'the-options-menu':
            child.innerHTML = '11. The Options Menu'
            break
          case 'the-examples-menu':
            child.innerHTML = '12. The Examples Menu'
            break
        }
      }
    }
  }
}
