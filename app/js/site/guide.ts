/**
 * Interactive functionality for the user guide.
 */
import { Mode } from '../state/modes'
import state from '../state/index'

// check for guide TOC and mode selection inputs
const guideToc = document.getElementById('guide-toc') as HTMLSelectElement
const guideRadios = document.querySelectorAll('input[name="guide"]')

// add interactivity if these elements are on the page
if (guideToc && (guideRadios.length > 0)) {
  for (const guideRadio of guideRadios) {
    guideRadio.addEventListener('change', () => {
      // update system state to reflect selection
      if ((guideRadio as HTMLInputElement).checked) {
        state.mode = (guideRadio as HTMLInputElement).value as Mode
      }
    })
  }
  state.on('mode-changed', updateGuide)
}

// update the guide to reflect the current viewing mode
function updateGuide (mode: Mode): void {
  // update the guide radios
  for (const guideRadio of guideRadios) {
    if ((guideRadio as HTMLInputElement).value === mode) {
      guideRadio.setAttribute('checked', 'checked')
    } else {
      guideRadio.removeAttribute('checked')
    }
  }
  // change the table of contents (add/remove some sections and update section numbers)
  if (guideToc) {
    for (const child of guideToc.children) {
      if (mode === 'simple' || mode === 'normal') {
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

  // show/hide mode specific elements
  for (const modeElement of document.querySelectorAll('[data-mode')) {
    const modes = (modeElement as HTMLElement).dataset.mode.split(',')
    if (modes.includes(mode)) {
      modeElement.classList.remove('hidden')
    } else {
      modeElement.classList.add('hidden')
    }
  }
}
