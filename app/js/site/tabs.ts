/**
 * enable tab functionality
 */
const tabs = Array.from(document.querySelectorAll('[data-tab]'))
const selects = Array.from(document.querySelectorAll('[data-action="select-tab"]'))

function activate (element: Element): void {
  Array.from(element.parentElement.children).forEach((sibling) => {
    sibling.classList.remove('active')
  })
  element.classList.add('active')
}

function switchTab (event: Event): void {
  const element = event.currentTarget as HTMLElement
  activate(element)
  activate(document.getElementById(element.dataset.tab))
}

function selectTab (event: Event): void {
  const element = event.currentTarget as HTMLSelectElement
  activate(document.getElementById(element.value))
}

tabs.forEach((tab) => {
  tab.addEventListener('click', switchTab)
})

selects.forEach((select) => {
  select.addEventListener('change', selectTab)
})
