/**
 * Tabs.
 */
import state from '../state/index'

export default init()

/** initialise tab switching */
function init (): void {
  // get relevant elements
  const tabSelects = document.querySelectorAll('[data-action="select-tab"') as NodeListOf<HTMLSelectElement>

  // add event listeners
  for (const tabSelect of tabSelects) {
    tabSelect.addEventListener('change', (event: Event) => {
      tabSelect.blur()
      selectTab(tabSelect.value)
    })
  }

  // register callbacks (to allow other modules to switch tabs dynamically)
  // state.on('selectTab', selectTab)
}

/** activates a tab */
function selectTab (id: string): void {
  for (const tabPane of document.querySelectorAll(`[data-tab="${id}"]`)) {
    for (const sibling of tabPane.parentElement.children) {
      sibling.classList.remove('active')
    }
    tabPane.classList.add('active')
  }
}
