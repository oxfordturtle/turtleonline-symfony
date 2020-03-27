const tabs = Array.from(document.querySelectorAll('[data-tab]'))

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

tabs.forEach((tab) => {
  tab.addEventListener('click', switchTab)
})
