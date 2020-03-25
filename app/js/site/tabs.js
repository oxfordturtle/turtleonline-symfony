const tabs = Array.from(document.querySelectorAll('[data-tab]'))

function activate (element) {
  Array.from(element.parentElement.children).forEach((sibling) => {
    sibling.classList.remove('active')
  })
  element.classList.add('active')
}

function switchTab (event) {
  activate(event.currentTarget)
  activate(document.getElementById(event.currentTarget.dataset.tab))
}

tabs.forEach((tab) => {
  tab.addEventListener('click', switchTab)
})
