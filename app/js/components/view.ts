/** toggles a menu */
export function toggleMenu (id: string): void {
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
export function openMenu (id: string): void {
  // get relevant elements
  const a = document.querySelector(`[data-action="toggleMenu"][data-arg="${id}"]`) as HTMLAnchorElement
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

    // if it's a system sub menu, also open the system menu
    if (menu.classList.contains('system-sub-menu')) {
      document.querySelector('.system-menu').classList.add('open')
    }

    // maybe swap caret up/down
    const caret = a.querySelector('.fa-caret-down')
    if (caret) {
      caret.classList.remove('fa-caret-down')
      caret.classList.add('fa-caret-up')
    }
  }
}

/** closes a menu */
export function closeMenu (id: string): void {
  // get relevant elements
  const a = document.querySelector(`[data-action="toggleMenu"][data-arg="${id}"]`) as HTMLAnchorElement
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

/** activates a tab */
export function selectTab (id: string): void {
  for (const select of document.querySelectorAll('[data-action="selectTab"]')) {
    for (const option of select.children) {
      if ((option as HTMLOptionElement).value === id) (option as HTMLOptionElement).selected = true
    }
  }
  for (const tabPane of document.querySelectorAll(`[data-tab="${id}"]`)) {
    for (const sibling of tabPane.parentElement.children) sibling.classList.remove('active')
    tabPane.classList.add('active')
  }
}
