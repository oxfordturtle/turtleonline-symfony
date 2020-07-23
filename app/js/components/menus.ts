/**
 * Site menus.
 */
import state from '../state/index'

export default init()

/** initialises the menus */
function init (): void {
  // get relevant elements
  const toggleButtons = document.querySelectorAll('[data-action="toggle-menu"') as NodeListOf<HTMLButtonElement>
  const closeButtons = document.querySelectorAll('[data-action="close-menu"') as NodeListOf<HTMLButtonElement>

  // add event listeners
  for (const toggleButton of toggleButtons) {
    toggleButton.addEventListener('click', (event: Event) => {
      event.stopPropagation()
      toggleButton.blur()
      for (const arg of toggleButton.dataset.arg?.split(',')) {
        toggleMenu(arg)
      }
    })
  }

  for (const closeButton of closeButtons) {
    closeButton.addEventListener('click', (event: Event) => {
      event.stopPropagation()
      closeButton.blur()
      for (const arg of closeButton.dataset.arg?.split(',')) {
        closeMenu(arg)
      }
    })
  }

  // register callbacks (to allow other modules to close menus dynamically)
  // state.on('toggleMenu', toggleMenu)
  // state.on('openMenu', openMenu)
  // state.on('closeMenu', closeMenu)
}

/** toggles a menu */
function toggleMenu (id: string): void {
  const menu = document.querySelector(`[data-menu="${id}"]`)
  if (menu) {
    if (menu.classList.contains('open')) {
      closeMenu(id)
    } else {
      openMenu(id)
    }
  }
}

/** opens a menu */
function openMenu (id: string): void {
  // get relevant elements
  const a = document.querySelector(`[data-action="toggle-menu"][data-arg="${id}"]`) as HTMLAnchorElement
  const menu = document.querySelector(`[data-menu="${id}"]`)

  if (a && menu) {
    // close all sibling menus
    const siblingMenus = a.parentElement.querySelectorAll(':scope > [data-menu]').length > 1
      ? a.parentElement.querySelectorAll('[data-menu]')
      : a.parentElement.parentElement.querySelectorAll('[data-menu]')
    for (const siblingMenu of siblingMenus) {
      closeMenu((siblingMenu as HTMLElement).dataset.menu)
    }

    // close other menu-specific menus
    switch (id) {
      case 'user':
        closeMenu('site')
        break
      case 'site': // fallthrough
      case 'documentation':
        //closeMenu('user')
        break
    }

    // open the menu
    a.classList.add('open')
    menu.classList.add('open')

    // maybe swap caret up/down
    const caret = a.querySelector('.fa-caret-down')
    if (caret) {
      caret.classList.remove('fa-caret-down')
      caret.classList.add('fa-caret-up')
    }
  }
}

/** closes a menu */
function closeMenu (id: string): void {
  // get relevant elements
  const a = document.querySelector(`[data-action="toggle-menu"][data-arg="${id}"]`) as HTMLAnchorElement
  const menu = document.querySelector(`[data-menu="${id}"]`)

  if (a && menu) {
    // close all sub menus
    for (const subMenu of menu.querySelectorAll('[data-menu]')) {
      closeMenu((subMenu as HTMLElement).dataset.menu)
    }

    // close the menu
    menu.classList.remove('open')
    a.classList.remove('open')

    // maybe swap caret up/down
    const caret = a.querySelector('.fa-caret-up')
    if (caret) {
      caret.classList.remove('fa-caret-up')
      caret.classList.add('fa-caret-down')
    }
  }
}
