/**
 * Create and bind event listeners to action elements on the page.
 */
import { Language } from './definitions/languages'
import state from './state/index'

for (const el of document.querySelectorAll('[data-action]')) {
  const element = el as HTMLElement
  const arg = element.dataset.arg
  const target = document.querySelector(`[data-component="${arg}"]`) as HTMLElement
  switch (element.dataset.action) {
    case 'toggle-menu':
      element.addEventListener('click', () => { toggleMenu(arg) })
      break

    case 'close-menu':
      element.addEventListener('click', () => { closeMenu(arg) })
      break
  }
}

function toggleMenu(id: string): void {
  const menu = document.querySelector(`[data-menu="${id}"]`)
  if (menu.classList.contains('active')) {
    closeMenu(id)
  } else {
    openMenu(id)
  }
}

function openMenu (id: string): void {
  const a = document.querySelector(`[data-action="toggle-menu"][data-arg="${id}"]`)
  const menu = document.querySelector(`[data-menu="${id}"]`)
  const caret = a.querySelector('.fa-caret-down')
  if (caret) {
    caret.classList.remove('fa-caret-down')
    caret.classList.add('fa-caret-up')
  }
  menu.classList.add('active')
  switch (id) {
    case 'user':
      closeMenu('site')
      break
    case 'site': // fallthrough
    case 'documentation':
      closeMenu('user')
      break
  }
}

function closeMenu(id: string): void {
  const a = document.querySelector(`[data-action="toggle-menu"][data-arg="${id}"]`)
  const menu = document.querySelector(`[data-menu="${id}"]`)
  const caret = a.querySelector('.fa-caret-up')
  if (caret) {
    caret.classList.remove('fa-caret-up')
    caret.classList.add('fa-caret-down')
  }
  menu.classList.remove('active')
  for (const subMenu of menu.querySelectorAll('[data-menu]')) {
    closeMenu((subMenu as HTMLElement).dataset.menu)
  }
}



/*

// select tab
for (const element of document.querySelectorAll('[data-select-tab]')) {
  element.addEventListener('change', (event: Event) => {
    const element = event.currentTarget as HTMLSelectElement
    const targetId = element.value
    const target = document.querySelector(`[data-tab="${targetId}"]`)
    for (const sibling of target.parentElement.children) {
      sibling.classList.remove('active')
    }
    target.classList.add('active')
    element.blur()
  })
}

// toggle menu
for (const element of document.querySelectorAll('[data-toggle-menu]')) {
  element.addEventListener('click', (event: Event) => {
    const element = event.currentTarget as HTMLAnchorElement
    const targetId = element.dataset.toggleMenu
    const target = document.querySelector(`[data-menu="${targetId}"]`)
    element.blur()
    target.classList.toggle('active')
  })
}

// close menu
for (const element of document.querySelectorAll('[data-close-menu]')) {
  element.addEventListener('click', (event: Event) => {
    const element = event.currentTarget as HTMLElement
    const targetIds = element.dataset.closeMenu.split(',')
    for (const targetId of targetIds) {
      const target = document.querySelector(`[data-menu="${targetId}"]`)
      target.classList.remove('active')
    }
  })
}

// select language
for (const element of document.querySelectorAll('[data-language-select')) {
  element.addEventListener('change', (event: Event) => {
    const element = event.currentTarget as HTMLSelectElement
    element.blur()
    state.language = element.value as Language
  })
}

// select current file
for (const element of document.querySelectorAll('[data-select-current-file]')) {
  element.addEventListener('change', (event: Event) => {
    const element = event.currentTarget as HTMLSelectElement
    element.blur()
    state.currentFileIndex = parseInt(element.value)
  })
}
*/
