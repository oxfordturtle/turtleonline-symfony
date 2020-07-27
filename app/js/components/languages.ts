/**
 * Language features.
 */
import { Language } from '../definitions/languages'
import state from '../state/index'
import highlight from '../compile/highlight'

export default init()

/** initialise language features */
function init (): void {
  // get relevant elements
  const codeElements = document.querySelectorAll('code[data-language]') as NodeListOf<HTMLElement>

  // add syntax highlighting to code elements
  for (const code of codeElements) {
    code.innerHTML = highlight(code.innerText, code.dataset.language as Language)
  }

  // register to keep in sync with system state
  state.on('languageChanged', language)
}

/** updates the page to reflect language change */
function language (language: Language): void {
  // get relevant elements
  const languageElements = document.querySelectorAll('[data-language]') as NodeListOf<HTMLElement>

  for (const element of languageElements) {
    // show/hide elements according to language
    if (language === element.dataset.language || element.id === 'turtle') {
      element.classList.remove('hidden')
    } else {
      element.classList.add('hidden')
    }
  }
}
